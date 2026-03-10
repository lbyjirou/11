package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@TableName(value = "base_spec", autoResultMap = true)
public class BaseSpec {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String type;

    private String name;

    private String material;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> params;

    private BigDecimal unitPrice;

    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
