package com.gxyide.pricing.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SysUserMapper sysUserMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 重置所有测试账号密码为 admin123
        List<SysUser> users = sysUserMapper.selectList(null);
        String encodedPassword = passwordEncoder.encode("admin123");

        for (SysUser user : users) {
            user.setPassword(encodedPassword);
            sysUserMapper.updateById(user);
            log.info("用户 {} 密码已重置为: admin123", user.getUsername());
        }
    }
}
