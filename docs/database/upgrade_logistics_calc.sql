-- 物流核算功能补全 - 数据库升级脚本
-- quote_logistics 表新增目的地和物流公司字段

ALTER TABLE quote_logistics ADD COLUMN destination VARCHAR(100) DEFAULT NULL COMMENT '目的地/发货方向';
ALTER TABLE quote_logistics ADD COLUMN company_name VARCHAR(100) DEFAULT NULL COMMENT '物流公司名称';
