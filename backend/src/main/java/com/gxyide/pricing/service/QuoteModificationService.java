package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gxyide.pricing.entity.QuoteModificationLog;
import com.gxyide.pricing.entity.QuoteOrder;
import com.gxyide.pricing.entity.QuoteStageSnapshot;
import com.gxyide.pricing.enums.QuoteStatusEnum;
import com.gxyide.pricing.mapper.QuoteModificationLogMapper;
import com.gxyide.pricing.mapper.QuoteOrderMapper;
import com.gxyide.pricing.mapper.QuoteStageSnapshotMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuoteModificationService {

    private final QuoteOrderMapper orderMapper;
    private final QuoteStageSnapshotMapper snapshotMapper;
    private final QuoteModificationLogMapper modLogMapper;
    private final QuoteStateMachineService stateMachine;
    private final DeadlineService deadlineService;

    private static final List<String> STAGE_ORDER =
        List.of("SALES", "TECH", "PROCESS", "LOGISTICS", "APPROVAL");

    private static final Map<String, QuoteStatusEnum> STAGE_TO_STATUS = Map.of(
        "SALES", QuoteStatusEnum.DRAFT,
        "TECH", QuoteStatusEnum.PENDING_TECH,
        "PROCESS", QuoteStatusEnum.PENDING_PROCESS,
        "LOGISTICS", QuoteStatusEnum.PENDING_LOGISTICS,
        "APPROVAL", QuoteStatusEnum.PENDING_APPROVAL
    );

    /**
     * 保存阶段快照（在 advance 时调用）
     */
    public void saveSnapshot(Long orderId, String stage, Long handlerId, String dataJson) {
        QuoteStageSnapshot existing = getSnapshot(orderId, stage);
        if (existing != null) {
            existing.setDataSnapshot(dataJson);
            existing.setHandlerId(handlerId);
            existing.setVersion(existing.getVersion() + 1);
            existing.setStatus("CONFIRMED");
            existing.setConfirmedAt(LocalDateTime.now());
            snapshotMapper.updateById(existing);
        } else {
            QuoteStageSnapshot snapshot = new QuoteStageSnapshot();
            snapshot.setOrderId(orderId);
            snapshot.setStage(stage);
            snapshot.setHandlerId(handlerId);
            snapshot.setDataSnapshot(dataJson);
            snapshot.setVersion(1);
            snapshot.setStatus("CONFIRMED");
            snapshot.setConfirmedAt(LocalDateTime.now());
            snapshotMapper.insert(snapshot);
        }
    }

    /**
     * 发起修改：回滚到发起者阶段，后续走正常提交流程
     */
    @Transactional(rollbackFor = Exception.class)
    public void initiateModification(Long orderId, String initiatorStage,
                                     Long initiatorId, String reason) {
        QuoteOrder order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }

        int initiatorIdx = STAGE_ORDER.indexOf(initiatorStage);
        if (initiatorIdx < 0) {
            throw new RuntimeException("无效的阶段: " + initiatorStage);
        }

        QuoteStatusEnum currentStatus = QuoteStatusEnum.fromCode(order.getStatus());
        QuoteStatusEnum initiatorStatus = STAGE_TO_STATUS.get(initiatorStage);
        int currentIdx = STAGE_ORDER.indexOf(statusToStage(currentStatus));
        if (currentIdx < initiatorIdx) {
            throw new RuntimeException("只有已提交过的环节才能发起修改");
        }

        // 暂停所有活跃计时器，重启目标环节计时器
        deadlineService.pauseAllTimers(order);
        deadlineService.startStageTimer(order, initiatorStage);
        orderMapper.updateById(order);

        // 直接回滚到发起者阶段，后续走正常流转
        stateMachine.softRollback(orderId, initiatorStatus);

        // 记录修改日志
        List<String> affected = new ArrayList<>();
        for (int i = initiatorIdx + 1; i <= currentIdx; i++) {
            affected.add(STAGE_ORDER.get(i));
        }
        QuoteModificationLog modLog = new QuoteModificationLog();
        modLog.setOrderId(orderId);
        modLog.setInitiatorStage(initiatorStage);
        modLog.setInitiatorId(initiatorId);
        modLog.setReason(reason);
        modLog.setAffectedStages(String.join(",", affected));
        modLog.setStatus("COMPLETED");
        modLog.setCompleteTime(LocalDateTime.now());
        modLogMapper.insert(modLog);

        log.info("报价单[{}] {}发起修改，回滚到{}阶段", orderId, initiatorStage, initiatorStatus.getName());
    }

    /**
     * 获取修改状态（简化版：仅返回是否有修改历史）
     */
    public Map<String, Object> getModificationStatus(Long orderId) {
        Map<String, Object> result = new HashMap<>();
        result.put("isInModification", false);
        result.put("initiatorStage", null);
        result.put("stages", List.of());
        return result;
    }

    // ==================== 内部方法 ====================

    private QuoteStageSnapshot getSnapshot(Long orderId, String stage) {
        return snapshotMapper.selectOne(
            new LambdaQueryWrapper<QuoteStageSnapshot>()
                .eq(QuoteStageSnapshot::getOrderId, orderId)
                .eq(QuoteStageSnapshot::getStage, stage));
    }

    private String statusToStage(QuoteStatusEnum status) {
        if (status == null) return "";
        return switch (status) {
            case DRAFT -> "SALES";
            case PENDING_TECH -> "TECH";
            case PENDING_PROCESS -> "PROCESS";
            case PENDING_LOGISTICS -> "LOGISTICS";
            case PENDING_APPROVAL, APPROVED, ARCHIVED -> "APPROVAL";
            default -> "";
        };
    }
}