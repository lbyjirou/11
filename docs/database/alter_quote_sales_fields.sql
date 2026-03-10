-- 报价单表 - 新增销售商务字段
-- 执行时间: 2026-02-08

USE condenser_db;

-- ========================================
-- 新增销售填写字段
-- ========================================

ALTER TABLE quote_order
    ADD COLUMN rfq_id VARCHAR(100) COMMENT '客户RFQ编号' AFTER current_handler_id,
    ADD COLUMN quote_version VARCHAR(10) NOT NULL DEFAULT 'V0' COMMENT '报价版本(V0/V1/V2...)' AFTER rfq_id,
    ADD COLUMN commercial_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT '商业状态: DRAFT/SUBMITTED/AWARDED/LOST/EXPIRED' AFTER quote_version,
    ADD COLUMN oem_tier VARCHAR(20) COMMENT 'OEM层级: OEM/TIER1/TIER2' AFTER customer_name,
    ADD COLUMN vehicle_project VARCHAR(100) COMMENT '车型/项目代号' AFTER oem_tier,
    ADD COLUMN sop_date DATE COMMENT '量产日期(SOP)' AFTER vehicle_project,
    ADD COLUMN eop_date DATE COMMENT '停产日期(EOP)' AFTER sop_date,
    ADD COLUMN incoterm VARCHAR(20) COMMENT '贸易术语(EXW/FOB/CIF等)' AFTER currency,
    ADD COLUMN valid_until DATE COMMENT '报价有效期' AFTER delivery_location,
    ADD COLUMN annual_volume_1y INT COMMENT '年需求量-第1年' AFTER valid_until,
    ADD COLUMN annual_volume_3y INT COMMENT '年需求量-第3年' AFTER annual_volume_1y,
    ADD COLUMN annual_volume_peak INT COMMENT '年需求量-峰值' AFTER annual_volume_3y,
    ADD COLUMN ramp_profile JSON COMMENT '爬坡计划(月度或季度JSON)' AFTER annual_volume_peak,
    ADD COLUMN mold_shared TINYINT DEFAULT 0 COMMENT '模具是否客户分摊: 0-否 1-是' AFTER ramp_profile,
    ADD COLUMN mold_shared_qty INT COMMENT '模具分摊件数' AFTER mold_shared;

-- 索引
ALTER TABLE quote_order
    ADD INDEX idx_rfq_id (rfq_id),
    ADD INDEX idx_commercial_status (commercial_status),
    ADD INDEX idx_vehicle_project (vehicle_project);
