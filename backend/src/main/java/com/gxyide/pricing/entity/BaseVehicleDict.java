package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 车型字典表
 */
@Data
@TableName("base_vehicle_dict")
public class BaseVehicleDict {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 车型编码 */
    private String vehicleCode;

    /** 车型名称(如9.6米车) */
    private String vehicleName;

    /** 载重量(吨) */
    private BigDecimal loadWeight;

    /** 载货体积(立方米) */
    private BigDecimal loadVolume;

    /** 单车运费(元) */
    private BigDecimal freightPrice;

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
