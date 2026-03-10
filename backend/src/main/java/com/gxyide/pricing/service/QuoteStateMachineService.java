package com.gxyide.pricing.service;

import com.gxyide.pricing.entity.QuoteOrder;
import com.gxyide.pricing.enums.QuoteStatusEnum;
import com.gxyide.pricing.mapper.QuoteBomMapper;
import com.gxyide.pricing.mapper.QuoteItemProcessMapper;
import com.gxyide.pricing.mapper.QuoteLogisticsMapper;
import com.gxyide.pricing.mapper.QuoteOrderMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * 报价单状态机服务
 * 控制严格的状态流转，实现级联重置
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuoteStateMachineService {

    private final QuoteOrderMapper orderMapper;
    private final QuoteBomMapper bomMapper;
    private final QuoteItemProcessMapper processMapper;
    private final QuoteLogisticsMapper logisticsMapper;

    /** 状态流转规则：当前状态 -> 允许的下一状态列表 */
    private static final Map<QuoteStatusEnum, Set<QuoteStatusEnum>> TRANSITIONS = new HashMap<>();

    static {
        // 草稿 -> 待技术
        TRANSITIONS.put(QuoteStatusEnum.DRAFT,
            Set.of(QuoteStatusEnum.PENDING_TECH));
        // 待技术 -> 待工艺
        TRANSITIONS.put(QuoteStatusEnum.PENDING_TECH,
            Set.of(QuoteStatusEnum.PENDING_PROCESS, QuoteStatusEnum.DRAFT));
        // 待工艺 -> 待物流
        TRANSITIONS.put(QuoteStatusEnum.PENDING_PROCESS,
            Set.of(QuoteStatusEnum.PENDING_LOGISTICS, QuoteStatusEnum.PENDING_TECH));
        // 待物流 -> 待审批
        TRANSITIONS.put(QuoteStatusEnum.PENDING_LOGISTICS,
            Set.of(QuoteStatusEnum.PENDING_APPROVAL, QuoteStatusEnum.PENDING_PROCESS));
        // 待审批 -> 已批准/已驳回
        TRANSITIONS.put(QuoteStatusEnum.PENDING_APPROVAL,
            Set.of(QuoteStatusEnum.APPROVED, QuoteStatusEnum.REJECTED));
        // 已驳回 -> 可回到任意前置状态
        TRANSITIONS.put(QuoteStatusEnum.REJECTED,
            Set.of(QuoteStatusEnum.DRAFT, QuoteStatusEnum.PENDING_TECH,
                   QuoteStatusEnum.PENDING_PROCESS, QuoteStatusEnum.PENDING_LOGISTICS));
        // 已批准 -> 归档
        TRANSITIONS.put(QuoteStatusEnum.APPROVED,
            Set.of(QuoteStatusEnum.ARCHIVED));
    }

    /**
     * 检查状态流转是否合法
     */
    public boolean canTransition(QuoteStatusEnum from, QuoteStatusEnum to) {
        Set<QuoteStatusEnum> allowed = TRANSITIONS.get(from);
        return allowed != null && allowed.contains(to);
    }

    /**
     * 执行状态流转
     */
    @Transactional(rollbackFor = Exception.class)
    public void transition(Long orderId, QuoteStatusEnum targetStatus, Long handlerId) {
        QuoteOrder order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }

        QuoteStatusEnum currentStatus = QuoteStatusEnum.fromCode(order.getStatus());
        if (currentStatus == null) {
            throw new RuntimeException("报价单状态异常");
        }

        if (!canTransition(currentStatus, targetStatus)) {
            throw new RuntimeException(String.format(
                "状态流转不合法: %s -> %s", currentStatus.getName(), targetStatus.getName()));
        }

        order.setStatus(targetStatus.getCode());
        order.setCurrentHandlerId(handlerId);
        orderMapper.updateById(order);

        log.info("报价单[{}]状态流转: {} -> {}", orderId, currentStatus.getName(), targetStatus.getName());
    }

    /**
     * 级联重置：当BOM被修改时，清除后续阶段的数据
     * 防止零件变了，工序还留着旧的
     */
    @Transactional(rollbackFor = Exception.class)
    public void cascadeResetFromTech(Long orderId) {
        log.info("报价单[{}]触发级联重置：清除工艺和物流数据", orderId);

        // 清除工序数据
        processMapper.deleteByOrderId(orderId);

        // 清除物流数据
        logisticsMapper.deleteByOrderId(orderId);

        // 重置报价单的计算字段
        QuoteOrder order = orderMapper.selectById(orderId);
        if (order != null) {
            order.setManufacturingCost(null);
            order.setLogisticsCost(null);
            order.setPackagingCost(null);
            orderMapper.updateById(order);
        }
    }

    /**
     * 级联重置：当工艺被修改时，清除物流数据
     */
    @Transactional(rollbackFor = Exception.class)
    public void cascadeResetFromProcess(Long orderId) {
        log.info("报价单[{}]触发级联重置：清除物流数据", orderId);

        logisticsMapper.deleteByOrderId(orderId);

        QuoteOrder order = orderMapper.selectById(orderId);
        if (order != null) {
            order.setLogisticsCost(null);
            order.setPackagingCost(null);
            orderMapper.updateById(order);
        }
    }

    /**
     * 软回滚：仅回退状态，不删除下游数据
     * 用于修改流程，保留下游数据待再确认
     */
    @Transactional(rollbackFor = Exception.class)
    public void softRollback(Long orderId, QuoteStatusEnum targetStatus) {
        QuoteOrder order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }
        order.setStatus(targetStatus.getCode());
        order.setCurrentHandlerId(null);
        orderMapper.updateById(order);
        log.info("报价单[{}]软回滚到: {}", orderId, targetStatus.getName());
    }
}
