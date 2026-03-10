package com.gxyide.pricing.dto.excel;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Excel 填充数据 - BOM 明细行（第五部分）
 * 对应模板中的 {.fieldName} 列表占位符
 */
@Data
@Builder
public class BomFillDTO {

    /** 序号 */
    private Integer seq;

    /** 层次编码 */
    private String levelCode;

    /** 子物料编码 */
    private String partCode;

    /** 子物料名称 */
    private String partName;

    /** 子物料规格 */
    private String partSpec;

    /** 子物料型号 */
    private String partModel;

    /** 材质名称 */
    private String materialName;

    /** 基本单位 */
    private String unit;

    /** 图号 */
    private String drawingNo;

    /** 数量 */
    private BigDecimal quantity;

    /** 基数 */
    private Integer baseQuantity;

    /** 损耗率(%) */
    private BigDecimal lossRate;

    /** 单价(含税) */
    private BigDecimal unitPriceInclTax;

    /** 金额(含税) */
    private BigDecimal amountInclTax;

    /** 单价(不含税) */
    private BigDecimal unitPriceExclTax;

    /** 净重(KG) */
    private BigDecimal netWeight;

    /** 子项类型 */
    private String partType;

    /** 备注 */
    private String remark;

    // ==================== 上汽报价单 - 材料成本扩展字段 ====================

    /** 采购类型: P=采购件, M=自制件 */
    private String purchaseType;

    /** 材料总成本 */
    private BigDecimal materialTotalCost;

    /** 原材料名称/外购件零件号 */
    private String materialName2;

    /** 材料供应商名称 */
    private String materialSupplier;

    /** 材料供应商邓白氏号 */
    private String materialSupplierDuns;

    /** 工装分摊单件成本 */
    private BigDecimal toolingCostPerUnit;
}
