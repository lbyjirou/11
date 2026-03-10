-- ============================================================
-- 易德报价系统 - 上汽报价单字段升级脚本
-- 基于《上汽报价单-第五部分字段说明.md》
-- ============================================================

-- ============================================================
-- 1. quote_order 表：表头信息区 + 成本汇总区
-- ============================================================

-- 表头信息区 - SALES 字段
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS inquiry_no VARCHAR(50) DEFAULT NULL COMMENT '询价单号';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS inquiry_date DATE DEFAULT NULL COMMENT '询价单发布日期';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS quote_date DATE DEFAULT NULL COMMENT '报价日期';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS quote_quantity INT DEFAULT NULL COMMENT '报价产量';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS register_address VARCHAR(200) DEFAULT NULL COMMENT '注册地址';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS factory_address VARCHAR(200) DEFAULT NULL COMMENT '工厂地址';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS supplier_duns VARCHAR(50) DEFAULT NULL COMMENT '供应商邓白氏号';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS contact_name VARCHAR(50) DEFAULT NULL COMMENT '联系人';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS creator_name VARCHAR(50) DEFAULT NULL COMMENT '制表人';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'CNY' COMMENT '当地货币';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4) DEFAULT 1.0000 COMMENT '汇率';

-- 表头信息区 - TECH 字段
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS has_import_parts TINYINT DEFAULT 0 COMMENT '是否含有进口子零件: 0-否, 1-是';

-- 表头信息区 - PROCESS 字段
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS mold_life INT DEFAULT NULL COMMENT '模具寿命(件数)';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS daily_work_hours DECIMAL(4,1) DEFAULT NULL COMMENT '日工作工时';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS weekly_work_days INT DEFAULT NULL COMMENT '周工作日天数';

-- 成本汇总区 - 系统计算字段
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS total_production_cost DECIMAL(12,4) DEFAULT NULL COMMENT '总制造成本(材料+模具分摊+人工+制造费用)';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(12,4) DEFAULT NULL COMMENT '总直接人工成本';

-- 成本汇总区 - MANAGER 字段
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS management_fee DECIMAL(12,4) DEFAULT NULL COMMENT '一般管理费用';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS scrap_rate DECIMAL(5,2) DEFAULT 3.00 COMMENT '报废率(%)';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS scrap_cost DECIMAL(12,4) DEFAULT NULL COMMENT '报废损耗金额';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS profit DECIMAL(12,4) DEFAULT 0 COMMENT '利润';
ALTER TABLE quote_order ADD COLUMN IF NOT EXISTS factory_price DECIMAL(12,4) DEFAULT NULL COMMENT '出厂价';

-- ============================================================
-- 2. quote_bom 表：原材料及外购件成本区
-- ============================================================

ALTER TABLE quote_bom ADD COLUMN IF NOT EXISTS purchase_type CHAR(1) DEFAULT 'P' COMMENT 'P=采购件, M=自制件';
ALTER TABLE quote_bom ADD COLUMN IF NOT EXISTS material_total_cost DECIMAL(12,4) DEFAULT NULL COMMENT '材料总成本(数量×单位成本)';
ALTER TABLE quote_bom ADD COLUMN IF NOT EXISTS material_name VARCHAR(100) DEFAULT NULL COMMENT '原材料名称/外购件零件号';
ALTER TABLE quote_bom ADD COLUMN IF NOT EXISTS material_supplier VARCHAR(100) DEFAULT NULL COMMENT '材料供应商名称';
ALTER TABLE quote_bom ADD COLUMN IF NOT EXISTS material_supplier_duns VARCHAR(50) DEFAULT NULL COMMENT '材料供应商邓白氏号';
ALTER TABLE quote_bom ADD COLUMN IF NOT EXISTS tooling_cost_per_unit DECIMAL(12,6) DEFAULT NULL COMMENT '工装分摊单件成本';

-- ============================================================
-- 3. quote_item_process 表：自制件直接人工及制造费用区
-- ============================================================

ALTER TABLE quote_item_process ADD COLUMN IF NOT EXISTS process_seq VARCHAR(20) DEFAULT NULL COMMENT '工序序号(工艺1、工艺2...)';
ALTER TABLE quote_item_process ADD COLUMN IF NOT EXISTS machine_model VARCHAR(100) DEFAULT NULL COMMENT '机器型号';
ALTER TABLE quote_item_process ADD COLUMN IF NOT EXISTS machine_category VARCHAR(50) DEFAULT NULL COMMENT '机器类别(如500KW)';
ALTER TABLE quote_item_process ADD COLUMN IF NOT EXISTS variable_cost DECIMAL(12,4) DEFAULT NULL COMMENT '可变费用';
ALTER TABLE quote_item_process ADD COLUMN IF NOT EXISTS fixed_cost DECIMAL(12,4) DEFAULT NULL COMMENT '固定费用';

-- ============================================================
-- 4. quote_logistics 表：物流成本明细区
-- ============================================================

ALTER TABLE quote_logistics ADD COLUMN IF NOT EXISTS warehouse_fee DECIMAL(12,4) DEFAULT NULL COMMENT '三方仓费用';
ALTER TABLE quote_logistics ADD COLUMN IF NOT EXISTS freight_fee DECIMAL(12,4) DEFAULT NULL COMMENT '运费';
ALTER TABLE quote_logistics ADD COLUMN IF NOT EXISTS return_freight_fee DECIMAL(12,4) DEFAULT NULL COMMENT '围板箱与海绵返回运费';
ALTER TABLE quote_logistics ADD COLUMN IF NOT EXISTS total_logistics_cost DECIMAL(12,4) DEFAULT NULL COMMENT '物流成本合计';

-- ============================================================
-- 5. 创建索引（可选）
-- ============================================================

-- 询价单号索引
CREATE INDEX IF NOT EXISTS idx_inquiry_no ON quote_order(inquiry_no);

-- ============================================================
-- 完成
-- ============================================================
SELECT '上汽报价单字段升级完成' AS message;
