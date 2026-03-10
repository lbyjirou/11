package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("stage_deadline")
public class StageDeadline {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long quoteId;

    private String stage;

    private LocalDateTime deadline;

    private Integer warned;

    private Integer notified;

    private Integer escalated;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
