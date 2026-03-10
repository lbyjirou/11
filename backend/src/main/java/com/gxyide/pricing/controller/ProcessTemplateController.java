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

@Tag(name = "工艺模版管理")
@RestController
@RequestMapping("/process-template")
@RequiredArgsConstructor
public class ProcessTemplateController {

    private final ProcessTemplateService processTemplateService;

    @Operation(summary = "获取当前用户的模版列表")
    @GetMapping("/list")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<List<ProcessTemplate>> list() {
        return Result.success(processTemplateService.listByCurrentUser());
    }

    @Operation(summary = "创建模版")
    @PostMapping
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<Void> create(@RequestBody ProcessTemplate template) {
        processTemplateService.createTemplate(template);
        return Result.success();
    }

    @Operation(summary = "更新模版")
    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<Void> update(@PathVariable Long id,
                               @RequestBody ProcessTemplate template) {
        if (!processTemplateService.updateOwnTemplate(id, template)) {
            return Result.error("模版不存在或无权修改");
        }
        return Result.success();
    }

    @Operation(summary = "删除模版")
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<Void> delete(@PathVariable Long id) {
        if (!processTemplateService.deleteOwnTemplate(id)) {
            return Result.error("模版不存在或无权删除");
        }
        return Result.success();
    }

    @Operation(summary = "获取上次使用的工艺结构")
    @GetMapping("/last-used")
    @PreAuthorize("@perm.check('TAB_EDIT_PROCESS')")
    public Result<String> lastUsed() {
        return Result.success(processTemplateService.getLastUsedStructure());
    }
}
