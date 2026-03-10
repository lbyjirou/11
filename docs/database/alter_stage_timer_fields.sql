-- 秒表计时模型：每个环节跟踪活跃时间
ALTER TABLE quote_order ADD COLUMN tech_active_start DATETIME DEFAULT NULL COMMENT '技术环节计时器启动时间';
ALTER TABLE quote_order ADD COLUMN tech_elapsed_seconds BIGINT DEFAULT 0 COMMENT '技术环节累计活跃秒数';
ALTER TABLE quote_order ADD COLUMN process_active_start DATETIME DEFAULT NULL COMMENT '工序环节计时器启动时间';
ALTER TABLE quote_order ADD COLUMN process_elapsed_seconds BIGINT DEFAULT 0 COMMENT '工序环节累计活跃秒数';
ALTER TABLE quote_order ADD COLUMN logistics_active_start DATETIME DEFAULT NULL COMMENT '物流环节计时器启动时间';
ALTER TABLE quote_order ADD COLUMN logistics_elapsed_seconds BIGINT DEFAULT 0 COMMENT '物流环节累计活跃秒数';
ALTER TABLE quote_order ADD COLUMN approve_active_start DATETIME DEFAULT NULL COMMENT '审批环节计时器启动时间';
ALTER TABLE quote_order ADD COLUMN approve_elapsed_seconds BIGINT DEFAULT 0 COMMENT '审批环节累计活跃秒数';
