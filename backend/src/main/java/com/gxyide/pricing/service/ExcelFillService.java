package com.gxyide.pricing.service;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.ExcelWriter;
import com.alibaba.excel.write.metadata.WriteSheet;
import com.alibaba.excel.write.metadata.fill.FillConfig;
import com.gxyide.pricing.dto.excel.*;
import com.gxyide.pricing.entity.*;
import com.gxyide.pricing.mapper.*;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Excel 模板填充服务
 * 使用 EasyExcel Fill 功能将数据回填到上汽模板
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelFillService {

    private static final String TEMPLATE_PATH = "templates/quote_template.xlsx";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final QuoteOrderMapper orderMapper;
    private final QuoteBomMapper bomMapper;
    private final QuoteItemProcessMapper processMapper;
    private final QuoteLogisticsMapper logisticsMapper;

    /**
     * 导出填充后的报价单 Excel
     */
    public void exportFilledQuote(Long orderId, HttpServletResponse response) throws IOException {
        QuoteOrder order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }

        // 设置响应头
        String fileName = "报价单_" + order.getQuoteNo();
        setResponseHeaders(response, fileName);

        // 获取模板
        InputStream templateStream = new ClassPathResource(TEMPLATE_PATH).getInputStream();

        // 填充配置：列表数据向下新增行
        FillConfig listFillConfig = FillConfig.builder()
                .forceNewRow(Boolean.TRUE)
                .build();

        try (ExcelWriter writer = EasyExcel.write(response.getOutputStream())
                .withTemplate(templateStream)
                .build()) {

            WriteSheet sheet = EasyExcel.writerSheet().build();

            // 1. 填充概览数据（单值占位符）
            QuoteOverviewFillDTO overview = buildOverviewDTO(order);
            writer.fill(overview, sheet);

            // 2. 填充 BOM 列表
            List<BomFillDTO> bomList = buildBomList(orderId);
            writer.fill(bomList, listFillConfig, sheet);

            // 3. 填充工序列表
            List<ProcessFillDTO> processList = buildProcessList(orderId);
            writer.fill(processList, listFillConfig, sheet);

            // 4. 填充物流数据
            LogisticsFillDTO logistics = buildLogisticsDTO(orderId);
            if (logistics != null) {
                writer.fill(logistics, sheet);
            }
        }

        log.info("报价单[{}]导出成功", orderId);
    }

    // ==================== 私有方法：构建填充数据 ====================

    private void setResponseHeaders(HttpServletResponse response, String fileName) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        String encodedName = URLEncoder.encode(fileName + ".xlsx", StandardCharsets.UTF_8);
        response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + encodedName);
    }

    /**
     * 构建报价单概览 DTO
     */
    private QuoteOverviewFillDTO buildOverviewDTO(QuoteOrder order) {
        return QuoteOverviewFillDTO.builder()
                // 零件概况
                .partNo(order.getPartNo())
                .partName(order.getPartName())
                .drawingNo(order.getDrawingNo())
                .drawingDate(formatDate(order.getDrawingDate()))
                .productionStartYear(order.getProductionStartYear())
                .annualQuantity(order.getAnnualQuantity())
                .dailyQuantity(order.getDailyQuantity())
                .deliveryLocation(order.getDeliveryLocation())
                // 商务信息
                .customerName(order.getCustomerName())
                .customerCode(order.getCustomerCode())
                .projectName(order.getProjectName())
                .supplierName(order.getSupplierName())
                .supplierDuns(order.getSupplierDuns())
                .manufacturingLocation(order.getManufacturingLocation())
                .inquiryNo(order.getInquiryNo())
                .inquiryDate(formatDate(order.getInquiryDate()))
                .quoteDeadline(formatDate(order.getQuoteDeadline()))
                // 重量
                .netWeight(order.getNetWeight())
                .grossWeight(order.getGrossWeight())
                // 报价汇总
                .materialCost(order.getMaterialCost())
                .manufacturingCost(order.getManufacturingCost())
                .logisticsCost(order.getLogisticsCost())
                .packagingCost(order.getPackagingCost())
                .sgaCost(order.getSgaCost())
                .profitAmount(order.getProfitAmount())
                .unitPriceExclTax(order.getUnitPriceExclTax())
                .taxRate(order.getTaxRate())
                .unitPriceInclTax(order.getUnitPriceInclTax())
                // 报价单信息
                .quoteNo(order.getQuoteNo())
                .quoteDate(formatDate(order.getCreateTime() != null
                        ? order.getCreateTime().toLocalDate() : null))
                .supplierRemark(order.getSupplierRemark())
                // 上汽扩展 - 表头
                .quoteQuantity(order.getQuoteQuantity())
                .registerAddress(order.getRegisterAddress())
                .factoryAddress(order.getFactoryAddress())
                .contactName(order.getContactName())
                .contactPhone(order.getContactPhone())
                .creatorName(order.getCreatorName())
                .currency(order.getCurrency())
                .exchangeRate(order.getExchangeRate())
                .hasImportParts(order.getHasImportParts() != null && order.getHasImportParts() == 1 ? "是" : "否")
                .moldLife(order.getMoldLife())
                .dailyWorkHours(order.getDailyWorkHours())
                .weeklyWorkDays(order.getWeeklyWorkDays())
                // 上汽扩展 - 成本汇总
                .laborCost(order.getLaborCost())
                .totalProductionCost(order.getTotalProductionCost())
                .managementFee(order.getManagementFee())
                .scrapRate(order.getScrapRate())
                .scrapCost(order.getScrapCost())
                .profit(order.getProfit())
                .factoryPrice(order.getFactoryPrice())
                .build();
    }

    private String formatDate(java.time.LocalDate date) {
        return date != null ? date.format(DATE_FMT) : "";
    }

    /**
     * 构建 BOM 列表 DTO
     */
    private List<BomFillDTO> buildBomList(Long orderId) {
        List<QuoteBom> bomList = bomMapper.selectByOrderId(orderId);
        if (bomList == null || bomList.isEmpty()) {
            return Collections.emptyList();
        }

        // 按 sortOrder 排序
        bomList.sort(Comparator.comparingInt(b -> b.getSortOrder() != null ? b.getSortOrder() : 0));

        AtomicInteger seq = new AtomicInteger(1);
        return bomList.stream()
                .map(bom -> BomFillDTO.builder()
                        .seq(seq.getAndIncrement())
                        .levelCode(bom.getLevelCode())
                        .partCode(bom.getPartCode())
                        .partName(bom.getPartName())
                        .partSpec(bom.getPartSpec())
                        .partModel(bom.getPartModel())
                        .materialName(bom.getMaterialName())
                        .unit(bom.getUnit())
                        .drawingNo(bom.getDrawingNo())
                        .quantity(bom.getQuantity())
                        .baseQuantity(bom.getBaseQuantity())
                        .lossRate(bom.getLossRate())
                        .unitPriceInclTax(bom.getUnitPriceInclTax())
                        .amountInclTax(bom.getAmountInclTax())
                        .unitPriceExclTax(bom.getUnitPriceExclTax())
                        .netWeight(bom.getNetWeight())
                        .partType(bom.getPartType())
                        .remark(bom.getRemark())
                        // 上汽扩展字段
                        .purchaseType(bom.getPurchaseType())
                        .materialTotalCost(bom.getMaterialTotalCost())
                        .materialName2(bom.getMaterialName())
                        .materialSupplier(bom.getMaterialSupplier())
                        .materialSupplierDuns(bom.getMaterialSupplierDuns())
                        .toolingCostPerUnit(bom.getToolingCostPerUnit())
                        .build())
                .toList();
    }

    /**
     * 构建工序列表 DTO
     */
    private List<ProcessFillDTO> buildProcessList(Long orderId) {
        List<QuoteItemProcess> processes = processMapper.selectByOrderId(orderId);
        if (processes == null || processes.isEmpty()) {
            return Collections.emptyList();
        }

        // 构建 BOM ID -> 序号映射
        List<QuoteBom> bomList = bomMapper.selectByOrderId(orderId);
        Map<Long, Integer> bomSeqMap = new HashMap<>();
        AtomicInteger bomSeq = new AtomicInteger(1);
        bomList.stream()
                .sorted(Comparator.comparingInt(b -> b.getSortOrder() != null ? b.getSortOrder() : 0))
                .forEach(b -> bomSeqMap.put(b.getId(), bomSeq.getAndIncrement()));

        // 按 sortOrder 排序
        processes.sort(Comparator.comparingInt(p -> p.getSortOrder() != null ? p.getSortOrder() : 0));

        AtomicInteger seq = new AtomicInteger(1);
        return processes.stream()
                .map(p -> {
                    QuoteBom bom = bomList.stream()
                            .filter(b -> b.getId().equals(p.getBomId()))
                            .findFirst().orElse(null);
                    return ProcessFillDTO.builder()
                            .seq(seq.getAndIncrement())
                            .bomSeq(bomSeqMap.get(p.getBomId()))
                            .partCode(bom != null ? bom.getPartCode() : null)
                            .partName(bom != null ? bom.getPartName() : null)
                            .processName(p.getProcessName())
                            .machineName(p.getMachineName())
                            .cycleTime(p.getCycleTime())
                            .cavityCount(p.getCavityCount())
                            .crewSize(p.getCrewSize())
                            .machineHourlyRate(p.getMachineHourlyRate())
                            .laborHourlyRate(p.getLaborHourlyRate())
                            .unitMachineCost(p.getUnitMachineCost())
                            .unitLaborCost(p.getUnitLaborCost())
                            .unitTotalCost(p.getUnitTotalCost())
                            .remark(p.getRemark())
                            // 上汽扩展字段
                            .processSeq(p.getProcessSeq())
                            .machineModel(p.getMachineModel())
                            .machineCategory(p.getMachineCategory())
                            .variableCost(p.getVariableCost())
                            .fixedCost(p.getFixedCost())
                            .manufacturingCost(p.getManufacturingCost())
                            .build();
                })
                .toList();
    }

    /**
     * 构建物流包装 DTO
     */
    private LogisticsFillDTO buildLogisticsDTO(Long orderId) {
        QuoteLogistics logistics = logisticsMapper.selectByOrderId(orderId);
        if (logistics == null) {
            return null;
        }

        return LogisticsFillDTO.builder()
                // 包装信息
                .packType(logistics.getPackType())
                .boxPrice(logistics.getBoxPrice())
                .boxLife(logistics.getBoxLife())
                .partsPerBox(logistics.getPartsPerBox())
                .isReturnable(logistics.getIsReturnable() != null && logistics.getIsReturnable() == 1 ? "是" : "否")
                .unitPackCost(logistics.getUnitPackCost())
                // 运输信息
                .vehicleType(logistics.getVehicleType())
                .freightPrice(logistics.getFreightPrice())
                .boxesPerVehicle(logistics.getBoxesPerVehicle())
                .partsPerVehicle(logistics.getPartsPerVehicle())
                .annualVehicles(logistics.getAnnualVehicles())
                .annualFreight(logistics.getAnnualFreight())
                .unitFreightCost(logistics.getUnitFreightCost())
                // 汇总
                .unitTotalCost(logistics.getUnitTotalCost())
                // 上汽扩展字段
                .warehouseFee(logistics.getWarehouseFee())
                .freightFee(logistics.getFreightFee())
                .returnFreightFee(logistics.getReturnFreightFee())
                .totalLogisticsCost(logistics.getTotalLogisticsCost())
                .build();
    }
}
