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

@Tag(name = "能耗模板管理")
@RestController
@RequestMapping("/energy-device-template")
@RequiredArgsConstructor
public class EnergyDeviceTemplateController {

    private final EnergyDeviceTemplateService energyDeviceTemplateService;

    @Operation(summary = "获取模板列表")
    @GetMapping("/list")
    @PreAuthorize("@perm.check('TAB_VIEW_TECH') or @perm.check('SYSTEM_PROCESS_PRESET_CENTER')")
    public Result<List<EnergyDeviceTemplate>> list(
            @RequestParam(defaultValue = "device") String category,
            @RequestParam(defaultValue = "visible") String scope) {
        if ("public".equalsIgnoreCase(scope)) {
            return Result.success(energyDeviceTemplateService.listPublic(category));
        }
        return Result.success(energyDeviceTemplateService.listVisible(category));
    }

    @Operation(summary = "搜索模板")
    @GetMapping("/search")
    @PreAuthorize("@perm.check('TAB_VIEW_TECH') or @perm.check('SYSTEM_PROCESS_PRESET_CENTER')")
    public Result<List<EnergyDeviceTemplate>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "device") String category,
            @RequestParam(defaultValue = "visible") String scope) {
        return Result.success(energyDeviceTemplateService.search(
                keyword,
                category,
                "public".equalsIgnoreCase(scope)
        ));
    }

    @Operation(summary = "创建模板")
    @PostMapping
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS') or @perm.check('SYSTEM_PROCESS_PRESET_CENTER')")
    public Result<Void> create(@RequestBody EnergyDeviceTemplate template) {
        try {
            energyDeviceTemplateService.createTemplate(template);
            return Result.success();
        } catch (IllegalStateException ex) {
            return Result.error(ex.getMessage());
        }
    }

    @Operation(summary = "更新模板")
    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS') or @perm.check('SYSTEM_PROCESS_PRESET_CENTER')")
    public Result<Void> update(@PathVariable Long id,
                               @RequestBody EnergyDeviceTemplate template) {
        if (!energyDeviceTemplateService.updateManagedTemplate(id, template)) {
            return Result.error("模板不存在或无权修改");
        }
        return Result.success();
    }

    @Operation(summary = "删除模板")
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS') or @perm.check('SYSTEM_PROCESS_PRESET_CENTER')")
    public Result<Void> delete(@PathVariable Long id) {
        if (!energyDeviceTemplateService.deleteManagedTemplate(id)) {
            return Result.error("模板不存在或无权删除");
        }
        return Result.success();
    }
}
