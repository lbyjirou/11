package com.gxyide.pricing.dto.excel;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Excel 填充数据 - 物流包装（第七部分）
 */
@Data
@Builder
public class LogisticsFillDTO {

    // ==================== 包装信息 ====================
    /** 包装类型 */
    private String packType;
    /** 箱单价 */
    private BigDecimal boxPrice;
    /** 包装寿命 */
    private Integer boxLife;
    /** 每箱装件数(SNP) */
    private Integer partsPerBox;
    /** 是否可回收 */
    private String isReturnable;
    /** 单件包装摊销费 */
    private BigDecimal unitPackCost;

    // ==================== 运输信息 ====================
    /** 车型 */
    private String vehicleType;
    /** 单车运费 */
    private BigDecimal freightPrice;
    /** 每车装箱数 */
    private Integer boxesPerVehicle;
    /** 每车装件数 */
    private Integer partsPerVehicle;
    /** 年运输车次 */
    private Integer annualVehicles;
    /** 年运费总额 */
    private BigDecimal annualFreight;
    /** 单件运费 */
    private BigDecimal unitFreightCost;

    // ==================== 汇总 ====================
    /** 单件物流总费 */
    private BigDecimal unitTotalCost;

    // ==================== 上汽报价单 - 物流成本扩展字段 ====================

    /** 三方仓费用 */
    private BigDecimal warehouseFee;

    /** 运费 */
    private BigDecimal freightFee;

    /** 围板箱与海绵返回运费 */
    private BigDecimal returnFreightFee;

    /** 物流成本合计 */
    private BigDecimal totalLogisticsCost;
}
