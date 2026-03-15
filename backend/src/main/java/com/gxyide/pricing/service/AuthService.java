package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gxyide.pricing.dto.LoginDTO;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.mapper.SysUserMapper;
import com.gxyide.pricing.security.JwtTokenProvider;
import com.gxyide.pricing.vo.LoginVO;
import com.gxyide.pricing.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final SysUserMapper sysUserMapper;
    private final RbacService rbacService;

    public LoginVO login(LoginDTO dto) {
        String username = dto.getUsername() != null ? dto.getUsername().trim() : "";
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, dto.getPassword())
        );

        String token = jwtTokenProvider.generateToken(authentication);

        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username)
        );

        return LoginVO.builder()
                .token(token)
                .username(user.getUsername())
                .realName(user.getRealName())
                .role(user.getRole())
                .roles(rbacService.getUserRoleCodes(user.getId()))
                .permissions(rbacService.getUserPermissions(user.getId()))
                .build();
    }

    public UserVO getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username)
        );

        return UserVO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .realName(user.getRealName())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .techUserId(user.getTechUserId())
                .processUserId(user.getProcessUserId())
                .logisticsUserId(user.getLogisticsUserId())
                .techProcessUserId(user.getTechProcessUserId())
                .techLogisticsUserId(user.getTechLogisticsUserId())
                .processLogisticsUserId(user.getProcessLogisticsUserId())
                .logisticsApproveUserId(user.getLogisticsApproveUserId())
                .roles(rbacService.getUserRoleCodes(user.getId()))
                .permissions(rbacService.getUserPermissions(user.getId()))
                .build();
    }

    /**
     * 刷新 Token
     */
    public LoginVO refreshToken() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username)
        );

        if (user == null || user.getStatus() != 1) {
            throw new RuntimeException("用户不存在或已被禁用");
        }

        String newToken = jwtTokenProvider.generateTokenByUsername(username);

        return LoginVO.builder()
                .token(newToken)
                .username(user.getUsername())
                .realName(user.getRealName())
                .role(user.getRole())
                .roles(rbacService.getUserRoleCodes(user.getId()))
                .permissions(rbacService.getUserPermissions(user.getId()))
                .build();
    }
}
