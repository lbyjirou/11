package com.gxyide.pricing.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class QuoteCalculateDTO {

    private String customerName;
    private String productType;
    private Integer quantity;

    private BigDecimal alPrice;

    private List<CollectorItem> collectors;
    private List<FinItem> fins;
    private List<TubeItem> tubes;
    private List<ProcessItem> processes;

    private String logisticsDirection;  // OUTBOUND=送货, INBOUND=返货
    private String destination;         // 送货时为目的地
    private String origin;              // 返货时为出发地
    private BigDecimal totalVolume;     // 总体积（立方米），用于散货计费

    @Data
    public static class CollectorItem {
        private Long specId;
        private String name;
        private BigDecimal area;
        private BigDecimal length;
        private BigDecimal fee;
        private Integer count;
    }

    @Data
    public static class FinItem {
        private Long specId;
        private String name;
        private BigDecimal width;
        private BigDecimal waveLen;
        private Integer waveCount;
        private BigDecimal thickness;
        private BigDecimal fee;
        private BigDecimal partFee;
        private Integer count;
    }

    @Data
    public static class TubeItem {
        private Long specId;
        private String name;
        private BigDecimal meterWeight;
        private BigDecimal length;
        private BigDecimal fee;
        private Boolean isZinc;
        private Integer count;
    }

    @Data
    public static class ProcessItem {
        private Long processId;
        private String processName;
        private BigDecimal unitPrice;
        private Integer count;
    }
}
