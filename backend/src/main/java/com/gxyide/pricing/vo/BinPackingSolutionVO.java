package com.gxyide.pricing.vo;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class BinPackingSolutionVO {
    private String solutionId;
    private String name;
    private String description;
    private String solutionType; // TRUCK_ONLY/SCATTER_ONLY/MIXED
    private Boolean isOptimal;
    private BigDecimal totalFreight;
    private BigDecimal totalPackFee;
    private BigDecimal totalCost;
    private Integer truckCount;
    private BigDecimal scatterVolume;
    private BigDecimal scatterCost;
    private BigDecimal scatterUnitPrice;
    private Boolean isEditable = true;
    private List<TruckLoadVO> trucks;
}
