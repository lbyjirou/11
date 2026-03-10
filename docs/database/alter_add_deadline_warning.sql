-- 提前预警功能：stage_deadline 新增 warned 字段 + sys_config 新增预警配置
USE condenser_db;

-- 已有表添加 warned 列
ALTER TABLE stage_deadline
  ADD COLUMN warned TINYINT NOT NULL DEFAULT 0 COMMENT '是否已发送提前预警: 0-否 1-是'
  AFTER deadline;

-- 插入预警时间配置（忽略已存在的情况）
INSERT IGNORE INTO sys_config (config_key, config_value, description)
VALUES ('DEADLINE_WARNING_HOURS', '4', '截止前多少小时发送预警通知');
