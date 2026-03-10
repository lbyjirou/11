package com.gxyide.pricing.dto;

import lombok.Data;

@Data
public class UserCreateDTO {
    private String username;
    private String password;
    private String realName;
    private String phone;
    private String role;
}
