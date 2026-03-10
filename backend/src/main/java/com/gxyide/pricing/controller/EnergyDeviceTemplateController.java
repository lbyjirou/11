package com.gxyide.pricing.controller;

import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.entity.EnergyDeviceTemplate;
import com.gxyide.pricing.service.EnergyDeviceTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "能耗模版管理")
@RestController
@RequestMapping("/energy-device-template")
@RequiredArgsConstructor
public class EnergyDeviceTemplateController {

    private final EnergyDeviceTemplateService energyDeviceTemplateService;

    @Operation(summary = "获取当前用户的模版列表（device/mold/material）")
    @GetMapping("/list")
    @PreAuthorize("@perm.check('TAB_VIEW_TECH')")
    public Result<List<EnergyDeviceTemplate>> list(@RequestParam(defaultValue = "device") String category) {
        return Result.success(energyDeviceTemplateService.listByCurrentUser(category));
    }

    @Operation(summary = "模糊搜索模版（device/mold/material）")
    @GetMapping("/search")
    @PreAuthorize("@perm.check('TAB_VIEW_TECH')")
    public Result<List<EnergyDeviceTemplate>> search(@RequestParam(required = false) String keyword,
                                                      @RequestParam(defaultValue = "device") String category) {
        return Result.success(energyDeviceTemplateService.search(keyword, category));
    }

    @Operation(summary = "创建模版（device/mold/material）")
    @PostMapping
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<Void> create(@RequestBody EnergyDeviceTemplate template) {
        energyDeviceTemplateService.createTemplate(template);
        return Result.success();
    }

    @Operation(summary = "更新模版（device/mold/material）")
    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<Void> update(@PathVariable Long id,
                               @RequestBody EnergyDeviceTemplate template) {
        if (!energyDeviceTemplateService.updateOwnTemplate(id, template)) {
            return Result.error("模版不存在或无权修改");
        }
        return Result.success();
    }

    @Operation(summary = "删除模版（device/mold/material）")
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<Void> delete(@PathVariable Long id) {
        if (!energyDeviceTemplateService.deleteOwnTemplate(id)) {
            return Result.error("模版不存在或无权删除");
        }
        return Result.success();
    }
}
