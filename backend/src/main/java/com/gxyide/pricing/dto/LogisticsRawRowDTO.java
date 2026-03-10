package com.gxyide.pricing.dto;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 用于读取 Excel 原始行数据（不指定列映射，动态读取）
 */
@Data
public class LogisticsRawRowDTO {
    private Map<Integer, String> rowData = new LinkedHashMap<>();
}
