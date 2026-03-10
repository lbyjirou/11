package com.gxyide.pricing.vo;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class QuoteResultVO {

    private String customerName;
    private String productType;
    private Integer quantity;
    private BigDecimal alPrice;

    private List<MaterialItem> collectors;
    private List<MaterialItem> fins;
    private List<MaterialItem> tubes;
    private List<ProcessCostItem> processes;

    private BigDecimal materialCost;
    private BigDecimal processCost;
    private BigDecimal profit;
    private BigDecimal logisticsCost;
    private BigDecimal totalPrice;
    private BigDecimal unitPrice;

    @Data
    @Builder
    public static class MaterialItem {
        private String name;
        private BigDecimal weight;
        private BigDecimal unitPrice;
        private Integer count;
        private BigDecimal subtotal;
    }

    @Data
    @Builder
    public static class ProcessCostItem {
        private String processName;
        private BigDecimal unitPrice;
        private Integer count;
        private BigDecimal subtotal;
    }
}
