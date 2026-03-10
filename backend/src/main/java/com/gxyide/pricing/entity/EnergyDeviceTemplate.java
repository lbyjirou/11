package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("energy_device_template")
public class EnergyDeviceTemplate {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String name;

    private String templateJson;

    private String category;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
