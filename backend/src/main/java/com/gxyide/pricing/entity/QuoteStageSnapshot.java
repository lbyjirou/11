package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("quote_stage_snapshot")
public class QuoteStageSnapshot {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long orderId;

    private String stage;

    private Long handlerId;

    private String dataSnapshot;

    private Integer version;

    /** CONFIRMED / PENDING_RECONFIRM / MODIFIED */
    private String status;

    private LocalDateTime confirmedAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
