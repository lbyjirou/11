package com.gxyide.pricing.dto.excel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 列映射信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ColumnMappingDTO {

    /** 列索引（0开始） */
    private Integer index;

    /** 原始表头名称 */
    private String header;

    /** 映射到的字段名 */
    private String fieldName;

    /** 识别置信度: HIGH/MEDIUM/LOW */
    private String confidence;
}
