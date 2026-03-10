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

    @Operation(summary = "获取启用的工序列表（汇总页使用）")
    @GetMapping("/list")
    public Result<List<ProcessDict>> list() {
        return Result.success(processService.listActive());
    }

    @Operation(summary = "获取所有工序列表（工序管理页使用）")
    @GetMapping("/all")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<List<ProcessDict>> listAll() {
        return Result.success(processService.listAll());
    }

    @Operation(summary = "新增工序")
    @PostMapping
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<Void> add(@RequestBody ProcessDict process) {
        processService.save(process);
        return Result.success();
    }

    @Operation(summary = "更新工序")
    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<Void> update(@PathVariable Long id, @RequestBody ProcessDict process) {
        process.setId(id);
        processService.updateById(process);
        return Result.success();
    }

    @Operation(summary = "删除工序")
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<Void> delete(@PathVariable Long id) {
        processService.removeById(id);
        return Result.success();
    }
}
