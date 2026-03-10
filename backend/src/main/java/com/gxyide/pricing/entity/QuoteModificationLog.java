package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("quote_modification_log")
public class QuoteModificationLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long orderId;

    private String initiatorStage;

    private Long initiatorId;

    private String reason;

    private String affectedStages;

    /** IN_PROGRESS / COMPLETED */
    private String status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    private LocalDateTime completeTime;
}
