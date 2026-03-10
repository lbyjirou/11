package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 设备参数表
 */
@Data
@TableName("base_machine")
public class BaseMachine {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 设备编码 */
    private String machineCode;

    /** 设备名称 */
    private String machineName;

    /** 设备类型: PRESS-冲床, WELDER-焊机, CNC-数控机床, INJECTION-注塑机 */
    private String machineType;

    /** 吨位(T) */
    private Integer tonnage;

    /** 设备费率(元/小时) */
    private BigDecimal hourlyRate;

    /** 折旧费率(元/小时) */
    private BigDecimal depreciationRate;

    /** 能耗费率(元/小时) */
    private BigDecimal energyRate;

    /** 维护费率(元/小时) */
    private BigDecimal maintenanceRate;

    /** 配套人工费率(元/小时) */
    private BigDecimal laborRate;

    /** 默认操作人数 */
    private Integer defaultLaborCount;

    /** 状态: 0-禁用 1-启用 */
    private Integer status;

    /** 备注 */
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
