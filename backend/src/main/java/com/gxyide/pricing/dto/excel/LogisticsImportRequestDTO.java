package com.gxyide.pricing.dto.excel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 导入请求 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogisticsImportRequestDTO {

    /** 临时文件标识 */
    private String fileKey;

    /** 确认的区域映射列表 */
    private List<RegionMappingDTO> regions;
}
