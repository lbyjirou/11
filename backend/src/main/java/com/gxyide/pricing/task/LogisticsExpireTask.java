package com.gxyide.pricing.task;

import com.gxyide.pricing.service.LogisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 物流数据过期清理定时任务
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LogisticsExpireTask {

    private final LogisticsService logisticsService;

    /**
     * 每天凌晨2点执行过期数据清理
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanExpiredData() {
        log.info("开始执行物流数据过期清理任务");
        int count = logisticsService.deleteExpiredData();
        log.info("物流数据过期清理完成，删除 {} 条", count);
    }
}
