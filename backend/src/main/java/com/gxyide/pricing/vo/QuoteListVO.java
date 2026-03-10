package com.gxyide.pricing.vo;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 报价单列表VO
 */
@Data
public class QuoteListVO {

    private Long id;

    private String quoteNo;

    /** 内部流程状态 */
    private String status;

    private String statusName;

    /** 商业状态 */
    private String commercialStatus;

    private String commercialStatusName;

    private String rfqId;

    private String quoteVersion;

    private String customerName;

    private String owner;

    private String oemTier;

    private String vehicleProject;

    private LocalDate validUntil;

    private Integer annualVolume1y;

    /** 含税单价（仅销售员和经理可见） */
    private BigDecimal unitPriceInclTax;

    private String creatorName;

    private String currentHandlerName;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    /** 当前环节是否超期 */
    private Boolean overdue;

    /** 当前环节截止时间 */
    private LocalDateTime stageDeadline;
}
