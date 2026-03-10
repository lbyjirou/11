package com.gxyide.pricing.controller;

import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.dto.BinPackingRequestDTO;
import com.gxyide.pricing.dto.SolutionEditRequestDTO;
import com.gxyide.pricing.service.BinPackingService;
import com.gxyide.pricing.vo.BinPackingSolutionVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "装箱计算")
@RestController
@RequestMapping("/bin-packing")
@RequiredArgsConstructor
public class BinPackingController {

    private final BinPackingService binPackingService;

    @Operation(summary = "计算装箱方案")
    @PostMapping("/calculate")
    @PreAuthorize("@perm.check('DATA_VIEW_LOGISTICS')")
    public Result<List<BinPackingSolutionVO>> calculate(@RequestBody BinPackingRequestDTO request) {
        return Result.success(binPackingService.calculate(request));
    }

    @Operation(summary = "方案编辑后重新计算")
    @PostMapping("/recalculate")
    @PreAuthorize("@perm.check('TAB_EDIT_LOGISTICS')")
    public Result<BinPackingSolutionVO> recalculate(@RequestBody SolutionEditRequestDTO request) {
        return Result.success(binPackingService.recalculate(request));
    }
}
