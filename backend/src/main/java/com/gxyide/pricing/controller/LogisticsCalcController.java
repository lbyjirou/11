package com.gxyide.pricing.controller;

import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.dto.LogisticsSaveDTO;
import com.gxyide.pricing.entity.BasePackDict;
import com.gxyide.pricing.entity.BaseVehicleDict;
import com.gxyide.pricing.entity.QuoteLogistics;
import com.gxyide.pricing.service.LogisticsCalcService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "物流测算")
@RestController
@RequestMapping("/logistics")
@RequiredArgsConstructor
public class LogisticsCalcController {

    private final LogisticsCalcService logisticsCalcService;

    /**
     * 获取车型列表
     */
    @Operation(summary = "获取车型列表")
    @GetMapping("/vehicles")
    @PreAuthorize("@perm.check('DATA_VIEW_LOGISTICS')")
    public Result<List<BaseVehicleDict>> getVehicles() {
        return Result.success(logisticsCalcService.getVehicleList());
    }

    /**
     * 获取包装类型列表
     */
    @Operation(summary = "获取包装类型列表")
    @GetMapping("/packs")
    @PreAuthorize("@perm.check('DATA_VIEW_LOGISTICS')")
    public Result<List<BasePackDict>> getPacks() {
        return Result.success(logisticsCalcService.getPackList());
    }

    /**
     * 保存物流信息（自动计算）
     */
    @Operation(summary = "保存物流信息")
    @PostMapping("/save")
    @PreAuthorize("@perm.check('TAB_EDIT_LOGISTICS')")
    public Result<QuoteLogistics> save(@RequestBody LogisticsSaveDTO dto) {
        QuoteLogistics logistics = new QuoteLogistics();
        BeanUtils.copyProperties(dto, logistics);
        return Result.success(logisticsCalcService.saveLogistics(logistics));
    }

    /**
     * 获取报价单的物流信息
     */
    @Operation(summary = "获取物流信息")
    @GetMapping("/{orderId}")
    @PreAuthorize("@perm.check('DATA_VIEW_LOGISTICS')")
    public Result<QuoteLogistics> get(@PathVariable Long orderId) {
        return Result.success(logisticsCalcService.getByOrderId(orderId));
    }

    /**
     * 提交物流测算（流转到报价经理）
     */
    @Operation(summary = "提交物流测算")
    @PostMapping("/submit/{orderId}")
    @PreAuthorize("@perm.check('TAB_EDIT_LOGISTICS')")
    public Result<Void> submit(@PathVariable Long orderId) {
        logisticsCalcService.submitLogistics(orderId);
        return Result.success();
    }
}
