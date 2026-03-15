package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("process_dict")
public class ProcessDict {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String processName;

    private String unitType;

    private BigDecimal unitPrice;

    private BigDecimal laborRate;

    private Integer laborTime;

    private Integer operators;

    private String machineModel;

    private String machineType;

    private BigDecimal varCost;

    private BigDecimal fixCost;

    private Integer isActive;

    /** 归属用户ID，公共预设为空 */
    private Long ownerUserId;

    /** 是否公共预设：0-个人 1-公共 */
    private Integer isPublic;

    private String sectionKey;

    private String sectionLabel;

    private String columnsJson;

    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
