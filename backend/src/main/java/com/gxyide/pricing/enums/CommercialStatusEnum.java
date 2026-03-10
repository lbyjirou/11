package com.gxyide.pricing.enums;

import lombok.Getter;

/**
 * 报价单商业状态枚举
 * 由销售维护，表示报价在客户侧的商业进展
 */
@Getter
public enum CommercialStatusEnum {

    DRAFT("DRAFT", "草稿"),
    SUBMITTED("SUBMITTED", "已提交客户"),
    AWARDED("AWARDED", "已中标"),
    LOST("LOST", "已落标"),
    EXPIRED("EXPIRED", "已过期");

    private final String code;
    private final String name;

    CommercialStatusEnum(String code, String name) {
        this.code = code;
        this.name = name;
    }

    public static CommercialStatusEnum fromCode(String code) {
        for (CommercialStatusEnum s : values()) {
            if (s.getCode().equals(code)) {
                return s;
            }
        }
        return null;
    }
}
