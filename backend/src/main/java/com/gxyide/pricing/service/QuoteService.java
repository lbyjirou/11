package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.dto.QuoteCalculateDTO;
import com.gxyide.pricing.dto.QuoteCreateDTO;
import com.gxyide.pricing.entity.QuoteOrder;
import com.gxyide.pricing.entity.StageDeadline;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.enums.CommercialStatusEnum;
import com.gxyide.pricing.enums.QuoteStatusEnum;
import com.gxyide.pricing.mapper.QuoteOrderMapper;
import com.gxyide.pricing.mapper.QuoteOrderHiddenMapper;
import com.gxyide.pricing.mapper.SysUserMapper;
import com.gxyide.pricing.entity.QuoteOrderHidden;
import com.gxyide.pricing.utils.CalcUtils;
import com.gxyide.pricing.vo.LogisticsQuoteVO;
import com.gxyide.pricing.vo.OrderProgressVO;
import com.gxyide.pricing.vo.QuoteListVO;
import com.gxyide.pricing.vo.QuoteResultVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuoteService extends ServiceImpl<QuoteOrderMapper, QuoteOrder> {

    private final ConfigService configService;
    private final LogisticsService logisticsService;
    private final SysUserMapper sysUserMapper;
    private final QuoteOrderHiddenMapper hiddenMapper;
    private final QuoteModificationService modificationService;
    private final DeadlineService deadlineService;

    /**
     * 销售员创建报价单
     */
    public Long createQuote(QuoteCreateDTO dto, Long creatorId) {
        QuoteOrder order = new QuoteOrder();
        BeanUtils.copyProperties(dto, order);

        // 报价单号：优先使用销售填写的，否则自动生成
        if (dto.getQuoteNo() != null && !dto.getQuoteNo().isBlank()) {
            order.setQuoteNo(dto.getQuoteNo());
        } else {
            String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String randomStr = String.format("%04d", (int) (Math.random() * 10000));
            order.setQuoteNo("QT" + dateStr + randomStr);
        }

        order.setCreatorId(creatorId);
        order.setStatus(QuoteStatusEnum.DRAFT.getCode());
        order.setCurrentHandlerId(creatorId);

        // 销售新字段默认值
        if (order.getQuoteVersion() == null) {
            order.setQuoteVersion("V0");
        }
        if (order.getCommercialStatus() == null) {
            order.setCommercialStatus(CommercialStatusEnum.DRAFT.getCode());
        }

        save(order);
        return order.getId();
    }

    /**
     * 查询报价单列表（排除当前用户已隐藏的）
     * @param status 支持逗号分隔的多状态查询
     */
    public Page<QuoteListVO> listQuotes(Page<QuoteOrder> page, Long userId, String role, String status) {
        LambdaQueryWrapper<QuoteOrder> wrapper = new LambdaQueryWrapper<>();

        // 排除当前用户已隐藏的报价单
        List<Long> hiddenIds = hiddenMapper.selectHiddenOrderIds(userId);
        if (!hiddenIds.isEmpty()) {
            wrapper.notIn(QuoteOrder::getId, hiddenIds);
        }

        // 状态筛选（支持逗号分隔的多状态）
        if (status != null && !status.isEmpty()) {
            if (status.contains(",")) {
                List<String> statuses = List.of(status.split(","));
                wrapper.in(QuoteOrder::getStatus, statuses);
            } else {
                wrapper.eq(QuoteOrder::getStatus, status);
            }
        }

        // 根据角色过滤数据范围
        if ("SALES".equals(role)) {
            wrapper.eq(QuoteOrder::getCreatorId, userId);
        }

        wrapper.orderByDesc(QuoteOrder::getCreateTime);
        Page<QuoteOrder> orderPage = page(page, wrapper);

        Page<QuoteListVO> voPage = new Page<>(orderPage.getCurrent(), orderPage.getSize(), orderPage.getTotal());
        List<QuoteListVO> voList = orderPage.getRecords().stream()
                .map(this::convertToListVO)
                .collect(Collectors.toList());
        voPage.setRecords(voList);

        return voPage;
    }

    private QuoteListVO convertToListVO(QuoteOrder order) {
        QuoteListVO vo = new QuoteListVO();
        BeanUtils.copyProperties(order, vo);

        // 内部流程状态名称
        QuoteStatusEnum statusEnum = QuoteStatusEnum.fromCode(order.getStatus());
        vo.setStatusName(statusEnum != null ? statusEnum.getName() : order.getStatus());

        // 商业状态名称
        CommercialStatusEnum csEnum = CommercialStatusEnum.fromCode(order.getCommercialStatus());
        vo.setCommercialStatusName(csEnum != null ? csEnum.getName() : order.getCommercialStatus());

        // 创建人名称
        if (order.getCreatorId() != null) {
            SysUser creator = sysUserMapper.selectById(order.getCreatorId());
            vo.setCreatorName(creator != null ? creator.getRealName() : null);
        }

        // 当前处理人名称
        if (order.getCurrentHandlerId() != null) {
            SysUser handler = sysUserMapper.selectById(order.getCurrentHandlerId());
            vo.setCurrentHandlerName(handler != null ? handler.getRealName() : null);
        }

        // 超期信息
        List<StageDeadline> deadlines = deadlineService.getDeadlines(order.getId());
        for (StageDeadline sd : deadlines) {
            if (sd.getStage().equals(order.getStatus())) {
                vo.setStageDeadline(sd.getDeadline());
                vo.setOverdue(sd.getDeadline().isBefore(java.time.LocalDateTime.now()));
                break;
            }
        }

        return vo;
    }

    /**
     * 角色感知更新：只更新当前角色负责的字段，避免覆盖其他角色数据
     */
    public void updateQuote(Long id, QuoteCreateDTO dto, String role) {
        QuoteOrder order = getById(id);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }
        if ("ADMIN".equals(role)) {
            BeanUtils.copyProperties(dto, order);
        } else {
            applySalesFields(order, dto);
            if ("TECH".equals(role)) {
                applyTechFields(order, dto);
            } else if ("PROCESS".equals(role)) {
                applyProcessFields(order, dto);
            } else if ("LOGISTICS".equals(role)) {
                applyLogisticsFields(order, dto);
            } else if ("MANAGER".equals(role)) {
                applyApproveFields(order, dto);
            }
        }
        updateById(order);
    }

    /**
     * 销售员提交报价单（流转到技术工程师）
     * @return 新状态枚举
     */
    public QuoteStatusEnum submitToTech(Long quoteId) {
        QuoteOrder order = getById(quoteId);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }
        if (!QuoteStatusEnum.DRAFT.getCode().equals(order.getStatus())) {
            throw new RuntimeException("只有草稿状态的报价单可以提交");
        }
        order.setStatus(QuoteStatusEnum.PENDING_TECH.getCode());
        order.setCurrentHandlerId(null);

        // 首次提交时计算各环节截止时间
        deadlineService.calculateDeadlines(order);
        // 启动技术环节计时器
        deadlineService.startStageTimer(order, "TECH");

        updateById(order);

        modificationService.saveSnapshot(quoteId, "SALES", order.getCreatorId(), null);

        return QuoteStatusEnum.PENDING_TECH;
    }

    /**
     * 推进报价单状态到下一阶段
     * @return 新状态枚举
     */
    public QuoteStatusEnum advanceStatus(Long quoteId, String role) {
        QuoteOrder order = getById(quoteId);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }
        String currentStatus = order.getStatus();
        String nextStatus;

        switch (role) {
            case "TECH":
                if (!QuoteStatusEnum.PENDING_TECH.getCode().equals(currentStatus)) {
                    throw new RuntimeException("当前状态不允许技术提交");
                }
                deadlineService.pauseStageTimer(order, "TECH");
                deadlineService.startStageTimer(order, "PROCESS");
                nextStatus = QuoteStatusEnum.PENDING_PROCESS.getCode();
                break;
            case "PROCESS":
                if (!QuoteStatusEnum.PENDING_PROCESS.getCode().equals(currentStatus)) {
                    throw new RuntimeException("当前状态不允许工艺提交");
                }
                deadlineService.pauseStageTimer(order, "PROCESS");
                deadlineService.startStageTimer(order, "LOGISTICS");
                nextStatus = QuoteStatusEnum.PENDING_LOGISTICS.getCode();
                break;
            case "LOGISTICS":
                if (!QuoteStatusEnum.PENDING_LOGISTICS.getCode().equals(currentStatus)) {
                    throw new RuntimeException("当前状态不允许物流提交");
                }
                deadlineService.pauseStageTimer(order, "LOGISTICS");
                deadlineService.startStageTimer(order, "APPROVAL");
                nextStatus = QuoteStatusEnum.PENDING_APPROVAL.getCode();
                break;
            case "ADMIN":
                nextStatus = getNextStatus(currentStatus);
                if (nextStatus == null) {
                    throw new RuntimeException("当前状态无法继续推进");
                }
                deadlineService.pauseAllTimers(order);
                break;
            default:
                throw new RuntimeException("当前角色无权推进状态");
        }

        order.setStatus(nextStatus);
        order.setCurrentHandlerId(null);
        updateById(order);

        // 保存阶段快照
        String stage = roleToStage(role);
        if (stage != null) {
            modificationService.saveSnapshot(quoteId, stage, null, null);
        }

        return QuoteStatusEnum.fromCode(nextStatus);
    }

    private String roleToStage(String role) {
        return switch (role) {
            case "SALES" -> "SALES";
            case "TECH" -> "TECH";
            case "PROCESS" -> "PROCESS";
            case "LOGISTICS" -> "LOGISTICS";
            case "MANAGER" -> "APPROVAL";
            default -> null;
        };
    }

    private String getNextStatus(String currentStatus) {
        if (QuoteStatusEnum.PENDING_TECH.getCode().equals(currentStatus)) {
            return QuoteStatusEnum.PENDING_PROCESS.getCode();
        }
        if (QuoteStatusEnum.PENDING_PROCESS.getCode().equals(currentStatus)) {
            return QuoteStatusEnum.PENDING_LOGISTICS.getCode();
        }
        if (QuoteStatusEnum.PENDING_LOGISTICS.getCode().equals(currentStatus)) {
            return QuoteStatusEnum.PENDING_APPROVAL.getCode();
        }
        return null;
    }

    private static final List<QuoteStatusEnum> WORKFLOW_STAGES = List.of(
        QuoteStatusEnum.DRAFT,
        QuoteStatusEnum.PENDING_TECH,
        QuoteStatusEnum.PENDING_PROCESS,
        QuoteStatusEnum.PENDING_LOGISTICS,
        QuoteStatusEnum.PENDING_APPROVAL,
        QuoteStatusEnum.APPROVED
    );

    public OrderProgressVO getOrderProgress(Long orderId) {
        QuoteOrder order = getById(orderId);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }
        QuoteStatusEnum current = QuoteStatusEnum.fromCode(order.getStatus());
        int currentIdx = WORKFLOW_STAGES.indexOf(current);
        // REJECTED / ARCHIVED 特殊处理
        if (current == QuoteStatusEnum.REJECTED) {
            currentIdx = -1;
        } else if (current == QuoteStatusEnum.ARCHIVED) {
            currentIdx = WORKFLOW_STAGES.size();
        }

        List<OrderProgressVO.StageInfo> stages = new ArrayList<>();
        for (int i = 0; i < WORKFLOW_STAGES.size(); i++) {
            QuoteStatusEnum stage = WORKFLOW_STAGES.get(i);
            String state;
            if (current == QuoteStatusEnum.REJECTED) {
                state = "rejected";
            } else if (i < currentIdx) {
                state = "completed";
            } else if (i == currentIdx) {
                state = "current";
            } else {
                state = "pending";
            }
            stages.add(OrderProgressVO.StageInfo.builder()
                .stage(stage.getCode())
                .stageName(stage.getName())
                .state(state)
                .build());
        }

        return OrderProgressVO.builder()
            .currentStatus(order.getStatus())
            .currentStatusName(current != null ? current.getName() : order.getStatus())
            .stages(stages)
            .build();
    }

    // ==================== 保留原有计算逻辑 ====================

    public QuoteResultVO calculate(QuoteCalculateDTO dto) {
        BigDecimal alPrice = dto.getAlPrice() != null ? dto.getAlPrice() : configService.getAluminumPrice();

        List<QuoteResultVO.MaterialItem> collectorItems = new ArrayList<>();
        List<QuoteResultVO.MaterialItem> finItems = new ArrayList<>();
        List<QuoteResultVO.MaterialItem> tubeItems = new ArrayList<>();
        List<QuoteResultVO.ProcessCostItem> processItems = new ArrayList<>();

        BigDecimal materialCost = BigDecimal.ZERO;
        BigDecimal processCost = BigDecimal.ZERO;

        if (dto.getCollectors() != null) {
            for (QuoteCalculateDTO.CollectorItem item : dto.getCollectors()) {
                BigDecimal weight = CalcUtils.calcCollectorWeight(item.getArea(), item.getLength());
                BigDecimal unitPrice = CalcUtils.calcCollectorPrice(weight, alPrice, item.getFee());
                BigDecimal subtotal = unitPrice.multiply(new BigDecimal(item.getCount()));
                materialCost = materialCost.add(subtotal);

                collectorItems.add(QuoteResultVO.MaterialItem.builder()
                        .name(item.getName())
                        .weight(weight)
                        .unitPrice(unitPrice)
                        .count(item.getCount())
                        .subtotal(subtotal.setScale(2, RoundingMode.HALF_UP))
                        .build());
            }
        }

        if (dto.getFins() != null) {
            for (QuoteCalculateDTO.FinItem item : dto.getFins()) {
                BigDecimal weight = CalcUtils.calcFinWeight(
                        item.getWidth(), item.getWaveLen(), item.getWaveCount(), item.getThickness());
                BigDecimal unitPrice = CalcUtils.calcFinPrice(weight, alPrice, item.getFee(), item.getPartFee());
                BigDecimal subtotal = unitPrice.multiply(new BigDecimal(item.getCount()));
                materialCost = materialCost.add(subtotal);

                finItems.add(QuoteResultVO.MaterialItem.builder()
                        .name(item.getName())
                        .weight(weight)
                        .unitPrice(unitPrice)
                        .count(item.getCount())
                        .subtotal(subtotal.setScale(2, RoundingMode.HALF_UP))
                        .build());
            }
        }

        if (dto.getTubes() != null) {
            for (QuoteCalculateDTO.TubeItem item : dto.getTubes()) {
                BigDecimal weight = CalcUtils.calcTubeWeight(item.getMeterWeight(), item.getLength());
                BigDecimal fee = Boolean.TRUE.equals(item.getIsZinc()) ?
                        new BigDecimal("11.9") : item.getFee();
                BigDecimal unitPrice = CalcUtils.calcTubePrice(weight, alPrice, fee);
                BigDecimal subtotal = unitPrice.multiply(new BigDecimal(item.getCount()));
                materialCost = materialCost.add(subtotal);

                tubeItems.add(QuoteResultVO.MaterialItem.builder()
                        .name(item.getName())
                        .weight(weight)
                        .unitPrice(unitPrice)
                        .count(item.getCount())
                        .subtotal(subtotal.setScale(2, RoundingMode.HALF_UP))
                        .build());
            }
        }

        if (dto.getProcesses() != null) {
            for (QuoteCalculateDTO.ProcessItem item : dto.getProcesses()) {
                BigDecimal subtotal = item.getUnitPrice().multiply(new BigDecimal(item.getCount()));
                processCost = processCost.add(subtotal);

                processItems.add(QuoteResultVO.ProcessCostItem.builder()
                        .processName(item.getProcessName())
                        .unitPrice(item.getUnitPrice())
                        .count(item.getCount())
                        .subtotal(subtotal.setScale(2, RoundingMode.HALF_UP))
                        .build());
            }
        }

        BigDecimal profit = CalcUtils.calcProfit(materialCost, processCost);

        BigDecimal logisticsCost = BigDecimal.ZERO;
        LogisticsQuoteVO logisticsQuote = null;

        if (dto.getTotalVolume() != null && dto.getTotalVolume().compareTo(BigDecimal.ZERO) > 0) {
            String direction = dto.getLogisticsDirection();
            if ("INBOUND".equals(direction) && dto.getOrigin() != null) {
                logisticsQuote = logisticsService.calculateInboundQuote(dto.getOrigin(), dto.getTotalVolume());
            } else if (dto.getDestination() != null) {
                logisticsQuote = logisticsService.calculateOutboundQuote(dto.getDestination(), dto.getTotalVolume());
            }
            if (logisticsQuote != null && logisticsQuote.getRecommended() != null) {
                logisticsCost = logisticsQuote.getRecommended().getPrice();
            }
        }

        BigDecimal totalPrice = CalcUtils.calcFinalPrice(materialCost, processCost, profit, logisticsCost);
        BigDecimal unitPrice = dto.getQuantity() != null && dto.getQuantity() > 0 ?
                totalPrice.divide(new BigDecimal(dto.getQuantity()), 2, RoundingMode.HALF_UP) : totalPrice;

        return QuoteResultVO.builder()
                .customerName(dto.getCustomerName())
                .productType(dto.getProductType())
                .quantity(dto.getQuantity())
                .alPrice(alPrice)
                .collectors(collectorItems)
                .fins(finItems)
                .tubes(tubeItems)
                .processes(processItems)
                .materialCost(materialCost.setScale(2, RoundingMode.HALF_UP))
                .processCost(processCost.setScale(2, RoundingMode.HALF_UP))
                .profit(profit)
                .logisticsCost(logisticsCost)
                .totalPrice(totalPrice)
                .unitPrice(unitPrice)
                .build();
    }

    /**
     * 隐藏报价单（个人视图隐藏，不影响其他用户）
     */
    public void hideOrder(Long orderId, Long userId) {
        QuoteOrder order = getById(orderId);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }
        LambdaQueryWrapper<QuoteOrderHidden> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(QuoteOrderHidden::getOrderId, orderId)
               .eq(QuoteOrderHidden::getUserId, userId);
        if (hiddenMapper.selectCount(wrapper) > 0) {
            return;
        }
        QuoteOrderHidden hidden = new QuoteOrderHidden();
        hidden.setOrderId(orderId);
        hidden.setUserId(userId);
        hiddenMapper.insert(hidden);
    }

    /**
     * 取消隐藏报价单
     */
    public void unhideOrder(Long orderId, Long userId) {
        LambdaQueryWrapper<QuoteOrderHidden> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(QuoteOrderHidden::getOrderId, orderId)
               .eq(QuoteOrderHidden::getUserId, userId);
        hiddenMapper.delete(wrapper);
    }

    /**
     * 获取当前角色的待处理数量
     */
    public Map<String, Integer> getPendingCount(Long userId, String role) {
        Map<String, Integer> result = new HashMap<>();
        List<Long> hiddenIds = hiddenMapper.selectHiddenOrderIds(userId);

        switch (role) {
            case "SALES":
                result.put("pending", countByStatusAndCreator(
                    List.of(QuoteStatusEnum.DRAFT.getCode(), QuoteStatusEnum.REJECTED.getCode()),
                    userId, hiddenIds));
                break;
            case "TECH":
                result.put("pending", countByStatus(QuoteStatusEnum.PENDING_TECH.getCode(), hiddenIds));
                break;
            case "PROCESS":
                result.put("pending", countByStatus(QuoteStatusEnum.PENDING_PROCESS.getCode(), hiddenIds));
                break;
            case "LOGISTICS":
                result.put("pending", countByStatus(QuoteStatusEnum.PENDING_LOGISTICS.getCode(), hiddenIds));
                break;
            case "MANAGER":
                result.put("pending", countByStatus(QuoteStatusEnum.PENDING_APPROVAL.getCode(), hiddenIds));
                break;
            case "ADMIN":
                result.put("pending", 0);
                break;
            default:
                result.put("pending", 0);
        }
        return result;
    }

    private Integer countByStatus(String status, List<Long> hiddenIds) {
        LambdaQueryWrapper<QuoteOrder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(QuoteOrder::getStatus, status);
        if (!hiddenIds.isEmpty()) {
            wrapper.notIn(QuoteOrder::getId, hiddenIds);
        }
        return Math.toIntExact(count(wrapper));
    }

    private Integer countByStatusAndCreator(List<String> statuses, Long creatorId, List<Long> hiddenIds) {
        LambdaQueryWrapper<QuoteOrder> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(QuoteOrder::getStatus, statuses)
               .eq(QuoteOrder::getCreatorId, creatorId);
        if (!hiddenIds.isEmpty()) {
            wrapper.notIn(QuoteOrder::getId, hiddenIds);
        }
        return Math.toIntExact(count(wrapper));
    }

    // ==================== 角色字段映射 ====================

    private void applySalesFields(QuoteOrder o, QuoteCreateDTO d) {
        o.setRfqId(d.getRfqId());
        if (d.getQuoteNo() != null && !d.getQuoteNo().isBlank()) {
            o.setQuoteNo(d.getQuoteNo());
        }
        o.setQuoteVersion(d.getQuoteVersion());
        o.setCommercialStatus(d.getCommercialStatus());
        o.setOwner(d.getOwner());
        o.setCustomerName(d.getCustomerName());
        o.setOemTier(d.getOemTier());
        o.setVehicleProject(d.getVehicleProject());
        o.setSopDate(d.getSopDate());
        o.setEopDate(d.getEopDate());
        o.setCurrency(d.getCurrency());
        o.setIncoterm(d.getIncoterm());
        o.setDeliveryLocation(d.getDeliveryLocation());
        o.setValidUntil(d.getValidUntil());
        o.setAnnualVolume1y(d.getAnnualVolume1y());
        o.setAnnualVolume3y(d.getAnnualVolume3y());
        o.setAnnualVolumePeak(d.getAnnualVolumePeak());
        o.setRampProfile(d.getRampProfile());
        o.setMoldShared(d.getMoldShared());
        o.setMoldSharedQty(d.getMoldSharedQty());
        o.setDeadlineMode(d.getDeadlineMode());
        o.setDeadlineTech(d.getDeadlineTech());
        o.setDeadlineProcess(d.getDeadlineProcess());
        o.setDeadlineLogistics(d.getDeadlineLogistics());
        o.setDeadlineApprove(d.getDeadlineApprove());
    }

    private void applyTechFields(QuoteOrder o, QuoteCreateDTO d) {
        o.setTechDataJson(d.getTechDataJson());
        o.setPartNo(d.getPartNo());
        o.setSizeL(d.getSizeL());
        o.setSizeW(d.getSizeW());
        o.setSizeH(d.getSizeH());
        o.setVolume(d.getVolume());
        o.setCoreCenter(d.getCoreCenter());
        o.setCoreWidth(d.getCoreWidth());
        o.setCoreThickness(d.getCoreThickness());
        o.setHeatExchange(d.getHeatExchange());
        o.setRefrigerant(d.getRefrigerant());
        o.setWindSpeed(d.getWindSpeed());
        o.setPressureDrop(d.getPressureDrop());
    }

    private void applyProcessFields(QuoteOrder o, QuoteCreateDTO d) {
        o.setProcessDataJson(d.getProcessDataJson());
    }

    private void applyLogisticsFields(QuoteOrder o, QuoteCreateDTO d) {
        o.setLogisticsDataJson(d.getLogisticsDataJson());
    }

    private void applyApproveFields(QuoteOrder o, QuoteCreateDTO d) {
        o.setApproveDataJson(d.getApproveDataJson());
    }
}
