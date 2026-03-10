package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 人工费率配置表
 */
@Data
@TableName("base_labor_rate")
public class BaseLaborRate {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 费率名称(如普工/技工) */
    private String rateName;

    /** 人工小时费率(元/小时) */
    private BigDecimal hourlyRate;

    /** 是否默认费率 */
    private Integer isDefault;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
