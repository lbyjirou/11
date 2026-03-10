-- ============================================================
-- 易德报价系统 Phase 4 DDL - 物流与包装测算
-- 车型字典表 + 包装字典表 + 物流明细表
-- ============================================================

-- 车型字典表（基础数据，由经理预设）
DROP TABLE IF EXISTS `base_vehicle_dict`;
CREATE TABLE `base_vehicle_dict` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `vehicle_code` VARCHAR(50) NOT NULL COMMENT '车型编码',
    `vehicle_name` VARCHAR(100) NOT NULL COMMENT '车型名称(如9.6米车)',
    `load_weight` DECIMAL(10,2) DEFAULT NULL COMMENT '载重量(吨)',
    `load_volume` DECIMAL(10,2) DEFAULT NULL COMMENT '载货体积(立方米)',
    `freight_price` DECIMAL(10,2) NOT NULL COMMENT '单车运费(元)',
    `description` VARCHAR(200) DEFAULT NULL COMMENT '描述',
    `is_active` TINYINT DEFAULT 1 COMMENT '是否启用',
    `sort_order` INT DEFAULT 0 COMMENT '排序序号',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_vehicle_code` (`vehicle_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车型字典表';

-- 包装类型字典表
DROP TABLE IF EXISTS `base_pack_dict`;
CREATE TABLE `base_pack_dict` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `pack_code` VARCHAR(50) NOT NULL COMMENT '包装编码',
    `pack_name` VARCHAR(100) NOT NULL COMMENT '包装名称(纸箱/围板箱)',
    `pack_price` DECIMAL(10,2) NOT NULL COMMENT '包装单价(元)',
    `pack_life` INT NOT NULL DEFAULT 1 COMMENT '包装寿命(次数)',
    `is_returnable` TINYINT DEFAULT 0 COMMENT '是否可回收: 0-一次性, 1-可回收',
    `description` VARCHAR(200) DEFAULT NULL COMMENT '描述',
    `is_active` TINYINT DEFAULT 1 COMMENT '是否启用',
    `sort_order` INT DEFAULT 0 COMMENT '排序序号',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_pack_code` (`pack_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='包装类型字典表';

-- 物流包装明细表（关联报价单）
DROP TABLE IF EXISTS `quote_logistics`;
CREATE TABLE `quote_logistics` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `order_id` BIGINT NOT NULL COMMENT '报价单ID',

    -- ==================== 包装信息 ====================
    `pack_id` BIGINT DEFAULT NULL COMMENT '包装类型ID',
    `pack_type` VARCHAR(50) DEFAULT NULL COMMENT '包装类型(纸箱/围板箱)',
    `box_price` DECIMAL(10,2) DEFAULT NULL COMMENT '箱单价(元)',
    `box_life` INT DEFAULT 1 COMMENT '包装寿命(次数)',
    `parts_per_box` INT DEFAULT 1 COMMENT 'SNP-每箱装件数',
    `is_returnable` TINYINT DEFAULT 0 COMMENT '是否可回收',

    -- ==================== 运输信息 ====================
    `vehicle_id` BIGINT DEFAULT NULL COMMENT '车型ID',
    `vehicle_type` VARCHAR(50) DEFAULT NULL COMMENT '车型(9.6米车)',
    `freight_price` DECIMAL(10,2) DEFAULT NULL COMMENT '单车运费(元)',
    `load_weight` DECIMAL(10,2) DEFAULT NULL COMMENT '车辆载重(吨)',
    `load_volume` DECIMAL(10,2) DEFAULT NULL COMMENT '车辆容积(立方米)',

    -- ==================== 计算参数 ====================
    `total_weight` DECIMAL(12,4) DEFAULT NULL COMMENT '总重量(KG)-从BOM带入',
    `annual_quantity` INT DEFAULT NULL COMMENT '年产量-从报价单带入',
    `boxes_per_vehicle` INT DEFAULT NULL COMMENT '每车装箱数',
    `parts_per_vehicle` INT DEFAULT NULL COMMENT '每车装件数',

    -- ==================== 计算结果 ====================
    `unit_pack_cost` DECIMAL(12,6) DEFAULT NULL COMMENT '单件包装摊销费(元)',
    `annual_vehicles` INT DEFAULT NULL COMMENT '年运输车次',
    `annual_freight` DECIMAL(12,2) DEFAULT NULL COMMENT '年运费总额(元)',
    `unit_freight_cost` DECIMAL(12,6) DEFAULT NULL COMMENT '单件运费(元)',
    `unit_total_cost` DECIMAL(12,6) DEFAULT NULL COMMENT '单件物流总费(元)',

    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`),
    CONSTRAINT `fk_logistics_order` FOREIGN KEY (`order_id`) REFERENCES `quote_order` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物流包装明细表';

-- ============================================================
-- 初始化数据
-- ============================================================

-- 车型字典
INSERT INTO `base_vehicle_dict` (`vehicle_code`, `vehicle_name`, `load_weight`, `load_volume`, `freight_price`, `sort_order`) VALUES
('VH_4M2', '4.2米车', 2.00, 18.00, 800.00, 1),
('VH_6M8', '6.8米车', 5.00, 40.00, 1200.00, 2),
('VH_7M6', '7.6米车', 8.00, 50.00, 1500.00, 3),
('VH_9M6', '9.6米车', 15.00, 70.00, 2000.00, 4),
('VH_13M', '13米车', 25.00, 90.00, 2800.00, 5),
('VH_17M5', '17.5米车', 30.00, 110.00, 3500.00, 6);

-- 包装字典
INSERT INTO `base_pack_dict` (`pack_code`, `pack_name`, `pack_price`, `pack_life`, `is_returnable`, `sort_order`) VALUES
('PK_CARTON_S', '小纸箱', 15.00, 1, 0, 1),
('PK_CARTON_M', '中纸箱', 25.00, 1, 0, 2),
('PK_CARTON_L', '大纸箱', 40.00, 1, 0, 3),
('PK_PALLET', '木托盘', 80.00, 20, 1, 4),
('PK_FENCE_S', '小围板箱', 200.00, 50, 1, 5),
('PK_FENCE_M', '中围板箱', 350.00, 50, 1, 6),
('PK_FENCE_L', '大围板箱', 500.00, 50, 1, 7),
('PK_IRON', '铁箱', 800.00, 100, 1, 8);
