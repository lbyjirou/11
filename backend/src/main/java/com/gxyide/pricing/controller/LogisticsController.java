package com.gxyide.pricing.controller;

import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.dto.excel.ExcelAnalyzeResultDTO;
import com.gxyide.pricing.dto.excel.LogisticsImportRequestDTO;
import com.gxyide.pricing.dto.excel.LogisticsImportResultDTO;
import com.gxyide.pricing.entity.LogisticsPrice;
import com.gxyide.pricing.service.ExcelAnalyzeService;
import com.gxyide.pricing.service.LogisticsImportService;
import com.gxyide.pricing.service.LogisticsService;
import com.gxyide.pricing.vo.LogisticsQuoteVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Tag(name = "物流管理")
@RestController
@RequestMapping("/logistics")
@RequiredArgsConstructor
public class LogisticsController {

    private final LogisticsService logisticsService;
    private final ExcelAnalyzeService excelAnalyzeService;
    private final LogisticsImportService logisticsImportService;

    @Operation(summary = "获取送货目的地列表")
    @GetMapping("/outbound/destinations")
    public Result<List<String>> listOutboundDestinations() {
        return Result.success(logisticsService.listOutboundDestinations());
    }

    @Operation(summary = "获取返货出发地列表")
    @GetMapping("/inbound/origins")
    public Result<List<String>> listInboundOrigins() {
        return Result.success(logisticsService.listInboundOrigins());
    }

    @Operation(summary = "送货智能比价", description = "根据目的地和体积计算最优物流方案")
    @GetMapping("/outbound/quote")
    public Result<LogisticsQuoteVO> calculateOutboundQuote(
            @RequestParam String destination,
            @RequestParam BigDecimal volume) {
        return Result.success(logisticsService.calculateOutboundQuote(destination, volume));
    }

    @Operation(summary = "返货智能比价", description = "根据出发地和体积计算最优物流方案")
    @GetMapping("/inbound/quote")
    public Result<LogisticsQuoteVO> calculateInboundQuote(
            @RequestParam String origin,
            @RequestParam BigDecimal volume) {
        return Result.success(logisticsService.calculateInboundQuote(origin, volume));
    }

    @Operation(summary = "根据目的地获取送货价格列表")
    @GetMapping("/outbound/prices")
    public Result<List<LogisticsPrice>> listOutboundPrices(@RequestParam String destination) {
        return Result.success(logisticsService.listOutboundByDestination(destination));
    }

    @Operation(summary = "根据出发地获取返货价格列表")
    @GetMapping("/inbound/prices")
    public Result<List<LogisticsPrice>> listInboundPrices(@RequestParam String origin) {
        return Result.success(logisticsService.listInboundByOrigin(origin));
    }

    @Operation(summary = "获取目的地列表（兼容旧接口）")
    @GetMapping("/destinations")
    @Deprecated
    public Result<List<String>> listDestinations() {
        return Result.success(logisticsService.listDestinations());
    }

    @Operation(summary = "根据目的地获取物流价格（兼容旧接口）")
    @GetMapping("/prices")
    @Deprecated
    public Result<List<LogisticsPrice>> listByDestination(@RequestParam String destination) {
        return Result.success(logisticsService.listByDestination(destination));
    }

    @Operation(summary = "智能物流比价（兼容旧接口）")
    @GetMapping("/quote")
    @Deprecated
    public Result<LogisticsQuoteVO> calculateQuote(
            @RequestParam String destination,
            @RequestParam BigDecimal volume) {
        return Result.success(logisticsService.calculateBestQuote(destination, volume));
    }

    @Operation(summary = "解析物流价格Excel", description = "上传Excel文件，自动识别格式并返回预览数据")
    @PostMapping("/analyze")
    @PreAuthorize("@perm.check('TAB_EDIT_LOGISTICS')")
    public Result<ExcelAnalyzeResultDTO> analyzeExcel(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Result.error("请选择文件");
        }
        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
            return Result.error("仅支持 .xlsx 或 .xls 格式的文件");
        }
        return Result.success(excelAnalyzeService.analyze(file));
    }

    @Operation(summary = "确认导入物流价格", description = "根据用户确认的映射关系执行导入")
    @PostMapping("/import")
    @PreAuthorize("@perm.check('TAB_EDIT_LOGISTICS')")
    public Result<LogisticsImportResultDTO> importExcel(@RequestBody LogisticsImportRequestDTO request) {
        if (request.getFileKey() == null || request.getFileKey().isEmpty()) {
            return Result.error("缺少文件标识");
        }
        if (request.getRegions() == null || request.getRegions().isEmpty()) {
            return Result.error("缺少区域映射配置");
        }
        return Result.success(logisticsImportService.doImport(request));
    }

    @Operation(summary = "获取物流数据有效期信息")
    @GetMapping("/expire-info")
    public Result<Map<String, Object>> getExpireInfo() {
        return Result.success(logisticsService.getDataExpireInfo());
    }

    @Operation(summary = "删除过期物流数据")
    @DeleteMapping("/expired")
    @PreAuthorize("@perm.check('SYSTEM_LOGISTICS_IMPORT')")
    public Result<Integer> deleteExpiredData() {
        return Result.success(logisticsService.deleteExpiredData());
    }
}
