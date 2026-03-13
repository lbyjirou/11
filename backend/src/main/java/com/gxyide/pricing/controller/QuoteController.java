package com.gxyide.pricing.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.dto.QuoteCalculateDTO;
import com.gxyide.pricing.dto.QuoteCreateDTO;
import com.gxyide.pricing.entity.QuoteOrder;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.mapper.SysUserMapper;
import com.gxyide.pricing.service.QuoteService;
import com.gxyide.pricing.service.ExportService;
import com.gxyide.pricing.service.RbacService;
import com.gxyide.pricing.vo.QuoteListVO;
import com.gxyide.pricing.vo.QuoteResultVO;
import com.gxyide.pricing.enums.QuoteStatusEnum;
import com.gxyide.pricing.vo.OrderProgressVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Tag(name = "报价管理")
@RestController
@RequestMapping("/quote")
@RequiredArgsConstructor
public class QuoteController {

    private final QuoteService quoteService;
    private final ExportService exportService;
    private final SysUserMapper sysUserMapper;
    private final RbacService rbacService;

    /**
     * 销售员创建报价单
     */
    @Operation(summary = "创建报价单")
    @PostMapping("/create")
    @PreAuthorize("@perm.check('WORKFLOW_CREATE')")
    public Result<Long> create(@Valid @RequestBody QuoteCreateDTO dto) {
        SysUser currentUser = getCurrentUser();
        if (currentUser == null) {
            return Result.error("用户未登录");
        }
        Long quoteId = quoteService.createQuote(dto, currentUser.getId());
        return Result.success(quoteId);
    }

    /**
     * 报价单列表
     */
    @Operation(summary = "报价单列表")
    @GetMapping("/list")
    public Result<Page<QuoteListVO>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String status) {
        SysUser currentUser = getCurrentUser();
        if (currentUser == null) {
            return Result.error("用户未登录");
        }
        Page<QuoteOrder> pageParam = new Page<>(page, size);
        Page<QuoteListVO> result = quoteService.listQuotes(pageParam, currentUser.getId(), currentUser.getRole(), status);
        return Result.success(result);
    }

    /**
     * 更新报价单
     * SALES: 仅销售状态可编辑
     * TECH: 仅技术状态可编辑
     * PROCESS: 仅生产状态可编辑
     * LOGISTICS: 仅物流状态可编辑
     */
    @Operation(summary = "更新报价单")
    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('WORKFLOW_ADVANCE')")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody QuoteCreateDTO dto) {
        QuoteOrder order = quoteService.getById(id);
        if (order == null) {
            return Result.error("报价单不存在");
        }
        SysUser currentUser = getCurrentUser();
        String role = currentUser != null ? currentUser.getRole() : null;
        // SALES只能编辑销售状态
        if ("SALES".equals(role) && !"DRAFT".equals(order.getStatus())) {
            return Result.error("只能编辑销售状态的报价单");
        }
        // TECH只能在技术状态编辑
        if ("TECH".equals(role) && !"PENDING_TECH".equals(order.getStatus())) {
            return Result.error("只能在技术状态编辑");
        }
        // PROCESS只能在生产状态编辑
        if ("PROCESS".equals(role) && !"PENDING_PROCESS".equals(order.getStatus())) {
            return Result.error("只能在生产状态编辑");
        }
        // LOGISTICS只能在物流状态编辑
        if ("LOGISTICS".equals(role) && !"PENDING_LOGISTICS".equals(order.getStatus())) {
            return Result.error("只能在物流状态编辑");
        }
        quoteService.updateQuote(id, dto, role);
        return Result.success();
    }

    /**
     * 销售员提交报价单
     */
    @Operation(summary = "提交报价单")
    @PostMapping("/{id}/submit")
    @PreAuthorize("@perm.check('WORKFLOW_SUBMIT')")
    public Result<Map<String, String>> submit(@PathVariable Long id) {
        QuoteStatusEnum newStatus = quoteService.submitToTech(id);
        return Result.success(Map.of("newStatus", newStatus.getCode(), "statusName", newStatus.getName()));
    }

    /**
     * 推进报价单状态到下一阶段
     * TECH: PENDING_TECH -> PENDING_PROCESS
     * PROCESS: PENDING_PROCESS -> PENDING_LOGISTICS
     * LOGISTICS: PENDING_LOGISTICS -> PENDING_APPROVAL
     */
    @Operation(summary = "推进报价单状态")
    @PostMapping("/{id}/advance")
    @PreAuthorize("@perm.check('WORKFLOW_ADVANCE')")
    public Result<Map<String, String>> advance(@PathVariable Long id) {
        SysUser currentUser = getCurrentUser();
        if (currentUser == null) {
            return Result.error("用户未登录");
        }
        QuoteStatusEnum newStatus = quoteService.advanceStatus(id, currentUser.getRole());
        return Result.success(Map.of("newStatus", newStatus.getCode(), "statusName", newStatus.getName()));
    }

    /**
     * 获取报价单详情
     */
    @Operation(summary = "获取报价单详情")
    @GetMapping("/{id}")
    public Result<QuoteOrder> getById(@PathVariable Long id) {
        QuoteOrder order = quoteService.getById(id);
        if (order == null) return Result.error("报价单不存在");
        SysUser currentUser = getCurrentUser();
        if (currentUser != null) {
            filterByPermission(order, rbacService.getUserPermissions(currentUser.getId()));
        }
        return Result.success(order);
    }

    @Operation(summary = "获取报价单流程进度")
    @GetMapping("/{id}/progress")
    public Result<OrderProgressVO> getProgress(@PathVariable Long id) {
        return Result.success(quoteService.getOrderProgress(id));
    }

    /**
     * 删除报价单（仅销售状态）
     */
    @Operation(summary = "删除报价单")
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_SALES')")
    public Result<Void> delete(@PathVariable Long id) {
        QuoteOrder order = quoteService.getById(id);
        if (order == null) {
            return Result.error("报价单不存在");
        }
        if (!"DRAFT".equals(order.getStatus())) {
            return Result.error("只能删除销售状态的报价单");
        }
        quoteService.removeById(id);
        return Result.success();
    }

    // ==================== 保留原有接口 ====================

    @Operation(summary = "计算报价")
    @PostMapping("/calculate")
    @PreAuthorize("@perm.check('DATA_VIEW_SALES')")
    public Result<QuoteResultVO> calculate(@RequestBody QuoteCalculateDTO dto) {
        return Result.success(quoteService.calculate(dto));
    }

    @Operation(summary = "导出报价单Excel")
    @PostMapping("/export")
    @PreAuthorize("@perm.check('DATA_VIEW_SALES')")
    public void export(@RequestBody QuoteCalculateDTO dto, HttpServletResponse response) throws IOException {
        QuoteResultVO result = quoteService.calculate(dto);
        exportService.exportQuote(result, response);
    }

    /**
     * 隐藏报价单（仅创建者可操作，对自己隐藏，其他人仍可见）
     */
    @Operation(summary = "隐藏报价单")
    @PostMapping("/{id}/hide")
    public Result<Void> hide(@PathVariable Long id) {
        SysUser currentUser = getCurrentUser();
        if (currentUser == null) {
            return Result.error("用户未登录");
        }
        quoteService.hideOrder(id, currentUser.getId());
        return Result.success();
    }

    /**
     * 取消隐藏报价单
     */
    @Operation(summary = "取消隐藏报价单")
    @PostMapping("/{id}/unhide")
    public Result<Void> unhide(@PathVariable Long id) {
        SysUser currentUser = getCurrentUser();
        if (currentUser == null) {
            return Result.error("用户未登录");
        }
        quoteService.unhideOrder(id, currentUser.getId());
        return Result.success();
    }

    /**
     * 获取当前角色的待处理数量
     */
    @Operation(summary = "获取待处理数量")
    @GetMapping("/pending-count")
    public Result<Map<String, Integer>> getPendingCount() {
        SysUser currentUser = getCurrentUser();
        if (currentUser == null) {
            return Result.error("用户未登录");
        }
        return Result.success(quoteService.getPendingCount(currentUser.getId(), currentUser.getRole()));
    }

    // ==================== 工具方法 ====================

    private boolean canView(Set<String> perms, String dataKey, String tabKey) {
        return perms.contains(dataKey) || perms.contains(tabKey);
    }

    private void filterByPermission(QuoteOrder order, Set<String> perms) {
        if (canView(perms, "DATA_VIEW_TECH", "TAB_VIEW_TECH")
                && canView(perms, "DATA_VIEW_PROCESS", "TAB_VIEW_PROCESS")
                && canView(perms, "DATA_VIEW_LOGISTICS", "TAB_VIEW_LOGISTICS")
                && canView(perms, "DATA_VIEW_MANAGER", "TAB_VIEW_APPROVE")) {
            return;
        }
        if (!canView(perms, "DATA_VIEW_TECH", "TAB_VIEW_TECH")) {
            order.setTechDataJson(null);
            order.setMaterialCost(null);
            order.setNetWeight(null);
            order.setGrossWeight(null);
        }
        if (!canView(perms, "DATA_VIEW_PROCESS", "TAB_VIEW_PROCESS")) {
            order.setProcessDataJson(null);
            order.setLaborCost(null);
            order.setManufacturingCost(null);
            order.setToolingCost(null);
        }
        if (!canView(perms, "DATA_VIEW_LOGISTICS", "TAB_VIEW_LOGISTICS")) {
            order.setLogisticsDataJson(null);
            order.setLogisticsCost(null);
            order.setPackagingCost(null);
        }
        if (!canView(perms, "DATA_VIEW_MANAGER", "TAB_VIEW_APPROVE")) {
            order.setManagementFee(null);
            order.setScrapRate(null);
            order.setScrapCost(null);
            order.setProfit(null);
            order.setSgaCost(null);
            order.setProfitAmount(null);
            order.setFactoryPrice(null);
            order.setUnitPriceExclTax(null);
            order.setUnitPriceInclTax(null);
            order.setTaxRate(null);
        }
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
