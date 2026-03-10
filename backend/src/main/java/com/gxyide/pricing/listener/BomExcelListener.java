package com.gxyide.pricing.listener;

import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.event.AnalysisEventListener;
import com.gxyide.pricing.dto.excel.BomExcelRowDTO;
import com.gxyide.pricing.entity.QuoteBom;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Pattern;

/**
 * BOM Excel/CSV 解析监听器
 * 核心功能：将层次编码(1, 12.1, 12.1.1)转换为parent_id关系
 */
@Slf4j
public class BomExcelListener extends AnalysisEventListener<BomExcelRowDTO> {

    private static final Pattern LEVEL_PATTERN = Pattern.compile("^\\d+(\\.\\d+)*$");

    @Getter
    private final List<QuoteBom> bomList = new ArrayList<>();

    @Getter
    private final List<String> errors = new ArrayList<>();

    private final Long orderId;
    private int sortOrder = 0;

    // 层次编码 -> 临时ID 的映射（用于建立父子关系）
    private final Map<String, Integer> levelToTempId = new HashMap<>();

    public BomExcelListener(Long orderId) {
        this.orderId = orderId;
    }

    @Override
    public void invoke(BomExcelRowDTO row, AnalysisContext context) {
        int rowNum = context.readRowHolder().getRowIndex() + 1;

        // 跳过空行
        if (row.getLevelCode() == null || row.getLevelCode().trim().isEmpty()) {
            return;
        }

        String levelCode = row.getLevelCode().trim();

        // 校验层次格式
        if (!LEVEL_PATTERN.matcher(levelCode).matches()) {
            errors.add("第" + rowNum + "行: 层次格式错误 '" + levelCode + "'，应为数字或点分格式(如1, 12.1)");
            return;
        }

        // 校验必填字段
        if (row.getPartCode() == null || row.getPartCode().trim().isEmpty()) {
            errors.add("第" + rowNum + "行: 子物料编码不能为空");
            return;
        }
        if (row.getPartName() == null || row.getPartName().trim().isEmpty()) {
            errors.add("第" + rowNum + "行: 子物料名称不能为空");
            return;
        }

        // 构建BOM实体
        QuoteBom bom = new QuoteBom();
        bom.setOrderId(orderId);
        bom.setLevelCode(levelCode);
        bom.setLevelDepth(calculateDepth(levelCode));
        bom.setSortOrder(sortOrder++);

        bom.setPartCode(row.getPartCode().trim());
        bom.setPartName(row.getPartName().trim());
        bom.setPartSpec(row.getPartSpec());
        bom.setPartModel(row.getPartModel());
        bom.setMaterialName(row.getMaterialName());
        bom.setUnit(row.getUnit());
        bom.setDrawingNo(row.getDrawingNo());

        bom.setQuantity(row.getQuantity() != null ? row.getQuantity() : BigDecimal.ONE);
        bom.setBaseQuantity(row.getBaseQuantity() != null ? row.getBaseQuantity() : 1);
        bom.setLossRate(row.getLossRate());
        bom.setUnitPriceInclTax(row.getUnitPriceInclTax());
        bom.setAmountInclTax(row.getAmountInclTax());
        bom.setUnitPriceExclTax(row.getUnitPriceExclTax());

        bom.setPartType(row.getPartType());
        bom.setRemark(row.getRemark());

        // 记录临时ID映射
        int tempId = bomList.size();
        levelToTempId.put(levelCode, tempId);

        bomList.add(bom);
    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext context) {
        log.info("BOM解析完成，共{}条记录，{}个错误", bomList.size(), errors.size());

        // 第二遍：建立父子关系
        for (QuoteBom bom : bomList) {
            String parentLevelCode = getParentLevelCode(bom.getLevelCode());
            if (parentLevelCode != null) {
                Integer parentTempId = levelToTempId.get(parentLevelCode);
                if (parentTempId == null) {
                    errors.add("层次'" + bom.getLevelCode() + "'的父层次'" + parentLevelCode + "'不存在");
                } else {
                    // 标记父节点索引（后续保存时转换为真实ID）
                    bom.setParentId((long) parentTempId);
                }
            }
        }
    }

    /**
     * 计算层级深度
     * 1 -> 1, 12 -> 1, 12.1 -> 2, 12.1.1 -> 3
     */
    private int calculateDepth(String levelCode) {
        if (levelCode == null || levelCode.isEmpty()) {
            return 1;
        }
        int dotCount = 0;
        for (char c : levelCode.toCharArray()) {
            if (c == '.') {
                dotCount++;
            }
        }
        return dotCount + 1;
    }

    /**
     * 获取父层次编码
     * 12.1.1 -> 12.1
     * 12.1 -> 12
     * 12 -> null (顶级)
     * 1 -> null (顶级)
     */
    private String getParentLevelCode(String levelCode) {
        if (levelCode == null || levelCode.isEmpty()) {
            return null;
        }
        int lastDot = levelCode.lastIndexOf('.');
        if (lastDot == -1) {
            return null; // 顶级节点
        }
        return levelCode.substring(0, lastDot);
    }

    public boolean hasErrors() {
        return !errors.isEmpty();
    }
}
