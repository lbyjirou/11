package com.gxyide.pricing.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.mapper.SysUserMapper;
import com.gxyide.pricing.service.RbacService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * SpEL 权限检查: @perm.check('PERM_CODE')
 */
@Component("perm")
@RequiredArgsConstructor
public class CustomPermissionEvaluator {

    private final RbacService rbacService;
    private final SysUserMapper sysUserMapper;

    public boolean check(String permCode) {
        Long userId = getCurrentUserId();
        if (userId == null) return false;
        return rbacService.hasPermission(userId, permCode);
    }

    public boolean hasRole(String roleCode) {
        Long userId = getCurrentUserId();
        if (userId == null) return false;
        return rbacService.hasRole(userId, roleCode);
    }

    public boolean anyRole(String... roleCodes) {
        Long userId = getCurrentUserId();
        if (userId == null) return false;
        Set<String> userRoles = rbacService.getUserRoleCodes(userId);
        for (String code : roleCodes) {
            if (userRoles.contains(code)) return true;
        }
        return false;
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        String username = null;
        if (principal instanceof UserDetails ud) {
            username = ud.getUsername();
        } else if (principal instanceof String s) {
            username = s;
        }
        if (username == null) return null;
        SysUser user = sysUserMapper.selectOne(
            new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, username));
        return user != null ? user.getId() : null;
    }
}
