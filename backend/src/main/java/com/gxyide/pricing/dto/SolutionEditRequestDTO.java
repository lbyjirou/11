package com.gxyide.pricing.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class SolutionEditRequestDTO {
    private List<CargoItemDTO> cargoList;
    private List<TruckEditDTO> trucks;
    private BigDecimal scatterVolume;
    private BigDecimal scatterUnitPrice;
}
