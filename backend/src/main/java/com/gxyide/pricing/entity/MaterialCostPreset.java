package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("material_cost_preset")
public class MaterialCostPreset {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    /** COLLECTOR / FIN / TUBE / FOLD_TUBE */
    private String type;

    private String spec;

    private BigDecimal factor;

    /** 集流管/扁管/折叠扁管用 */
    private BigDecimal weight;

    /** 翅片用 */
    private BigDecimal thickness;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
