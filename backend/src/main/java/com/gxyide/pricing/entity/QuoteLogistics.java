package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 物流包装明细表
 */
@Data
@TableName("quote_logistics")
public class QuoteLogistics {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 报价单ID */
    private Long orderId;

    // ==================== 包装信息 ====================

    /** 包装类型ID */
    private Long packId;

    /** 包装类型(纸箱/围板箱) */
    private String packType;

    /** 箱单价(元) */
    private BigDecimal boxPrice;

    /** 包装寿命(次数) */
    private Integer boxLife;

    /** SNP-每箱装件数 */
    private Integer partsPerBox;

    /** 是否可回收 */
    private Integer isReturnable;

    // ==================== 运输信息 ====================

    /** 车型ID */
    private Long vehicleId;

    /** 车型(9.6米车) */
    private String vehicleType;

    /** 单车运费(元) */
    private BigDecimal freightPrice;

    /** 车辆载重(吨) */
    private BigDecimal loadWeight;

    /** 车辆容积(立方米) */
    private BigDecimal loadVolume;

    // ==================== 计算参数 ====================

    /** 总重量(KG)-从BOM带入 */
    private BigDecimal totalWeight;

    /** 年产量-从报价单带入 */
    private Integer annualQuantity;

    /** 每车装箱数 */
    private Integer boxesPerVehicle;

    /** 每车装件数 */
    private Integer partsPerVehicle;

    // ==================== 计算结果 ====================

    /** 单件包装摊销费(元) */
    private BigDecimal unitPackCost;

    /** 年运输车次 */
    private Integer annualVehicles;

    /** 年运费总额(元) */
    private BigDecimal annualFreight;

    /** 单件运费(元) */
    private BigDecimal unitFreightCost;

    /** 单件物流总费(元) */
    private BigDecimal unitTotalCost;

    // ==================== 物流价格库关联 ====================

    /** 目的地 */
    private String destination;

    /** 物流公司名称 */
    private String companyName;

    // ==================== 上汽报价单 - 物流明细扩展字段 ====================

    /** 三方仓费用 */
    private BigDecimal warehouseFee;

    /** 运费 */
    private BigDecimal freightFee;

    /** 围板箱与海绵返回运费 */
    private BigDecimal returnFreightFee;

    /** 物流成本合计 */
    private BigDecimal totalLogisticsCost;

    /** 备注 */
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
