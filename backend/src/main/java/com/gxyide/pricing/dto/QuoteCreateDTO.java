package com.gxyide.pricing.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 销售创建/编辑报价单DTO
 * 仅包含销售可填写的商务信息字段
 */
@Data
public class QuoteCreateDTO {

    /** 客户RFQ编号 */
    private String rfqId;

    /** 内部报价编号（销售可填写） */
    private String quoteNo;

    /** 报价版本(V0/V1/V2...) */
    private String quoteVersion;

    /** 商业状态: DRAFT/SUBMITTED/AWARDED/LOST/EXPIRED */
    private String commercialStatus;

    /** 报价负责人 */
    private String owner;

    @NotBlank(message = "客户名称不能为空")
    private String customerName;

    /** OEM层级: OEM/TIER1/TIER2 */
    private String oemTier;

    /** 车型/项目代号 */
    private String vehicleProject;

    private LocalDate sopDate;

    private LocalDate eopDate;

    /** 币种 */
    private String currency;

    /** 贸易术语(EXW/FOB/CIF等) */
    private String incoterm;

    /** 交货地点 */
    private String deliveryLocation;

    /** 报价有效期 */
    private LocalDate validUntil;

    /** 年需求量-第1年 */
    private Integer annualVolume1y;

    /** 年需求量-第3年 */
    private Integer annualVolume3y;

    /** 年需求量-峰值 */
    private Integer annualVolumePeak;

    /** 爬坡计划(月度或季度JSON) */
    private String rampProfile;

    /** 模具是否客户分摊: 0-否 1-是 */
    private Integer moldShared;

    /** 模具分摊件数 */
    private Integer moldSharedQty;

    /** 交期模式: PERCENTAGE/FIXED_DAYS */
    private String deadlineMode;
    private Integer deadlineTech;
    private Integer deadlineProcess;
    private Integer deadlineLogistics;
    private Integer deadlineApprove;

    // ==================== 技术填写 - 产品规格 ====================

    private String partNo;
    private BigDecimal sizeL;
    private BigDecimal sizeW;
    private BigDecimal sizeH;
    private BigDecimal volume;
    private BigDecimal coreCenter;
    private BigDecimal coreWidth;
    private BigDecimal coreThickness;
    private BigDecimal heatExchange;
    private String refrigerant;
    private BigDecimal windSpeed;
    private BigDecimal pressureDrop;

    // ==================== 其他角色通过同一接口更新的字段 ====================

    private String techDataJson;
    private String logisticsDataJson;
    private String processDataJson;
    private String approveDataJson;
}
