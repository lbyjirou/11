package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 设备字典表
 * 由经理预设，工程师只能选择不能修改费率
 */
@Data
@TableName("base_machine_dict")
public class BaseMachineDict {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 设备编码 */
    private String machineCode;

    /** 设备名称(如400T冲床) */
    private String machineName;

    /** 设备小时费率(元/小时) */
    private BigDecimal hourlyRate;

    /** 设备描述 */
    private String description;

    /** 是否启用: 0-禁用, 1-启用 */
    private Integer isActive;

    /** 排序序号 */
    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
