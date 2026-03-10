package com.gxyide.pricing.dto.excel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 导入结果 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogisticsImportResultDTO {

    /** 是否成功 */
    private Boolean success;

    /** 新增条数 */
    private Integer insertedCount;

    /** 更新条数 */
    private Integer updatedCount;

    /** 失败条数 */
    private Integer failedCount;

    /** 总处理条数 */
    private Integer totalCount;

    /** 错误信息 */
    private String errorMessage;
}
