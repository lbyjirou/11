package com.gxyide.pricing.controller;

import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.dto.BomNodeDTO;
import com.gxyide.pricing.entity.QuoteBom;
import com.gxyide.pricing.service.BomService;
import com.gxyide.pricing.vo.BomTreeNodeVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Tag(name = "BOM管理")
@RestController
@RequestMapping("/bom")
@RequiredArgsConstructor
public class BomController {

    private final BomService bomService;

    // ==================== BOM 编辑器 CRUD 接口 ====================

    /**
     * 新增BOM节点
     */
    @Operation(summary = "新增节点")
    @PostMapping("/node")
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<QuoteBom> addNode(@RequestBody BomNodeDTO dto) {
        return Result.success(bomService.addNode(dto));
    }

    /**
     * 修改BOM节点
     */
    @Operation(summary = "修改节点")
    @PutMapping("/node")
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<QuoteBom> updateNode(@RequestBody BomNodeDTO dto) {
        return Result.success(bomService.updateNode(dto));
    }

    /**
     * 删除BOM节点（级联删除子节点）
     */
    @Operation(summary = "删除节点")
    @DeleteMapping("/node/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<Void> deleteNode(@PathVariable Long id) {
        bomService.deleteNode(id);
        return Result.success();
    }

    /**
     * 获取完整BOM树
     */
    @Operation(summary = "获取BOM树")
    @GetMapping("/tree/{orderId}")
    @PreAuthorize("@perm.check('DATA_VIEW_TECH')")
    public Result<List<BomTreeNodeVO>> getTree(@PathVariable Long orderId) {
        return Result.success(bomService.getBomTree(orderId));
    }

    // ==================== 原有接口 ====================

    /**
     * 导入BOM Excel/CSV文件
     */
    @Operation(summary = "导入BOM")
    @PostMapping("/import/{orderId}")
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<Map<String, Object>> importBom(
            @PathVariable Long orderId,
            @RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> result = bomService.importBom(orderId, file);
            if (Boolean.TRUE.equals(result.get("success"))) {
                return Result.success(result);
            } else {
                return Result.error((String) result.getOrDefault("message", "导入失败"));
            }
        } catch (IOException e) {
            return Result.error("文件读取失败: " + e.getMessage());
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取报价单的BOM列表（平铺）
     */
    @Operation(summary = "获取BOM列表")
    @GetMapping("/list/{orderId}")
    @PreAuthorize("@perm.check('DATA_VIEW_TECH')")
    public Result<List<QuoteBom>> list(@PathVariable Long orderId) {
        return Result.success(bomService.getBomByOrderId(orderId));
    }

    /**
     * 获取顶级BOM节点
     */
    @Operation(summary = "获取顶级BOM")
    @GetMapping("/top/{orderId}")
    @PreAuthorize("@perm.check('DATA_VIEW_TECH')")
    public Result<List<QuoteBom>> topLevel(@PathVariable Long orderId) {
        return Result.success(bomService.getTopLevelBom(orderId));
    }

    /**
     * 获取子节点
     */
    @Operation(summary = "获取子BOM")
    @GetMapping("/children/{parentId}")
    @PreAuthorize("@perm.check('DATA_VIEW_TECH')")
    public Result<List<QuoteBom>> children(@PathVariable Long parentId) {
        return Result.success(bomService.getChildBom(parentId));
    }

    /**
     * 更新BOM项净重
     */
    @Operation(summary = "更新净重")
    @PutMapping("/{bomId}/weight")
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<Void> updateWeight(
            @PathVariable Long bomId,
            @RequestParam BigDecimal netWeight) {
        bomService.updateNetWeight(bomId, netWeight);
        return Result.success();
    }

    /**
     * 计算总重量
     */
    @Operation(summary = "计算总重量")
    @PostMapping("/calculate-weight/{orderId}")
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<BigDecimal> calculateWeight(@PathVariable Long orderId) {
        BigDecimal totalWeight = bomService.calculateTotalWeight(orderId);
        return Result.success(totalWeight);
    }

    /**
     * 提交BOM（流转到工艺工程师）
     */
    @Operation(summary = "提交BOM")
    @PostMapping("/submit/{orderId}")
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<Void> submit(@PathVariable Long orderId) {
        bomService.submitBom(orderId);
        return Result.success();
    }

    /**
     * 批量更新BOM工装分摊
     */
    @Operation(summary = "批量更新工装分摊")
    @PutMapping("/batch-tooling")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<Void> batchUpdateTooling(@RequestBody List<Map<String, Object>> updates) {
        bomService.batchUpdateToolingCost(updates);
        return Result.success();
    }
}
