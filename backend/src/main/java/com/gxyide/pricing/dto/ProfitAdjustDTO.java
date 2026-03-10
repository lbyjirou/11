package com.gxyide.pricing.dto;

import lombok.Data;
import java.math.BigDecimal;

/**
 * 利润调整请求DTO
 */
@Data
public class ProfitAdjustDTO {

    /** 报价单ID */
    private Long orderId;

    /** 管理费率(%) */
    private BigDecimal managementRate;

    /** 利润率(%) */
    private BigDecimal profitRate;

    /** 税率(%) - 默认13% */
    private BigDecimal taxRate;

    // ==================== 上汽报价单 - 成本汇总扩展字段 ====================

    /** 总制造成本(可覆盖) */
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

    /** 销售价格不含税(可覆盖) */
    private BigDecimal unitPriceExclTax;
}
