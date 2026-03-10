package com.gxyide.pricing.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.entity.*;
import com.gxyide.pricing.mapper.*;
import com.gxyide.pricing.service.RbacService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Tag(name = "角色管理")
@RestController
@RequestMapping("/admin/role")
@RequiredArgsConstructor
public class RoleController {

    private final SysRoleMapper roleMapper;
    private final SysPermissionMapper permissionMapper;
    private final SysRolePermissionMapper rolePermissionMapper;
    private final SysUserRoleMapper userRoleMapper;
    private final RbacService rbacService;

    @Operation(summary = "角色列表")
    @GetMapping("/list")
    @PreAuthorize("@perm.check('SYSTEM_ROLE_MANAGE')")
    public Result<List<SysRole>> list() {
        return Result.success(roleMapper.selectList(null));
    }

    @Operation(summary = "权限列表")
    @GetMapping("/permissions")
    @PreAuthorize("@perm.check('SYSTEM_ROLE_MANAGE')")
    public Result<List<SysPermission>> permissions() {
        return Result.success(permissionMapper.selectList(null));
    }

    @Operation(summary = "获取角色的权限")
    @GetMapping("/{roleId}/permissions")
    @PreAuthorize("@perm.check('SYSTEM_ROLE_MANAGE')")
    public Result<List<SysPermission>> rolePermissions(@PathVariable Long roleId) {
        return Result.success(permissionMapper.selectPermissionsByRoleId(roleId));
    }

    @Operation(summary = "创建角色")
    @PostMapping
    @PreAuthorize("@perm.check('SYSTEM_ROLE_MANAGE')")
    public Result<Long> create(@RequestBody SysRole role) {
        role.setIsSystem(0);
        roleMapper.insert(role);
        return Result.success(role.getId());
    }

    @Operation(summary = "更新角色")
    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('SYSTEM_ROLE_MANAGE')")
    public Result<Void> update(@PathVariable Long id, @RequestBody SysRole role) {
        SysRole existing = roleMapper.selectById(id);
        if (existing == null) return Result.error("角色不存在");
        existing.setRoleName(role.getRoleName());
        existing.setDescription(role.getDescription());
        existing.setWorkflowStage(role.getWorkflowStage());
        existing.setStatus(role.getStatus());
        roleMapper.updateById(existing);
        return Result.success();
    }

    @Operation(summary = "删除角色")
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('SYSTEM_ROLE_MANAGE')")
    public Result<Void> delete(@PathVariable Long id) {
        SysRole role = roleMapper.selectById(id);
        if (role == null) return Result.error("角色不存在");
        if (role.getIsSystem() == 1) return Result.error("系统角色不可删除");
        roleMapper.deleteById(id);
        rolePermissionMapper.delete(
            new LambdaQueryWrapper<SysRolePermission>()
                .eq(SysRolePermission::getRoleId, id));
        return Result.success();
    }

    @Operation(summary = "分配角色权限")
    @PostMapping("/{roleId}/permissions")
    @PreAuthorize("@perm.check('SYSTEM_ROLE_MANAGE')")
    public Result<Void> assignPermissions(
            @PathVariable Long roleId,
            @RequestBody List<Long> permissionIds) {
        rolePermissionMapper.delete(
            new LambdaQueryWrapper<SysRolePermission>()
                .eq(SysRolePermission::getRoleId, roleId));
        for (Long permId : permissionIds) {
            SysRolePermission rp = new SysRolePermission();
            rp.setRoleId(roleId);
            rp.setPermissionId(permId);
            rolePermissionMapper.insert(rp);
        }
        return Result.success();
    }
}
