package com.gxyide.pricing.dto;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

/**
 * Excel 列映射：
 * 列A(0): 目的地
 * 列B(1): 散货(元/KG)
 * 列C(2): 4.2米
 * 列D(3): 6.8米
 * 列E(4): 9.6米
 * 列F(5): 最低一票
 * 物流公司名称来自 Sheet 名称
 *
 * 使用 String 接收，避免格式转换异常
 */
@Data
public class LogisticsExcelDTO {

    @ExcelProperty(index = 0)
    private String destination;

    @ExcelProperty(index = 1)
    private String priceScatter;

    @ExcelProperty(index = 2)
    private String price42m;

    @ExcelProperty(index = 3)
    private String price68m;

    @ExcelProperty(index = 4)
    private String price96m;

    @ExcelProperty(index = 5)
    private String minChargeVal;
}
