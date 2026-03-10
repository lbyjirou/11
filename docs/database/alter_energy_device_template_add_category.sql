-- 给 energy_device_template 添加 category 字段，区分设备能耗(device)、模具费(mold)和辅料预设(material)
ALTER TABLE energy_device_template
  ADD COLUMN category VARCHAR(20) NOT NULL DEFAULT 'device' COMMENT '模版类别: device/mold/material'
  AFTER template_json;

CREATE INDEX idx_category ON energy_device_template (category);
