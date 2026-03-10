package com.gxyide.pricing.dto;

import lombok.Data;
import java.math.BigDecimal;

/**
 * 物流信息保存请求DTO
 */
@Data
public class LogisticsSaveDTO {

    /** 报价单ID */
    private Long orderId;

    /** 包装类型ID */
    private Long packId;

    /** SNP-每箱装件数 */
    private Integer partsPerBox;

    /** 车型ID */
    private Long vehicleId;

    /** 每车装箱数 */
    private Integer boxesPerVehicle;

    /** 备注 */
    private String remark;

    /** 目的地 */
    private String destination;

    /** 物流公司名称 */
    private String companyName;

    /** 物流价格库运费（前端从价格库选择后传入，覆盖车型字典默认值） */
    private BigDecimal freightPrice;

    /** 车型名称（前端从价格库选择后传入） */
    private String vehicleType;

    // ==================== 上汽报价单 - 物流成本扩展字段 ====================

    /** 三方仓费用 */
    private BigDecimal warehouseFee;

    /** 运费 */
    private BigDecimal freightFee;

    /** 围板箱与海绵返回运费 */
    private BigDecimal returnFreightFee;

    /** 物流成本合计 */
    private BigDecimal totalLogisticsCost;
}
