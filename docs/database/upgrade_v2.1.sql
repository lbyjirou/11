-- ============================================================
-- 冷凝器报价管理系统 v2.1 数据库升级脚本
-- 升级内容：支持主机厂报价逻辑
-- 创建时间: 2026-01-22
-- ============================================================

USE condenser_db;

-- ========================================
-- 1. 扩展工序字典表 (process_dict)
-- 增加主机厂报价所需的设备和人工参数
-- ========================================
ALTER TABLE process_dict
    ADD COLUMN process_code VARCHAR(50) COMMENT '工序编码' AFTER id,
    ADD COLUMN calc_mode VARCHAR(20) NOT NULL DEFAULT 'FIXED' COMMENT '计算模式: FIXED-固定单价, MACHINE-设备+人工, WEIGHT-按重量' AFTER unit_price,
    ADD COLUMN machine_tonnage INT COMMENT '设备吨位(T)' AFTER calc_mode,
    ADD COLUMN machine_rate DECIMAL(10,2) COMMENT '设备费率(元/小时)' AFTER machine_tonnage,
    ADD COLUMN labor_rate DECIMAL(10,2) COMMENT '人工费率(元/小时)' AFTER machine_rate,
    ADD COLUMN labor_count INT DEFAULT 1 COMMENT '操作人数' AFTER labor_rate,
    ADD COLUMN cycle_time DECIMAL(10,2) COMMENT '标准节拍(秒/件)' AFTER labor_count,
    ADD COLUMN cavity_count INT DEFAULT 1 COMMENT '模具穴数' AFTER cycle_time,
    ADD COLUMN remark VARCHAR(500) COMMENT '备注' AFTER cavity_count;

-- 添加索引
ALTER TABLE process_dict ADD INDEX idx_process_code (process_code);
ALTER TABLE process_dict ADD INDEX idx_calc_mode (calc_mode);

-- ========================================
-- 2. 新建包装方案字典表 (base_packaging)
-- ========================================
DROP TABLE IF EXISTS base_packaging;
CREATE TABLE base_packaging (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    packaging_code VARCHAR(50) COMMENT '包装编码',
    packaging_name VARCHAR(100) NOT NULL COMMENT '包装名称',
    packaging_type VARCHAR(50) NOT NULL COMMENT '包装类型: CARTON-纸箱, PALLET-托盘, CRATE-围板箱, CUSTOM-定制',
    material VARCHAR(100) COMMENT '包装材料',
    spec_length DECIMAL(10,2) COMMENT '长度(mm)',
    spec_width DECIMAL(10,2) COMMENT '宽度(mm)',
    spec_height DECIMAL(10,2) COMMENT '高度(mm)',
    max_weight DECIMAL(10,2) COMMENT '最大承重(kg)',
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '单价(元/个)',
    pieces_per_box INT DEFAULT 1 COMMENT '每箱装载数量',
    is_returnable TINYINT DEFAULT 0 COMMENT '是否周转箱: 0-否 1-是',
    return_rate DECIMAL(5,2) DEFAULT 0 COMMENT '周转回收率(%)',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
    remark VARCHAR(500) COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_packaging_code (packaging_code),
    INDEX idx_packaging_type (packaging_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='包装方案字典表';

-- ========================================
-- 3. 新建报价物流计算表 (quote_logistics)
-- 记录每个报价单的物流计算明细
-- ========================================
DROP TABLE IF EXISTS quote_logistics;
CREATE TABLE quote_logistics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    quote_id BIGINT NOT NULL COMMENT '关联报价单ID',
    logistics_type VARCHAR(20) NOT NULL COMMENT '物流类型: DELIVERY-送货, RETURN-返货',

    -- 包装信息
    packaging_id BIGINT COMMENT '包装方案ID',
    packaging_name VARCHAR(100) COMMENT '包装名称',
    box_count INT COMMENT '包装箱数',
    packaging_cost DECIMAL(12,2) COMMENT '包装费用',

    -- 物流信息
    origin VARCHAR(100) COMMENT '出发地',
    destination VARCHAR(100) COMMENT '目的地',
    distance DECIMAL(10,2) COMMENT '距离(km)',
    transport_mode VARCHAR(50) COMMENT '运输方式: TRUCK-整车, LTL-零担, EXPRESS-快递',
    truck_type VARCHAR(50) COMMENT '车型: 4.2m/6.8m/9.6m/13.5m/17.5m',

    -- 费用明细
    total_weight DECIMAL(10,2) COMMENT '总重量(kg)',
    total_volume DECIMAL(10,4) COMMENT '总体积(m³)',
    freight_cost DECIMAL(12,2) COMMENT '运费',
    loading_cost DECIMAL(12,2) DEFAULT 0 COMMENT '装卸费',
    insurance_cost DECIMAL(12,2) DEFAULT 0 COMMENT '保险费',
    other_cost DECIMAL(12,2) DEFAULT 0 COMMENT '其他费用',
    total_logistics_cost DECIMAL(12,2) COMMENT '物流总费用',

    -- 周转箱相关
    is_returnable TINYINT DEFAULT 0 COMMENT '是否使用周转箱',
    return_packaging_cost DECIMAL(12,2) DEFAULT 0 COMMENT '周转箱回收运费',

    remark VARCHAR(500) COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_quote_id (quote_id),
    INDEX idx_logistics_type (logistics_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价物流计算表';

-- ========================================
-- 4. 新建报价工序明细表 (quote_item_process)
-- 记录每个报价单中各工序的详细计算参数
-- ========================================
DROP TABLE IF EXISTS quote_item_process;
CREATE TABLE quote_item_process (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    quote_id BIGINT NOT NULL COMMENT '关联报价单ID',
    item_index INT DEFAULT 0 COMMENT '产品序号(多产品报价时)',

    -- 工序基础信息
    process_id BIGINT COMMENT '关联工序字典ID',
    process_code VARCHAR(50) COMMENT '工序编码',
    process_name VARCHAR(100) NOT NULL COMMENT '工序名称',
    process_seq INT DEFAULT 0 COMMENT '工序顺序',

    -- 计算模式与参数
    calc_mode VARCHAR(20) NOT NULL DEFAULT 'FIXED' COMMENT '计算模式: FIXED-固定单价, MACHINE-设备+人工, WEIGHT-按重量',

    -- FIXED 模式参数
    fixed_unit_price DECIMAL(10,4) COMMENT '固定单价(元/件)',

    -- MACHINE 模式参数（设备+人工）
    machine_tonnage INT COMMENT '设备吨位(T)',
    machine_rate DECIMAL(10,2) COMMENT '设备费率(元/小时)',
    labor_rate DECIMAL(10,2) COMMENT '人工费率(元/小时)',
    labor_count INT DEFAULT 1 COMMENT '操作人数',
    input_cycle_time DECIMAL(10,2) COMMENT '输入节拍(秒/件)',
    actual_cycle_time DECIMAL(10,2) COMMENT '实际节拍(秒/件)',
    cavity_count INT DEFAULT 1 COMMENT '模具穴数',
    efficiency_rate DECIMAL(5,2) DEFAULT 85.00 COMMENT '稼动率(%)',

    -- WEIGHT 模式参数
    weight_price DECIMAL(10,4) COMMENT '单位重量价格(元/kg)',
    part_weight DECIMAL(10,4) COMMENT '零件重量(kg)',

    -- 计算结果
    quantity INT DEFAULT 1 COMMENT '数量',
    machine_cost DECIMAL(12,4) COMMENT '设备费用',
    labor_cost DECIMAL(12,4) COMMENT '人工费用',
    unit_process_cost DECIMAL(12,4) COMMENT '单件工序成本',
    total_process_cost DECIMAL(12,2) COMMENT '工序总成本',

    remark VARCHAR(500) COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_quote_id (quote_id),
    INDEX idx_process_id (process_id),
    INDEX idx_calc_mode (calc_mode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价工序明细表';

-- ========================================
-- 5. 新建设备参数表 (base_machine)
-- 存储各类设备的费率参数
-- ========================================
DROP TABLE IF EXISTS base_machine;
CREATE TABLE base_machine (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    machine_code VARCHAR(50) COMMENT '设备编码',
    machine_name VARCHAR(100) NOT NULL COMMENT '设备名称',
    machine_type VARCHAR(50) NOT NULL COMMENT '设备类型: PRESS-冲床, WELDER-焊机, CNC-数控机床, INJECTION-注塑机',
    tonnage INT COMMENT '吨位(T)',
    hourly_rate DECIMAL(10,2) NOT NULL COMMENT '设备费率(元/小时)',
    depreciation_rate DECIMAL(10,2) COMMENT '折旧费率(元/小时)',
    energy_rate DECIMAL(10,2) COMMENT '能耗费率(元/小时)',
    maintenance_rate DECIMAL(10,2) COMMENT '维护费率(元/小时)',
    labor_rate DECIMAL(10,2) COMMENT '配套人工费率(元/小时)',
    default_labor_count INT DEFAULT 1 COMMENT '默认操作人数',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
    remark VARCHAR(500) COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_machine_code (machine_code),
    INDEX idx_machine_type (machine_type),
    INDEX idx_tonnage (tonnage),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备参数表';

-- ========================================
-- 6. 初始化数据
-- ========================================

-- 6.1 更新现有工序，设置计算模式
UPDATE process_dict SET calc_mode = 'FIXED' WHERE calc_mode IS NULL OR calc_mode = '';

-- 6.2 插入主机厂常用工序（设备+人工模式）
INSERT INTO process_dict (process_code, process_name, unit_type, unit_price, calc_mode, machine_tonnage, machine_rate, labor_rate, labor_count, cycle_time, cavity_count, sort_order) VALUES
-- 冲压工序
('STAMP_200T', '冲压-200T', 'PCS', 0, 'MACHINE', 200, 45.00, 25.00, 1, 8.0, 1, 10),
('STAMP_400T', '冲压-400T', 'PCS', 0, 'MACHINE', 400, 65.00, 25.00, 1, 10.0, 1, 11),
('STAMP_630T', '冲压-630T', 'PCS', 0, 'MACHINE', 630, 85.00, 25.00, 1, 12.0, 1, 12),
('STAMP_800T', '冲压-800T', 'PCS', 0, 'MACHINE', 800, 100.00, 25.00, 1, 15.0, 1, 13),
('STAMP_1000T', '冲压-1000T', 'PCS', 0, 'MACHINE', 1000, 120.00, 25.00, 1, 18.0, 1, 14),
('STAMP_1600T', '冲压-1600T', 'PCS', 0, 'MACHINE', 1600, 150.00, 30.00, 2, 20.0, 1, 15),
('STAMP_2000T', '冲压-2000T', 'PCS', 0, 'MACHINE', 2000, 180.00, 30.00, 2, 25.0, 1, 16),

-- 焊接工序
('WELD_SPOT', '点焊', 'PCS', 0, 'MACHINE', NULL, 35.00, 28.00, 1, 6.0, 1, 20),
('WELD_MIG', 'MIG焊', 'PCS', 0, 'MACHINE', NULL, 45.00, 30.00, 1, 15.0, 1, 21),
('WELD_TIG', 'TIG焊', 'PCS', 0, 'MACHINE', NULL, 50.00, 35.00, 1, 20.0, 1, 22),
('WELD_LASER', '激光焊', 'PCS', 0, 'MACHINE', NULL, 80.00, 35.00, 1, 10.0, 1, 23),
('WELD_ROBOT', '机器人焊接', 'PCS', 0, 'MACHINE', NULL, 95.00, 25.00, 1, 8.0, 1, 24),

-- 机加工工序
('CNC_TURN', 'CNC车削', 'PCS', 0, 'MACHINE', NULL, 55.00, 30.00, 1, 30.0, 1, 30),
('CNC_MILL', 'CNC铣削', 'PCS', 0, 'MACHINE', NULL, 60.00, 30.00, 1, 45.0, 1, 31),
('CNC_DRILL', 'CNC钻孔', 'PCS', 0, 'MACHINE', NULL, 50.00, 28.00, 1, 20.0, 1, 32),

-- 表面处理
('SURFACE_PAINT', '喷涂', 'PCS', 0, 'FIXED', NULL, NULL, NULL, 1, NULL, 1, 40),
('SURFACE_PLATING', '电镀', 'KG', 15.00, 'WEIGHT', NULL, NULL, NULL, 1, NULL, 1, 41),
('SURFACE_ANODIZE', '阳极氧化', 'KG', 20.00, 'WEIGHT', NULL, NULL, NULL, 1, NULL, 1, 42),

-- 组装检测
('ASSY_MANUAL', '人工组装', 'PCS', 0, 'MACHINE', NULL, 0, 25.00, 1, 30.0, 1, 50),
('ASSY_AUTO', '自动组装', 'PCS', 0, 'MACHINE', NULL, 60.00, 25.00, 1, 5.0, 1, 51),
('QC_VISUAL', '外观检验', 'PCS', 0, 'MACHINE', NULL, 0, 22.00, 1, 10.0, 1, 60),
('QC_MEASURE', '尺寸检测', 'PCS', 0, 'MACHINE', NULL, 15.00, 25.00, 1, 15.0, 1, 61),
('QC_FUNCTION', '功能检测', 'PCS', 0, 'MACHINE', NULL, 25.00, 25.00, 1, 20.0, 1, 62);

-- 6.3 插入设备参数
INSERT INTO base_machine (machine_code, machine_name, machine_type, tonnage, hourly_rate, depreciation_rate, energy_rate, maintenance_rate, labor_rate, default_labor_count) VALUES
-- 冲床
('PRESS_160T', '160T冲床', 'PRESS', 160, 40.00, 15.00, 12.00, 8.00, 25.00, 1),
('PRESS_200T', '200T冲床', 'PRESS', 200, 45.00, 18.00, 14.00, 8.00, 25.00, 1),
('PRESS_315T', '315T冲床', 'PRESS', 315, 55.00, 22.00, 16.00, 10.00, 25.00, 1),
('PRESS_400T', '400T冲床', 'PRESS', 400, 65.00, 25.00, 20.00, 12.00, 25.00, 1),
('PRESS_500T', '500T冲床', 'PRESS', 500, 75.00, 28.00, 22.00, 14.00, 25.00, 1),
('PRESS_630T', '630T冲床', 'PRESS', 630, 85.00, 32.00, 25.00, 16.00, 25.00, 1),
('PRESS_800T', '800T冲床', 'PRESS', 800, 100.00, 38.00, 30.00, 18.00, 25.00, 1),
('PRESS_1000T', '1000T冲床', 'PRESS', 1000, 120.00, 45.00, 35.00, 22.00, 25.00, 1),
('PRESS_1250T', '1250T冲床', 'PRESS', 1250, 140.00, 52.00, 40.00, 25.00, 28.00, 2),
('PRESS_1600T', '1600T冲床', 'PRESS', 1600, 150.00, 58.00, 45.00, 28.00, 30.00, 2),
('PRESS_2000T', '2000T冲床', 'PRESS', 2000, 180.00, 70.00, 55.00, 32.00, 30.00, 2),
('PRESS_2500T', '2500T冲床', 'PRESS', 2500, 220.00, 85.00, 65.00, 38.00, 30.00, 2),

-- 焊机
('WELDER_SPOT', '点焊机', 'WELDER', NULL, 35.00, 12.00, 10.00, 8.00, 28.00, 1),
('WELDER_MIG', 'MIG焊机', 'WELDER', NULL, 45.00, 15.00, 12.00, 10.00, 30.00, 1),
('WELDER_TIG', 'TIG焊机', 'WELDER', NULL, 50.00, 18.00, 14.00, 12.00, 35.00, 1),
('WELDER_LASER', '激光焊机', 'WELDER', NULL, 80.00, 30.00, 20.00, 18.00, 35.00, 1),
('WELDER_ROBOT', '焊接机器人', 'WELDER', NULL, 95.00, 35.00, 25.00, 20.00, 25.00, 1),

-- 数控机床
('CNC_LATHE', 'CNC车床', 'CNC', NULL, 55.00, 20.00, 15.00, 12.00, 30.00, 1),
('CNC_MILL_3', '3轴加工中心', 'CNC', NULL, 60.00, 22.00, 18.00, 14.00, 30.00, 1),
('CNC_MILL_5', '5轴加工中心', 'CNC', NULL, 120.00, 45.00, 30.00, 25.00, 35.00, 1),
('CNC_DRILL', 'CNC钻攻机', 'CNC', NULL, 50.00, 18.00, 14.00, 10.00, 28.00, 1);

-- 6.4 插入包装方案
INSERT INTO base_packaging (packaging_code, packaging_name, packaging_type, material, spec_length, spec_width, spec_height, max_weight, unit_price, pieces_per_box, is_returnable, return_rate) VALUES
('PKG_CARTON_S', '小纸箱', 'CARTON', '瓦楞纸', 400, 300, 250, 15, 8.00, 20, 0, 0),
('PKG_CARTON_M', '中纸箱', 'CARTON', '瓦楞纸', 600, 400, 350, 25, 12.00, 40, 0, 0),
('PKG_CARTON_L', '大纸箱', 'CARTON', '瓦楞纸', 800, 600, 500, 40, 18.00, 80, 0, 0),
('PKG_PALLET_STD', '标准托盘', 'PALLET', '木质', 1200, 1000, 150, 1000, 85.00, 1, 1, 90),
('PKG_CRATE_S', '小围板箱', 'CRATE', '木质+塑料', 600, 400, 400, 50, 120.00, 50, 1, 95),
('PKG_CRATE_M', '中围板箱', 'CRATE', '木质+塑料', 800, 600, 500, 100, 180.00, 100, 1, 95),
('PKG_CRATE_L', '大围板箱', 'CRATE', '木质+塑料', 1200, 1000, 800, 200, 280.00, 200, 1, 95),
('PKG_IRON_BOX', '铁箱', 'CRATE', '钢铁', 1200, 1000, 800, 500, 450.00, 300, 1, 98),
('PKG_BLISTER', '吸塑托盘', 'CUSTOM', 'PET', 400, 300, 50, 5, 3.50, 10, 0, 0),
('PKG_BAG', 'PE袋', 'CUSTOM', 'PE', 300, 200, 0, 2, 0.50, 1, 0, 0);

-- ========================================
-- 7. 扩展报价单表，增加主机厂相关字段
-- ========================================
ALTER TABLE quote_order
    ADD COLUMN quote_type VARCHAR(20) DEFAULT 'STANDARD' COMMENT '报价类型: STANDARD-标准, OEM-主机厂' AFTER product_type,
    ADD COLUMN customer_code VARCHAR(50) COMMENT '客户编码' AFTER customer_name,
    ADD COLUMN part_no VARCHAR(100) COMMENT '零件号' AFTER customer_code,
    ADD COLUMN part_name VARCHAR(200) COMMENT '零件名称' AFTER part_no,
    ADD COLUMN annual_volume INT COMMENT '年产量' AFTER quantity,
    ADD COLUMN packaging_cost DECIMAL(12,2) DEFAULT 0 COMMENT '包装费用' AFTER logistics_cost,
    ADD COLUMN management_cost DECIMAL(12,2) DEFAULT 0 COMMENT '管理费用' AFTER packaging_cost,
    ADD COLUMN profit_amount DECIMAL(12,2) DEFAULT 0 COMMENT '利润金额' AFTER management_cost,
    ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 13.00 COMMENT '税率(%)' AFTER profit_amount,
    ADD COLUMN tax_amount DECIMAL(12,2) DEFAULT 0 COMMENT '税额' AFTER tax_rate;

-- 添加索引
ALTER TABLE quote_order ADD INDEX idx_quote_type (quote_type);
ALTER TABLE quote_order ADD INDEX idx_customer_code (customer_code);
ALTER TABLE quote_order ADD INDEX idx_part_no (part_no);

-- ========================================
-- 完成
-- ========================================
SELECT '数据库升级完成！' AS message;
SELECT
    (SELECT COUNT(*) FROM process_dict) AS '工序数量',
    (SELECT COUNT(*) FROM base_machine) AS '设备数量',
    (SELECT COUNT(*) FROM base_packaging) AS '包装方案数量';
