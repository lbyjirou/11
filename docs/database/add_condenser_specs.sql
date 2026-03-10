-- 冷凝器产品规格字段升级
-- 执行时间: 2026-02-05

ALTER TABLE quote_order ADD COLUMN size_l DECIMAL(10,2) DEFAULT NULL COMMENT '总成尺寸-长(mm)';
ALTER TABLE quote_order ADD COLUMN size_w DECIMAL(10,2) DEFAULT NULL COMMENT '总成尺寸-宽(mm)';
ALTER TABLE quote_order ADD COLUMN size_h DECIMAL(10,2) DEFAULT NULL COMMENT '总成尺寸-高(mm)';
ALTER TABLE quote_order ADD COLUMN volume DECIMAL(10,2) DEFAULT NULL COMMENT '体积(L)';
ALTER TABLE quote_order ADD COLUMN core_center DECIMAL(10,2) DEFAULT NULL COMMENT '芯体中心距(mm)';
ALTER TABLE quote_order ADD COLUMN core_width DECIMAL(10,2) DEFAULT NULL COMMENT '芯体宽度(mm)';
ALTER TABLE quote_order ADD COLUMN core_thickness DECIMAL(10,2) DEFAULT NULL COMMENT '芯体厚度(mm)';
ALTER TABLE quote_order ADD COLUMN heat_exchange DECIMAL(10,2) DEFAULT NULL COMMENT '换热量(kW)';
ALTER TABLE quote_order ADD COLUMN refrigerant VARCHAR(50) DEFAULT NULL COMMENT '制冷剂类型';
ALTER TABLE quote_order ADD COLUMN wind_speed DECIMAL(10,2) DEFAULT NULL COMMENT '风速(m/s)';
ALTER TABLE quote_order ADD COLUMN pressure_drop DECIMAL(10,2) DEFAULT NULL COMMENT '压降(kPa)';
ALTER TABLE quote_order ADD COLUMN tech_data_json TEXT DEFAULT NULL COMMENT '技术Tab数据(JSON)';
ALTER TABLE quote_order ADD COLUMN logistics_data_json TEXT DEFAULT NULL COMMENT '物流Tab数据(JSON)';
