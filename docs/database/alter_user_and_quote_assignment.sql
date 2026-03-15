-- 为销售归属与报价单流转负责人增加字段

ALTER TABLE sys_user
  ADD COLUMN IF NOT EXISTS tech_user_id BIGINT NULL COMMENT '归属技术员ID',
  ADD COLUMN IF NOT EXISTS process_user_id BIGINT NULL COMMENT '归属生产员ID',
  ADD COLUMN IF NOT EXISTS logistics_user_id BIGINT NULL COMMENT '归属物流员ID';

ALTER TABLE quote_order
  ADD COLUMN IF NOT EXISTS tech_handler_id BIGINT NULL COMMENT '指派技术员ID',
  ADD COLUMN IF NOT EXISTS process_handler_id BIGINT NULL COMMENT '指派生产员ID',
  ADD COLUMN IF NOT EXISTS logistics_handler_id BIGINT NULL COMMENT '指派物流员ID';
