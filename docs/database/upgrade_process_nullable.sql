-- 工序字典表字段允许NULL升级脚本
-- 执行时间: 2026-02-05
-- 说明: 将非必填字段的默认值改为NULL

USE condenser_db;

ALTER TABLE process_dict MODIFY COLUMN labor_rate DECIMAL(10,2) DEFAULT NULL COMMENT '人工费率(元/H)';
ALTER TABLE process_dict MODIFY COLUMN labor_time INT DEFAULT NULL COMMENT '工时(秒)';
ALTER TABLE process_dict MODIFY COLUMN operators INT DEFAULT NULL COMMENT '操作人数';
ALTER TABLE process_dict MODIFY COLUMN var_cost DECIMAL(10,2) DEFAULT NULL COMMENT '可变费用';
ALTER TABLE process_dict MODIFY COLUMN fix_cost DECIMAL(10,2) DEFAULT NULL COMMENT '固定费用';
