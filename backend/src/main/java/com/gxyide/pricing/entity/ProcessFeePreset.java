package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("process_fee_preset")
public class ProcessFeePreset {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String label;

    private BigDecimal defaultRate;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
