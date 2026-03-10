-- 给 process_dict 表添加预设工序相关字段
ALTER TABLE process_dict ADD COLUMN section_key VARCHAR(64) DEFAULT NULL COMMENT '预设所属区域key';
ALTER TABLE process_dict ADD COLUMN section_label VARCHAR(64) DEFAULT NULL COMMENT '预设所属区域名称';
ALTER TABLE process_dict ADD COLUMN columns_json TEXT DEFAULT NULL COMMENT '预设列定义及默认值JSON';
