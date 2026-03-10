-- Phase 3: RBAC 权限系统

CREATE TABLE `sys_role` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `role_code` VARCHAR(50) NOT NULL UNIQUE,
  `role_name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(200),
  `is_system` TINYINT DEFAULT 0 COMMENT '系统内置角色不可删除',
  `workflow_stage` VARCHAR(20) COMMENT '关联的工作流阶段',
  `status` TINYINT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='角色表';

CREATE TABLE `sys_permission` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `perm_code` VARCHAR(100) NOT NULL UNIQUE,
  `perm_name` VARCHAR(100) NOT NULL,
  `perm_group` VARCHAR(50) NOT NULL COMMENT 'TAB_VIEW/TAB_EDIT/DATA_VIEW/WORKFLOW/SYSTEM',
  `description` VARCHAR(200)
) COMMENT='权限表';

CREATE TABLE `sys_role_permission` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `role_id` BIGINT NOT NULL,
  `permission_id` BIGINT NOT NULL,
  UNIQUE KEY `uk_role_perm` (`role_id`, `permission_id`)
) COMMENT='角色权限关联表';

CREATE TABLE `sys_user_role` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `role_id` BIGINT NOT NULL,
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`)
) COMMENT='用户角色关联表';
