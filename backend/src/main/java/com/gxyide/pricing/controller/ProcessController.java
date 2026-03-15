package com.gxyide.pricing.controller;

import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.entity.ProcessDict;
import com.gxyide.pricing.service.ProcessService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "工序管理")
@RestController
@RequestMapping("/process")
@RequiredArgsConstructor
public class ProcessController {

    private final ProcessService processService;

    @Operation(summary = "获取启用的公共工序列表")
    @GetMapping("/list")
    public Result<List<ProcessDict>> list() {
        return Result.success(processService.listActive());
    }

    @Operation(summary = "获取公共工序预设列表")
    @GetMapping("/all")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS') or @perm.check('SYSTEM_PROCESS_PRESET_CENTER')")
    public Result<List<ProcessDict>> listAll() {
        return Result.success(processService.listAllPublic());
    }

    @Operation(summary = "获取当前用户可见的工序预设（个人+公共）")
    @GetMapping("/preset-list")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<List<ProcessDict>> presetList() {
        return Result.success(processService.listVisibleForCurrentUser());
    }

    @Operation(summary = "新增工序预设")
    @PostMapping
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS') or @perm.check('SYSTEM_PROCESS_PRESET_CENTER')")
    public Result<Void> add(@RequestBody ProcessDict process) {
        try {
            processService.createManaged(process);
            return Result.success();
        } catch (IllegalStateException ex) {
            return Result.error(ex.getMessage());
        }
    }

    @Operation(summary = "更新工序预设")
    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS') or @perm.check('SYSTEM_PROCESS_PRESET_CENTER')")
    public Result<Void> update(@PathVariable Long id, @RequestBody ProcessDict process) {
        if (!processService.updateManaged(id, process)) {
            return Result.error("工序预设不存在或无权修改");
        }
        return Result.success();
    }

    @Operation(summary = "删除工序预设")
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS') or @perm.check('SYSTEM_PROCESS_PRESET_CENTER')")
    public Result<Void> delete(@PathVariable Long id) {
        if (!processService.deleteManaged(id)) {
            return Result.error("工序预设不存在或无权删除");
        }
        return Result.success();
    }
}
