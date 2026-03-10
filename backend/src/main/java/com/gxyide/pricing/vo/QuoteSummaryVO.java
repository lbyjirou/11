package com.gxyide.pricing.vo;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

/**
 * 报价汇总VO - 经理驾驶舱
 * 汇总各阶段成本，支持利润调整
 */
@Data
@Builder
public class QuoteSummaryVO {

    // ==================== 基本信息 ====================
    private Long orderId;
    private String quoteNo;
    private String partName;
    private String customerName;
    private Integer annualQuantity;

    // ==================== Phase 2: 材料成本 ====================
    private BigDecimal materialCost;
    private BigDecimal totalWeight;
    private Integer bomItemCount;

    // ==================== Phase 3: 制造费用 ====================
    private BigDecimal manufacturingCost;
    private Integer processCount;
    private List<ProcessSummary> processSummaries;

    // ==================== Phase 4: 物流费用 ====================
    private BigDecimal logisticsCost;
    private BigDecimal packagingCost;
    private String packType;
    private String vehicleType;

    /** 目的地 */
    private String destination;
    /** 物流公司 */
    private String companyName;
    /** SNP-每箱装件数 */
    private Integer partsPerBox;
    /** 每车装箱数 */
    private Integer boxesPerVehicle;
    /** 单件包装摊销费 */
    private BigDecimal unitPackCost;
    /** 单件运费 */
    private BigDecimal unitFreightCost;
    /** 单件物流总费 */
    private BigDecimal unitTotalCost;
    /** 年运输车次 */
    private Integer annualVehicles;
    /** 年运费总额 */
    private BigDecimal annualFreight;

    /** 三方仓费用 */
    private BigDecimal warehouseFee;
    /** 运费 */
    private BigDecimal freightFee;
    /** 围板箱与海绵返回运费 */
    private BigDecimal returnFreightFee;
    /** 物流成本合计 */
    private BigDecimal totalLogisticsCost;

    // ==================== 成本小计 ====================
    /** 直接成本 = 材料 + 制造 + 物流 + 包装 */
    private BigDecimal directCost;

    // ==================== 上汽报价单 - 成本汇总扩展字段 ====================

    /** 总直接人工成本 */
    private BigDecimal laborCost;

    /** 总制造成本(材料+模具分摊+人工+制造费用) */
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

    // ==================== 经理调整项 ====================
    /** 管理费率(%) */
    private BigDecimal managementRate;
    /** 管理费金额 */
    private BigDecimal managementCost;

    /** 利润率(%) */
    private BigDecimal profitRate;
    /** 利润金额 */
    private BigDecimal profitAmount;

    // ==================== 最终报价 ====================
    /** 不含税单价 */
    private BigDecimal unitPriceExclTax;
    /** 税率(%) */
    private BigDecimal taxRate;
    /** 含税单价 */
    private BigDecimal unitPriceInclTax;
    /** 年度总金额 */
    private BigDecimal annualAmount;

    // ==================== 状态信息 ====================
    private String status;
    private String statusName;

    /**
     * 工序汇总
     */
    @Data
    @Builder
    public static class ProcessSummary {
        private String processName;
        private String machineName;
        private BigDecimal unitCost;
        private Integer count;
    }
}
