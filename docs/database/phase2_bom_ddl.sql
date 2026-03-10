-- ============================================================
-- 易德报价系统 Phase 2 DDL - BOM表
-- 支持多级递归结构
-- ============================================================

-- BOM物料清单表
DROP TABLE IF EXISTS `quote_bom`;
CREATE TABLE `quote_bom` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `order_id` BIGINT NOT NULL COMMENT '报价单ID',

    -- ==================== 层级关系 ====================
    `parent_id` BIGINT DEFAULT NULL COMMENT '父节点ID，顶级为NULL',
    `level_code` VARCHAR(50) NOT NULL COMMENT '层次编码(原始值)，如: 1, 12.1, 12.1.1',
    `level_depth` INT NOT NULL DEFAULT 1 COMMENT '层级深度，1=顶级',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序序号',

    -- ==================== 物料基本信息 ====================
    `part_code` VARCHAR(50) NOT NULL COMMENT '子物料编码',
    `part_name` VARCHAR(100) NOT NULL COMMENT '子物料名称',
    `part_spec` VARCHAR(200) DEFAULT NULL COMMENT '子物料规格',
    `part_model` VARCHAR(200) DEFAULT NULL COMMENT '子物料型号',
    `material_name` VARCHAR(100) DEFAULT NULL COMMENT '材质名称',
    `unit` VARCHAR(20) DEFAULT NULL COMMENT '基本单位(件/根/KG等)',
    `drawing_no` VARCHAR(50) DEFAULT NULL COMMENT '子物料图号',

    -- ==================== 数量与价格 ====================
    `quantity` DECIMAL(12,4) NOT NULL DEFAULT 1 COMMENT '数量/用量',
    `base_quantity` INT DEFAULT 1 COMMENT '基数',
    `loss_rate` DECIMAL(5,2) DEFAULT 0 COMMENT '损耗率(%)',
    `unit_price_incl_tax` DECIMAL(12,4) DEFAULT NULL COMMENT '单价(含税)',
    `amount_incl_tax` DECIMAL(12,4) DEFAULT NULL COMMENT '金额(含税)',
    `unit_price_excl_tax` DECIMAL(12,4) DEFAULT NULL COMMENT '单价(不含税)',

    -- ==================== 重量信息（关键字段） ====================
    `net_weight` DECIMAL(12,6) DEFAULT NULL COMMENT '净重(KG)，高精度存储',
    `gross_weight` DECIMAL(12,6) DEFAULT NULL COMMENT '毛重(KG)',
    `calculated_weight` DECIMAL(12,6) DEFAULT NULL COMMENT '计算后总重(数量*净重)',

    -- ==================== 其他信息 ====================
    `part_type` VARCHAR(20) DEFAULT NULL COMMENT '子项类型(标准件/外购件等)',
    `is_purchased` TINYINT DEFAULT 0 COMMENT '是否外购件: 0-自制, 1-外购',
    `supplier_name` VARCHAR(100) DEFAULT NULL COMMENT '供应商名称',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT 'BOM备注',

    -- ==================== 时间戳 ====================
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_level_code` (`level_code`),
    KEY `idx_part_code` (`part_code`),
    CONSTRAINT `fk_bom_order` FOREIGN KEY (`order_id`) REFERENCES `quote_order` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报价单BOM物料清单';

-- 添加自引用外键（parent_id指向自身）
ALTER TABLE `quote_bom` ADD CONSTRAINT `fk_bom_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `quote_bom` (`id`) ON DELETE CASCADE;
