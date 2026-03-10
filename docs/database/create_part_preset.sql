USE condenser_db;

CREATE TABLE IF NOT EXISTS part_preset (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL COMMENT '所属用户ID',
  name VARCHAR(100) NOT NULL COMMENT '零件名称',
  category VARCHAR(10) NOT NULL DEFAULT 'A' COMMENT '分类(A/B/C)',
  columns_json TEXT NOT NULL COMMENT '列定义JSON([{key,label,type,role,formula,unit}])',
  spec_table_json TEXT COMMENT '规格系数表JSON([{spec,coefficient,...}])',
  default_values_json TEXT COMMENT '默认值JSON({material,processFee,...})',
  sort_order INT DEFAULT 0 COMMENT '排序',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='零件模版预存';
