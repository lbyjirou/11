package com.gxyide.pricing.controller;

import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.dto.ProcessAddDTO;
import com.gxyide.pricing.entity.BaseMachineDict;
import com.gxyide.pricing.entity.QuoteItemProcess;
import com.gxyide.pricing.enums.QuoteStatusEnum;
import com.gxyide.pricing.service.ProcessCalcService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Tag(name = "工艺计算")
@RestController
@RequestMapping("/process-calc")
@RequiredArgsConstructor
public class ProcessCalcController {

    private final ProcessCalcService processCalcService;

    /**
     * 获取设备字典列表
     */
    @Operation(summary = "获取设备列表")
    @GetMapping("/machines")
    @PreAuthorize("@perm.check('DATA_VIEW_PROCESS')")
    public Result<List<BaseMachineDict>> getMachines() {
        return Result.success(processCalcService.getMachineList());
    }

    /**
     * 添加工序
     */
    @Operation(summary = "添加工序")
    @PostMapping("/add")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<QuoteItemProcess> addProcess(@RequestBody ProcessAddDTO dto) {
        return Result.success(processCalcService.addProcess(dto));
    }

    /**
     * 更新工序
     */
    @Operation(summary = "更新工序")
    @PutMapping("/update")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<QuoteItemProcess> updateProcess(@RequestBody QuoteItemProcess process) {
        return Result.success(processCalcService.updateProcess(process));
    }

    /**
     * 删除工序
     */
    @Operation(summary = "删除工序")
    @DeleteMapping("/{processId}")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<Void> deleteProcess(@PathVariable Long processId) {
        processCalcService.deleteProcess(processId);
        return Result.success();
    }

    /**
     * 获取报价单的所有工序
     */
    @Operation(summary = "获取报价单工序列表")
    @GetMapping("/list/{orderId}")
    @PreAuthorize("@perm.check('DATA_VIEW_PROCESS')")
    public Result<List<QuoteItemProcess>> listByOrder(@PathVariable Long orderId) {
        return Result.success(processCalcService.getProcessByOrderId(orderId));
    }

    /**
     * 获取BOM零件的工序
     */
    @Operation(summary = "获取BOM零件工序")
    @GetMapping("/bom/{bomId}")
    @PreAuthorize("@perm.check('DATA_VIEW_PROCESS')")
    public Result<List<QuoteItemProcess>> listByBom(@PathVariable Long bomId) {
        return Result.success(processCalcService.getProcessByBomId(bomId));
    }

    /**
     * 计算总制造费用
     */
    @Operation(summary = "计算总制造费用")
    @PostMapping("/calculate/{orderId}")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<BigDecimal> calculate(@PathVariable Long orderId) {
        return Result.success(processCalcService.calculateTotalManufacturingCost(orderId));
    }

    /**
     * 提交工艺核算（流转到物流专员）
     */
    @Operation(summary = "提交工艺核算")
    @PostMapping("/submit/{orderId}")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<Map<String, String>> submit(@PathVariable Long orderId) {
        QuoteStatusEnum newStatus = processCalcService.submitProcess(orderId);
        return Result.success(Map.of("newStatus", newStatus.getCode(), "statusName", newStatus.getName()));
    }
}
