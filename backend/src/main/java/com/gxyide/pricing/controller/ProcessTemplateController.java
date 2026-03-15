package com.gxyide.pricing.controller;

import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.entity.ProcessTemplate;
import com.gxyide.pricing.service.ProcessTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "工艺模板管理")
@RestController
@RequestMapping("/process-template")
@RequiredArgsConstructor
public class ProcessTemplateController {

    private final ProcessTemplateService processTemplateService;

    @Operation(summary = "获取模板列表")
    @GetMapping("/list")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS') or @perm.check('SYSTEM_PROCESS_PRESET_CENTER')")
    public Result<List<ProcessTemplate>> list(
            @RequestParam(defaultValue = "visible") String scope) {
        if ("public".equalsIgnoreCase(scope)) {
            return Result.success(processTemplateService.listPublic());
        }
        return Result.success(processTemplateService.listVisibleForCurrentUser());
    }

    @Operation(summary = "创建模板")
    @PostMapping
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS') or @perm.check('SYSTEM_PROCESS_PRESET_CENTER')")
    public Result<Void> create(@RequestBody ProcessTemplate template) {
        try {
            processTemplateService.createTemplate(template);
            return Result.success();
        } catch (IllegalStateException ex) {
            return Result.error(ex.getMessage());
        }
    }

    @Operation(summary = "更新模板")
    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS') or @perm.check('SYSTEM_PROCESS_PRESET_CENTER')")
    public Result<Void> update(@PathVariable Long id,
                               @RequestBody ProcessTemplate template) {
        if (!processTemplateService.updateManagedTemplate(id, template)) {
            return Result.error("模板不存在或无权修改");
        }
        return Result.success();
    }

    @Operation(summary = "删除模板")
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS') or @perm.check('SYSTEM_PROCESS_PRESET_CENTER')")
    public Result<Void> delete(@PathVariable Long id) {
        if (!processTemplateService.deleteManagedTemplate(id)) {
            return Result.error("模板不存在或无权删除");
        }
        return Result.success();
    }

    @Operation(summary = "获取最近使用的工艺结构")
    @GetMapping("/last-used")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS') or @perm.check('SYSTEM_PROCESS_PRESET_CENTER')")
    public Result<String> lastUsed() {
        return Result.success(processTemplateService.getLastUsedStructure());
    }
}
