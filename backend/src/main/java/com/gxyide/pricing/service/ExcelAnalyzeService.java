package com.gxyide.pricing.service;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import com.gxyide.pricing.dto.excel.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Excel 智能解析服务 - 物流报价表专用
 */
@Slf4j
@Service
public class ExcelAnalyzeService {

    private final Map<String, String> tempFileCache = new ConcurrentHashMap<>();

    // 车型关键词
    private static final Map<String, List<String>> VEHICLE_KEYWORDS = new LinkedHashMap<>();
    static {
        VEHICLE_KEYWORDS.put("price_scatter", Arrays.asList("散货", "立方", "零担"));
        VEHICLE_KEYWORDS.put("price_4_2m", Arrays.asList("4.2米", "4.2m", "4米2"));
        VEHICLE_KEYWORDS.put("price_6_8m", Arrays.asList("6.8米", "6.8m", "6米8"));
        VEHICLE_KEYWORDS.put("price_9_6m", Arrays.asList("9.6米", "9.6m", "9米6"));
        VEHICLE_KEYWORDS.put("price_13_5m", Arrays.asList("13.5米", "13.5m", "13米"));
        VEHICLE_KEYWORDS.put("price_17_5m", Arrays.asList("17.5米", "17.5m", "17米"));
        VEHICLE_KEYWORDS.put("price_16m_box", Arrays.asList("16米厢", "16米箱", "厢车", "箱车"));
    }

    public ExcelAnalyzeResultDTO analyze(MultipartFile file) {
        try {
            String fileKey = UUID.randomUUID().toString();
            Path tempPath = Files.createTempFile("logistics_", ".xlsx");
            file.transferTo(tempPath.toFile());
            tempFileCache.put(fileKey, tempPath.toString());

            List<Map<Integer, Object>> rows = readSheet(tempPath.toFile(), 0);
            AnalyzeContext ctx = parseStructure(rows);

            if (ctx == null || ctx.companyColumns.isEmpty()) {
                return ExcelAnalyzeResultDTO.builder()
                        .success(false)
                        .recognized(false)
                        .errorMessage("无法识别表格结构")
                        .build();
            }

            List<Map<String, Object>> previewData = generatePreview(rows, ctx);

            RegionMappingDTO region = RegionMappingDTO.builder()
                    .direction("ALL")
                    .directionLabel("全部数据")
                    .sheetName("Sheet1")
                    .sheetIndex(0)
                    .headerRow(ctx.headerRow + 1)
                    .dataStartRow(ctx.dataStartRow + 1)
                    .dataEndRow(rows.size())
                    .columnMapping(buildColumnMapping(ctx))
                    .previewData(previewData)
                    .totalRows(rows.size() - ctx.dataStartRow)
                    .build();

            return ExcelAnalyzeResultDTO.builder()
                    .success(true)
                    .recognized(true)
                    .fileKey(fileKey)
                    .fileName(file.getOriginalFilename())
                    .regions(Collections.singletonList(region))
                    .unmappedColumns(new ArrayList<>())
                    .sheetNames(Collections.singletonList("Sheet1"))
                    .build();

        } catch (Exception e) {
            log.error("Excel解析失败", e);
            return ExcelAnalyzeResultDTO.builder()
                    .success(false)
                    .recognized(false)
                    .errorMessage("解析失败: " + e.getMessage())
                    .build();
        }
    }

    public String getTempFilePath(String fileKey) {
        return tempFileCache.get(fileKey);
    }

    public void cleanupTempFile(String fileKey) {
        String path = tempFileCache.remove(fileKey);
        if (path != null) {
            try {
                Files.deleteIfExists(Path.of(path));
            } catch (IOException e) {
                log.warn("清理临时文件失败: {}", path);
            }
        }
    }

    // 解析上下文
    public static class AnalyzeContext {
        int vehicleTypeRow = -1;  // 车型行
        int headerRow = -1;       // 表头行（含出发地、到站、公司名）
        int dataStartRow = -1;    // 数据起始行
        int originCol = -1;       // 出发地列
        int destCol = -1;         // 到站列
        // companyColumns: key=公司名, value=Map<车型字段名, 列索引>
        Map<String, Map<String, Integer>> companyColumns = new LinkedHashMap<>();
    }

    private AnalyzeContext parseStructure(List<Map<Integer, Object>> rows) {
        AnalyzeContext ctx = new AnalyzeContext();

        // 查找表头行（包含"出发地"或"到站"的行）
        for (int i = 0; i < Math.min(rows.size(), 20); i++) {
            String rowText = rowToString(rows.get(i));
            if (rowText.contains("出发地") || rowText.contains("到站")) {
                ctx.headerRow = i;
                ctx.vehicleTypeRow = i - 1;
                ctx.dataStartRow = i + 1;
                break;
            }
        }

        if (ctx.headerRow < 0 || ctx.vehicleTypeRow < 0) {
            return null;
        }

        Map<Integer, Object> headerRow = rows.get(ctx.headerRow);
        Map<Integer, Object> vehicleRow = rows.get(ctx.vehicleTypeRow);

        // 找出发地和到站列
        for (Map.Entry<Integer, Object> cell : headerRow.entrySet()) {
            String text = cellToString(cell.getValue());
            if (text.contains("出发地") || text.contains("出发")) {
                ctx.originCol = cell.getKey();
            } else if (text.contains("到站") || text.contains("目的地") || text.contains("终点")) {
                ctx.destCol = cell.getKey();
            }
        }

        // 解析车型和公司列
        // 先扫描一遍找出所有车型的起始列
        Map<Integer, String> vehicleStartCols = new LinkedHashMap<>();
        for (int col = 0; col < 100; col++) {
            String vehicleText = cellToString(vehicleRow.get(col));
            if (!vehicleText.isEmpty()) {
                String detected = detectVehicleType(vehicleText);
                if (detected != null) {
                    vehicleStartCols.put(col, detected);
                    log.info("列{}: 识别到车型 {} <- {}", col, detected, vehicleText);
                }
            }
        }

        // 检查是否有散货区域（在第一个整车类型之前的公司列）
        int firstTruckCol = vehicleStartCols.isEmpty() ? 100 : vehicleStartCols.keySet().iterator().next();

        // 扫描公司列，根据位置判断属于哪个车型
        String currentVehicle = "";
        for (int col = 0; col < 100; col++) {
            String companyName = cellToString(headerRow.get(col));

            // 调试日志：打印前20列的内容
            if (col < 20) {
                String vehicleText = cellToString(vehicleRow.get(col));
                log.info("列{}: 车型行=[{}], 公司行=[{}]", col, vehicleText, companyName);
            }

            // 更新当前车型
            if (vehicleStartCols.containsKey(col)) {
                currentVehicle = vehicleStartCols.get(col);
            }

            // 特殊处理：如果在第一个整车之前，且还没有车型，假定为散货
            if (currentVehicle.isEmpty() && col >= 2 && col < firstTruckCol) {
                currentVehicle = "price_scatter";
            }

            // 检查公司名
            if (!companyName.isEmpty() && isValidCompanyName(companyName) && !currentVehicle.isEmpty()) {
                ctx.companyColumns.computeIfAbsent(companyName, k -> new LinkedHashMap<>());
                ctx.companyColumns.get(companyName).put(currentVehicle, col);
            }
        }

        log.info("解析结果: 车型行={}, 表头行={}, 数据起始行={}, 出发地列={}, 到站列={}, 公司数={}",
                ctx.vehicleTypeRow, ctx.headerRow, ctx.dataStartRow, ctx.originCol, ctx.destCol,
                ctx.companyColumns.size());

        return ctx;
    }

    private String detectVehicleType(String text) {
        for (Map.Entry<String, List<String>> entry : VEHICLE_KEYWORDS.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (text.contains(keyword)) {
                    return entry.getKey();
                }
            }
        }
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

    private Map<String, ColumnMappingDTO> buildColumnMapping(AnalyzeContext ctx) {
        Map<String, ColumnMappingDTO> mapping = new LinkedHashMap<>();

        mapping.put("origin", ColumnMappingDTO.builder()
                .index(ctx.originCol).header("出发地").fieldName("origin").confidence("HIGH").build());
        mapping.put("destination", ColumnMappingDTO.builder()
                .index(ctx.destCol).header("到站").fieldName("destination").confidence("HIGH").build());

        // 添加公司-车型映射信息（存储在特殊字段中）
        int idx = 0;
        for (Map.Entry<String, Map<String, Integer>> company : ctx.companyColumns.entrySet()) {
            for (Map.Entry<String, Integer> vehicle : company.getValue().entrySet()) {
                String key = "company_" + idx++;
                mapping.put(key, ColumnMappingDTO.builder()
                        .index(vehicle.getValue())
                        .header(company.getKey() + "-" + vehicle.getKey())
                        .fieldName(vehicle.getKey())
                        .confidence("HIGH")
                        .build());
            }
        }

        return mapping;
    }

    private List<Map<String, Object>> generatePreview(List<Map<Integer, Object>> rows, AnalyzeContext ctx) {
        List<Map<String, Object>> preview = new ArrayList<>();

        log.info("生成预览: dataStartRow={}, originCol={}, destCol={}, totalRows={}",
                ctx.dataStartRow, ctx.originCol, ctx.destCol, rows.size());

        // 构建列索引到字段名的映射（与 columnMapping 的 key 一致）
        Map<Integer, String> colToField = new LinkedHashMap<>();
        colToField.put(ctx.originCol, "origin");
        colToField.put(ctx.destCol, "destination");
        int idx = 0;
        for (Map.Entry<String, Map<String, Integer>> company : ctx.companyColumns.entrySet()) {
            for (Map.Entry<String, Integer> vehicle : company.getValue().entrySet()) {
                colToField.put(vehicle.getValue(), "company_" + idx++);
            }
        }

        for (int i = ctx.dataStartRow; i < rows.size(); i++) {
            Map<Integer, Object> row = rows.get(i);
            String origin = cellToString(row.get(ctx.originCol));
            String dest = cellToString(row.get(ctx.destCol));

            if (i < ctx.dataStartRow + 3) {
                log.info("第{}行: origin={}, dest={}", i, origin, dest);
            }

            if (origin.isEmpty() && dest.isEmpty()) continue;
            if (origin.contains("返货") || dest.contains("返货")) continue;

            Map<String, Object> previewRow = new LinkedHashMap<>();
            for (Map.Entry<Integer, String> entry : colToField.entrySet()) {
                previewRow.put(entry.getValue(), cellToString(row.get(entry.getKey())));
            }

            preview.add(previewRow);
        }

        log.info("生成预览数据 {} 条", preview.size());
        return preview;
    }

    private List<Map<Integer, Object>> readSheet(File file, int sheetIndex) {
        List<Map<Integer, Object>> rows = new ArrayList<>();
        EasyExcel.read(file, new ReadListener<Map<Integer, Object>>() {
            @Override
            public void invoke(Map<Integer, Object> row, AnalysisContext context) {
                rows.add(new LinkedHashMap<>(row));
            }
            @Override
            public void doAfterAllAnalysed(AnalysisContext context) {}
        }).sheet(sheetIndex).doRead();
        return rows;
    }

    private String cellToString(Object value) {
        return value == null ? "" : value.toString().trim();
    }

    private String rowToString(Map<Integer, Object> row) {
        StringBuilder sb = new StringBuilder();
        row.values().forEach(v -> sb.append(cellToString(v)));
        return sb.toString();
    }

    // 暴露给 ImportService 使用
    public AnalyzeContext getAnalyzeContext(String fileKey) {
        String path = tempFileCache.get(fileKey);
        if (path == null) return null;
        List<Map<Integer, Object>> rows = readSheet(new File(path), 0);
        return parseStructure(rows);
    }

    public List<Map<Integer, Object>> readSheetData(String fileKey, int sheetIndex) {
        String path = tempFileCache.get(fileKey);
        if (path == null) return Collections.emptyList();
        return readSheet(new File(path), sheetIndex);
    }
}
