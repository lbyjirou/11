package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("process_template")
public class ProcessTemplate {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String name;

    private String templateJson;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
