package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.entity.QuoteOrder;
import com.gxyide.pricing.entity.StageDeadline;
import com.gxyide.pricing.entity.SysConfig;
import com.gxyide.pricing.mapper.StageDeadlineMapper;
import com.gxyide.pricing.mapper.SysConfigMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DeadlineService extends ServiceImpl<StageDeadlineMapper, StageDeadline> {

    private final SysConfigMapper sysConfigMapper;

    private static final String[] STAGES = {
        "PENDING_TECH", "PENDING_PROCESS", "PENDING_LOGISTICS", "PENDING_APPROVAL"
    };
    private static final String[] STAGE_KEYS = {
        "DEADLINE_TECH", "DEADLINE_PROCESS", "DEADLINE_LOGISTICS", "DEADLINE_APPROVE"
    };

    /**
     * 读取交期配置
     */
    public Map<String, String> getConfig() {
        LambdaQueryWrapper<SysConfig> w = new LambdaQueryWrapper<>();
        w.likeRight(SysConfig::getConfigKey, "DEADLINE_");
        List<SysConfig> list = sysConfigMapper.selectList(w);
        Map<String, String> map = new LinkedHashMap<>();
        for (SysConfig c : list) {
            map.put(c.getConfigKey(), c.getConfigValue());
        }
        return map;
    }

    /**
     * 保存交期配置
     */
    public void saveConfig(Map<String, String> config) {
        for (Map.Entry<String, String> entry : config.entrySet()) {
            if (!entry.getKey().startsWith("DEADLINE_")) continue;
            LambdaQueryWrapper<SysConfig> w = new LambdaQueryWrapper<>();
            w.eq(SysConfig::getConfigKey, entry.getKey());
            SysConfig existing = sysConfigMapper.selectOne(w);
            if (existing != null) {
                existing.setConfigValue(entry.getValue());
                sysConfigMapper.updateById(existing);
            } else {
                SysConfig c = new SysConfig();
                c.setConfigKey(entry.getKey());
                c.setConfigValue(entry.getValue());
                sysConfigMapper.insert(c);
            }
        }
    }

    /**
     * 销售首次提交时，计算各环节截止时间
     */
    public void calculateDeadlines(QuoteOrder order) {
        LocalDate validUntil = order.getValidUntil();
        if (validUntil == null) return;

        LocalDateTime startTime = LocalDateTime.now();
        LocalDateTime endTime = validUntil.atTime(23, 59, 59);
        long totalMinutes = ChronoUnit.MINUTES.between(startTime, endTime);
        if (totalMinutes <= 0) return;

        Map<String, String> config = getConfig();
        // 优先使用报价单自带的交期配置，否则用管理员默认值
        String mode = order.getDeadlineMode() != null ? order.getDeadlineMode()
                : config.getOrDefault("DEADLINE_MODE", "PERCENTAGE");
        int[] stageValues = new int[4];
        Integer[] orderValues = { order.getDeadlineTech(), order.getDeadlineProcess(),
                order.getDeadlineLogistics(), order.getDeadlineApprove() };
        for (int i = 0; i < 4; i++) {
            stageValues[i] = orderValues[i] != null ? orderValues[i]
                    : parseInt(config.get(STAGE_KEYS[i]), "FIXED_DAYS".equals(mode) ? 3 : 25);
        }

        // 已有截止时间则跳过（避免重复计算）
        LambdaQueryWrapper<StageDeadline> check = new LambdaQueryWrapper<>();
        check.eq(StageDeadline::getQuoteId, order.getId());
        if (count(check) > 0) return;

        LocalDateTime cursor = startTime;
        for (int i = 0; i < STAGES.length; i++) {
            StageDeadline sd = new StageDeadline();
            sd.setQuoteId(order.getId());
            sd.setStage(STAGES[i]);
            sd.setWarned(0);
            sd.setNotified(0);
            sd.setEscalated(0);

            if ("FIXED_DAYS".equals(mode)) {
                cursor = cursor.plusDays(stageValues[i]);
            } else {
                long stageMinutes = totalMinutes * stageValues[i] / 100;
                cursor = cursor.plusMinutes(stageMinutes);
            }
            sd.setDeadline(cursor.isAfter(endTime) ? endTime : cursor);
            save(sd);
        }
    }

    /**
     * 查询报价单各环节截止时间
     */
    public List<StageDeadline> getDeadlines(Long quoteId) {
        LambdaQueryWrapper<StageDeadline> w = new LambdaQueryWrapper<>();
        w.eq(StageDeadline::getQuoteId, quoteId).orderByAsc(StageDeadline::getId);
        return list(w);
    }

    /**
     * 查询所有已超期且未通知的记录
     */
    public List<StageDeadline> findOverdueNotNotified() {
        LambdaQueryWrapper<StageDeadline> w = new LambdaQueryWrapper<>();
        w.lt(StageDeadline::getDeadline, LocalDateTime.now())
         .eq(StageDeadline::getNotified, 0);
        return list(w);
    }

    /**
     * 查询已通知但未升级、且超期超过N小时的记录
     */
    public List<StageDeadline> findOverdueNotEscalated(int escalationHours) {
        LocalDateTime threshold = LocalDateTime.now().minusHours(escalationHours);
        LambdaQueryWrapper<StageDeadline> w = new LambdaQueryWrapper<>();
        w.lt(StageDeadline::getDeadline, threshold)
         .eq(StageDeadline::getNotified, 1)
         .eq(StageDeadline::getEscalated, 0);
        return list(w);
    }

    public int getEscalationHours() {
        Map<String, String> config = getConfig();
        return parseInt(config.get("DEADLINE_ESCALATION_HOURS"), 24);
    }

    /**
     * 查询即将到期且未预警的记录（deadline在 now ~ now+warningHours 之间）
     */
    public List<StageDeadline> findApproachingNotWarned(int warningHours) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusHours(warningHours);
        LambdaQueryWrapper<StageDeadline> w = new LambdaQueryWrapper<>();
        w.gt(StageDeadline::getDeadline, now)
         .lt(StageDeadline::getDeadline, threshold)
         .eq(StageDeadline::getWarned, 0);
        return list(w);
    }

    public int getWarningHours() {
        Map<String, String> config = getConfig();
        return parseInt(config.get("DEADLINE_WARNING_HOURS"), 4);
    }

    /**
     * 启动某环节的计时器
     */
    public void startStageTimer(QuoteOrder order, String stage) {
        LocalDateTime now = LocalDateTime.now();
        switch (stage) {
            case "TECH" -> order.setTechActiveStart(now);
            case "PROCESS" -> order.setProcessActiveStart(now);
            case "LOGISTICS" -> order.setLogisticsActiveStart(now);
            case "APPROVAL" -> order.setApproveActiveStart(now);
        }
    }

    /**
     * 暂停某环节的计时器，累加活跃秒数
     */
    public void pauseStageTimer(QuoteOrder order, String stage) {
        LocalDateTime start;
        long elapsed;
        switch (stage) {
            case "TECH" -> {
                start = order.getTechActiveStart();
                elapsed = order.getTechElapsedSeconds() != null ? order.getTechElapsedSeconds() : 0;
                if (start != null) {
                    elapsed += ChronoUnit.SECONDS.between(start, LocalDateTime.now());
                    order.setTechElapsedSeconds(elapsed);
                    order.setTechActiveStart(null);
                }
            }
            case "PROCESS" -> {
                start = order.getProcessActiveStart();
                elapsed = order.getProcessElapsedSeconds() != null ? order.getProcessElapsedSeconds() : 0;
                if (start != null) {
                    elapsed += ChronoUnit.SECONDS.between(start, LocalDateTime.now());
                    order.setProcessElapsedSeconds(elapsed);
                    order.setProcessActiveStart(null);
                }
            }
            case "LOGISTICS" -> {
                start = order.getLogisticsActiveStart();
                elapsed = order.getLogisticsElapsedSeconds() != null ? order.getLogisticsElapsedSeconds() : 0;
                if (start != null) {
                    elapsed += ChronoUnit.SECONDS.between(start, LocalDateTime.now());
                    order.setLogisticsElapsedSeconds(elapsed);
                    order.setLogisticsActiveStart(null);
                }
            }
            case "APPROVAL" -> {
                start = order.getApproveActiveStart();
                elapsed = order.getApproveElapsedSeconds() != null ? order.getApproveElapsedSeconds() : 0;
                if (start != null) {
                    elapsed += ChronoUnit.SECONDS.between(start, LocalDateTime.now());
                    order.setApproveElapsedSeconds(elapsed);
                    order.setApproveActiveStart(null);
                }
            }
        }
    }

    /**
     * 暂停所有活跃的计时器
     */
    public void pauseAllTimers(QuoteOrder order) {
        for (String stage : new String[]{"TECH", "PROCESS", "LOGISTICS", "APPROVAL"}) {
            pauseStageTimer(order, stage);
        }
    }

    private int parseInt(String val, int defaultVal) {
        if (val == null || val.isBlank()) return defaultVal;
        try { return Integer.parseInt(val); } catch (NumberFormatException e) { return defaultVal; }
    }
}
