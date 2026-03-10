package com.gxyide.pricing.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.dto.ProfitAdjustDTO;
import com.gxyide.pricing.dto.RejectDTO;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.enums.QuoteStatusEnum;
import com.gxyide.pricing.mapper.SysUserMapper;
import com.gxyide.pricing.service.ManagerService;
import com.gxyide.pricing.vo.QuoteSummaryVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "经理驾驶舱")
@RestController
@RequestMapping("/manager")
@RequiredArgsConstructor
public class ManagerController {

    private final ManagerService managerService;
    private final SysUserMapper sysUserMapper;

    /**
     * 获取报价汇总
     */
    @Operation(summary = "获取报价汇总")
    @GetMapping("/summary/{orderId}")
    @PreAuthorize("@perm.check('DATA_VIEW_MANAGER')")
    public Result<QuoteSummaryVO> getSummary(@PathVariable Long orderId) {
        return Result.success(managerService.getSummary(orderId));
    }

    /**
     * 利润调整（实时计算）
     */
    @Operation(summary = "利润调整")
    @PostMapping("/adjust")
    @PreAuthorize("@perm.check('WORKFLOW_APPROVE')")
    public Result<QuoteSummaryVO> adjustProfit(@RequestBody ProfitAdjustDTO dto) {
        return Result.success(managerService.adjustProfit(dto));
    }

    /**
     * 审批通过
     */
    @Operation(summary = "审批通过")
    @PostMapping("/approve/{orderId}")
    @PreAuthorize("@perm.check('WORKFLOW_APPROVE')")
    public Result<Map<String, String>> approve(@PathVariable Long orderId) {
        SysUser user = getCurrentUser();
        QuoteStatusEnum newStatus = managerService.approve(orderId, user != null ? user.getId() : null);
        return Result.success(Map.of("newStatus", newStatus.getCode(), "statusName", newStatus.getName()));
    }

    /**
     * 驳回
     */
    @Operation(summary = "驳回")
    @PostMapping("/reject")
    @PreAuthorize("@perm.check('WORKFLOW_APPROVE')")
    public Result<Void> reject(@RequestBody RejectDTO dto) {
        QuoteStatusEnum targetStatus = QuoteStatusEnum.fromCode(dto.getTargetStatus());
        if (targetStatus == null) {
            return Result.error("无效的目标状态");
        }
        SysUser user = getCurrentUser();
        managerService.reject(dto.getOrderId(), targetStatus, dto.getReason(),
                user != null ? user.getId() : null);
        return Result.success();
    }

    private SysUser getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username = null;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            username = (String) principal;
        }
        if (username != null) {
            return sysUserMapper.selectOne(
                    new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username));
        }
        return null;
    }
}
