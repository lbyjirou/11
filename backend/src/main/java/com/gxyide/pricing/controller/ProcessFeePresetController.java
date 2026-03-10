package com.gxyide.pricing.controller;

import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.entity.ProcessFeePreset;
import com.gxyide.pricing.service.ProcessFeePresetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "加工费预存管理")
@RestController
@RequestMapping("/process-fee-preset")
@RequiredArgsConstructor
public class ProcessFeePresetController {

    private final ProcessFeePresetService service;

    @Operation(summary = "搜索加工费预存（模糊匹配）")
    @GetMapping("/search")
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<List<ProcessFeePreset>> search(
            @RequestParam(required = false, defaultValue = "") String keyword) {
        return Result.success(service.search(keyword));
    }

    @Operation(summary = "创建加工费预存")
    @PostMapping
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<Void> create(@RequestBody ProcessFeePreset preset) {
        service.createPreset(preset);
        return Result.success();
    }

    @Operation(summary = "更新加工费预存")
    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<Void> update(@PathVariable Long id, @RequestBody ProcessFeePreset preset) {
        if (!service.updateOwn(id, preset)) {
            return Result.error("不存在或无权修改");
        }
        return Result.success();
    }

    @Operation(summary = "删除加工费预存")
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_TECH')")
    public Result<Void> delete(@PathVariable Long id) {
        if (!service.deleteOwn(id)) {
            return Result.error("不存在或无权删除");
        }
        return Result.success();
    }
}
