package com.gxyide.pricing.vo;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class LogisticsQuoteVO {

    private String direction;   // OUTBOUND=送货, INBOUND=返货
    private String origin;      // 出发地
    private String destination; // 目的地
    private BigDecimal volume;  // 体积（立方米）
    private QuoteOption recommended;
    private List<QuoteOption> allOptions;

    @Data
    @Builder
    public static class QuoteOption {
        private String company;
        private String type;
        private BigDecimal price;
    }
}
