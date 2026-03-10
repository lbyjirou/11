-- Phase 3: RBAC 初始数据

-- 系统角色
INSERT INTO `sys_role` (`role_code`, `role_name`, `description`, `is_system`, `workflow_stage`) VALUES
('SALES', '销售员', '负责创建和提交报价单', 1, 'SALES'),
('TECH', '技术工程师', '负责技术核算', 1, 'TECH'),
('PROCESS', '工艺工程师', '负责工艺核算', 1, 'PROCESS'),
('LOGISTICS', '物流专员', '负责物流核算', 1, 'LOGISTICS'),
('MANAGER', '经理', '负责审批报价单', 1, 'APPROVAL'),
('ADMIN', '管理员', '系统管理员，拥有所有权限', 1, NULL);

-- 权限数据
INSERT INTO `sys_permission` (`perm_code`, `perm_name`, `perm_group`, `description`) VALUES
-- Tab可见性
('TAB_VIEW_SETTING', '查看铝价Tab', 'TAB_VIEW', NULL),
('TAB_VIEW_SALES', '查看销售Tab', 'TAB_VIEW', NULL),
('TAB_VIEW_TECH', '查看技术Tab', 'TAB_VIEW', NULL),
('TAB_VIEW_PROCESS', '查看工序Tab', 'TAB_VIEW', NULL),
('TAB_VIEW_LOGISTICS', '查看物流Tab', 'TAB_VIEW', NULL),
('TAB_VIEW_APPROVE', '查看审批Tab', 'TAB_VIEW', NULL),
-- Tab可编辑
('TAB_EDIT_SETTING', '编辑铝价Tab', 'TAB_EDIT', NULL),
('TAB_EDIT_SALES', '编辑销售Tab', 'TAB_EDIT', NULL),
('TAB_EDIT_TECH', '编辑技术Tab', 'TAB_EDIT', NULL),
('TAB_EDIT_PROCESS', '编辑工序Tab', 'TAB_EDIT', NULL),
('TAB_EDIT_LOGISTICS', '编辑物流Tab', 'TAB_EDIT', NULL),
('TAB_EDIT_APPROVE', '编辑审批Tab', 'TAB_EDIT', NULL),
-- 数据查看
('DATA_VIEW_SALES', '查看销售数据', 'DATA_VIEW', NULL),
('DATA_VIEW_TECH', '查看技术数据', 'DATA_VIEW', NULL),
('DATA_VIEW_PROCESS', '查看工艺数据', 'DATA_VIEW', NULL),
('DATA_VIEW_LOGISTICS', '查看物流数据', 'DATA_VIEW', NULL),
('DATA_VIEW_MANAGER', '查看审批数据', 'DATA_VIEW', NULL),
-- 流程操作
('WORKFLOW_CREATE', '创建报价单', 'WORKFLOW', NULL),
('WORKFLOW_SUBMIT', '提交报价单', 'WORKFLOW', NULL),
('WORKFLOW_ADVANCE', '推进报价单', 'WORKFLOW', NULL),
('WORKFLOW_APPROVE', '审批报价单', 'WORKFLOW', NULL),
('WORKFLOW_REJECT', '驳回报价单', 'WORKFLOW', NULL),
('WORKFLOW_MODIFY', '发起修改', 'WORKFLOW', NULL),
-- 系统管理
('SYSTEM_USER_MANAGE', '用户管理', 'SYSTEM', NULL),
('SYSTEM_ROLE_MANAGE', '角色管理', 'SYSTEM', NULL),
('SYSTEM_CONFIG', '系统配置', 'SYSTEM', NULL),
('SYSTEM_SPEC_MANAGE', '规格库管理', 'SYSTEM', NULL),
('SYSTEM_LOGISTICS_IMPORT', '物流数据导入', 'SYSTEM', NULL);

-- 角色权限关联（使用子查询关联ID）
-- SALES
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.role_code = 'SALES' AND p.perm_code IN (
  'TAB_VIEW_SETTING','TAB_VIEW_SALES','TAB_EDIT_SALES',
  'DATA_VIEW_SALES','WORKFLOW_CREATE','WORKFLOW_SUBMIT'
);

-- TECH
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.role_code = 'TECH' AND p.perm_code IN (
  'TAB_VIEW_SETTING','TAB_VIEW_SALES','TAB_VIEW_TECH',
  'TAB_EDIT_TECH','DATA_VIEW_SALES','DATA_VIEW_TECH',
  'WORKFLOW_ADVANCE','WORKFLOW_MODIFY'
);

-- PROCESS
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.role_code = 'PROCESS' AND p.perm_code IN (
  'TAB_VIEW_TECH','TAB_VIEW_PROCESS','TAB_EDIT_PROCESS',
  'DATA_VIEW_TECH','DATA_VIEW_PROCESS',
  'WORKFLOW_ADVANCE','WORKFLOW_MODIFY'
);

-- LOGISTICS
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.role_code = 'LOGISTICS' AND p.perm_code IN (
  'TAB_VIEW_TECH','TAB_VIEW_LOGISTICS','TAB_EDIT_LOGISTICS',
  'DATA_VIEW_TECH','DATA_VIEW_LOGISTICS','WORKFLOW_ADVANCE','WORKFLOW_MODIFY'
);

-- MANAGER
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.role_code = 'MANAGER' AND p.perm_code IN (
  'TAB_VIEW_SETTING','TAB_VIEW_SALES','TAB_VIEW_TECH',
  'TAB_VIEW_PROCESS','TAB_VIEW_LOGISTICS','TAB_VIEW_APPROVE',
  'TAB_EDIT_APPROVE','DATA_VIEW_SALES','DATA_VIEW_TECH',
  'DATA_VIEW_PROCESS','DATA_VIEW_LOGISTICS','DATA_VIEW_MANAGER',
  'WORKFLOW_APPROVE','WORKFLOW_REJECT'
);

-- 从 sys_user.role 迁移到 sys_user_role
INSERT INTO `sys_user_role` (`user_id`, `role_id`)
SELECT u.id, r.id FROM sys_user u
JOIN sys_role r ON r.role_code = u.role
WHERE u.role IS NOT NULL AND u.role != '';
