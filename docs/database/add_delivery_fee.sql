-- 添加低于10方送货费字段
-- 创建时间: 2026-01-23

USE condenser_db;

-- 添加字段
ALTER TABLE logistics_price
ADD COLUMN delivery_fee DECIMAL(10,2) COMMENT '低于10方送货费(元)' AFTER scatter_remark;
