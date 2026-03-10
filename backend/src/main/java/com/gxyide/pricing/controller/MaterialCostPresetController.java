package com.gxyide.pricing.controller;

import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.entity.MaterialCostPreset;
import com.gxyide.pricing.service.MaterialCostPresetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "材料预算系数管理")
@RestController
@RequestMapping("/material-cost-preset")
@RequiredArgsConstructor
public class MaterialCostPresetController {

    private final MaterialCostPresetService service;

    @Operation(summary = "按类型查询预设列表")
    @GetMapping("/list")
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<List<MaterialCostPreset>> list(@RequestParam String type) {
        return Result.success(service.listByType(type));
    }

    @Operation(summary = "创建预设")
    @PostMapping
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<Void> create(@RequestBody MaterialCostPreset preset) {
        service.createPreset(preset);
        return Result.success();
    }

    @Operation(summary = "更新预设")
    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<Void> update(@PathVariable Long id, @RequestBody MaterialCostPreset preset) {
        if (!service.updateOwn(id, preset)) {
            return Result.error("不存在或无权修改");
        }
        return Result.success();
    }

    @Operation(summary = "删除预设")
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<Void> delete(@PathVariable Long id) {
        if (!service.deleteOwn(id)) {
            return Result.error("不存在或无权删除");
        }
        return Result.success();
    }
}
