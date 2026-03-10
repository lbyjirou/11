package com.gxyide.pricing.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gxyide.pricing.entity.SysRole;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.mapper.SysRoleMapper;
import com.gxyide.pricing.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final SysUserMapper sysUserMapper;
    private final SysRoleMapper sysRoleMapper;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>()
                        .eq(SysUser::getUsername, username)
                        .eq(SysUser::getStatus, 1)
        );

        if (user == null) {
            throw new UsernameNotFoundException("用户不存在或已禁用: " + username);
        }

        // 优先从 sys_user_role 表加载角色，表不存在时 fallback
        List<SysRole> roles;
        try {
            roles = sysRoleMapper.selectRolesByUserId(user.getId());
        } catch (Exception e) {
            roles = Collections.emptyList();
        }
        List<SimpleGrantedAuthority> authorities;
        if (!roles.isEmpty()) {
            authorities = roles.stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.getRoleCode()))
                .collect(Collectors.toList());
        } else {
            // Fallback: 从 sys_user.role 字段
            authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + user.getRole()));
        }

        return new User(user.getUsername(), user.getPassword(), authorities);
    }
}
