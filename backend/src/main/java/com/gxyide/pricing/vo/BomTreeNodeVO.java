package com.gxyide.pricing.vo;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

/**
 * BOM树节点VO
 */
@Data
public class BomTreeNodeVO {

    private Long id;
    private Long orderId;
    private Long parentId;
    private Integer level;
    private Integer sortOrder;

    // 核心字段
    private String partName;
    private String partCode;
    private String materialGrade;
    private String specDesc;
    private BigDecimal netWeight;
    private BigDecimal grossWeight;
    private BigDecimal scrapRate;
    private String techNote;

    // 扩展字段
    private BigDecimal quantity;
    private String unit;
    private String drawingNo;
    private Integer isPurchased;
    private String supplierName;

    // 计算字段
    private BigDecimal calculatedWeight;

    // ==================== 上汽报价单 - 材料成本扩展字段 ====================

    /** 采购类型: P=采购件, M=自制件 */
    private String purchaseType;

    /** 材料总成本 */
    private BigDecimal materialTotalCost;

    /** 原材料名称 */
    private String materialName;

    /** 材料供应商名称 */
    private String materialSupplier;

    /** 材料供应商邓白氏号 */
    private String materialSupplierDuns;

    /** 含税单价 */
    private BigDecimal unitPriceInclTax;

    /** 含税金额 */
    private BigDecimal amountInclTax;

    /** 不含税单价 */
    private BigDecimal unitPriceExclTax;

    /** 工装分摊单件成本 */
    private BigDecimal toolingCostPerUnit;

    // 子节点
    private List<BomTreeNodeVO> children;
}
