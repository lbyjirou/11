-- 交期约束机制：环节截止时间表 + 通知表
-- 配置数据复用 sys_config 表（key-value）

USE condenser_db;

-- 各环节截止时间
CREATE TABLE IF NOT EXISTS stage_deadline (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    quote_id BIGINT NOT NULL COMMENT '报价单ID',
    stage VARCHAR(30) NOT NULL COMMENT '环节状态: PENDING_TECH/PENDING_PROCESS/PENDING_LOGISTICS/PENDING_APPROVAL',
    deadline DATETIME NOT NULL COMMENT '截止时间',
    warned TINYINT NOT NULL DEFAULT 0 COMMENT '是否已发送提前预警: 0-否 1-是',
    notified TINYINT NOT NULL DEFAULT 0 COMMENT '是否已通知负责人: 0-否 1-是',
    escalated TINYINT NOT NULL DEFAULT 0 COMMENT '是否已升级通知管理员: 0-否 1-是',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_quote_stage (quote_id, stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价单环节截止时间';

-- 系统通知
CREATE TABLE IF NOT EXISTS notification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '接收人ID',
    quote_id BIGINT DEFAULT NULL COMMENT '关联报价单ID',
    type VARCHAR(30) NOT NULL COMMENT '通知类型: DEADLINE_WARNING/OVERDUE_WARNING/OVERDUE_ESCALATION',
    title VARCHAR(100) NOT NULL COMMENT '通知标题',
    message VARCHAR(500) NOT NULL COMMENT '通知内容',
    is_read TINYINT NOT NULL DEFAULT 0 COMMENT '是否已读: 0-否 1-是',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统通知';

CREATE INDEX idx_notification_user ON notification(user_id, is_read);

-- 插入默认交期配置（百分比模式）
INSERT INTO sys_config (config_key, config_value, description) VALUES
('DEADLINE_MODE', 'PERCENTAGE', '交期分配模式: PERCENTAGE-百分比 / FIXED_DAYS-固定天数'),
('DEADLINE_TECH', '30', '技术环节分配值（百分比或天数）'),
('DEADLINE_PROCESS', '25', '工序环节分配值'),
('DEADLINE_LOGISTICS', '20', '物流环节分配值'),
('DEADLINE_APPROVE', '25', '审批环节分配值'),
('DEADLINE_ESCALATION_HOURS', '24', '超期多少小时后升级通知管理员'),
('DEADLINE_WARNING_HOURS', '4', '截止前多少小时发送预警通知');
