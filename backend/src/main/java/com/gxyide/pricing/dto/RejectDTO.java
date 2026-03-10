package com.gxyide.pricing.dto;

import lombok.Data;

/**
 * 驳回请求DTO
 */
@Data
public class RejectDTO {

    /** 报价单ID */
    private Long orderId;

    /** 驳回到的目标状态: DRAFT/PENDING_TECH/PENDING_PROCESS/PENDING_LOGISTICS */
    private String targetStatus;

    /** 驳回原因 */
    private String reason;
}
