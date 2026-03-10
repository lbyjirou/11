package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("part_preset")
public class PartPreset {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String name;

    private String category;

    private String material;

    private String columnsJson;

    private String specTableJson;

    private String defaultValuesJson;

    private Integer hasProcessFee;

    private String processFeeLabel;

    private BigDecimal processFeeDefault;

    private String formulasJson;

    /** 材料预算系数JSON，如 {"type":"COLLECTOR","spec":"Φ16","factor":"0.38","weight":"0.38"} */
    private String materialCostJson;

    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
