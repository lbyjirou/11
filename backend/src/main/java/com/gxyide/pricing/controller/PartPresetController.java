package com.gxyide.pricing.controller;

import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.entity.PartPreset;
import com.gxyide.pricing.service.PartPresetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "零件模版管理")
@RestController
@RequestMapping("/part-preset")
@RequiredArgsConstructor
public class PartPresetController {

    private final PartPresetService partPresetService;

    @Operation(summary = "获取当前用户的零件模版列表")
    @GetMapping("/list")
    @PreAuthorize("@perm.anyRole('TECH','PROCESS','ADMIN')")
    public Result<List<PartPreset>> list() {
        return Result.success(partPresetService.listByCurrentUser());
    }

    @Operation(summary = "获取所有零件模版")
    @GetMapping("/all")
    @PreAuthorize("@perm.anyRole('TECH','PROCESS','ADMIN')")
    public Result<List<PartPreset>> all() {
        return Result.success(partPresetService.listAll());
    }

    @Operation(summary = "创建零件模版")
    @PostMapping
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<Void> create(@RequestBody PartPreset preset) {
        partPresetService.createPreset(preset);
        return Result.success();
    }

    @Operation(summary = "更新零件模版")
    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<Void> update(@PathVariable Long id,
                               @RequestBody PartPreset preset) {
        if (!partPresetService.updateOwnPreset(id, preset)) {
            return Result.error("模版不存在或无权修改");
        }
        return Result.success();
    }

    @Operation(summary = "删除零件模版")
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<Void> delete(@PathVariable Long id) {
        if (!partPresetService.deleteOwnPreset(id)) {
            return Result.error("模版不存在或无权删除");
        }
        return Result.success();
    }
}
