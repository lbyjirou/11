package com.gxyide.pricing.dto.excel;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Excel 填充数据 - 工序明细行（第五部分）
 * 对应模板中的 {.fieldName} 列表占位符
 */
@Data
@Builder
public class ProcessFillDTO {

    /** 序号 */
    private Integer seq;

    /** 关联BOM序号 */
    private Integer bomSeq;

    /** 零件编码 */
    private String partCode;

    /** 零件名称 */
    private String partName;

    /** 工序名称 */
    private String processName;

    /** 设备名称 */
    private String machineName;

    /** 节拍(秒) */
    private BigDecimal cycleTime;

    /** 穴数 */
    private Integer cavityCount;

    /** 人数 */
    private Integer crewSize;

    /** 设备费率(元/小时) */
    private BigDecimal machineHourlyRate;

    /** 人工费率(元/小时) */
    private BigDecimal laborHourlyRate;

    /** 单件加工费 */
    private BigDecimal unitMachineCost;

    /** 单件人工费 */
    private BigDecimal unitLaborCost;

    /** 单件总工序费 */
    private BigDecimal unitTotalCost;

    /** 备注 */
    private String remark;

    // ==================== 上汽报价单 - 工序扩展字段 ====================

    /** 工序序号(工艺1、工艺2...) */
    private String processSeq;

    /** 机器型号 */
    private String machineModel;

    /** 机器类别(如500KW) */
    private String machineCategory;

    /** 可变费用 */
    private BigDecimal variableCost;

    /** 固定费用 */
    private BigDecimal fixedCost;

    /** 制造费用总值(可变+固定) */
    private BigDecimal manufacturingCost;
}
