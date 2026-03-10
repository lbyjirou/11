package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gxyide.pricing.entity.*;
import com.gxyide.pricing.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RbacService {

    private final SysRoleMapper roleMapper;
    private final SysPermissionMapper permissionMapper;
    private final SysUserRoleMapper userRoleMapper;
    private final SysRolePermissionMapper rolePermissionMapper;
    private final SysUserMapper sysUserMapper;

    public List<SysRole> getUserRoles(Long userId) {
        try {
            List<SysRole> roles = roleMapper.selectRolesByUserId(userId);
            if (roles.isEmpty()) {
                return fallbackRole(userId);
            }
            return roles;
        } catch (Exception e) {
            return fallbackRoleLegacy(userId);
        }
    }

    public Set<String> getUserRoleCodes(Long userId) {
        return getUserRoles(userId).stream()
                .map(SysRole::getRoleCode)
                .collect(Collectors.toSet());
    }

    public Set<String> getUserPermissions(Long userId) {
        Set<String> roleCodes = getUserRoleCodes(userId);
        if (roleCodes.contains("ADMIN")) {
            try {
                return getAllPermissionCodes();
            } catch (Exception e) {
                return Collections.emptySet();
            }
        }
        try {
            List<SysPermission> perms = permissionMapper.selectPermissionsByUserId(userId);
            return perms.stream()
                    .map(SysPermission::getPermCode)
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            return Collections.emptySet();
        }
    }

    public boolean hasPermission(Long userId, String permCode) {
        return getUserPermissions(userId).contains(permCode);
    }

    public boolean hasRole(Long userId, String roleCode) {
        return getUserRoleCodes(userId).contains(roleCode);
    }

    private Set<String> getAllPermissionCodes() {
        return permissionMapper.selectList(null).stream()
                .map(SysPermission::getPermCode)
                .collect(Collectors.toSet());
    }

    /**
     * 兼容：从 sys_user.role 字段 fallback
     */
    private List<SysRole> fallbackRole(Long userId) {
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null || user.getRole() == null) {
            return Collections.emptyList();
        }
        try {
            SysRole role = roleMapper.selectOne(
                new LambdaQueryWrapper<SysRole>()
                    .eq(SysRole::getRoleCode, user.getRole()));
            return role != null ? List.of(role) : fallbackRoleLegacy(userId);
        } catch (Exception e) {
            return fallbackRoleLegacy(userId);
        }
    }

    /** sys_role 表不存在时，用 sys_user.role 构造虚拟角色 */
    private List<SysRole> fallbackRoleLegacy(Long userId) {
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null || user.getRole() == null) {
            return Collections.emptyList();
        }
        SysRole virtual = new SysRole();
        virtual.setRoleCode(user.getRole());
        virtual.setRoleName(user.getRole());
        return List.of(virtual);
    }
}
