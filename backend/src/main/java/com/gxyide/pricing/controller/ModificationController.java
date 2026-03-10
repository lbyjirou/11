package com.gxyide.pricing.controller;

import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.mapper.SysUserMapper;
import com.gxyide.pricing.service.QuoteModificationService;
import com.gxyide.pricing.service.RbacService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "报价修改管理")
@RestController
@RequestMapping("/quote/modification")
@RequiredArgsConstructor
public class ModificationController {

    private final QuoteModificationService modificationService;
    private final SysUserMapper sysUserMapper;
    private final RbacService rbacService;

    @Operation(summary = "发起修改")
    @PostMapping("/{orderId}/initiate")
    @PreAuthorize("@perm.check('WORKFLOW_MODIFY')")
    public Result<Void> initiate(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body) {
        SysUser user = getCurrentUser();
        String stage = roleToStage(user.getRole());
        String reason = body.getOrDefault("reason", "");
        modificationService.initiateModification(orderId, stage, user.getId(), reason);
        return Result.success();
    }

    @Operation(summary = "获取修改状态")
    @GetMapping("/{orderId}/status")
    public Result<Map<String, Object>> status(@PathVariable Long orderId) {
        return Result.success(modificationService.getModificationStatus(orderId));
    }

    private String roleToStage(String role) {
        return switch (role) {
            case "TECH" -> "TECH";
            case "PROCESS" -> "PROCESS";
            case "LOGISTICS" -> "LOGISTICS";
            case "MANAGER" -> "APPROVAL";
            case "SALES" -> "SALES";
            default -> role;
        };
    }

    private SysUser getCurrentUser() {
        Object principal = SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        String username = null;
        if (principal instanceof UserDetails ud) {
            username = ud.getUsername();
        } else if (principal instanceof String s) {
            username = s;
        }
        if (username != null) {
            return sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>()
                    .eq(SysUser::getUsername, username));
        }
        throw new RuntimeException("用户未登录");
    }
}
