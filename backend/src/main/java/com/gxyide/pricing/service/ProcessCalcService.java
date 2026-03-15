package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.dto.ProcessAddDTO;
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
 * 工艺计算服务 - The Brain
 * 核心公式：
 * - 单件加工费 = (设备费率 / 3600) * cycle_time / cavity_count
 * - 单件人工费 = (人工费率 / 3600) * cycle_time * crew_size / cavity_count
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProcessCalcService extends ServiceImpl<QuoteItemProcessMapper, QuoteItemProcess> {

    private static final BigDecimal SECONDS_PER_HOUR = new BigDecimal("3600");
    private static final int CALC_SCALE = 6;

    private final QuoteItemProcessMapper processMapper;
    private final BaseMachineDictMapper machineDictMapper;
    private final BaseLaborRateMapper laborRateMapper;
    private final ProcessDictMapper processDictMapper;
    private final QuoteOrderMapper orderMapper;
    private final QuoteBomMapper bomMapper;
    private final QuoteModificationService modificationService;
    private final SysUserMapper sysUserMapper;

    /**
     * 添加工序（从DTO，支持processDictId自动填充工序名称）
     */
    @Transactional(rollbackFor = Exception.class)
    public QuoteItemProcess addProcess(ProcessAddDTO dto) {
        QuoteItemProcess process = new QuoteItemProcess();
        process.setOrderId(dto.getOrderId());
        process.setBomId(dto.getBomId());
        process.setSortOrder(dto.getSortOrder());
        process.setMachineId(dto.getMachineId());
        process.setCycleTime(dto.getCycleTime());
        process.setCavityCount(dto.getCavityCount());
        process.setCrewSize(dto.getCrewSize());
        process.setRemark(dto.getRemark());

        // 从工序字典获取名称（优先使用字典）
        if (dto.getProcessDictId() != null) {
            ProcessDict dict = processDictMapper.selectById(dto.getProcessDictId());
            if (dict != null) {
                process.setProcessName(dict.getProcessName());
            }
        } else if (dto.getProcessName() != null) {
            process.setProcessName(dto.getProcessName());
        }

        return addProcess(process);
    }

    /**
     * 添加工序（自动计算费用）
     */
    @Transactional(rollbackFor = Exception.class)
    public QuoteItemProcess addProcess(QuoteItemProcess process) {
        // 校验报价单状态
        QuoteOrder order = orderMapper.selectById(process.getOrderId());
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }
        if (!QuoteStatusEnum.PENDING_PROCESS.getCode().equals(order.getStatus())) {
            throw new RuntimeException("只有生产状态的报价单可以添加工序");
        }

        // 从设备字典获取费率
        if (process.getMachineId() != null) {
            BaseMachineDict machine = machineDictMapper.selectById(process.getMachineId());
            if (machine != null) {
                process.setMachineName(machine.getMachineName());
                process.setMachineHourlyRate(machine.getHourlyRate());
            }
        }

        // 获取默认人工费率
        if (process.getLaborHourlyRate() == null) {
            BaseLaborRate laborRate = laborRateMapper.selectDefault();
            if (laborRate != null) {
                process.setLaborHourlyRate(laborRate.getHourlyRate());
            }
        }

        // 计算费用
        calculateProcessCost(process);

        save(process);
        return process;
    }

    /**
     * 核心计算逻辑
     */
    public void calculateProcessCost(QuoteItemProcess process) {
        BigDecimal cycleTime = process.getCycleTime();
        Integer cavityCount = process.getCavityCount() != null ? process.getCavityCount() : 1;
        Integer crewSize = process.getCrewSize() != null ? process.getCrewSize() : 1;

        if (cycleTime == null || cycleTime.compareTo(BigDecimal.ZERO) <= 0) {
            process.setUnitMachineCost(BigDecimal.ZERO);
            process.setUnitLaborCost(BigDecimal.ZERO);
            process.setUnitTotalCost(BigDecimal.ZERO);
            process.setVariableCost(BigDecimal.ZERO);
            process.setFixedCost(BigDecimal.ZERO);
            process.setManufacturingCost(BigDecimal.ZERO);
            return;
        }

        BigDecimal cavityBD = new BigDecimal(cavityCount);
        BigDecimal crewBD = new BigDecimal(crewSize);

        // 单件加工费 = (设备费率 / 3600) * cycle_time / cavity_count
        BigDecimal unitMachineCost = BigDecimal.ZERO;
        if (process.getMachineHourlyRate() != null) {
            unitMachineCost = process.getMachineHourlyRate()
                    .divide(SECONDS_PER_HOUR, CALC_SCALE, RoundingMode.HALF_UP)
                    .multiply(cycleTime)
                    .divide(cavityBD, CALC_SCALE, RoundingMode.HALF_UP);
        }

        // 单件人工费 = (人工费率 / 3600) * cycle_time * crew_size / cavity_count
        BigDecimal unitLaborCost = BigDecimal.ZERO;
        if (process.getLaborHourlyRate() != null) {
            unitLaborCost = process.getLaborHourlyRate()
                    .divide(SECONDS_PER_HOUR, CALC_SCALE, RoundingMode.HALF_UP)
                    .multiply(cycleTime)
                    .multiply(crewBD)
                    .divide(cavityBD, CALC_SCALE, RoundingMode.HALF_UP);
        }

        process.setUnitMachineCost(unitMachineCost);
        process.setUnitLaborCost(unitLaborCost);
        process.setUnitTotalCost(unitMachineCost.add(unitLaborCost));

        // 上汽报价单扩展：可变费用 = 单件加工费，固定费用 = 单件人工费
        // 制造费用总值 = 可变费用 + 固定费用
        BigDecimal variableCost = process.getVariableCost() != null ? process.getVariableCost() : unitMachineCost;
        BigDecimal fixedCost = process.getFixedCost() != null ? process.getFixedCost() : unitLaborCost;
        process.setVariableCost(variableCost);
        process.setFixedCost(fixedCost);
        process.setManufacturingCost(variableCost.add(fixedCost));
    }

    /**
     * 更新工序（重新计算费用）
     */
    @Transactional(rollbackFor = Exception.class)
    public QuoteItemProcess updateProcess(QuoteItemProcess process) {
        QuoteItemProcess existing = getById(process.getId());
        if (existing == null) {
            throw new RuntimeException("工序不存在");
        }

        // 如果更换了设备，重新获取费率
        if (process.getMachineId() != null && !process.getMachineId().equals(existing.getMachineId())) {
            BaseMachineDict machine = machineDictMapper.selectById(process.getMachineId());
            if (machine != null) {
                process.setMachineName(machine.getMachineName());
                process.setMachineHourlyRate(machine.getHourlyRate());
            }
        }

        // 重新计算
        calculateProcessCost(process);
        updateById(process);
        return process;
    }

    /**
     * 获取报价单的所有工序
     */
    public List<QuoteItemProcess> getProcessByOrderId(Long orderId) {
        return processMapper.selectByOrderId(orderId);
    }

    /**
     * 获取BOM零件的所有工序
     */
    public List<QuoteItemProcess> getProcessByBomId(Long bomId) {
        return processMapper.selectByBomId(bomId);
    }

    /**
     * 计算报价单的总制造费用和总人工成本
     */
    public BigDecimal calculateTotalManufacturingCost(Long orderId) {
        List<QuoteItemProcess> processes = processMapper.selectByOrderId(orderId);
        BigDecimal totalManufacturingCost = BigDecimal.ZERO;
        BigDecimal totalLaborCost = BigDecimal.ZERO;

        for (QuoteItemProcess process : processes) {
            // 获取BOM数量
            QuoteBom bom = bomMapper.selectById(process.getBomId());
            BigDecimal quantity = bom != null && bom.getQuantity() != null ? bom.getQuantity() : BigDecimal.ONE;

            // 制造费用（只计算设备加工费，不包含人工）
            if (process.getUnitMachineCost() != null) {
                totalManufacturingCost = totalManufacturingCost.add(process.getUnitMachineCost().multiply(quantity));
            }

            // 人工成本（单独计算）
            if (process.getUnitLaborCost() != null) {
                totalLaborCost = totalLaborCost.add(process.getUnitLaborCost().multiply(quantity));
            }
        }

        // 更新报价单的制造费用和人工成本
        QuoteOrder order = orderMapper.selectById(orderId);
        if (order != null) {
            order.setManufacturingCost(totalManufacturingCost);
            order.setLaborCost(totalLaborCost);
            orderMapper.updateById(order);
        }

        return totalManufacturingCost;
    }

    /**
     * 工艺工程师提交（流转到物流专员）
     */
    @Transactional(rollbackFor = Exception.class)
    public QuoteStatusEnum submitProcess(Long orderId) {
        QuoteOrder order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }
        if (!QuoteStatusEnum.PENDING_PROCESS.getCode().equals(order.getStatus())) {
            throw new RuntimeException("只有生产状态的报价单可以提交");
        }

        // 计算总制造费用
        calculateTotalManufacturingCost(orderId);

        // 状态流转到物流专员
        if (order.getCurrentHandlerId() != null) {
            SysUser process = sysUserMapper.selectById(order.getCurrentHandlerId());
            if (process != null && process.getProcessLogisticsUserId() != null) {
                order.setLogisticsHandlerId(process.getProcessLogisticsUserId());
            }
        }
        if (order.getLogisticsHandlerId() == null) {
            SysUser creator = order.getCreatorId() != null ? sysUserMapper.selectById(order.getCreatorId()) : null;
            if (creator != null) {
                order.setLogisticsHandlerId(creator.getLogisticsUserId());
            }
        }
        order.setStatus(QuoteStatusEnum.PENDING_LOGISTICS.getCode());
        if (order.getLogisticsHandlerId() == null) {
            throw new RuntimeException("请先配置归属物流员");
        }
        order.setCurrentHandlerId(order.getLogisticsHandlerId());
        orderMapper.updateById(order);

        modificationService.saveSnapshot(orderId, "PROCESS", null, null);

        log.info("报价单[{}]工艺核算完成，流转到物流专员", orderId);
        return QuoteStatusEnum.PENDING_LOGISTICS;
    }

    /**
     * 获取所有启用的设备列表
     */
    public List<BaseMachineDict> getMachineList() {
        return machineDictMapper.selectActiveList();
    }

    /**
     * 删除工序
     */
    public void deleteProcess(Long processId) {
        removeById(processId);
    }
}
