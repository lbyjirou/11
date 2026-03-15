ALTER TABLE `process_dict`
  ADD COLUMN IF NOT EXISTS `owner_user_id` BIGINT NULL COMMENT '个人工序预设归属用户ID',
  ADD COLUMN IF NOT EXISTS `is_public` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否公共预设：0-个人 1-公共';

ALTER TABLE `energy_device_template`
  ADD COLUMN IF NOT EXISTS `is_public` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否公共预设：0-个人 1-公共';

ALTER TABLE `process_template`
  ADD COLUMN IF NOT EXISTS `is_public` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否公共模板：0-个人 1-公共';

UPDATE `process_dict`
SET `is_public` = 1
WHERE `is_public` IS NULL;

UPDATE `energy_device_template`
SET `is_public` = 0
WHERE `is_public` IS NULL;

UPDATE `process_template`
SET `is_public` = 0
WHERE `is_public` IS NULL;

INSERT INTO `sys_permission` (`perm_code`, `perm_name`, `perm_group`, `description`)
SELECT 'SYSTEM_PROCESS_PRESET_CENTER', '公共工艺预设中心', 'SYSTEM', '管理工艺公共预设中心'
WHERE NOT EXISTS (
  SELECT 1 FROM `sys_permission` WHERE `perm_code` = 'SYSTEM_PROCESS_PRESET_CENTER'
);

INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `sys_role` r
JOIN `sys_permission` p ON p.perm_code = 'SYSTEM_PROCESS_PRESET_CENTER'
WHERE r.role_code = 'PROCESS'
  AND NOT EXISTS (
    SELECT 1
    FROM `sys_role_permission` rp
    WHERE rp.role_id = r.id
      AND rp.permission_id = p.id
  );
