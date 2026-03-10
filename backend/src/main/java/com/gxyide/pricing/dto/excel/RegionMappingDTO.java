package com.gxyide.pricing.dto.excel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Excel 区域映射信息（送货/返货区域）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegionMappingDTO {

    /** 方向: OUTBOUND/INBOUND */
    private String direction;

    /** 方向标签: 送货/返货 */
    private String directionLabel;

    /** Sheet名称 */
    private String sheetName;

    /** Sheet索引 */
    private Integer sheetIndex;

    /** 表头行号（1开始） */
    private Integer headerRow;

    /** 数据起始行号（1开始） */
    private Integer dataStartRow;

    /** 数据结束行号（1开始） */
    private Integer dataEndRow;

    /** 列映射关系: fieldName -> ColumnMappingDTO */
    private Map<String, ColumnMappingDTO> columnMapping;

    /** 预览数据（前10条） */
    private List<Map<String, Object>> previewData;

    /** 总数据行数 */
    private Integer totalRows;
}
