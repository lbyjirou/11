package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
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

    /** 是否公共预设：0-个人 1-公共 */
    private Integer isPublic;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
