package com.gxyide.pricing.enums;

import lombok.Getter;

/**
 * 报价单状态枚举
 * 对应5角色串行流程
 */
@Getter
public enum QuoteStatusEnum {

    DRAFT("DRAFT", "销售"),
    PENDING_TECH("PENDING_TECH", "技术"),
    PENDING_PROCESS("PENDING_PROCESS", "生产"),
    PENDING_LOGISTICS("PENDING_LOGISTICS", "物流"),
    PENDING_APPROVAL("PENDING_APPROVAL", "审批"),
    REJECTED("REJECTED", "已驳回"),
    APPROVED("APPROVED", "已批准"),
    ARCHIVED("ARCHIVED", "已归档");

    private final String code;
    private final String name;

    QuoteStatusEnum(String code, String name) {
        this.code = code;
        this.name = name;
    }

    public static QuoteStatusEnum fromCode(String code) {
        for (QuoteStatusEnum status : values()) {
            if (status.getCode().equals(code)) {
                return status;
            }
        }
        return null;
    }
}
