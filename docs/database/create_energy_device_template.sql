CREATE TABLE energy_device_template (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL COMMENT '模版名称',
  template_json TEXT NOT NULL COMMENT '模版结构JSON',
  category VARCHAR(20) NOT NULL DEFAULT 'device' COMMENT '模版类别: device/mold/material',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_category (category)
) COMMENT '能耗模版';
