-- ============================================================
-- 易德报价系统 Phase 1 DDL
-- 基于上汽报价单 Part 3/4 设计
-- ============================================================

-- 用户表（扩展5角色）
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `username` VARCHAR(50) NOT NULL COMMENT '用户名',
    `password` VARCHAR(255) NOT NULL COMMENT '密码(BCrypt加密)',
    `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `role` VARCHAR(20) NOT NULL COMMENT '角色: SALES-销售员, TECH-技术工程师, PROCESS-工艺工程师, LOGISTICS-物流专员, MANAGER-报价经理, ADMIN-管理员',
    `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户表';

-- 报价单主表
DROP TABLE IF EXISTS `quote_order`;
CREATE TABLE `quote_order` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',

    -- ==================== 系统字段 ====================
    `quote_no` VARCHAR(30) NOT NULL COMMENT '报价单号(系统生成)',
    `creator_id` BIGINT NOT NULL COMMENT '创建人ID',
    `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT '状态: DRAFT-草稿, PENDING_TECH-待技术定义, PENDING_PROCESS-待成本核算, PENDING_LOGISTICS-待物流测算, PENDING_APPROVAL-待审批, REJECTED-已驳回, APPROVED-已批准, ARCHIVED-已归档',
    `current_handler_id` BIGINT DEFAULT NULL COMMENT '当前处理人ID',
    `reject_reason` VARCHAR(500) DEFAULT NULL COMMENT '驳回原因',

    -- ==================== Part 3: 销售填写 - 零件概况 ====================
    `part_no` VARCHAR(50) NOT NULL COMMENT '零件号',
    `part_name` VARCHAR(100) NOT NULL COMMENT '零件名称',
    `drawing_no` VARCHAR(50) DEFAULT NULL COMMENT '图纸号',
    `drawing_date` DATE DEFAULT NULL COMMENT '图纸日期',
    `production_start_year` INT DEFAULT NULL COMMENT '生产起始年',
    `annual_quantity` INT NOT NULL COMMENT '年产量',
    `daily_quantity` INT DEFAULT NULL COMMENT '预测每日产量',
    `delivery_location` VARCHAR(200) DEFAULT NULL COMMENT '收货地点',

    -- ==================== Part 4: 销售填写 - 商务信息 ====================
    `customer_name` VARCHAR(100) NOT NULL COMMENT '客户名称',
    `customer_code` VARCHAR(50) DEFAULT NULL COMMENT '客户编码',
    `project_name` VARCHAR(100) DEFAULT NULL COMMENT '项目名称',
    `shipping_location` VARCHAR(200) DEFAULT NULL COMMENT '交货地点',
    `supplier_name` VARCHAR(100) DEFAULT NULL COMMENT '供应商名称',
    `supplier_duns` VARCHAR(20) DEFAULT NULL COMMENT '供应商邓白氏码',
    `manufacturing_location` VARCHAR(200) DEFAULT NULL COMMENT '制造地点',
    `manufacturer_duns` VARCHAR(20) DEFAULT NULL COMMENT '制造商邓白氏码',
    `inquiry_no` VARCHAR(50) DEFAULT NULL COMMENT '询价单号(客户提供)',
    `inquiry_date` DATE DEFAULT NULL COMMENT '询价单发布日期',
    `quote_deadline` DATE DEFAULT NULL COMMENT '报价截止日期',
    `supplier_remark` TEXT DEFAULT NULL COMMENT '供应商意见/备注',

    -- ==================== 计算字段（灰底，后续角色填写或系统计算） ====================
    `material_cost` DECIMAL(12,2) DEFAULT NULL COMMENT '材料总成本 - 技术工程师',
    `manufacturing_cost` DECIMAL(12,2) DEFAULT NULL COMMENT '制造费用 - 工艺工程师',
    `tooling_cost` DECIMAL(12,2) DEFAULT NULL COMMENT '工装成本 - 工艺工程师',
    `logistics_cost` DECIMAL(12,2) DEFAULT NULL COMMENT '物流费用 - 物流专员',
    `packaging_cost` DECIMAL(12,2) DEFAULT NULL COMMENT '包装费用 - 物流专员',
    `sga_cost` DECIMAL(12,2) DEFAULT NULL COMMENT '管理费用(SG&A) - 报价经理',
    `profit_amount` DECIMAL(12,2) DEFAULT NULL COMMENT '利润金额 - 报价经理',
    `tax_rate` DECIMAL(5,2) DEFAULT 13.00 COMMENT '税率(%)',
    `unit_price_excl_tax` DECIMAL(12,4) DEFAULT NULL COMMENT '不含税单价',
    `unit_price_incl_tax` DECIMAL(12,4) DEFAULT NULL COMMENT '含税单价',
    `net_weight` DECIMAL(10,4) DEFAULT NULL COMMENT '零件净重(KG) - 技术工程师',
    `gross_weight` DECIMAL(10,4) DEFAULT NULL COMMENT '零件毛重(KG) - 技术工程师',

    -- ==================== 时间戳 ====================
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_quote_no` (`quote_no`),
    KEY `idx_creator_id` (`creator_id`),
    KEY `idx_status` (`status`),
    KEY `idx_customer_name` (`customer_name`),
    KEY `idx_part_no` (`part_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报价单主表';

-- ============================================================
-- 初始化数据
-- ============================================================

-- 插入测试用户（5个角色各一个）
INSERT INTO `sys_user` (`username`, `password`, `real_name`, `phone`, `role`, `status`) VALUES
('sales01', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '张销售', '13800000001', 'SALES', 1),
('tech01', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '李技术', '13800000002', 'TECH', 1),
('process01', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '王工艺', '13800000003', 'PROCESS', 1),
('logistics01', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '赵物流', '13800000004', 'LOGISTICS', 1),
('manager01', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '钱经理', '13800000005', 'MANAGER', 1),
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '系统管理员', '13800000000', 'ADMIN', 1);

-- 注意：上面的密码hash是示例，实际使用时需要用BCrypt生成
-- 默认密码均为: 123456
