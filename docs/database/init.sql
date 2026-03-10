-- 冷凝器报价管理系统 v2.0 数据库初始化脚本
-- 创建时间: 2026-01-21

-- 创建数据库
CREATE DATABASE IF NOT EXISTS condenser_db
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE condenser_db;

-- ========================================
-- 1. 用户表
-- ========================================
DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码(BCrypt加密)',
    real_name VARCHAR(50) COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    role VARCHAR(20) NOT NULL DEFAULT 'SALES' COMMENT '角色: ADMIN/TECH/SALES',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- ========================================
-- 2. 系统配置表
-- ========================================
DROP TABLE IF EXISTS sys_config;
CREATE TABLE sys_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
    config_value VARCHAR(500) NOT NULL COMMENT '配置值',
    description VARCHAR(200) COMMENT '描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- ========================================
-- 3. 工序字典表
-- ========================================
DROP TABLE IF EXISTS process_dict;
CREATE TABLE process_dict (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    process_name VARCHAR(100) NOT NULL COMMENT '工序名称',
    unit_type VARCHAR(20) NOT NULL DEFAULT 'PCS' COMMENT '计价单位: PCS/KG/M',
    unit_price DECIMAL(10,4) NOT NULL DEFAULT 0 COMMENT '单价(元)',
    is_active TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用: 0-否 1-是',
    sort_order INT DEFAULT 0 COMMENT '排序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序字典表';

-- ========================================
-- 4. 物流价格表
-- ========================================
DROP TABLE IF EXISTS logistics_price;
CREATE TABLE logistics_price (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    direction VARCHAR(20) NOT NULL DEFAULT 'OUTBOUND' COMMENT '方向：OUTBOUND=送货(柳州→各地), INBOUND=返货(各地→柳州)',
    origin VARCHAR(100) COMMENT '出发地（返货时为各地城市，送货时为柳州）',
    destination VARCHAR(100) NOT NULL COMMENT '目的地（送货时为各地城市，返货时为柳州）',
    company_name VARCHAR(100) COMMENT '物流公司',
    price_scatter DECIMAL(10,2) COMMENT '散货价格(元/立方)',
    price_4_2m DECIMAL(10,2) COMMENT '4.2米车价格(元)',
    price_6_8m DECIMAL(10,2) COMMENT '6.8米车价格(元)',
    price_9_6m DECIMAL(10,2) COMMENT '9.6米车价格(元)',
    price_13_5m DECIMAL(10,2) COMMENT '13.5米车价格(元)',
    price_17_5m DECIMAL(10,2) COMMENT '17.5米车价格(元)',
    price_16m_box DECIMAL(10,2) COMMENT '16米厢车价格(元)',
    min_charge_val DECIMAL(10,2) COMMENT '最低收费(元)',
    update_year INT COMMENT '数据年份',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_direction (direction),
    INDEX idx_destination (destination),
    INDEX idx_origin (origin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物流价格表';

-- ========================================
-- 5. 规格库表 (统一存储集流管/翅片/扁管)
-- ========================================
DROP TABLE IF EXISTS base_spec;
CREATE TABLE base_spec (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    type VARCHAR(20) NOT NULL COMMENT '类型: COLLECTOR/FIN/TUBE/COMPONENT',
    name VARCHAR(100) NOT NULL COMMENT '规格名称',
    material VARCHAR(100) COMMENT '材料',
    params JSON COMMENT '规格参数(JSON格式)',
    unit_price DECIMAL(10,4) DEFAULT 0 COMMENT '单价(元)',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_type (type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='规格库表';

-- ========================================
-- 6. 报价单表
-- ========================================
DROP TABLE IF EXISTS quote_order;
CREATE TABLE quote_order (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    quote_no VARCHAR(50) NOT NULL UNIQUE COMMENT '报价单号',
    user_id BIGINT NOT NULL COMMENT '创建用户ID',
    customer_name VARCHAR(100) COMMENT '客户名称',
    product_type VARCHAR(50) COMMENT '产品类型',
    quantity INT DEFAULT 1 COMMENT '数量',
    material_cost DECIMAL(12,2) COMMENT '材料成本',
    process_cost DECIMAL(12,2) COMMENT '工序成本',
    logistics_cost DECIMAL(12,2) COMMENT '物流成本',
    total_price DECIMAL(12,2) COMMENT '总价',
    full_json_data JSON COMMENT '完整报价数据(JSON)',
    status TINYINT DEFAULT 0 COMMENT '状态: 0-草稿 1-已确认 2-已导出',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_quote_no (quote_no),
    INDEX idx_user_id (user_id),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价单表';

-- ========================================
-- 初始数据
-- ========================================

-- 默认管理员账号 (密码: admin123, BCrypt加密)
INSERT INTO sys_user (username, password, real_name, role, status) VALUES
('admin', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '系统管理员', 'ADMIN', 1);

-- 系统配置
INSERT INTO sys_config (config_key, config_value, description) VALUES
('ALUMINUM_PRICE', '20500', '当前铝锭价(元/吨)'),
('AL_DENSITY', '2.75', '铝密度(g/cm³)'),
('DIFF_RATIO', '1.0', '理论实际差异比'),
('LOSS_RATIO', '1.02', '损耗比'),
('PROFIT_RATE', '0.10', '利润率');

-- 默认工序
INSERT INTO process_dict (process_name, unit_type, unit_price, sort_order) VALUES
('装配', 'PCS', 5.00, 1),
('焊接', 'PCS', 3.00, 2),
('检测', 'PCS', 2.00, 3),
('包装', 'PCS', 1.50, 4);
