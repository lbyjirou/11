package com.gxyide.pricing.dto;

import lombok.Data;
import java.math.BigDecimal;

/**
 * BOM节点编辑DTO
 */
@Data
public class BomNodeDTO {

    /** 节点ID（新增时为空，修改时必填） */
    private Long id;

    /** 报价单ID（新增时必填） */
    private Long orderId;

    /** 父节点ID（顶级节点为空） */
    private Long parentId;

    // ==================== 核心定义字段 ====================

    /** 零件名称 */
    private String partName;

    /** 材质牌号，如 AL3003 */
    private String materialGrade;

    /** 规格描述，如 φ20*1.5 */
    private String specDesc;

    /** 净重(KG) */
    private BigDecimal netWeight;

    /** 毛重(KG) */
    private BigDecimal grossWeight;

    /** 废料率(%) */
    private BigDecimal scrapRate;

    /** 技术备注 */
    private String techNote;

    // ==================== 扩展字段 ====================

    /** 零件编码 */
    private String partCode;

    /** 数量 */
    private BigDecimal quantity;

    /** 单位 */
    private String unit;

    /** 图号 */
    private String drawingNo;

    /** 是否外购件: 0=自制, 1=外购 */
    private Integer isPurchased;

    /** 供应商名称 */
    private String supplierName;

    // ==================== 上汽报价单 - 材料成本扩展字段 ====================

    /** 采购类型: P=采购件, M=自制件 */
    private String purchaseType;

    /** 材料总成本(数量×单位成本) */
    private BigDecimal materialTotalCost;

    /** 原材料名称/外购件零件号 */
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
}
