package com.gxyide.pricing.dto.excel;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

import java.math.BigDecimal;

/**
 * BOM Excel/CSV 导入行数据
 * 对应上汽BOM报表结构
 */
@Data
public class BomExcelRowDTO {

    @ExcelProperty("层次")
    private String levelCode;

    @ExcelProperty("子物料编码")
    private String partCode;

    @ExcelProperty("子物料名称")
    private String partName;

    @ExcelProperty("子物料规格")
    private String partSpec;

    @ExcelProperty("子物料型号")
    private String partModel;

    @ExcelProperty("数量")
    private BigDecimal quantity;

    @ExcelProperty("单价（含税）")
    private BigDecimal unitPriceInclTax;

    @ExcelProperty("金额（含税）")
    private BigDecimal amountInclTax;

    @ExcelProperty("不含税")
    private BigDecimal unitPriceExclTax;

    @ExcelProperty("基数")
    private Integer baseQuantity;

    @ExcelProperty("损耗率")
    private BigDecimal lossRate;

    @ExcelProperty("子物料基本单位")
    private String unit;

    @ExcelProperty("子物料图号")
    private String drawingNo;

    @ExcelProperty("子物料材质")
    private String materialName;

    @ExcelProperty("子项类型")
    private String partType;

    @ExcelProperty("BOM备注")
    private String remark;
}
