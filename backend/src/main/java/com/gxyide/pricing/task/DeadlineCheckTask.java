package com.gxyide.pricing.task;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gxyide.pricing.entity.QuoteOrder;
import com.gxyide.pricing.entity.StageDeadline;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.mapper.SysUserMapper;
import com.gxyide.pricing.service.DeadlineService;
import com.gxyide.pricing.service.NotificationService;
import com.gxyide.pricing.service.QuoteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DeadlineCheckTask {

    private final DeadlineService deadlineService;
    private final NotificationService notificationService;
    private final QuoteService quoteService;
    private final SysUserMapper sysUserMapper;

    private static final Map<String, String> STAGE_ROLE_MAP = Map.of(
        "PENDING_TECH", "TECH",
        "PENDING_PROCESS", "PROCESS",
        "PENDING_LOGISTICS", "LOGISTICS",
        "PENDING_APPROVAL", "MANAGER"
    );

    private static final Map<String, String> STAGE_LABEL_MAP = Map.of(
        "PENDING_TECH", "技术",
        "PENDING_PROCESS", "生产",
        "PENDING_LOGISTICS", "物流",
        "PENDING_APPROVAL", "审批"
    );

    /**
     * 每小时检测超期
     */
    @Scheduled(cron = "0 0 * * * ?")
    public void checkOverdue() {
        log.info("开始执行交期检测");

        // 第零轮：提前预警（截止前N小时通知负责人）
        int warningHours = deadlineService.getWarningHours();
        if (warningHours > 0) {
            List<StageDeadline> approaching = deadlineService.findApproachingNotWarned(warningHours);
            for (StageDeadline sd : approaching) {
                QuoteOrder order = quoteService.getById(sd.getQuoteId());
                if (order == null) continue;
                if (!sd.getStage().equals(order.getStatus())) {
                    sd.setWarned(1);
                    deadlineService.updateById(sd);
                    continue;
                }
                warnStageUsers(sd, order, warningHours);
                sd.setWarned(1);
                deadlineService.updateById(sd);
            }
        }

        // 第一轮：通知当前环节负责人
        List<StageDeadline> overdue = deadlineService.findOverdueNotNotified();
        for (StageDeadline sd : overdue) {
            QuoteOrder order = quoteService.getById(sd.getQuoteId());
            if (order == null) continue;
            // 仅当报价单仍在该环节时才通知
            if (!sd.getStage().equals(order.getStatus())) {
                sd.setNotified(1);
                sd.setEscalated(1);
                deadlineService.updateById(sd);
                continue;
            }
            notifyStageUsers(sd, order);
            sd.setNotified(1);
            deadlineService.updateById(sd);
        }

        // 第二轮：升级通知管理员
        int hours = deadlineService.getEscalationHours();
        List<StageDeadline> escalate = deadlineService.findOverdueNotEscalated(hours);
        for (StageDeadline sd : escalate) {
            QuoteOrder order = quoteService.getById(sd.getQuoteId());
            if (order == null) continue;
            if (!sd.getStage().equals(order.getStatus())) {
                sd.setEscalated(1);
                deadlineService.updateById(sd);
                continue;
            }
            notifyAdmins(sd, order);
            sd.setEscalated(1);
            deadlineService.updateById(sd);
        }

        log.info("交期检测完成");
    }

    private void warnStageUsers(StageDeadline sd, QuoteOrder order, int warningHours) {
        String role = STAGE_ROLE_MAP.get(sd.getStage());
        String label = STAGE_LABEL_MAP.getOrDefault(sd.getStage(), sd.getStage());
        String quoteNo = order.getQuoteNo() != null ? order.getQuoteNo() : "ID:" + order.getId();
        long remainHours = ChronoUnit.HOURS.between(LocalDateTime.now(), sd.getDeadline());
        String timeDesc = remainHours >= 1 ? remainHours + "小时" : "不足1小时";

        List<SysUser> users = sysUserMapper.selectList(
            new LambdaQueryWrapper<SysUser>().eq(SysUser::getRole, role));
        for (SysUser user : users) {
            notificationService.send(user.getId(), order.getId(),
                "DEADLINE_WARNING",
                "环节即将到期",
                "报价单[" + quoteNo + "]的「" + label + "」环节将在" + timeDesc + "后到期，请及时处理");
        }
    }

    private void notifyStageUsers(StageDeadline sd, QuoteOrder order) {
        String role = STAGE_ROLE_MAP.get(sd.getStage());
        String label = STAGE_LABEL_MAP.getOrDefault(sd.getStage(), sd.getStage());
        String quoteNo = order.getQuoteNo() != null ? order.getQuoteNo() : "ID:" + order.getId();

        List<SysUser> users = sysUserMapper.selectList(
            new LambdaQueryWrapper<SysUser>().eq(SysUser::getRole, role));
        for (SysUser user : users) {
            notificationService.send(user.getId(), order.getId(),
                "OVERDUE_WARNING",
                "环节超期提醒",
                "报价单[" + quoteNo + "]的「" + label + "」环节已超期，请尽快处理");
        }
    }

    private void notifyAdmins(StageDeadline sd, QuoteOrder order) {
        String label = STAGE_LABEL_MAP.getOrDefault(sd.getStage(), sd.getStage());
        String quoteNo = order.getQuoteNo() != null ? order.getQuoteNo() : "ID:" + order.getId();

        List<SysUser> admins = sysUserMapper.selectList(
            new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getRole, "ADMIN")
                .or().eq(SysUser::getRole, "MANAGER"));
        for (SysUser admin : admins) {
            notificationService.send(admin.getId(), order.getId(),
                "OVERDUE_ESCALATION",
                "超期升级通知",
                "报价单[" + quoteNo + "]的「" + label + "」环节严重超期，已升级通知");
        }
    }
}
