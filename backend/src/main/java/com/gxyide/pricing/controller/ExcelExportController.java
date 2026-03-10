package com.gxyide.pricing.controller;

import com.gxyide.pricing.service.ExcelFillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

/**
 * Excel 导出接口
 */
@Slf4j
@Tag(name = "Excel导出")
@RestController
@RequestMapping("/export")
@RequiredArgsConstructor
public class ExcelExportController {

    private final ExcelFillService excelFillService;

    /**
     * 导出报价单 Excel（基于模板填充）
     */
    @Operation(summary = "导出报价单Excel")
    @GetMapping("/quote/{orderId}")
    @PreAuthorize("@perm.check('DATA_VIEW_MANAGER')")
    public void exportQuote(@PathVariable Long orderId, HttpServletResponse response) {
        try {
            excelFillService.exportFilledQuote(orderId, response);
        } catch (IOException e) {
            log.error("导出报价单失败: orderId={}", orderId, e);
            throw new RuntimeException("导出失败: " + e.getMessage());
        }
    }
}
