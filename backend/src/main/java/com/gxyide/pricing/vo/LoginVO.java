package com.gxyide.pricing.vo;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
@Builder
public class LoginVO {
    private String token;
    private String username;
    private String realName;
    private String role;
    private Set<String> roles;
    private Set<String> permissions;
}
