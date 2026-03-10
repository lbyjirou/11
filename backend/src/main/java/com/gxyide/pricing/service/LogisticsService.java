package com.gxyide.pricing.service;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.event.AnalysisEventListener;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.entity.LogisticsPrice;
import com.gxyide.pricing.mapper.LogisticsPriceMapper;
import com.gxyide.pricing.vo.LogisticsQuoteVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Year;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
public class LogisticsService extends ServiceImpl<LogisticsPriceMapper, LogisticsPrice> {

    private static final String DIRECTION_OUTBOUND = "OUTBOUND";  // 送货：柳州→各地
    private static final String DIRECTION_INBOUND = "INBOUND";    // 返货：各地→柳州
    private static final String DEFAULT_ORIGIN = "柳州";
    private static final int DATA_EXPIRE_DAYS = 30;

    /**
     * 获取物流数据有效期信息
     */
    public Map<String, Object> getDataExpireInfo() {
        LogisticsPrice latest = getOne(new LambdaQueryWrapper<LogisticsPrice>()
                .orderByDesc(LogisticsPrice::getUpdateTime)
                .last("LIMIT 1"));

        Map<String, Object> result = new HashMap<>();
        if (latest == null || latest.getUpdateTime() == null) {
            result.put("hasData", false);
            return result;
        }

        LocalDateTime importTime = latest.getUpdateTime();
        LocalDateTime expireTime = importTime.plusDays(DATA_EXPIRE_DAYS);
        boolean expired = LocalDateTime.now().isAfter(expireTime);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        result.put("hasData", true);
        result.put("importTime", importTime.format(formatter));
        result.put("expireTime", expireTime.format(formatter));
        result.put("expired", expired);
        result.put("daysRemaining", expired ? 0 :
                java.time.Duration.between(LocalDateTime.now(), expireTime).toDays());

        return result;
    }

    /**
     * 删除过期数据（30天前导入的数据）
     */
    public int deleteExpiredData() {
        LocalDateTime expireDate = LocalDateTime.now().minusDays(DATA_EXPIRE_DAYS);
        int count = (int) count(new LambdaQueryWrapper<LogisticsPrice>()
                .lt(LogisticsPrice::getUpdateTime, expireDate));
        if (count > 0) {
            remove(new LambdaQueryWrapper<LogisticsPrice>()
                    .lt(LogisticsPrice::getUpdateTime, expireDate));
            log.info("已删除 {} 条过期物流数据", count);
        }
        return count;
    }

    /**
     * 获取所有目的地列表（送货：柳州→各地）
     */
    public List<String> listOutboundDestinations() {
        return list(new LambdaQueryWrapper<LogisticsPrice>()
                .select(LogisticsPrice::getDestination)
                .isNotNull(LogisticsPrice::getDestination)
                .ne(LogisticsPrice::getDestination, "")
                .ne(LogisticsPrice::getDestination, DEFAULT_ORIGIN)
                .groupBy(LogisticsPrice::getDestination))
                .stream()
                .map(LogisticsPrice::getDestination)
                .filter(d -> d != null && !d.isEmpty())
                .toList();
    }

    /**
     * 获取所有出发地列表（返货：各地→柳州）
     */
    public List<String> listInboundOrigins() {
        return list(new LambdaQueryWrapper<LogisticsPrice>()
                .select(LogisticsPrice::getOrigin)
                .isNotNull(LogisticsPrice::getOrigin)
                .ne(LogisticsPrice::getOrigin, "")
                .ne(LogisticsPrice::getOrigin, DEFAULT_ORIGIN)
                .groupBy(LogisticsPrice::getOrigin))
                .stream()
                .map(LogisticsPrice::getOrigin)
                .filter(o -> o != null && !o.isEmpty())
                .toList();
    }

    /**
     * @deprecated 使用 listOutboundDestinations 或 listInboundOrigins 替代
     */
    @Deprecated
    public List<String> listDestinations() {
        return listOutboundDestinations();
    }

    /**
     * 根据目的地查询价格（不再区分方向）
     */
    public List<LogisticsPrice> listOutboundByDestination(String destination) {
        return list(new LambdaQueryWrapper<LogisticsPrice>()
                .eq(LogisticsPrice::getDestination, destination));
    }

    /**
     * 根据出发地查询价格（不再区分方向）
     */
    public List<LogisticsPrice> listInboundByOrigin(String origin) {
        return list(new LambdaQueryWrapper<LogisticsPrice>()
                .eq(LogisticsPrice::getOrigin, origin));
    }

    /**
     * @deprecated 使用 listOutboundByDestination 或 listInboundByOrigin 替代
     */
    @Deprecated
    public List<LogisticsPrice> listByDestination(String destination) {
        return listOutboundByDestination(destination);
    }

    /**
     * 计算送货最优报价
     * @param destination 目的地
     * @param volume 体积（立方米），用于散货计费
     */
    public LogisticsQuoteVO calculateOutboundQuote(String destination, BigDecimal volume) {
        List<LogisticsPrice> prices = listOutboundByDestination(destination);
        return buildQuoteVO(prices, DIRECTION_OUTBOUND, DEFAULT_ORIGIN, destination, volume);
    }

    /**
     * 计算返货最优报价
     * @param origin 出发地
     * @param volume 体积（立方米），用于散货计费
     */
    public LogisticsQuoteVO calculateInboundQuote(String origin, BigDecimal volume) {
        List<LogisticsPrice> prices = listInboundByOrigin(origin);
        return buildQuoteVO(prices, DIRECTION_INBOUND, origin, DEFAULT_ORIGIN, volume);
    }

    private LogisticsQuoteVO buildQuoteVO(List<LogisticsPrice> prices, String direction,
                                           String origin, String destination, BigDecimal volume) {
        if (prices.isEmpty()) {
            return null;
        }

        List<LogisticsQuoteVO.QuoteOption> options = new ArrayList<>();

        for (LogisticsPrice price : prices) {
            // 散货：按立方计费
            if (price.getPriceScatter() != null) {
                BigDecimal scatterCost = price.getPriceScatter().multiply(volume);
                if (price.getMinChargeVal() != null && scatterCost.compareTo(price.getMinChargeVal()) < 0) {
                    scatterCost = price.getMinChargeVal();
                }
                options.add(LogisticsQuoteVO.QuoteOption.builder()
                        .company(price.getCompanyName())
                        .type("散货")
                        .price(scatterCost.setScale(2, RoundingMode.HALF_UP))
                        .build());
            }

            // 整车：固定价格
            addTruckOption(options, price.getCompanyName(), "4.2米", price.getPrice42m());
            addTruckOption(options, price.getCompanyName(), "6.8米", price.getPrice68m());
            addTruckOption(options, price.getCompanyName(), "9.6米", price.getPrice96m());
            addTruckOption(options, price.getCompanyName(), "13.5米", price.getPrice135m());
            addTruckOption(options, price.getCompanyName(), "17.5米", price.getPrice175m());
            addTruckOption(options, price.getCompanyName(), "16米厢车", price.getPrice16mBox());
        }

        options.sort(Comparator.comparing(LogisticsQuoteVO.QuoteOption::getPrice));

        LogisticsQuoteVO.QuoteOption best = options.isEmpty() ? null : options.get(0);

        return LogisticsQuoteVO.builder()
                .direction(direction)
                .origin(origin)
                .destination(destination)
                .volume(volume)
                .recommended(best)
                .allOptions(options)
                .build();
    }

    /**
     * @deprecated 使用 calculateOutboundQuote 或 calculateInboundQuote 替代
     */
    @Deprecated
    public LogisticsQuoteVO calculateBestQuote(String destination, BigDecimal volume) {
        return calculateOutboundQuote(destination, volume);
    }

    private void addTruckOption(List<LogisticsQuoteVO.QuoteOption> options, String company,
                                String type, BigDecimal price) {
        if (price != null && price.compareTo(BigDecimal.ZERO) > 0) {
            options.add(LogisticsQuoteVO.QuoteOption.builder()
                    .company(company)
                    .type(type + "整车")
                    .price(price)
                    .build());
        }
    }

    private BigDecimal parseBigDecimal(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String cleaned = value.trim().replaceAll("[^0-9.]", "");
        if (cleaned.isEmpty()) {
            return null;
        }
        try {
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean isValidCompanyName(String name) {
        if (name == null || name.isBlank() || name.length() < 2) return false;
        String[] invalidKeywords = {
            "出发", "到站", "目的", "运价", "最低", "同比", "整车", "散货", "立方", "元"
        };
        for (String keyword : invalidKeywords) {
            if (name.contains(keyword)) return false;
        }
        return true;
    }

    /**
     * 导入横向汇总表格式的 Excel
     * 结构：
     * - 送货区域（第5行开始）：B列=目的地，柳州→各地
     * - 返货区域（"返货"标题行之后）：A列=出发地，各地→柳州
     */
    public int importFromExcel(MultipartFile file) throws IOException {
        int currentYear = Year.now().getValue();
        byte[] fileBytes = file.getBytes();

        List<Map<Integer, String>> allRows = new ArrayList<>();

        EasyExcel.read(new ByteArrayInputStream(fileBytes), new AnalysisEventListener<Map<Integer, String>>() {
            @Override
            public void invoke(Map<Integer, String> row, AnalysisContext context) {
                allRows.add(row);
            }
            @Override
            public void doAfterAllAnalysed(AnalysisContext context) {}
        }).sheet(0).headRowNumber(0).doRead();

        if (allRows.size() < 5) {
            log.warn("Excel 数据行数不足");
            return 0;
        }

        // 解析送货区域的列结构（第3-4行）
        Map<String, Map<String, Integer>> outboundCompanyColumnMap = parseCompanyColumns(allRows, 2, 3);
        log.info("送货区域解析到 {} 个物流公司: {}", outboundCompanyColumnMap.size(), outboundCompanyColumnMap.keySet());

        // 查找返货区域起始行（含"返货"关键词的行）
        int inboundStartRow = -1;
        int inboundHeaderRow = -1;
        for (int i = 4; i < allRows.size(); i++) {
            Map<Integer, String> row = allRows.get(i);
            for (Map.Entry<Integer, String> cell : row.entrySet()) {
                String cellValue = cell.getValue();
                if (cellValue != null && cellValue.contains("返货")) {
                    inboundHeaderRow = i;
                    log.info("找到返货标识行: 第{}行", i + 1);
                    break;
                }
            }
            if (inboundHeaderRow > 0) break;
        }

        // 返货区域：从标识行往下找第一个有效数据行
        // 跳过标题行（大类标题、公司名称等），找到第一个A列有城市名的行
        if (inboundHeaderRow > 0) {
            for (int i = inboundHeaderRow + 1; i < allRows.size(); i++) {
                String cellA = allRows.get(i).get(0);
                if (cellA != null && !cellA.isBlank() && !isInvalidLocation(cellA)) {
                    inboundStartRow = i;
                    log.info("返货数据起始行: 第{}行, 首个城市: {}", i + 1, cellA);
                    break;
                }
            }
        }

        List<LogisticsPrice> allEntities = new ArrayList<>();

        // 处理送货数据（第5行到返货区域之前）
        int outboundEndRow = inboundHeaderRow > 0 ? inboundHeaderRow : allRows.size();
        for (int rowIdx = 4; rowIdx < outboundEndRow; rowIdx++) {
            Map<Integer, String> row = allRows.get(rowIdx);
            String destination = row.get(1);  // B列是目的地

            if (isInvalidLocation(destination)) continue;
            final String dest = destination.trim();

            for (Map.Entry<String, Map<String, Integer>> entry : outboundCompanyColumnMap.entrySet()) {
                LogisticsPrice price = createPriceEntity(row, entry.getKey(), entry.getValue(),
                        DIRECTION_OUTBOUND, DEFAULT_ORIGIN, dest, currentYear);
                if (price != null) allEntities.add(price);
            }
        }
        log.info("送货数据解析完成，共 {} 条", allEntities.size());

        // 处理返货数据（复用送货区域的列结构，因为列位置完全一致）
        if (inboundStartRow > 0) {
            for (int rowIdx = inboundStartRow; rowIdx < allRows.size(); rowIdx++) {
                Map<Integer, String> row = allRows.get(rowIdx);
                String origin = row.get(0);  // A列是出发地（返货时）

                if (isInvalidLocation(origin)) continue;
                final String orig = origin.trim();

                // 复用送货区域的列结构
                for (Map.Entry<String, Map<String, Integer>> entry : outboundCompanyColumnMap.entrySet()) {
                    LogisticsPrice price = createPriceEntity(row, entry.getKey(), entry.getValue(),
                            DIRECTION_INBOUND, orig, DEFAULT_ORIGIN, currentYear);
                    if (price != null) allEntities.add(price);
                }
            }
            log.info("返货数据解析完成，总计 {} 条", allEntities.size());
        }

        if (!allEntities.isEmpty()) {
            remove(new LambdaQueryWrapper<LogisticsPrice>().eq(LogisticsPrice::getUpdateYear, currentYear));
            saveBatch(allEntities);
            log.info("成功导入 {} 条物流价格数据", allEntities.size());
        }

        return allEntities.size();
    }

    /**
     * 解析物流公司列结构
     * @param allRows 所有行数据
     * @param categoryRowIdx 大类标题行索引（散货、4.2米整车等）
     * @param companyRowIdx 物流公司名称行索引
     */
    private Map<String, Map<String, Integer>> parseCompanyColumns(List<Map<Integer, String>> allRows,
                                                                   int categoryRowIdx, int companyRowIdx) {
        Map<String, Map<String, Integer>> companyColumnMap = new LinkedHashMap<>();
        Map<Integer, String> categoryRow = allRows.get(categoryRowIdx);
        Map<Integer, String> companyRow = allRows.get(companyRowIdx);

        String currentCategory = "";
        for (int col = 2; col < 100; col++) {
            String category = categoryRow.get(col);
            String company = companyRow.get(col);

            if (category != null && !category.isBlank()) {
                currentCategory = category.trim();
            }

            if (company != null && isValidCompanyName(company)) {
                String companyName = company.trim();
                companyColumnMap.computeIfAbsent(companyName, k -> new HashMap<>());

                String priceType = detectPriceType(currentCategory);
                if (!priceType.isEmpty()) {
                    companyColumnMap.get(companyName).put(priceType, col);
                }
            }
        }
        return companyColumnMap;
    }

    private String detectPriceType(String category) {
        if (category.contains("散货")) return "scatter";
        if (category.contains("4.2") || category.contains("4．2")) return "42m";
        if (category.contains("6.8") || category.contains("6．8")) return "68m";
        if (category.contains("9.6") || category.contains("9．6")) return "96m";
        if (category.contains("13.5") || category.contains("13．5")) return "135m";
        if (category.contains("17.5") || category.contains("17．5")) return "175m";
        if (category.contains("16") && category.contains("厢")) return "16mBox";
        return "";
    }

    private LogisticsPrice createPriceEntity(Map<Integer, String> row, String companyName,
                                              Map<String, Integer> priceColumns,
                                              String direction, String origin, String destination,
                                              int updateYear) {
        LogisticsPrice price = new LogisticsPrice();
        price.setDirection(direction);
        price.setOrigin(origin);
        price.setDestination(destination);
        price.setCompanyName(companyName);
        price.setUpdateYear(updateYear);

        if (priceColumns.containsKey("scatter")) {
            price.setPriceScatter(parseBigDecimal(row.get(priceColumns.get("scatter"))));
        }
        if (priceColumns.containsKey("42m")) {
            price.setPrice42m(parseBigDecimal(row.get(priceColumns.get("42m"))));
        }
        if (priceColumns.containsKey("68m")) {
            price.setPrice68m(parseBigDecimal(row.get(priceColumns.get("68m"))));
        }
        if (priceColumns.containsKey("96m")) {
            price.setPrice96m(parseBigDecimal(row.get(priceColumns.get("96m"))));
        }
        if (priceColumns.containsKey("135m")) {
            price.setPrice135m(parseBigDecimal(row.get(priceColumns.get("135m"))));
        }
        if (priceColumns.containsKey("175m")) {
            price.setPrice175m(parseBigDecimal(row.get(priceColumns.get("175m"))));
        }
        if (priceColumns.containsKey("16mBox")) {
            price.setPrice16mBox(parseBigDecimal(row.get(priceColumns.get("16mBox"))));
        }

        // 只返回有价格数据的记录
        if (price.getPriceScatter() != null || price.getPrice42m() != null ||
            price.getPrice68m() != null || price.getPrice96m() != null ||
            price.getPrice135m() != null || price.getPrice175m() != null ||
            price.getPrice16mBox() != null) {
            return price;
        }
        return null;
    }

    private boolean isInvalidLocation(String location) {
        if (location == null || location.isBlank() || location.length() < 2) return true;
        String[] invalidKeywords = {
            "目的", "地区", "出发", "备注", "物流", "线路", "返货", "说明", "价格", "报价",
            "整车", "散货", "运价", "最低", "同比", "到站", "终点", "起点"
        };
        for (String keyword : invalidKeywords) {
            if (location.contains(keyword)) return true;
        }
        return false;
    }
}
