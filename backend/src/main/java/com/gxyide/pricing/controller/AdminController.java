package com.gxyide.pricing.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.dto.UserCreateDTO;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.entity.SysUserRole;
import com.gxyide.pricing.entity.SysRole;
import com.gxyide.pricing.mapper.SysUserMapper;
import com.gxyide.pricing.mapper.SysUserRoleMapper;
import com.gxyide.pricing.mapper.SysRoleMapper;
import com.gxyide.pricing.service.ConfigService;
import com.gxyide.pricing.service.LogisticsService;
import com.gxyide.pricing.vo.UserVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@Tag(name = "管理员功能")
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final SysUserMapper sysUserMapper;
    private final SysUserRoleMapper userRoleMapper;
    private final SysRoleMapper roleMapper;
    private final PasswordEncoder passwordEncoder;
    private final ConfigService configService;
    private final LogisticsService logisticsService;

    @Operation(summary = "获取用户列表")
    @GetMapping("/user/list")
    @PreAuthorize("@perm.check('SYSTEM_USER_MANAGE') or @perm.anyRole('MANAGER','ADMIN')")
    public Result<Page<SysUser>> listUsers(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<SysUser> pageParam = new Page<>(page, size);
        Page<SysUser> result = sysUserMapper.selectPage(pageParam,
                new LambdaQueryWrapper<SysUser>().orderByDesc(SysUser::getCreateTime));
        result.getRecords().forEach(u -> u.setPassword(null));
        return Result.success(result);
    }

    @Operation(summary = "获取销售归属配置")
    @GetMapping("/user/{id}/assignments")
    @PreAuthorize("@perm.check('SYSTEM_USER_MANAGE') or @perm.anyRole('MANAGER','ADMIN')")
    public Result<UserVO> getAssignments(@PathVariable Long id) {
        SysUser user = sysUserMapper.selectById(id);
        if (user == null) {
            return Result.error("用户不存在");
        }
        return Result.success(UserVO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .realName(user.getRealName())
                .role(user.getRole())
                .techUserId(user.getTechUserId())
                .processUserId(user.getProcessUserId())
                .logisticsUserId(user.getLogisticsUserId())
                .techProcessUserId(user.getTechProcessUserId())
                .techLogisticsUserId(user.getTechLogisticsUserId())
                .processLogisticsUserId(user.getProcessLogisticsUserId())
                .logisticsApproveUserId(user.getLogisticsApproveUserId())
                .build());
    }

    @Operation(summary = "设置销售归属配置")
    @PostMapping("/user/{id}/assignments")
    @PreAuthorize("@perm.check('SYSTEM_USER_MANAGE') or @perm.anyRole('MANAGER','ADMIN')")
    public Result<Void> setAssignments(@PathVariable Long id, @RequestBody UserCreateDTO dto) {
        SysUser user = sysUserMapper.selectById(id);
        if (user == null) {
            return Result.error("用户不存在");
        }
        String role = user.getRole();
        if ("SALES".equals(role)) {
            user.setTechUserId(dto.getTechUserId());
            user.setProcessUserId(dto.getProcessUserId());
            user.setLogisticsUserId(dto.getLogisticsUserId());
        } else if ("TECH".equals(role)) {
            user.setTechProcessUserId(dto.getTechProcessUserId());
            user.setTechLogisticsUserId(dto.getTechLogisticsUserId());
        } else if ("PROCESS".equals(role)) {
            user.setProcessLogisticsUserId(dto.getProcessLogisticsUserId());
        } else if ("LOGISTICS".equals(role)) {
            user.setLogisticsApproveUserId(dto.getLogisticsApproveUserId());
        }
        sysUserMapper.updateById(user);
        return Result.success();
    }

    @Operation(summary = "创建用户")
    @PostMapping("/user")
    @PreAuthorize("@perm.check('SYSTEM_USER_MANAGE')")
    public Result<Void> createUser(@RequestBody UserCreateDTO dto) {
        String username = dto.getUsername() != null ? dto.getUsername().trim() : "";
        if (username.isEmpty()) {
            return Result.error("用户名不能为空");
        }
        // 检查用户名是否已存在
        SysUser existing = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username));
        if (existing != null) {
            return Result.error("用户名已存在");
        }

        SysUser user = new SysUser();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRealName(dto.getRealName());
        user.setPhone(dto.getPhone());
        user.setRole(dto.getRole());
        user.setTechUserId(dto.getTechUserId());
        user.setProcessUserId(dto.getProcessUserId());
        user.setLogisticsUserId(dto.getLogisticsUserId());
        user.setTechProcessUserId(dto.getTechProcessUserId());
        user.setTechLogisticsUserId(dto.getTechLogisticsUserId());
        user.setProcessLogisticsUserId(dto.getProcessLogisticsUserId());
        user.setLogisticsApproveUserId(dto.getLogisticsApproveUserId());
        user.setStatus(1);
        sysUserMapper.insert(user);

        // 同步写入 sys_user_role
        if (dto.getRole() != null) {
            SysRole role = roleMapper.selectOne(
                new LambdaQueryWrapper<SysRole>().eq(SysRole::getRoleCode, dto.getRole()));
            if (role != null) {
                SysUserRole ur = new SysUserRole();
                ur.setUserId(user.getId());
                ur.setRoleId(role.getId());
                userRoleMapper.insert(ur);
            }
        }
        return Result.success();
    }

    @Operation(summary = "更新用户")
    @PutMapping("/user/{id}")
    @PreAuthorize("@perm.check('SYSTEM_USER_MANAGE')")
    public Result<Void> updateUser(@PathVariable Long id, @RequestBody UserCreateDTO dto) {
        SysUser user = sysUserMapper.selectById(id);
        if (user == null) {
            return Result.error("用户不存在");
        }
        if (dto.getUsername() != null) {
            String newUsername = dto.getUsername().trim();
            if (!newUsername.isEmpty() && !newUsername.equals(user.getUsername())) {
                SysUser dup = sysUserMapper.selectOne(
                    new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, newUsername));
                if (dup != null) {
                    return Result.error("用户名已存在");
                }
                user.setUsername(newUsername);
            }
        }
        if (dto.getRealName() != null) user.setRealName(dto.getRealName());
        if (dto.getPhone() != null) user.setPhone(dto.getPhone());
        if (dto.getRole() != null) user.setRole(dto.getRole());
        if (dto.getTechUserId() != null || dto.getProcessUserId() != null || dto.getLogisticsUserId() != null) {
            user.setTechUserId(dto.getTechUserId());
            user.setProcessUserId(dto.getProcessUserId());
            user.setLogisticsUserId(dto.getLogisticsUserId());
        }
        if (dto.getTechProcessUserId() != null || dto.getTechLogisticsUserId() != null || dto.getProcessLogisticsUserId() != null || dto.getLogisticsApproveUserId() != null) {
            user.setTechProcessUserId(dto.getTechProcessUserId());
            user.setTechLogisticsUserId(dto.getTechLogisticsUserId());
            user.setProcessLogisticsUserId(dto.getProcessLogisticsUserId());
            user.setLogisticsApproveUserId(dto.getLogisticsApproveUserId());
        }
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        sysUserMapper.updateById(user);

        // 同步 sys_user_role
        if (dto.getRole() != null) {
            userRoleMapper.delete(
                new LambdaQueryWrapper<SysUserRole>().eq(SysUserRole::getUserId, id));
            SysRole role = roleMapper.selectOne(
                new LambdaQueryWrapper<SysRole>().eq(SysRole::getRoleCode, dto.getRole()));
            if (role != null) {
                SysUserRole ur = new SysUserRole();
                ur.setUserId(id);
                ur.setRoleId(role.getId());
                userRoleMapper.insert(ur);
            }
        }
        return Result.success();
    }

    @Operation(summary = "禁用/启用用户")
    @PutMapping("/user/{id}/status")
    @PreAuthorize("@perm.check('SYSTEM_USER_MANAGE')")
    public Result<Void> toggleUserStatus(@PathVariable Long id, @RequestParam Integer status) {
        SysUser user = sysUserMapper.selectById(id);
        if (user == null) {
            return Result.error("用户不存在");
        }
        user.setStatus(status);
        sysUserMapper.updateById(user);
        return Result.success();
    }

    @Operation(summary = "删除用户")
    @DeleteMapping("/user/{id}")
    @PreAuthorize("@perm.check('SYSTEM_USER_MANAGE')")
    public Result<Void> deleteUser(@PathVariable Long id) {
        sysUserMapper.deleteById(id);
        return Result.success();
    }

    @Operation(summary = "重置用户密码")
    @PutMapping("/user/{id}/reset-pwd")
    @PreAuthorize("@perm.check('SYSTEM_USER_MANAGE')")
    public Result<Void> resetPassword(@PathVariable Long id, @RequestParam(defaultValue = "123456") String newPassword) {
        SysUser user = sysUserMapper.selectById(id);
        if (user == null) {
            return Result.error("用户不存在");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        sysUserMapper.updateById(user);
        return Result.success();
    }

    @Operation(summary = "获取用户角色")
    @GetMapping("/user/{id}/roles")
    @PreAuthorize("@perm.check('SYSTEM_USER_MANAGE')")
    public Result<List<Long>> getUserRoles(@PathVariable Long id) {
        List<SysUserRole> urs = userRoleMapper.selectList(
            new LambdaQueryWrapper<SysUserRole>().eq(SysUserRole::getUserId, id));
        return Result.success(urs.stream().map(SysUserRole::getRoleId).toList());
    }

    @Operation(summary = "分配用户角色")
    @PostMapping("/user/{id}/roles")
    @PreAuthorize("@perm.check('SYSTEM_USER_MANAGE')")
    public Result<Void> assignRoles(@PathVariable Long id, @RequestBody List<Long> roleIds) {
        userRoleMapper.delete(
            new LambdaQueryWrapper<SysUserRole>().eq(SysUserRole::getUserId, id));
        for (Long roleId : roleIds) {
            SysUserRole ur = new SysUserRole();
            ur.setUserId(id);
            ur.setRoleId(roleId);
            userRoleMapper.insert(ur);
        }
        // 同步 sys_user.role（取第一个角色的 roleCode）
        if (!roleIds.isEmpty()) {
            SysRole firstRole = roleMapper.selectById(roleIds.get(0));
            if (firstRole != null) {
                SysUser user = sysUserMapper.selectById(id);
                if (user != null) {
                    user.setRole(firstRole.getRoleCode());
                    sysUserMapper.updateById(user);
                }
            }
        }
        return Result.success();
    }

    @Operation(summary = "获取当前铝价")
    @GetMapping("/config/aluminum-price")
    public Result<BigDecimal> getAluminumPrice() {
        return Result.success(configService.getAluminumPrice());
    }

    @Operation(summary = "更新铝价")
    @PutMapping("/config/aluminum-price")
    @PreAuthorize("@perm.check('SYSTEM_CONFIG') or @perm.check('TAB_EDIT_SETTING')")
    public Result<Void> updateAluminumPrice(@RequestParam BigDecimal price) {
        configService.updateValue("ALUMINUM_PRICE", price.multiply(new BigDecimal("1000")).toPlainString());
        return Result.success();
    }

    @Operation(summary = "获取损耗比")
    @GetMapping("/config/loss-ratio")
    @PreAuthorize("@perm.check('SYSTEM_CONFIG')")
    public Result<BigDecimal> getLossRatio() {
        return Result.success(configService.getLossRatio());
    }

    @Operation(summary = "更新损耗比")
    @PutMapping("/config/loss-ratio")
    @PreAuthorize("@perm.check('SYSTEM_CONFIG')")
    public Result<Void> updateLossRatio(@RequestParam BigDecimal value) {
        configService.updateValue("LOSS_RATIO", value.toPlainString());
        return Result.success();
    }

    @Operation(summary = "获取利润率")
    @GetMapping("/config/profit-rate")
    @PreAuthorize("@perm.check('SYSTEM_CONFIG')")
    public Result<BigDecimal> getProfitRate() {
        return Result.success(configService.getProfitRate());
    }

    @Operation(summary = "更新利润率")
    @PutMapping("/config/profit-rate")
    @PreAuthorize("@perm.check('SYSTEM_CONFIG')")
    public Result<Void> updateProfitRate(@RequestParam BigDecimal value) {
        configService.updateValue("PROFIT_RATE", value.toPlainString());
        return Result.success();
    }

    @Operation(summary = "获取损耗比（公开接口）")
    @GetMapping("/config/loss-ratio/public")
    public Result<BigDecimal> getLossRatioPublic() {
        return Result.success(configService.getLossRatio());
    }

    @Operation(summary = "获取利润率（公开接口）")
    @GetMapping("/config/profit-rate/public")
    public Result<BigDecimal> getProfitRatePublic() {
        return Result.success(configService.getProfitRate());
    }

    @Operation(summary = "导入物流价格数据")
    @PostMapping("/logistics/import")
    @PreAuthorize("@perm.check('SYSTEM_LOGISTICS_IMPORT')")
    public Result<Integer> importLogistics(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Result.error("请选择文件");
        }
        try {
            int count = logisticsService.importFromExcel(file);
            return Result.success(count);
        } catch (Exception e) {
            return Result.error("导入失败: " + e.getMessage());
        }
    }
}
