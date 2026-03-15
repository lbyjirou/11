-- 用户链式归属配置字段：技术 -> 生产，生产 -> 物流，物流 -> 审批
ALTER TABLE sys_user
  ADD COLUMN tech_process_user_id BIGINT NULL COMMENT '技术归属生产员ID',
  ADD COLUMN tech_logistics_user_id BIGINT NULL COMMENT '技术归属物流员ID',
  ADD COLUMN process_logistics_user_id BIGINT NULL COMMENT '生产归属物流员ID',
  ADD COLUMN logistics_approve_user_id BIGINT NULL COMMENT '物流归属报价经理ID';
