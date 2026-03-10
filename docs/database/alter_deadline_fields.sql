-- 报价单交期分配字段（销售按单覆盖管理员默认值）
ALTER TABLE quote_order ADD COLUMN deadline_mode VARCHAR(20) DEFAULT NULL COMMENT '交期模式: PERCENTAGE/FIXED_DAYS';
ALTER TABLE quote_order ADD COLUMN deadline_tech INT DEFAULT NULL COMMENT '技术环节分配值';
ALTER TABLE quote_order ADD COLUMN deadline_process INT DEFAULT NULL COMMENT '工序环节分配值';
ALTER TABLE quote_order ADD COLUMN deadline_logistics INT DEFAULT NULL COMMENT '物流环节分配值';
ALTER TABLE quote_order ADD COLUMN deadline_approve INT DEFAULT NULL COMMENT '审批环节分配值';
