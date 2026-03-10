-- 零件模板表升级：增加加工费和公式字段
USE condenser_db;

ALTER TABLE part_preset
  ADD COLUMN material VARCHAR(100) DEFAULT NULL
      COMMENT '默认材质(如3003铝合金)',
  ADD COLUMN has_process_fee TINYINT(1) NOT NULL DEFAULT 0
      COMMENT '是否有加工费: 0否 1是',
  ADD COLUMN process_fee_label VARCHAR(50) DEFAULT NULL
      COMMENT '加工费名称(如材料加工费)',
  ADD COLUMN process_fee_default DECIMAL(10,4) DEFAULT NULL
      COMMENT '加工费默认值',
  ADD COLUMN formulas_json TEXT DEFAULT NULL
      COMMENT '计算公式集JSON,如{"weight":"spec1*spec2*spec3*2.75/1000000","unitPrice":"weight*(alPrice+processFee)","amount":"qty*unitPrice"}';
