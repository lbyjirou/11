-- 工序字典表字段扩展
-- 执行时间: 2026-02-05

ALTER TABLE process_dict ADD COLUMN labor_rate DECIMAL(10,2) DEFAULT 25 COMMENT '人工费率(元/H)';
ALTER TABLE process_dict ADD COLUMN labor_time INT DEFAULT 180 COMMENT '工时(秒)';
ALTER TABLE process_dict ADD COLUMN operators INT DEFAULT 1 COMMENT '操作人数';
ALTER TABLE process_dict ADD COLUMN machine_model VARCHAR(100) DEFAULT NULL COMMENT '机器型号';
ALTER TABLE process_dict ADD COLUMN machine_type VARCHAR(100) DEFAULT NULL COMMENT '机器类别';
ALTER TABLE process_dict ADD COLUMN var_cost DECIMAL(10,2) DEFAULT 0 COMMENT '可变费用';
ALTER TABLE process_dict ADD COLUMN fix_cost DECIMAL(10,2) DEFAULT 0 COMMENT '固定费用';
