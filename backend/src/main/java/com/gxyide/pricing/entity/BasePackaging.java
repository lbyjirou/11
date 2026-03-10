package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 包装方案字典表
 */
@Data
@TableName("base_packaging")
public class BasePackaging {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 包装编码 */
    private String packagingCode;

    /** 包装名称 */
    private String packagingName;

    /** 包装类型: CARTON-纸箱, PALLET-托盘, CRATE-围板箱, CUSTOM-定制 */
    private String packagingType;

    /** 包装材料 */
    private String material;

    /** 长度(mm) */
    private BigDecimal specLength;

    /** 宽度(mm) */
    private BigDecimal specWidth;

    /** 高度(mm) */
    private BigDecimal specHeight;

    /** 最大承重(kg) */
    private BigDecimal maxWeight;

    /** 单价(元/个) */
    private BigDecimal unitPrice;

    /** 每箱装载数量 */
    private Integer piecesPerBox;

    /** 是否周转箱: 0-否 1-是 */
    private Integer isReturnable;

    /** 周转回收率(%) */
    private BigDecimal returnRate;

    /** 状态: 0-禁用 1-启用 */
    private Integer status;

    /** 备注 */
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
