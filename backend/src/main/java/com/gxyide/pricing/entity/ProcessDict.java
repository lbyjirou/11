package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("process_dict")
public class ProcessDict {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 工序名称 */
    private String processName;

    /** 计价单位: PCS/KG/M */
    private String unitType;

    /** 单价(元) */
    private BigDecimal unitPrice;

    /** 人工费率(元/H) */
    private BigDecimal laborRate;

    /** 工时(秒) */
    private Integer laborTime;

    /** 操作人数 */
    private Integer operators;

    /** 机器型号 */
    private String machineModel;

    /** 机器类别 */
    private String machineType;

    /** 可变费用 */
    private BigDecimal varCost;

    /** 固定费用 */
    private BigDecimal fixCost;

    /** 是否启用: 0-否 1-是 */
    private Integer isActive;

    /** 预设所属区域key */
    private String sectionKey;

    /** 预设所属区域名称 */
    private String sectionLabel;

    /** 预设列定义及默认值JSON */
    private String columnsJson;

    /** 排序 */
    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
