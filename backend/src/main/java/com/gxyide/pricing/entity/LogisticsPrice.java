package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("logistics_price")
public class LogisticsPrice {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 方向：OUTBOUND=送货（柳州→各地），INBOUND=返货（各地→柳州）
     */
    private String direction;

    /**
     * 出发地（返货时为各地城市，送货时为"柳州"）
     */
    private String origin;

    /**
     * 目的地（送货时为各地城市，返货时为"柳州"）
     */
    private String destination;

    private String companyName;

    private BigDecimal priceScatter;

    @TableField("price_4_2m")
    private BigDecimal price42m;

    @TableField("price_6_8m")
    private BigDecimal price68m;

    @TableField("price_9_6m")
    private BigDecimal price96m;

    @TableField("price_13_5m")
    private BigDecimal price135m;

    @TableField("price_17_5m")
    private BigDecimal price175m;

    @TableField("price_16m_box")
    private BigDecimal price16mBox;

    private BigDecimal minChargeVal;

    private String scatterRemark;

    /** 低于10方送货费(元) */
    private BigDecimal deliveryFee;

    /** 东莞特殊送货费(元)，从备注中解析，如"东莞台达送货费400/趟" */
    private BigDecimal dongguanSurcharge;

    private Integer updateYear;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
