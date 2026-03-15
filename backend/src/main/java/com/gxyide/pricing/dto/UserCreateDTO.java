package com.gxyide.pricing.dto;

import lombok.Data;

@Data
public class UserCreateDTO {
    private String username;
    private String password;
    private String realName;
    private String phone;
    private String role;
    private Long techUserId;
    private Long processUserId;
    private Long logisticsUserId;
    private Long techProcessUserId;
    private Long techLogisticsUserId;
    private Long processLogisticsUserId;
    private Long logisticsApproveUserId;
}
