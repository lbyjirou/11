package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.entity.*;
import com.gxyide.pricing.enums.QuoteStatusEnum;
import com.gxyide.pricing.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * 物流计算服务
 * 核心公式：
 * - 包装摊销费 = box_price / box_life / parts_per_box
 * - 单件运费 = (年运费总额 / 年产量) * 返空系数
 * - 返空系数：可回收包装 = 1.5，一次性包装 = 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LogisticsCalcService extends ServiceImpl<QuoteLogisticsMapper, QuoteLogistics> {

    private static final int CALC_SCALE = 6;
    private static final BigDecimal RETURN_FACTOR = new BigDecimal("1.5");

    private final QuoteLogisticsMapper logisticsMapper;
    private final BaseVehicleDictMapper vehicleDictMapper;
    private final BasePackDictMapper packDictMapper;
    private final QuoteOrderMapper orderMapper;

    /**
     * 保存或更新物流信息（自动计算）
     */
    @Transactional(rollbackFor = Exception.class)
    public QuoteLogistics saveLogistics(QuoteLogistics logistics) {
        // 校验报价单状态
        QuoteOrder order = orderMapper.selectById(logistics.getOrderId());
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }
        if (!QuoteStatusEnum.PENDING_LOGISTICS.getCode().equals(order.getStatus())) {
            throw new RuntimeException("只有物流状态的报价单可以编辑物流信息");
        }

        // 从字典获取包装信息
        if (logistics.getPackId() != null) {
            BasePackDict pack = packDictMapper.selectById(logistics.getPackId());
            if (pack != null) {
                logistics.setPackType(pack.getPackName());
                logistics.setBoxPrice(pack.getPackPrice());
                logistics.setBoxLife(pack.getPackLife());
                logistics.setIsReturnable(pack.getIsReturnable());
            }
        }

        // 从字典获取车型信息（仅获取载重/容积，运费由前端从价格库传入时优先）
        if (logistics.getVehicleId() != null) {
            BaseVehicleDict vehicle = vehicleDictMapper.selectById(logistics.getVehicleId());
            if (vehicle != null) {
                logistics.setVehicleType(vehicle.getVehicleName());
                // 仅当前端未传入 freightPrice 时才从车型字典获取
                if (logistics.getFreightPrice() == null) {
                    logistics.setFreightPrice(vehicle.getFreightPrice());
                }
                logistics.setLoadWeight(vehicle.getLoadWeight());
                logistics.setLoadVolume(vehicle.getLoadVolume());
            }
        }

        // 从报价单获取年产量和总重量
        logistics.setAnnualQuantity(order.getAnnualQuantity());
        logistics.setTotalWeight(order.getNetWeight());

        // 计算费用
        calculateLogisticsCost(logistics);

        // 保存或更新
        QuoteLogistics existing = logisticsMapper.selectByOrderId(logistics.getOrderId());
        if (existing != null) {
            logistics.setId(existing.getId());
            updateById(logistics);
        } else {
            save(logistics);
        }

        return logistics;
    }

    /**
     * 核心计算逻辑
     */
    public void calculateLogisticsCost(QuoteLogistics logistics) {
        // 1. 计算包装摊销费 = box_price / box_life / parts_per_box
        BigDecimal unitPackCost = calculatePackCost(logistics);
        logistics.setUnitPackCost(unitPackCost);

        // 2. 计算运费
        BigDecimal unitFreightCost = calculateFreightCost(logistics);
        logistics.setUnitFreightCost(unitFreightCost);

        // 3. 单件物流总费 = 包装摊销 + 运费
        logistics.setUnitTotalCost(unitPackCost.add(unitFreightCost));

        // 4. 物流成本合计 = 单件物流总费(自动) + 三方仓 + 运费 + 返回运费(手动)
        BigDecimal unitTotal = logistics.getUnitTotalCost() != null ? logistics.getUnitTotalCost() : BigDecimal.ZERO;
        BigDecimal warehouseFee = logistics.getWarehouseFee() != null ? logistics.getWarehouseFee() : BigDecimal.ZERO;
        BigDecimal freightFee = logistics.getFreightFee() != null ? logistics.getFreightFee() : BigDecimal.ZERO;
        BigDecimal returnFreightFee = logistics.getReturnFreightFee() != null ? logistics.getReturnFreightFee() : BigDecimal.ZERO;
        logistics.setTotalLogisticsCost(unitTotal.add(warehouseFee).add(freightFee).add(returnFreightFee));
    }

    /**
     * 计算包装摊销费
     * 公式：box_price / box_life / parts_per_box
     */
    private BigDecimal calculatePackCost(QuoteLogistics logistics) {
        BigDecimal boxPrice = logistics.getBoxPrice();
        Integer boxLife = logistics.getBoxLife();
        Integer partsPerBox = logistics.getPartsPerBox();

        if (boxPrice == null || boxLife == null || boxLife <= 0
                || partsPerBox == null || partsPerBox <= 0) {
            return BigDecimal.ZERO;
        }

        return boxPrice
                .divide(new BigDecimal(boxLife), CALC_SCALE, RoundingMode.HALF_UP)
                .divide(new BigDecimal(partsPerBox), CALC_SCALE, RoundingMode.HALF_UP);
    }

    /**
     * 计算单件运费
     * 公式：(年运费总额 / 年产量) * 返空系数
     */
    private BigDecimal calculateFreightCost(QuoteLogistics logistics) {
        Integer annualQuantity = logistics.getAnnualQuantity();
        Integer partsPerBox = logistics.getPartsPerBox();
        Integer boxesPerVehicle = logistics.getBoxesPerVehicle();
        BigDecimal freightPrice = logistics.getFreightPrice();

        if (annualQuantity == null || annualQuantity <= 0 || freightPrice == null) {
            return BigDecimal.ZERO;
        }

        // 计算每车装件数
        int partsPerVehicle = 1;
        if (partsPerBox != null && partsPerBox > 0 && boxesPerVehicle != null && boxesPerVehicle > 0) {
            partsPerVehicle = partsPerBox * boxesPerVehicle;
        }
        logistics.setPartsPerVehicle(partsPerVehicle);

        // 计算年运输车次 = 年产量 / 每车装件数（向上取整）
        int annualVehicles = (int) Math.ceil((double) annualQuantity / partsPerVehicle);
        logistics.setAnnualVehicles(annualVehicles);

        // 年运费总额 = 车次 * 单车运费
        BigDecimal annualFreight = freightPrice.multiply(new BigDecimal(annualVehicles));

        // 返空逻辑：可回收包装需要返空，运费 * 1.5
        if (logistics.getIsReturnable() != null && logistics.getIsReturnable() == 1) {
            annualFreight = annualFreight.multiply(RETURN_FACTOR);
        }
        logistics.setAnnualFreight(annualFreight);

        // 单件运费 = 年运费 / 年产量
        return annualFreight.divide(new BigDecimal(annualQuantity), CALC_SCALE, RoundingMode.HALF_UP);
    }

    /**
     * 获取报价单的物流信息
     */
    public QuoteLogistics getByOrderId(Long orderId) {
        return logisticsMapper.selectByOrderId(orderId);
    }

    /**
     * 获取车型列表
     */
    public List<BaseVehicleDict> getVehicleList() {
        return vehicleDictMapper.selectActiveList();
    }

    /**
     * 获取包装类型列表
     */
    public List<BasePackDict> getPackList() {
        return packDictMapper.selectActiveList();
    }

    /**
     * 物流专员提交（流转到报价经理）
     */
    @Transactional(rollbackFor = Exception.class)
    public void submitLogistics(Long orderId) {
        QuoteOrder order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }
        if (!QuoteStatusEnum.PENDING_LOGISTICS.getCode().equals(order.getStatus())) {
            throw new RuntimeException("只有物流状态的报价单可以提交");
        }

        // 检查是否有物流数据
        QuoteLogistics logistics = logisticsMapper.selectByOrderId(orderId);
        if (logistics == null) {
            throw new RuntimeException("请先填写物流信息");
        }

        // 更新报价单的物流费用和包装费用
        order.setLogisticsCost(logistics.getUnitFreightCost());
        order.setPackagingCost(logistics.getUnitPackCost());

        // 状态流转到报价经理
        order.setStatus(QuoteStatusEnum.PENDING_APPROVAL.getCode());
        order.setCurrentHandlerId(null);
        orderMapper.updateById(order);

        log.info("报价单[{}]物流测算完成，流转到报价经理", orderId);
    }
}
