-- 工序字典表字段升级脚本
-- 创建时间: 2026-01-23
-- 说明: 添加实体类中定义但数据库缺失的字段

USE condenser_db;

-- 添加缺失的字段
ALTER TABLE process_dict
    ADD COLUMN process_code VARCHAR(50) COMMENT '工序编码' AFTER id,
    ADD COLUMN calc_mode VARCHAR(20) DEFAULT 'FIXED' COMMENT '计算模式: FIXED-固定单价, MACHINE-设备+人工, WEIGHT-按重量' AFTER unit_price,
    ADD COLUMN machine_tonnage INT COMMENT '设备吨位(T)' AFTER calc_mode,
    ADD COLUMN machine_rate DECIMAL(10,2) COMMENT '设备费率(元/小时)' AFTER machine_tonnage,
    ADD COLUMN labor_rate DECIMAL(10,2) COMMENT '人工费率(元/小时)' AFTER machine_rate,
    ADD COLUMN labor_count INT COMMENT '操作人数' AFTER labor_rate,
    ADD COLUMN cycle_time DECIMAL(10,2) COMMENT '标准节拍(秒/件)' AFTER labor_count,
    ADD COLUMN cavity_count INT COMMENT '模具穴数' AFTER cycle_time,
    ADD COLUMN remark VARCHAR(500) COMMENT '备注' AFTER cavity_count;

-- 为现有数据设置默认工序编码
UPDATE process_dict SET process_code = CONCAT('PROC', LPAD(id, 4, '0')) WHERE process_code IS NULL;
