-- 上汽报价单扩展字段 - 添加到 quote_order 表
-- 执行前请备份数据库

-- 表头扩展字段（SALES填写）
ALTER TABLE quote_order ADD COLUMN quote_date DATE COMMENT '报价日期' AFTER quote_deadline;
ALTER TABLE quote_order ADD COLUMN quote_quantity INT COMMENT '报价产量' AFTER annual_quantity;
ALTER TABLE quote_order ADD COLUMN register_address VARCHAR(500) COMMENT '注册地址' AFTER supplier_duns;
ALTER TABLE quote_order ADD COLUMN factory_address VARCHAR(500) COMMENT '工厂地址' AFTER register_address;
ALTER TABLE quote_order ADD COLUMN contact_name VARCHAR(100) COMMENT '联系人' AFTER factory_address;
ALTER TABLE quote_order ADD COLUMN contact_phone VARCHAR(50) COMMENT '联系电话' AFTER contact_name;
ALTER TABLE quote_order ADD COLUMN creator_name VARCHAR(100) COMMENT '制表人' AFTER contact_phone;
ALTER TABLE quote_order ADD COLUMN currency VARCHAR(20) DEFAULT 'CNY' COMMENT '当地货币' AFTER creator_name;
ALTER TABLE quote_order ADD COLUMN exchange_rate DECIMAL(10,4) DEFAULT 1.0 COMMENT '汇率' AFTER currency;

-- TECH填写字段
ALTER TABLE quote_order ADD COLUMN has_import_parts TINYINT DEFAULT 0 COMMENT '是否含有进口子零件: 0-否, 1-是' AFTER exchange_rate;

-- PROCESS填写字段
ALTER TABLE quote_order ADD COLUMN mold_life INT COMMENT '模具寿命(件数)' AFTER has_import_parts;
ALTER TABLE quote_order ADD COLUMN daily_work_hours DECIMAL(10,2) COMMENT '日工作工时' AFTER mold_life;
ALTER TABLE quote_order ADD COLUMN weekly_work_days INT COMMENT '周工作日天数' AFTER daily_work_hours;

-- 计算字段（如果不存在则添加）
ALTER TABLE quote_order ADD COLUMN labor_cost DECIMAL(18,4) COMMENT '总直接人工成本' AFTER material_cost;
ALTER TABLE quote_order ADD COLUMN tooling_cost DECIMAL(18,4) COMMENT '工装成本' AFTER manufacturing_cost;
ALTER TABLE quote_order ADD COLUMN total_production_cost DECIMAL(18,4) COMMENT '总制造成本' AFTER tooling_cost;
ALTER TABLE quote_order ADD COLUMN management_fee DECIMAL(18,4) COMMENT '管理费用' AFTER packaging_cost;
ALTER TABLE quote_order ADD COLUMN scrap_rate DECIMAL(10,4) COMMENT '报废率(%)' AFTER management_fee;
ALTER TABLE quote_order ADD COLUMN scrap_cost DECIMAL(18,4) COMMENT '报废损耗金额' AFTER scrap_rate;
ALTER TABLE quote_order ADD COLUMN profit DECIMAL(18,4) COMMENT '利润' AFTER scrap_cost;
ALTER TABLE quote_order ADD COLUMN factory_price DECIMAL(18,4) COMMENT '出厂价' AFTER profit;
