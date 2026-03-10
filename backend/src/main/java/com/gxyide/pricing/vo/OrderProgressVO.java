package com.gxyide.pricing.vo;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class OrderProgressVO {

    private String currentStatus;
    private String currentStatusName;
    private List<StageInfo> stages;

    @Data
    @Builder
    public static class StageInfo {
        private String stage;
        private String stageName;
        private String state; // completed / current / pending
    }
}
