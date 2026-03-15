package com.gxyide.pricing.vo;

import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class UserVO {
    private Long id;
    private String username;
    private String realName;
    private String phone;
    private String role;
    private Integer status;
    private Long techUserId;
    private Long processUserId;
    private Long logisticsUserId;
    private Long techProcessUserId;
    private Long techLogisticsUserId;
    private Long processLogisticsUserId;
    private Long logisticsApproveUserId;
    private Set<String> roles;
    private Set<String> permissions;
}
