-- 零件模板表升级：增加材料预算系数字段
USE condenser_db;

ALTER TABLE part_preset
  ADD COLUMN material_cost_json TEXT DEFAULT NULL
      COMMENT '材料预算系数JSON {"type":"COLLECTOR","spec":"Φ16","factor":"0.38","weight":"0.38"}';
