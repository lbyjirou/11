-- ============================================================
-- 易德报价系统 Phase 3 DDL - 工艺计算引擎
-- 设备字典表 + 工序明细表
-- ============================================================

-- 设备字典表（基础数据，由经理预设）
DROP TABLE IF EXISTS `base_machine_dict`;
CREATE TABLE `base_machine_dict` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `machine_code` VARCHAR(50) NOT NULL COMMENT '设备编码',
    `machine_name` VARCHAR(100) NOT NULL COMMENT '设备名称(如400T冲床)',
    `hourly_rate` DECIMAL(10,2) NOT NULL COMMENT '设备小时费率(元/小时)',
    `description` VARCHAR(200) DEFAULT NULL COMMENT '设备描述',
    `is_active` TINYINT DEFAULT 1 COMMENT '是否启用: 0-禁用, 1-启用',
    `sort_order` INT DEFAULT 0 COMMENT '排序序号',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_machine_code` (`machine_code`),
    KEY `idx_machine_name` (`machine_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备字典表';

-- 人工费率配置表（系统级配置）
DROP TABLE IF EXISTS `base_labor_rate`;
CREATE TABLE `base_labor_rate` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `rate_name` VARCHAR(50) NOT NULL COMMENT '费率名称(如普工/技工)',
    `hourly_rate` DECIMAL(10,2) NOT NULL COMMENT '人工小时费率(元/小时)',
    `is_default` TINYINT DEFAULT 0 COMMENT '是否默认费率',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='人工费率配置表';

-- 工序明细表（关联BOM零件）
DROP TABLE IF EXISTS `quote_item_process`;
CREATE TABLE `quote_item_process` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `order_id` BIGINT NOT NULL COMMENT '报价单ID',
    `bom_id` BIGINT NOT NULL COMMENT '关联的BOM零件ID',
    `sort_order` INT DEFAULT 0 COMMENT '工序顺序',

    -- 工序基本信息
    `process_name` VARCHAR(100) NOT NULL COMMENT '工序名称',
    `machine_id` BIGINT DEFAULT NULL COMMENT '设备ID(关联base_machine_dict)',
    `machine_name` VARCHAR(100) DEFAULT NULL COMMENT '设备名称(冗余存储)',

    -- 工艺参数（工程师填写）
    `cycle_time` DECIMAL(10,2) NOT NULL COMMENT '节拍/周期时间(秒)',
    `cavity_count` INT NOT NULL DEFAULT 1 COMMENT '穴数/模腔数',
    `crew_size` INT NOT NULL DEFAULT 1 COMMENT '操作人数',

    -- 费率（从字典带入，不可手改）
    `machine_hourly_rate` DECIMAL(10,2) DEFAULT NULL COMMENT '设备小时费率(元/小时)',
    `labor_hourly_rate` DECIMAL(10,2) DEFAULT NULL COMMENT '人工小时费率(元/小时)',

    -- 计算结果（系统自动计算）
    `unit_machine_cost` DECIMAL(12,6) DEFAULT NULL COMMENT '单件加工费(元)',
    `unit_labor_cost` DECIMAL(12,6) DEFAULT NULL COMMENT '单件人工费(元)',
    `unit_total_cost` DECIMAL(12,6) DEFAULT NULL COMMENT '单件总工序费(元)',

    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_bom_id` (`bom_id`),
    CONSTRAINT `fk_process_order` FOREIGN KEY (`order_id`) REFERENCES `quote_order` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_process_bom` FOREIGN KEY (`bom_id`) REFERENCES `quote_bom` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工序明细表';

-- ============================================================
-- 初始化数据：设备字典
-- ============================================================
INSERT INTO `base_machine_dict` (`machine_code`, `machine_name`, `hourly_rate`, `description`, `sort_order`) VALUES
('PRESS_400T', '400T冲床', 300.00, '400吨冲压设备', 1),
('PRESS_200T', '200T冲床', 200.00, '200吨冲压设备', 2),
('PRESS_100T', '100T冲床', 150.00, '100吨冲压设备', 3),
('CNC_3AXIS', '三轴加工中心', 250.00, 'CNC三轴加工', 4),
('CNC_5AXIS', '五轴加工中心', 450.00, 'CNC五轴加工', 5),
('LATHE_CNC', 'CNC车床', 180.00, '数控车床', 6),
('WELD_ROBOT', '焊接机器人', 280.00, '自动焊接设备', 7),
('WELD_MANUAL', '手工焊接台', 80.00, '手工焊接工位', 8),
('INJECT_200T', '200T注塑机', 220.00, '200吨注塑设备', 9),
('ASSEMBLE', '装配工位', 60.00, '人工装配工位', 10);

-- 初始化数据：人工费率
INSERT INTO `base_labor_rate` (`rate_name`, `hourly_rate`, `is_default`) VALUES
('普工', 35.00, 1),
('技工', 50.00, 0),
('高级技工', 70.00, 0);
