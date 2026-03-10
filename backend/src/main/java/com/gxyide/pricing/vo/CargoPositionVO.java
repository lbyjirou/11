package com.gxyide.pricing.vo;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CargoPositionVO {
    private Integer cargoIndex;
    private String packType;
    private BigDecimal x;
    private BigDecimal y;
    private BigDecimal z;
    private BigDecimal length;
    private BigDecimal width;
    private BigDecimal height;
    private Boolean rotated;
}
