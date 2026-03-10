package com.gxyide.pricing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 报价单主表
 * 字段分为：销售填写字段(白底) + 计算字段(灰底,nullable)
 */
@Data
@TableName("quote_order")
public class QuoteOrder {

    @TableId(type = IdType.AUTO)
    private Long id;

    // ==================== 系统字段 ====================

    /** 报价单号（系统生成） */
    private String quoteNo;

    /** 创建人ID */
    private Long creatorId;

    /** 内部流程状态 */
    private String status;

    /** 当前处理人ID */
    private Long currentHandlerId;

    /** 驳回原因 */
    private String rejectReason;

    /** 是否处于修改流程: 0-否, 1-是 */
    private Integer isInModification;

    /** 修改发起阶段 */
    private String modificationInitiator;

    // ==================== 销售填写 - 商务信息 ====================

    /** 客户RFQ编号 */
    private String rfqId;

    /** 报价版本(V0/V1/V2...) */
    private String quoteVersion;

    /** 商业状态: DRAFT/SUBMITTED/AWARDED/LOST/EXPIRED */
    private String commercialStatus;

    /** 报价负责人 */
    private String owner;

    /** 客户名称 */
    private String customerName;

    /** OEM层级: OEM/TIER1/TIER2 */
    private String oemTier;

    /** 车型/项目代号 */
    private String vehicleProject;

    /** 量产日期(SOP) */
    private LocalDate sopDate;

    /** 停产日期(EOP) */
    private LocalDate eopDate;

    /** 当地货币 */
    private String currency;

    /** 贸易术语(EXW/FOB/CIF等) */
    private String incoterm;

    /** 交货地点 */
    private String deliveryLocation;

    /** 报价有效期 */
    private LocalDate validUntil;

    /** 年需求量-第1年 */
    @TableField("annual_volume_1y")
    private Integer annualVolume1y;

    /** 年需求量-第3年 */
    @TableField("annual_volume_3y")
    private Integer annualVolume3y;

    /** 年需求量-峰值 */
    @TableField("annual_volume_peak")
    private Integer annualVolumePeak;

    /** 爬坡计划(月度或季度JSON) */
    private String rampProfile;

    /** 模具是否客户分摊: 0-否 1-是 */
    private Integer moldShared;

    /** 模具分摊件数 */
    private Integer moldSharedQty;

    // ==================== 交期分配（销售按单设定，覆盖管理员默认值） ====================

    /** 交期模式: PERCENTAGE/FIXED_DAYS (null则用管理员默认) */
    private String deadlineMode;

    /** 技术环节分配值 */
    private Integer deadlineTech;

    /** 工序环节分配值 */
    private Integer deadlineProcess;

    /** 物流环节分配值 */
    private Integer deadlineLogistics;

    /** 审批环节分配值 */
    private Integer deadlineApprove;

    // ==================== 秒表计时器（固定天数模式用） ====================

    private LocalDateTime techActiveStart;
    private Long techElapsedSeconds;
    private LocalDateTime processActiveStart;
    private Long processElapsedSeconds;
    private LocalDateTime logisticsActiveStart;
    private Long logisticsElapsedSeconds;
    private LocalDateTime approveActiveStart;
    private Long approveElapsedSeconds;

    // ==================== 技术填写 - 产品规格 ====================

    /** 零件号 */
    private String partNo;

    /** 零件名称 */
    private String partName;

    /** 图纸号 */
    private String drawingNo;

    /** 图纸日期 */
    private LocalDate drawingDate;

    /** 总成尺寸-长(mm) */
    private BigDecimal sizeL;

    /** 总成尺寸-宽(mm) */
    private BigDecimal sizeW;

    /** 总成尺寸-高(mm) */
    private BigDecimal sizeH;

    /** 体积(L) */
    private BigDecimal volume;

    /** 芯体中心距(mm) */
    private BigDecimal coreCenter;

    /** 芯体宽度(mm) */
    private BigDecimal coreWidth;

    /** 芯体厚度(mm) */
    private BigDecimal coreThickness;

    /** 换热量(kW) */
    private BigDecimal heatExchange;

    /** 制冷剂类型 */
    private String refrigerant;

    /** 风速(m/s) */
    private BigDecimal windSpeed;

    /** 压降(kPa) */
    private BigDecimal pressureDrop;

    /** 技术Tab数据（JSON格式存储） */
    private String techDataJson;

    /** 物流Tab数据（JSON格式存储） */
    private String logisticsDataJson;

    /** 工艺工序数据（JSON格式存储） */
    private String processDataJson;

    /** 审批Tab数据（JSON格式存储） */
    private String approveDataJson;

    // ==================== 遗留字段（Excel导出依赖，保留兼容） ====================

    private Integer productionStartYear;
    private Integer annualQuantity;
    private Integer dailyQuantity;
    private String customerCode;
    private String projectName;
    private String shippingLocation;
    private String supplierName;
    private String supplierDuns;
    private String manufacturingLocation;
    private String manufacturerDuns;
    private String inquiryNo;
    private LocalDate inquiryDate;
    private LocalDate quoteDeadline;
    private String supplierRemark;
    private LocalDate quoteDate;
    private Integer quoteQuantity;
    private String registerAddress;
    private String factoryAddress;
    private String contactName;
    private String contactPhone;
    private String creatorName;
    private BigDecimal exchangeRate;
    private Integer hasImportParts;
    private Integer moldLife;
    private BigDecimal dailyWorkHours;
    private Integer weeklyWorkDays;

    // ==================== 计算字段（灰底，后续角色填写或系统计算） ====================

    /** 材料总成本 - 技术工程师 */
    private BigDecimal materialCost;

    /** 总直接人工成本 - 工艺工程师 */
    private BigDecimal laborCost;

    /** 制造费用 - 工艺工程师 */
    private BigDecimal manufacturingCost;

    /** 工装成本 - 工艺工程师 */
    private BigDecimal toolingCost;

    /** 总制造成本(材料+模具分摊+人工+制造费用) */
    private BigDecimal totalProductionCost;

    /** 物流费用 - 物流专员 */
    private BigDecimal logisticsCost;

    /** 包装费用 - 物流专员 */
    private BigDecimal packagingCost;

    /** 一般管理费用 - 报价经理 */
    private BigDecimal managementFee;

    /** 报废率(%) */
    private BigDecimal scrapRate;

    /** 报废损耗金额 */
    private BigDecimal scrapCost;

    /** 利润 - 报价经理 */
    private BigDecimal profit;

    /** 出厂价 */
    private BigDecimal factoryPrice;

    /** 管理费用(SG&A) - 报价经理(兼容旧字段) */
    private BigDecimal sgaCost;

    /** 利润金额 - 报价经理(兼容旧字段) */
    private BigDecimal profitAmount;

    /** 税率(%) */
    private BigDecimal taxRate;

    /** 不含税单价 */
    private BigDecimal unitPriceExclTax;

    /** 含税单价 */
    private BigDecimal unitPriceInclTax;

    /** 零件净重(KG) - 技术工程师 */
    private BigDecimal netWeight;

    /** 零件毛重(KG) - 技术工程师 */
    private BigDecimal grossWeight;

    // ==================== 时间戳 ====================

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
