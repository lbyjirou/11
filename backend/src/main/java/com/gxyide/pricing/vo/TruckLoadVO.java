package com.gxyide.pricing.vo;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class TruckLoadVO {
    private String truckType;
    private String truckStyle;
    private BigDecimal truckLength;
    private BigDecimal truckWidth;
    private BigDecimal truckHeight;
    private BigDecimal effectiveHeight; // 有效高度（考虑车型样式）
    private String heightNote; // 高度说明
    private BigDecimal maxWeight;
    private BigDecimal usedVolume;
    private BigDecimal usedWeight;
    private BigDecimal utilization;
    private BigDecimal price;
    private List<CargoPositionVO> positions;
}
