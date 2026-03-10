-- Phase 2: 工单修改与回滚机制 DDL
-- 执行前请备份数据库

-- 1. quote_order 新增修改流程字段
ALTER TABLE `quote_order`
  ADD COLUMN `is_in_modification` TINYINT DEFAULT 0 COMMENT '是否处于修改流程: 0-否, 1-是',
  ADD COLUMN `modification_initiator` VARCHAR(20) DEFAULT NULL COMMENT '修改发起阶段';

-- 2. 阶段快照表
CREATE TABLE IF NOT EXISTS `quote_stage_snapshot` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT NOT NULL,
  `stage` VARCHAR(20) NOT NULL COMMENT 'SALES/TECH/PROCESS/LOGISTICS/APPROVAL',
  `handler_id` BIGINT,
  `data_snapshot` JSON COMMENT '该阶段提交时的数据快照',
  `version` INT DEFAULT 1,
  `status` VARCHAR(20) DEFAULT 'CONFIRMED' COMMENT 'CONFIRMED/PENDING_RECONFIRM/MODIFIED',
  `confirmed_at` DATETIME,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_order_stage` (`order_id`, `stage`)
) COMMENT='阶段快照表';

-- 3. 修改记录表
CREATE TABLE IF NOT EXISTS `quote_modification_log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT NOT NULL,
  `initiator_stage` VARCHAR(20) NOT NULL,
  `initiator_id` BIGINT NOT NULL,
  `reason` VARCHAR(500),
  `affected_stages` VARCHAR(200),
  `status` VARCHAR(20) DEFAULT 'IN_PROGRESS' COMMENT 'IN_PROGRESS/COMPLETED',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `complete_time` DATETIME,
  KEY `idx_order_id` (`order_id`)
) COMMENT='修改记录表';
