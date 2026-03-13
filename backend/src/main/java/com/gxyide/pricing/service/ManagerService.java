package com.gxyide.pricing.service;

import com.gxyide.pricing.dto.ProfitAdjustDTO;
import com.gxyide.pricing.entity.*;
import com.gxyide.pricing.enums.QuoteStatusEnum;
import com.gxyide.pricing.mapper.*;
import com.gxyide.pricing.vo.QuoteSummaryVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 经理审批服务
 * 汇总各阶段成本，支持利润调整，审批/驳回
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ManagerService {

    private static final int CALC_SCALE = 6;
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal DEFAULT_TAX_RATE = new BigDecimal("13");

    private final QuoteOrderMapper orderMapper;
    private final QuoteBomMapper bomMapper;
    private final QuoteItemProcessMapper processMapper;
    private final QuoteLogisticsMapper logisticsMapper;
    private final QuoteStateMachineService stateMachine;

    /**
     * 获取报价汇总（经理驾驶舱）
     */
    public QuoteSummaryVO getSummary(Long orderId) {
        QuoteOrder order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }

        // 获取BOM数据
        List<QuoteBom> bomList = bomMapper.selectByOrderId(orderId);
        BigDecimal materialCost = calculateMaterialCost(bomList);
        BigDecimal toolingCost = calculateToolingCost(bomList);

        // 获取工序数据
        List<QuoteItemProcess> processes = processMapper.selectByOrderId(orderId);
        List<QuoteSummaryVO.ProcessSummary> processSummaries = buildProcessSummaries(processes);

        // 获取物流数据
        QuoteLogistics logistics = logisticsMapper.selectByOrderId(orderId);

        // 构建汇总
        QuoteStatusEnum statusEnum = QuoteStatusEnum.fromCode(order.getStatus());

        // 计算总制造成本 = 材料成本 + 模具分摊成本 + 直接人工 + 总制造费用
        BigDecimal laborCost = order.getLaborCost() != null ? order.getLaborCost() : BigDecimal.ZERO;
        BigDecimal manufacturingCost = order.getManufacturingCost() != null ? order.getManufacturingCost() : BigDecimal.ZERO;
        BigDecimal totalProductionCost = materialCost.add(toolingCost).add(laborCost).add(manufacturingCost);

        // 物流明细
        BigDecimal warehouseFee = logistics != null && logistics.getWarehouseFee() != null ? logistics.getWarehouseFee() : BigDecimal.ZERO;
        BigDecimal freightFee = logistics != null && logistics.getFreightFee() != null ? logistics.getFreightFee() : BigDecimal.ZERO;
        BigDecimal returnFreightFee = logistics != null && logistics.getReturnFreightFee() != null ? logistics.getReturnFreightFee() : BigDecimal.ZERO;
        BigDecimal totalLogisticsCost = logistics != null && logistics.getTotalLogisticsCost() != null ? logistics.getTotalLogisticsCost() : BigDecimal.ZERO;

        return QuoteSummaryVO.builder()
                .orderId(orderId)
                .quoteNo(order.getQuoteNo())
                .partName(order.getPartName())
                .customerName(order.getCustomerName())
                .annualQuantity(order.getAnnualQuantity())
                // Phase 2
                .materialCost(materialCost)
                .totalWeight(order.getNetWeight())
                .bomItemCount(bomList.size())
                // Phase 3
                .laborCost(laborCost)
                .manufacturingCost(manufacturingCost)
                .processCount(processes.size())
                .processSummaries(processSummaries)
                // Phase 4
                .logisticsCost(order.getLogisticsCost())
                .packagingCost(order.getPackagingCost())
                .packType(logistics != null ? logistics.getPackType() : null)
                .vehicleType(logistics != null ? logistics.getVehicleType() : null)
                .destination(logistics != null ? logistics.getDestination() : null)
                .companyName(logistics != null ? logistics.getCompanyName() : null)
                .partsPerBox(logistics != null ? logistics.getPartsPerBox() : null)
                .boxesPerVehicle(logistics != null ? logistics.getBoxesPerVehicle() : null)
                .unitPackCost(logistics != null ? logistics.getUnitPackCost() : null)
                .unitFreightCost(logistics != null ? logistics.getUnitFreightCost() : null)
                .unitTotalCost(logistics != null ? logistics.getUnitTotalCost() : null)
                .annualVehicles(logistics != null ? logistics.getAnnualVehicles() : null)
                .annualFreight(logistics != null ? logistics.getAnnualFreight() : null)
                .warehouseFee(warehouseFee)
                .freightFee(freightFee)
                .returnFreightFee(returnFreightFee)
                .totalLogisticsCost(totalLogisticsCost)
                // 成本汇总
                .totalProductionCost(totalProductionCost)
                .managementFee(order.getManagementFee())
                .scrapRate(order.getScrapRate())
                .scrapCost(order.getScrapCost())
                .profit(order.getProfit())
                .factoryPrice(order.getFactoryPrice())
                .unitPriceExclTax(order.getUnitPriceExclTax())
                // 状态
                .status(order.getStatus())
                .statusName(statusEnum != null ? statusEnum.getName() : order.getStatus())
                .build();
    }

    /**
     * 计算材料成本（BOM材料总成本汇总）
     */
    private BigDecimal calculateMaterialCost(List<QuoteBom> bomList) {
        return bomList.stream()
                .filter(b -> b.getMaterialTotalCost() != null)
                .map(QuoteBom::getMaterialTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * 计算工装分摊成本（BOM工装分摊汇总）
     */
    private BigDecimal calculateToolingCost(List<QuoteBom> bomList) {
        return bomList.stream()
                .filter(b -> b.getToolingCostPerUnit() != null)
                .map(QuoteBom::getToolingCostPerUnit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * 构建工序汇总
     */
    private List<QuoteSummaryVO.ProcessSummary> buildProcessSummaries(List<QuoteItemProcess> processes) {
        Map<String, List<QuoteItemProcess>> grouped = processes.stream()
                .collect(Collectors.groupingBy(p ->
                    p.getProcessName() + "|" + (p.getMachineName() != null ? p.getMachineName() : "")));

        List<QuoteSummaryVO.ProcessSummary> summaries = new ArrayList<>();
        for (Map.Entry<String, List<QuoteItemProcess>> entry : grouped.entrySet()) {
            List<QuoteItemProcess> list = entry.getValue();
            QuoteItemProcess first = list.get(0);
            BigDecimal totalCost = list.stream()
                    .filter(p -> p.getUnitTotalCost() != null)
                    .map(QuoteItemProcess::getUnitTotalCost)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            summaries.add(QuoteSummaryVO.ProcessSummary.builder()
                    .processName(first.getProcessName())
                    .machineName(first.getMachineName())
                    .unitCost(totalCost)
                    .count(list.size())
                    .build());
        }
        return summaries;
    }

    /**
     * 利润调整并计算最终报价
     * 用户只能调整：管理费用、报废率、利润
     * 其他成本项均为自动计算，不可覆盖
     */
    @Transactional(rollbackFor = Exception.class)
    public QuoteSummaryVO adjustProfit(ProfitAdjustDTO dto) {
        QuoteOrder order = orderMapper.selectById(dto.getOrderId());
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }

        QuoteSummaryVO summary = getSummary(dto.getOrderId());

        // 获取BOM数据计算工装分摊成本
        List<QuoteBom> bomList = bomMapper.selectByOrderId(dto.getOrderId());
        BigDecimal materialCost = summary.getMaterialCost() != null ? summary.getMaterialCost() : BigDecimal.ZERO;
        BigDecimal toolingCost = calculateToolingCost(bomList);
        BigDecimal laborCost = order.getLaborCost() != null ? order.getLaborCost() : BigDecimal.ZERO;
        BigDecimal manufacturingCost = order.getManufacturingCost() != null ? order.getManufacturingCost() : BigDecimal.ZERO;

        // 总制造成本：总是自动计算，不可覆盖
        // 公式：总制造成本 = 材料成本 + 模具分摊成本 + 直接人工 + 总制造费用
        BigDecimal totalProductionCost = materialCost.add(toolingCost).add(laborCost).add(manufacturingCost);
        summary.setTotalProductionCost(totalProductionCost);
        summary.setLaborCost(laborCost);

        // 管理费用（用户可输入）
        BigDecimal managementFee = dto.getManagementFee() != null ? dto.getManagementFee() : BigDecimal.ZERO;
        summary.setManagementFee(managementFee);

        // 报废率（用户可输入）和报废成本（自动计算）
        BigDecimal scrapRate = dto.getScrapRate() != null ? dto.getScrapRate() : new BigDecimal("3");
        BigDecimal scrapCost = totalProductionCost.multiply(scrapRate).divide(HUNDRED, CALC_SCALE, RoundingMode.HALF_UP);
        summary.setScrapRate(scrapRate);
        summary.setScrapCost(scrapCost);

        // 利润（用户可输入）
        BigDecimal profit = dto.getProfit() != null ? dto.getProfit() : BigDecimal.ZERO;
        summary.setProfit(profit);

        // 出厂价：总是自动计算，不可覆盖
        BigDecimal factoryPrice = totalProductionCost.add(managementFee).add(scrapCost).add(profit);
        summary.setFactoryPrice(factoryPrice);

        // 物流成本
        BigDecimal logisticsCost = summary.getTotalLogisticsCost() != null
                ? summary.getTotalLogisticsCost()
                : (order.getLogisticsCost() != null ? order.getLogisticsCost() : BigDecimal.ZERO);

        // 销售价格(不含税)：总是自动计算，不可覆盖
        BigDecimal unitPriceExclTax = factoryPrice.add(logisticsCost);
        summary.setUnitPriceExclTax(unitPriceExclTax.setScale(4, RoundingMode.HALF_UP));

        // 更新报价单
        order.setMaterialCost(materialCost);
        order.setLaborCost(laborCost);
        order.setTotalProductionCost(totalProductionCost);
        order.setManagementFee(managementFee);
        order.setScrapRate(scrapRate);
        order.setScrapCost(scrapCost);
        order.setProfit(profit);
        order.setFactoryPrice(factoryPrice);
        order.setUnitPriceExclTax(unitPriceExclTax.setScale(4, RoundingMode.HALF_UP));
        orderMapper.updateById(order);

        return summary;
    }

    /**
     * 审批通过
     */
    @Transactional(rollbackFor = Exception.class)
    public QuoteStatusEnum approve(Long orderId, Long managerId) {
        QuoteOrder order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }
        if (!QuoteStatusEnum.PENDING_APPROVAL.getCode().equals(order.getStatus())) {
            throw new RuntimeException("只有审批状态的报价单可以审批");
        }

        stateMachine.transition(orderId, QuoteStatusEnum.APPROVED, managerId);
        log.info("报价单[{}]已审批通过", orderId);
        return QuoteStatusEnum.APPROVED;
    }

    /**
     * 驳回
     * @param targetStatus 驳回到的目标状态
     * @param reason 驳回原因
     */
    @Transactional(rollbackFor = Exception.class)
    public void reject(Long orderId, QuoteStatusEnum targetStatus, String reason, Long managerId) {
        QuoteOrder order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }
        if (!QuoteStatusEnum.PENDING_APPROVAL.getCode().equals(order.getStatus())) {
            throw new RuntimeException("只有审批状态的报价单可以驳回");
        }

        // 先标记为已驳回
        order.setStatus(QuoteStatusEnum.REJECTED.getCode());
        order.setRejectReason(reason);
        orderMapper.updateById(order);

        // 根据目标状态执行级联重置
        if (targetStatus == QuoteStatusEnum.PENDING_TECH) {
            stateMachine.cascadeResetFromTech(orderId);
        } else if (targetStatus == QuoteStatusEnum.PENDING_PROCESS) {
            stateMachine.cascadeResetFromProcess(orderId);
        }

        // 流转到目标状态
        stateMachine.transition(orderId, targetStatus, null);
        log.info("报价单[{}]已驳回到{}, 原因: {}", orderId, targetStatus.getName(), reason);
    }
}
