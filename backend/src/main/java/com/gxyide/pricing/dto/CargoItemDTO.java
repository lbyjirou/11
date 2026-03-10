package com.gxyide.pricing.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CargoItemDTO {
    private String packType;
    private BigDecimal length;
    private BigDecimal width;
    private BigDecimal height;
    private Integer quantity;
    private BigDecimal weight;
    private BigDecimal packFee;
    private Integer maxStack;
}
