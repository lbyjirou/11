package com.gxyide.pricing.enums;

import lombok.Getter;

/**
 * 系统角色枚举
 * 5角色 + 管理员
 */
@Getter
public enum RoleEnum {

    SALES("SALES", "销售员"),
    TECH("TECH", "技术工程师"),
    PROCESS("PROCESS", "工艺工程师"),
    LOGISTICS("LOGISTICS", "物流专员"),
    MANAGER("MANAGER", "报价经理"),
    ADMIN("ADMIN", "系统管理员");

    private final String code;
    private final String name;

    RoleEnum(String code, String name) {
        this.code = code;
        this.name = name;
    }

    public static RoleEnum fromCode(String code) {
        for (RoleEnum role : values()) {
            if (role.getCode().equals(code)) {
                return role;
            }
        }
        return null;
    }
}
