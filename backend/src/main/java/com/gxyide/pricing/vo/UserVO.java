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
    private Set<String> roles;
    private Set<String> permissions;
}
