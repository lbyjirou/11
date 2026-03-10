package com.gxyide.pricing.enums;

import lombok.Getter;

@Getter
public enum SpecTypeEnum {
    COLLECTOR("COLLECTOR", "集流管"),
    FIN("FIN", "翅片"),
    TUBE("TUBE", "扁管"),
    COMPONENT("COMPONENT", "其他部件");

    private final String code;
    private final String name;

    SpecTypeEnum(String code, String name) {
        this.code = code;
        this.name = name;
    }
}
