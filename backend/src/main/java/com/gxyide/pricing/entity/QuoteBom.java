package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * BOM物料清单实体
 * 支持多级递归结构，用于技术工程师在线设计
 */
@Data
@TableName("quote_bom")
public class QuoteBom {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 报价单ID */
    private Long orderId;

    // ==================== 层级关系 ====================

    /** 父节点ID，顶级为NULL */
    private Long parentId;

    /** 层次编码(原始值)，如: 1, 12.1, 12.1.1 */
    private String levelCode;

    /** 层级深度，1=顶级 */
    private Integer levelDepth;

    /** 排序序号 */
    private Integer sortOrder;

    // ==================== 核心定义字段（技术工程师手动录入） ====================

    /** 零件名称 */
    private String partName;

    /** 材质牌号，如 AL3003, 6061-T6 */
    private String materialGrade;

    /** 规格描述，如 φ20*1.5 */
    private String specDesc;

    /** 净重(KG)，核心计费参数 */
    private BigDecimal netWeight;

    /** 毛重(KG) */
    private BigDecimal grossWeight;

    /** 废料率(%)，用于计算材料成本 */
    private BigDecimal scrapRate;

    /** 技术备注，如"需耐压30MPa" */
    private String techNote;

    // ==================== 物料扩展信息 ====================

    /** 子物料编码 */
    private String partCode;

    /** 子物料规格（兼容旧字段） */
    private String partSpec;

    /** 子物料型号 */
    private String partModel;

    /** 材质名称（兼容旧字段） */
    private String materialName;

    /** 基本单位 */
    private String unit;

    /** 子物料图号 */
    private String drawingNo;

    // ==================== 数量与价格 ====================

    /** 数量/用量 */
    private BigDecimal quantity;

    /** 基数 */
    private Integer baseQuantity;

    /** 损耗率(%)，兼容旧字段 */
    private BigDecimal lossRate;

    /** 单价(含税) */
    private BigDecimal unitPriceInclTax;

    /** 金额(含税) */
    private BigDecimal amountInclTax;

    /** 单价(不含税) */
    private BigDecimal unitPriceExclTax;

    // ==================== 计算字段 ====================

    /** 计算后总重(递归汇总) */
    private BigDecimal calculatedWeight;

    // ==================== 其他信息 ====================

    /** 子项类型 */
    private String partType;

    /** 是否外购件: 0=自制, 1=外购 */
    private Integer isPurchased;

    /** 采购类型: P=采购件, M=自制件 */
    private String purchaseType;

    /** 材料总成本(数量×单位成本) */
    private BigDecimal materialTotalCost;

    /** 原材料名称/外购件零件号 */
    private String materialName2;

    /** 材料供应商名称 */
    private String materialSupplier;

    /** 材料供应商邓白氏号 */
    private String materialSupplierDuns;

    /** 工装分摊单件成本 */
    private BigDecimal toolingCostPerUnit;

    /** 供应商名称 */
    private String supplierName;

    /** BOM备注 */
    private String remark;

    // ==================== 时间戳 ====================

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
