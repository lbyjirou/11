package com.gxyide.pricing.dto.excel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Excel 解析结果
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExcelAnalyzeResultDTO {

    /** 是否解析成功 */
    private Boolean success;

    /** 是否自动识别成功 */
    private Boolean recognized;

    /** 错误信息（解析失败时） */
    private String errorMessage;

    /** 临时文件标识（用于后续导入） */
    private String fileKey;

    /** 原始文件名 */
    private String fileName;

    /** 识别到的区域列表 */
    private List<RegionMappingDTO> regions;

    /** 未映射的列名 */
    private List<String> unmappedColumns;

    /** 所有Sheet名称 */
    private List<String> sheetNames;
}
