package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_user")
public class SysUser {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private String password;

    private String realName;

    private String phone;

    private String role;

    private Integer status;

    /** 归属技术员（销售用户可配置） */
    private Long techUserId;

    /** 归属生产员（销售用户可配置） */
    private Long processUserId;

    /** 归属物流员（销售用户可配置） */
    private Long logisticsUserId;

    /** 技术归属生产员（技术用户可配置） */
    private Long techProcessUserId;

    /** 技术归属物流员（技术用户可配置） */
    private Long techLogisticsUserId;

    /** 生产归属物流员（生产用户可配置） */
    private Long processLogisticsUserId;

    private Long logisticsApproveUserId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
