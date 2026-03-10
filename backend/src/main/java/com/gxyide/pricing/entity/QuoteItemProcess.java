package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 工序明细表
 * 关联BOM零件，记录每道工序的参数和计算结果
 */
@Data
@TableName("quote_item_process")
public class QuoteItemProcess {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 报价单ID */
    private Long orderId;

    /** 关联的BOM零件ID */
    private Long bomId;

    /** 工序顺序 */
    private Integer sortOrder;

    // ==================== 工序基本信息 ====================

    /** 工序序号(工艺1、工艺2...) */
    private String processSeq;

    /** 工序名称/描述 */
    private String processName;

    /** 设备ID(关联base_machine_dict) */
    private Long machineId;

    /** 设备名称(冗余存储) */
    private String machineName;

    /** 机器型号 */
    private String machineModel;

    /** 机器类别(如500KW) */
    private String machineCategory;

    // ==================== 工艺参数（工程师填写） ====================

    /** 节拍/周期时间(秒) */
    private BigDecimal cycleTime;

    /** 穴数/模腔数 */
    private Integer cavityCount;

    /** 操作人数 */
    private Integer crewSize;

    // ==================== 费率（从字典带入，不可手改） ====================

    /** 设备小时费率(元/小时) */
    private BigDecimal machineHourlyRate;

    /** 人工小时费率(元/小时) */
    private BigDecimal laborHourlyRate;

    // ==================== 计算结果（系统自动计算） ====================

    /** 单件加工费(元) */
    private BigDecimal unitMachineCost;

    /** 单件人工费(元) */
    private BigDecimal unitLaborCost;

    /** 单件总工序费(元) */
    private BigDecimal unitTotalCost;

    /** 可变费用 */
    private BigDecimal variableCost;

    /** 固定费用 */
    private BigDecimal fixedCost;

    /** 制造费用总值(可变+固定) */
    private BigDecimal manufacturingCost;

    /** 备注 */
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
