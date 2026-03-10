package com.gxyide.pricing.controller;

import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.entity.BaseSpec;
import com.gxyide.pricing.enums.SpecTypeEnum;
import com.gxyide.pricing.service.SpecService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "规格管理")
@RestController
@RequestMapping("/spec")
@RequiredArgsConstructor
public class SpecController {

    private final SpecService specService;

    @Operation(summary = "获取集流管规格列表")
    @GetMapping("/collector")
    public Result<List<BaseSpec>> listCollector() {
        return Result.success(specService.listByType(SpecTypeEnum.COLLECTOR.getCode()));
    }

    @Operation(summary = "获取翅片规格列表")
    @GetMapping("/fin")
    public Result<List<BaseSpec>> listFin() {
        return Result.success(specService.listByType(SpecTypeEnum.FIN.getCode()));
    }

    @Operation(summary = "获取扁管规格列表")
    @GetMapping("/tube")
    public Result<List<BaseSpec>> listTube() {
        return Result.success(specService.listByType(SpecTypeEnum.TUBE.getCode()));
    }

    @Operation(summary = "获取其他部件规格列表")
    @GetMapping("/component")
    public Result<List<BaseSpec>> listComponent() {
        return Result.success(specService.listByType(SpecTypeEnum.COMPONENT.getCode()));
    }

    @Operation(summary = "新增规格")
    @PostMapping
    @PreAuthorize("@perm.check('SYSTEM_SPEC_MANAGE')")
    public Result<Void> add(@RequestBody BaseSpec spec) {
        specService.save(spec);
        return Result.success();
    }

    @Operation(summary = "更新规格")
    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('SYSTEM_SPEC_MANAGE')")
    public Result<Void> update(@PathVariable Long id, @RequestBody BaseSpec spec) {
        spec.setId(id);
        specService.updateById(spec);
        return Result.success();
    }

    @Operation(summary = "删除规格")
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('SYSTEM_SPEC_MANAGE')")
    public Result<Void> delete(@PathVariable Long id) {
        specService.removeById(id);
        return Result.success();
    }
}
