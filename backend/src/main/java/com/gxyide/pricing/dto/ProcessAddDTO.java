package com.gxyide.pricing.dto;

import lombok.Data;
import java.math.BigDecimal;

/**
 * 添加工序请求DTO
 */
@Data
public class ProcessAddDTO {

    /** 报价单ID */
    private Long orderId;

    /** 关联的BOM零件ID */
    private Long bomId;

    /** 工序顺序 */
    private Integer sortOrder;

    /** 工序字典ID(关联process_dict，优先使用) */
    private Long processDictId;

    /** 工序名称(当processDictId为空时使用) */
    private String processName;

    /** 设备ID(关联base_machine_dict) */
    private Long machineId;

    /** 节拍/周期时间(秒) */
    private BigDecimal cycleTime;

    /** 穴数/模腔数 */
    private Integer cavityCount;

    /** 操作人数 */
    private Integer crewSize;

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
}
