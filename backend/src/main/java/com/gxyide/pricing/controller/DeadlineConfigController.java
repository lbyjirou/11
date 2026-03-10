package com.gxyide.pricing.controller;

import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.service.DeadlineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "交期配置（管理员）")
@RestController
@RequestMapping("/admin/deadline")
@RequiredArgsConstructor
public class DeadlineConfigController {

    private final DeadlineService deadlineService;

    @Operation(summary = "获取交期配置")
    @GetMapping("/config")
    @PreAuthorize("@perm.check('SYSTEM_CONFIG')")
    public Result<Map<String, String>> getConfig() {
        return Result.success(deadlineService.getConfig());
    }

    @Operation(summary = "保存交期配置")
    @PostMapping("/config")
    @PreAuthorize("@perm.check('SYSTEM_CONFIG')")
    public Result<Void> saveConfig(@RequestBody Map<String, String> config) {
        deadlineService.saveConfig(config);
        return Result.success();
    }
}
