package com.gxyide.pricing.dto;

import lombok.Data;

@Data
public class TruckEditDTO {
    private String truckType;  // 车型如"9.6米"
    private String truckStyle; // 样式如"厢式"
    private Integer count;     // 数量
}
