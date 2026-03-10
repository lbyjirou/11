-- 修复：将已移交给技术的字段改为允许 NULL
-- 原因：销售创建报价单时不再填写这些字段，NOT NULL 约束导致 INSERT 失败
-- 执行时间: 2026-02-08

USE condenser_db;

ALTER TABLE quote_order
  MODIFY COLUMN part_no VARCHAR(50) DEFAULT NULL COMMENT '零件号',
  MODIFY COLUMN part_name VARCHAR(100) DEFAULT NULL COMMENT '零件名称',
  MODIFY COLUMN annual_quantity INT DEFAULT NULL COMMENT '年产量(遗留字段)',
  MODIFY COLUMN customer_name VARCHAR(100) DEFAULT NULL COMMENT '客户名称';
