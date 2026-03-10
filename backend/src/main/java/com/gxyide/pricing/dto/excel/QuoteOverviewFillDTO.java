package com.gxyide.pricing.dto.excel;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Excel 填充数据 - 报价单概览（第四部分）
 * 对应模板中的 {fieldName} 占位符
 */
@Data
@Builder
public class QuoteOverviewFillDTO {

    // ==================== 零件概况 ====================
    /** 零件号 */
    private String partNo;
    /** 零件名称 */
    private String partName;
    /** 图纸号 */
    private String drawingNo;
    /** 图纸日期 */
    private String drawingDate;
    /** 生产起始年 */
    private Integer productionStartYear;
    /** 年产量 */
    private Integer annualQuantity;
    /** 预测每日产量 */
    private Integer dailyQuantity;
    /** 收货地点 */
    private String deliveryLocation;

    // ==================== 商务信息 ====================
    /** 客户名称 */
    private String customerName;
    /** 客户编码 */
    private String customerCode;
    /** 项目名称 */
    private String projectName;
    /** 供应商名称 */
    private String supplierName;
    /** 供应商邓白氏码 */
    private String supplierDuns;
    /** 制造地点 */
    private String manufacturingLocation;
    /** 询价单号 */
    private String inquiryNo;
    /** 询价单发布日期 */
    private String inquiryDate;
    /** 报价截止日期 */
    private String quoteDeadline;

    // ==================== 重量信息 ====================
    /** 零件净重(KG) */
    private BigDecimal netWeight;
    /** 零件毛重(KG) */
    private BigDecimal grossWeight;

    // ==================== 报价汇总 ====================
    /** 材料成本 */
    private BigDecimal materialCost;
    /** 制造费用 */
    private BigDecimal manufacturingCost;
    /** 物流费用 */
    private BigDecimal logisticsCost;
    /** 包装费用 */
    private BigDecimal packagingCost;
    /** 管理费用 */
    private BigDecimal sgaCost;
    /** 利润金额 */
    private BigDecimal profitAmount;
    /** 不含税单价 */
    private BigDecimal unitPriceExclTax;
    /** 税率 */
    private BigDecimal taxRate;
    /** 含税单价 */
    private BigDecimal unitPriceInclTax;

    // ==================== 报价单信息 ====================
    /** 报价单号 */
    private String quoteNo;
    /** 报价日期 */
    private String quoteDate;
    /** 供应商意见 */
    private String supplierRemark;

    // ==================== 上汽报价单 - 表头扩展字段 ====================

    /** 报价产量 */
    private Integer quoteQuantity;

    /** 注册地址 */
    private String registerAddress;

    /** 工厂地址 */
    private String factoryAddress;

    /** 联系人 */
    private String contactName;

    /** 联系电话 */
    private String contactPhone;

    /** 制表人 */
    private String creatorName;

    /** 当地货币 */
    private String currency;

    /** 汇率 */
    private BigDecimal exchangeRate;

    /** 是否含有进口子零件 */
    private String hasImportParts;

    /** 模具寿命(件数) */
    private Integer moldLife;

    /** 日工作工时 */
    private BigDecimal dailyWorkHours;

    /** 周工作日天数 */
    private Integer weeklyWorkDays;

    // ==================== 上汽报价单 - 成本汇总扩展字段 ====================

    /** 总直接人工成本 */
    private BigDecimal laborCost;

    /** 总制造成本 */
    private BigDecimal totalProductionCost;

    /** 一般管理费用 */
    private BigDecimal managementFee;

    /** 报废率(%) */
    private BigDecimal scrapRate;

    /** 报废损耗金额 */
    private BigDecimal scrapCost;

    /** 利润 */
    private BigDecimal profit;

    /** 出厂价 */
    private BigDecimal factoryPrice;
}
