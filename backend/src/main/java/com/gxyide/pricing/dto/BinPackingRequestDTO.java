package com.gxyide.pricing.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class BinPackingRequestDTO {
    private List<CargoItemDTO> cargoList;
    private String origin;
    private String destination;
    // 车型价格映射：key为车型如"4.2米"，value为该路线最低价
    private Map<String, BigDecimal> truckPrices;
    // 散货单价（元/立方）
    private BigDecimal scatterUnitPrice;
    // 是否启用混合方案（整车+散货），默认true
    private Boolean enableMixedSolution = true;
}
