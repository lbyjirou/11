-- 报价单表 - 新增 owner(报价负责人) 字段
-- 执行时间: 2026-02-08

USE condenser_db;

ALTER TABLE quote_order
  ADD COLUMN owner VARCHAR(50) DEFAULT NULL COMMENT '报价负责人';
