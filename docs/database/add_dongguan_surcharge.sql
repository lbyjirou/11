-- 新增东莞特殊送货费字段
-- 用于存储从备注中解析的东莞送货费，如"东莞台达送货费400/趟"中的400
ALTER TABLE logistics_price ADD COLUMN dongguan_surcharge DECIMAL(10,2) DEFAULT NULL COMMENT '东莞特殊送货费(元)';
