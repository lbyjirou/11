package com.gxyide.pricing.service;

import com.gxyide.pricing.dto.excel.*;
import com.gxyide.pricing.entity.LogisticsPrice;
import com.gxyide.pricing.mapper.LogisticsPriceMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 物流价格导入服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LogisticsImportService {

    private final LogisticsPriceMapper logisticsPriceMapper;
    private final ExcelAnalyzeService excelAnalyzeService;

    @Transactional(rollbackFor = Exception.class)
    public LogisticsImportResultDTO doImport(LogisticsImportRequestDTO request) {
        String fileKey = request.getFileKey();

        ExcelAnalyzeService.AnalyzeContext ctx = excelAnalyzeService.getAnalyzeContext(fileKey);
        if (ctx == null) {
            return LogisticsImportResultDTO.builder()
                    .success(false)
                    .errorMessage("临时文件已过期，请重新上传")
                    .build();
        }

        List<Map<Integer, Object>> rows = excelAnalyzeService.readSheetData(fileKey, 0);
        if (rows.isEmpty()) {
            return LogisticsImportResultDTO.builder()
                    .success(false)
                    .errorMessage("无法读取数据")
                    .build();
        }

        try {
            int insertedCount = 0;
            int updatedCount = 0;
            int failedCount = 0;

            // 清空所有旧数据，只保留新导入的
            int deletedCount = logisticsPriceMapper.delete(null);
            log.info("已清空旧数据 {} 条", deletedCount);

            // 先解析备注区域，获取各公司的散货备注信息
            Map<String, CompanyRemarkInfo> companyRemarks = parseRemarkSection(rows);
            log.info("解析到 {} 个公司的备注信息", companyRemarks.size());

            // 遍历数据行
            for (int i = ctx.dataStartRow; i < rows.size(); i++) {
                Map<Integer, Object> row = rows.get(i);

                String origin = cellToString(row.get(ctx.originCol));
                String dest = cellToString(row.get(ctx.destCol));

                // 跳过无效行
                if (origin.isEmpty() && dest.isEmpty()) continue;
                if (isInvalidLocation(origin) || isInvalidLocation(dest)) continue;

                // 遇到新的区域标识行，重新解析结构
                if (origin.contains("出发地") || dest.contains("到站")) {
                    ExcelAnalyzeService.AnalyzeContext newCtx = parseNewSection(rows, i);
                    if (newCtx != null) {
                        ctx = newCtx;
                        i = ctx.dataStartRow - 1; // 下一轮循环会 +1
                    }
                    // 如果解析失败，继续使用原来的 ctx
                    continue;
                }

                // 为每个物流公司创建记录
                for (Map.Entry<String, Map<String, Integer>> companyEntry : ctx.companyColumns.entrySet()) {
                    String companyName = companyEntry.getKey();
                    Map<String, Integer> vehicleColumns = companyEntry.getValue();

                    try {
                        LogisticsPrice entity = new LogisticsPrice();
                        entity.setOrigin(origin);
                        entity.setDestination(dest);
                        entity.setCompanyName(companyName);
                        entity.setDirection("ALL");
                        entity.setUpdateYear(LocalDateTime.now().getYear());

                        boolean hasPrice = false;
                        for (Map.Entry<String, Integer> vehicle : vehicleColumns.entrySet()) {
                            BigDecimal price = parseBigDecimal(cellToString(row.get(vehicle.getValue())));
                            if (price != null) {
                                hasPrice = true;
                                setPrice(entity, vehicle.getKey(), price);
                            }
                        }

                        if (!hasPrice) continue;

                        // 填充备注信息
                        CompanyRemarkInfo remarkInfo = companyRemarks.get(companyName);
                        if (remarkInfo != null) {
                            entity.setDeliveryFee(remarkInfo.deliveryFee);
                            entity.setScatterRemark(remarkInfo.remark);
                            entity.setDongguanSurcharge(remarkInfo.dongguanSurcharge);
                        }

                        // 直接插入（已清空旧数据，无需查重）
                        entity.setCreateTime(LocalDateTime.now());
                        entity.setUpdateTime(LocalDateTime.now());
                        logisticsPriceMapper.insert(entity);
                        insertedCount++;
                    } catch (Exception e) {
                        log.warn("处理第{}行 {} 数据失败: {}", i + 1, companyName, e.getMessage());
                        failedCount++;
                    }
                }
            }

            excelAnalyzeService.cleanupTempFile(fileKey);

            return LogisticsImportResultDTO.builder()
                    .success(true)
                    .insertedCount(insertedCount)
                    .updatedCount(updatedCount)
                    .failedCount(failedCount)
                    .totalCount(insertedCount + updatedCount + failedCount)
                    .build();

        } catch (Exception e) {
            log.error("导入失败", e);
            return LogisticsImportResultDTO.builder()
                    .success(false)
                    .errorMessage("导入失败: " + e.getMessage())
                    .build();
        }
    }

    private ExcelAnalyzeService.AnalyzeContext parseNewSection(List<Map<Integer, Object>> rows, int startRow) {
        ExcelAnalyzeService.AnalyzeContext ctx = new ExcelAnalyzeService.AnalyzeContext();
        ctx.headerRow = startRow;
        ctx.vehicleTypeRow = startRow - 1;
        ctx.dataStartRow = startRow + 1;

        if (ctx.vehicleTypeRow < 0) return null;

        Map<Integer, Object> headerRow = rows.get(ctx.headerRow);
        Map<Integer, Object> vehicleRow = rows.get(ctx.vehicleTypeRow);

        // 找出发地和到站列
        for (Map.Entry<Integer, Object> cell : headerRow.entrySet()) {
            String text = cellToString(cell.getValue());
            if (text.contains("出发地") || text.contains("出发")) {
                ctx.originCol = cell.getKey();
            } else if (text.contains("到站") || text.contains("目的地")) {
                ctx.destCol = cell.getKey();
            }
        }

        // 先扫描找出所有车型的起始列
        Map<Integer, String> vehicleStartCols = new LinkedHashMap<>();
        for (int col = 0; col < 100; col++) {
            String vehicleText = cellToString(vehicleRow.get(col));
            if (!vehicleText.isEmpty()) {
                String detected = detectVehicleType(vehicleText);
                if (detected != null) {
                    vehicleStartCols.put(col, detected);
                }
            }
        }

        // 检查是否有散货区域（在第一个整车类型之前的公司列）
        int firstTruckCol = vehicleStartCols.isEmpty() ? 100 : vehicleStartCols.keySet().iterator().next();

        // 解析公司列
        String currentVehicle = "";
        for (int col = 0; col < 100; col++) {
            // 更新当前车型
            if (vehicleStartCols.containsKey(col)) {
                currentVehicle = vehicleStartCols.get(col);
            }

            // 特殊处理：如果在第一个整车之前，且还没有车型，假定为散货
            if (currentVehicle.isEmpty() && col >= 2 && col < firstTruckCol) {
                currentVehicle = "price_scatter";
            }

            String companyName = cellToString(headerRow.get(col));
            if (!companyName.isEmpty() && isValidCompanyName(companyName) && !currentVehicle.isEmpty()) {
                ctx.companyColumns.computeIfAbsent(companyName, k -> new LinkedHashMap<>());
                ctx.companyColumns.get(companyName).put(currentVehicle, col);
            }
        }

        log.info("解析新区域: 表头行={}, 数据起始行={}, 公司数={}", ctx.headerRow, ctx.dataStartRow, ctx.companyColumns.size());
        return ctx.companyColumns.isEmpty() ? null : ctx;
    }

    private String detectVehicleType(String text) {
        if (text.contains("散货") || text.contains("立方")) return "price_scatter";
        if (text.contains("4.2")) return "price_4_2m";
        if (text.contains("6.8")) return "price_6_8m";
        if (text.contains("9.6")) return "price_9_6m";
        if (text.contains("13.5") || text.contains("13米")) return "price_13_5m";
        if (text.contains("17.5") || text.contains("17米")) return "price_17_5m";
        if (text.contains("16") && (text.contains("厢") || text.contains("箱"))) return "price_16m_box";
        return null;
    }

    private boolean isValidCompanyName(String name) {
        if (name == null || name.length() < 2 || name.length() > 10) return false;
        String[] invalid = {"出发", "到站", "目的", "运价", "最低", "同比", "整车", "散货",
                           "立方", "元", "年", "价格", "物流线路", "米"};
        for (String kw : invalid) {
            if (name.contains(kw)) return false;
        }
        return true;
    }

    /**
     * 判断是否为无效地名
     */
    private boolean isInvalidLocation(String location) {
        if (location == null || location.isBlank() || location.length() < 2) return true;
        String[] invalidKeywords = {
            "出发", "到站", "目的", "备注", "物流", "线路", "返货", "说明", "价格", "报价",
            "整车", "散货", "运价", "最低", "同比", "终点", "起点", "合计", "总计"
        };
        for (String keyword : invalidKeywords) {
            if (location.contains(keyword)) return true;
        }
        return false;
    }

    private void setPrice(LogisticsPrice entity, String field, BigDecimal price) {
        switch (field) {
            case "price_scatter" -> entity.setPriceScatter(price);
            case "price_4_2m" -> entity.setPrice42m(price);
            case "price_6_8m" -> entity.setPrice68m(price);
            case "price_9_6m" -> entity.setPrice96m(price);
            case "price_13_5m" -> entity.setPrice135m(price);
            case "price_17_5m" -> entity.setPrice175m(price);
            case "price_16m_box" -> entity.setPrice16mBox(price);
        }
    }

    private LogisticsPrice findExisting(String origin, String dest, String companyName) {
        return logisticsPriceMapper.selectOne(new LambdaQueryWrapper<LogisticsPrice>()
                .eq(LogisticsPrice::getOrigin, origin)
                .eq(LogisticsPrice::getDestination, dest)
                .eq(LogisticsPrice::getCompanyName, companyName));
    }

    private BigDecimal parseBigDecimal(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        try {
            String cleaned = value.replaceAll("[^\\d.\\-]", "");
            if (cleaned.isEmpty()) return null;
            BigDecimal result = new BigDecimal(cleaned);
            // 价格范围校验：必须在 0 到 999999 之间，超出范围视为无效数据
            if (result.compareTo(BigDecimal.ZERO) < 0 || result.compareTo(new BigDecimal("999999")) > 0) {
                log.debug("价格超出有效范围，忽略: {}", result);
                return null;
            }
            return result;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String cellToString(Object value) {
        return value == null ? "" : value.toString().trim();
    }

    /**
     * 公司备注信息
     */
    private static class CompanyRemarkInfo {
        BigDecimal deliveryFee;        // 低于10方送货费
        BigDecimal dongguanSurcharge;  // 东莞特殊送货费（从备注解析）
        String remark;                 // 备注
    }

    /**
     * 解析备注区域
     * 结构：备注: | 物流公司 | 低于10立方送货费 | 备注
     */
    private Map<String, CompanyRemarkInfo> parseRemarkSection(List<Map<Integer, Object>> rows) {
        Map<String, CompanyRemarkInfo> result = new HashMap<>();

        // 查找备注区域起始行（包含"备注"且同行有"物流公司"）
        int remarkStartRow = -1;
        int companyCol = -1;
        int deliveryFeeCol = -1;
        int remarkCol = -1;

        for (int i = 0; i < rows.size(); i++) {
            Map<Integer, Object> row = rows.get(i);
            String rowText = rowToString(row);

            if (rowText.contains("备注") && rowText.contains("物流公司")) {
                remarkStartRow = i;
                // 解析列位置
                for (Map.Entry<Integer, Object> cell : row.entrySet()) {
                    String text = cellToString(cell.getValue());
                    if (text.contains("物流公司")) {
                        companyCol = cell.getKey();
                    } else if (text.contains("10立方") || text.contains("送货费")) {
                        deliveryFeeCol = cell.getKey();
                    } else if (text.equals("备注")) {
                        remarkCol = cell.getKey();
                    }
                }
                log.info("找到备注区域: 行={}, 公司列={}, 送货费列={}, 备注列={}",
                        remarkStartRow, companyCol, deliveryFeeCol, remarkCol);
                break;
            }
        }

        if (remarkStartRow < 0 || companyCol < 0) {
            log.info("未找到备注区域");
            return result;
        }

        // 解析备注数据行
        for (int i = remarkStartRow + 1; i < rows.size(); i++) {
            Map<Integer, Object> row = rows.get(i);
            String companyName = cellToString(row.get(companyCol));

            // 遇到空行或非公司名行则结束
            if (companyName.isEmpty() || !isValidCompanyName(companyName)) {
                // 检查是否是结束标记（如"红色表示..."）
                String rowText = rowToString(row);
                if (rowText.contains("红色") || rowText.contains("表示")) {
                    break;
                }
                continue;
            }

            CompanyRemarkInfo info = new CompanyRemarkInfo();
            if (deliveryFeeCol >= 0) {
                info.deliveryFee = parseBigDecimal(cellToString(row.get(deliveryFeeCol)));
            }
            if (remarkCol >= 0) {
                info.remark = cellToString(row.get(remarkCol));
                if (info.remark.isEmpty()) {
                    info.remark = null;
                } else {
                    // 从备注中解析东莞特殊送货费，格式如"东莞台达送货费400/趟"
                    info.dongguanSurcharge = parseDongguanSurcharge(info.remark);
                }
            }

            result.put(companyName, info);
            log.info("解析公司备注: {} -> 送货费={}, 备注={}", companyName, info.deliveryFee,
                    info.remark != null ? info.remark.substring(0, Math.min(20, info.remark.length())) + "..." : "无");
        }

        return result;
    }

    private String rowToString(Map<Integer, Object> row) {
        StringBuilder sb = new StringBuilder();
        row.values().forEach(v -> sb.append(cellToString(v)));
        return sb.toString();
    }

    /** 从备注中解析东莞特殊送货费，格式如"东莞台达送货费400/趟" */
    private static final Pattern DONGGUAN_SURCHARGE_PATTERN = Pattern.compile("东莞.*?送货费(\\d+)");

    private BigDecimal parseDongguanSurcharge(String remark) {
        if (remark == null) return null;
        Matcher matcher = DONGGUAN_SURCHARGE_PATTERN.matcher(remark);
        if (matcher.find()) {
            return new BigDecimal(matcher.group(1));
        }
        return null;
    }
}
