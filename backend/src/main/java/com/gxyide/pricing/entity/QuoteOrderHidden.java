package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 报价单隐藏记录表
 */
@Data
@TableName("quote_order_hidden")
public class QuoteOrderHidden {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long orderId;

    private Long userId;

    private LocalDateTime hiddenAt;
}
