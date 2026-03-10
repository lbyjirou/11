package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 包装类型字典表
 */
@Data
@TableName("base_pack_dict")
public class BasePackDict {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 包装编码 */
    private String packCode;

    /** 包装名称(纸箱/围板箱) */
    private String packName;

    /** 包装单价(元) */
    private BigDecimal packPrice;

    /** 包装寿命(次数) */
    private Integer packLife;

    /** 是否可回收: 0-一次性, 1-可回收 */
    private Integer isReturnable;

    /** 描述 */
    private String description;

    /** 是否启用 */
    private Integer isActive;

    /** 排序序号 */
    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
