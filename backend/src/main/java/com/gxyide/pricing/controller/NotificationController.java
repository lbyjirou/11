package com.gxyide.pricing.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.entity.Notification;
import com.gxyide.pricing.entity.StageDeadline;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.mapper.SysUserMapper;
import com.gxyide.pricing.service.DeadlineService;
import com.gxyide.pricing.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "通知与交期")
@RestController
@RequestMapping("/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final DeadlineService deadlineService;
    private final SysUserMapper sysUserMapper;

    @Operation(summary = "获取我的通知列表")
    @GetMapping("/list")
    public Result<List<Notification>> list() {
        SysUser user = getCurrentUser();
        if (user == null) return Result.error("未登录");
        return Result.success(notificationService.getUserNotifications(user.getId()));
    }

    @Operation(summary = "获取未读数量")
    @GetMapping("/unread-count")
    public Result<Long> unreadCount() {
        SysUser user = getCurrentUser();
        if (user == null) return Result.error("未登录");
        return Result.success(notificationService.getUnreadCount(user.getId()));
    }

    @Operation(summary = "标记已读")
    @PostMapping("/{id}/read")
    public Result<Void> markAsRead(@PathVariable Long id) {
        SysUser user = getCurrentUser();
        if (user == null) return Result.error("未登录");
        notificationService.markAsRead(id, user.getId());
        return Result.success();
    }

    @Operation(summary = "全部已读")
    @PostMapping("/read-all")
    public Result<Void> markAllAsRead() {
        SysUser user = getCurrentUser();
        if (user == null) return Result.error("未登录");
        notificationService.markAllAsRead(user.getId());
        return Result.success();
    }

    @Operation(summary = "获取报价单各环节截止时间")
    @GetMapping("/deadlines/{quoteId}")
    public Result<List<StageDeadline>> getDeadlines(@PathVariable Long quoteId) {
        return Result.success(deadlineService.getDeadlines(quoteId));
    }

    private SysUser getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username = null;
        if (principal instanceof UserDetails ud) {
            username = ud.getUsername();
        } else if (principal instanceof String s) {
            username = s;
        }
        if (username != null) {
            return sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username));
        }
        return null;
    }
}
