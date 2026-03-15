package com.gxyide.pricing.service;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.dto.BomNodeDTO;
import com.gxyide.pricing.dto.excel.BomExcelRowDTO;
import com.gxyide.pricing.entity.QuoteBom;
import com.gxyide.pricing.entity.QuoteOrder;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.enums.QuoteStatusEnum;
import com.gxyide.pricing.listener.BomExcelListener;
import com.gxyide.pricing.mapper.QuoteBomMapper;
import com.gxyide.pricing.mapper.QuoteOrderMapper;
import com.gxyide.pricing.mapper.SysUserMapper;
import com.gxyide.pricing.vo.BomTreeNodeVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BomService extends ServiceImpl<QuoteBomMapper, QuoteBom> {

    private final QuoteBomMapper bomMapper;
    private final QuoteOrderMapper orderMapper;
    private final SysUserMapper sysUserMapper;

    // ==================== BOM 编辑器 CRUD ====================

    /**
     * 新增BOM节点
     */
    @Transactional(rollbackFor = Exception.class)
    public QuoteBom addNode(BomNodeDTO dto) {
        // 校验报价单
        QuoteOrder order = orderMapper.selectById(dto.getOrderId());
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }
        if (!QuoteStatusEnum.PENDING_TECH.getCode().equals(order.getStatus())) {
            throw new RuntimeException("只有技术状态的报价单可以编辑BOM");
        }

        QuoteBom bom = new QuoteBom();
        BeanUtils.copyProperties(dto, bom);

        // 计算层级
        if (dto.getParentId() != null) {
            QuoteBom parent = getById(dto.getParentId());
            if (parent == null) {
                throw new RuntimeException("父节点不存在");
            }
            bom.setLevelDepth(parent.getLevelDepth() + 1);
        } else {
            bom.setLevelDepth(1);
        }

        // 计算排序（同级最大+1）
        Integer maxSort = bomMapper.selectMaxSortOrder(dto.getOrderId(), dto.getParentId());
        bom.setSortOrder(maxSort != null ? maxSort + 1 : 1);

        // 默认数量为1
        if (bom.getQuantity() == null) {
            bom.setQuantity(BigDecimal.ONE);
        }

        save(bom);
        log.info("新增BOM节点: orderId={}, partName={}, id={}", dto.getOrderId(), dto.getPartName(), bom.getId());
        return bom;
    }

    /**
     * 修改BOM节点
     */
    @Transactional(rollbackFor = Exception.class)
    public QuoteBom updateNode(BomNodeDTO dto) {
        if (dto.getId() == null) {
            throw new RuntimeException("节点ID不能为空");
        }

        QuoteBom bom = getById(dto.getId());
        if (bom == null) {
            throw new RuntimeException("BOM节点不存在");
        }

        // 校验报价单状态
        QuoteOrder order = orderMapper.selectById(bom.getOrderId());
        if (order == null || !QuoteStatusEnum.PENDING_TECH.getCode().equals(order.getStatus())) {
            throw new RuntimeException("只有技术状态的报价单可以编辑BOM");
        }

        // 参数校验：毛重不能小于净重
        if (dto.getGrossWeight() != null && dto.getNetWeight() != null) {
            if (dto.getGrossWeight().compareTo(dto.getNetWeight()) < 0) {
                throw new RuntimeException("毛重不能小于净重");
            }
        }

        // 更新字段
        if (dto.getPartName() != null) bom.setPartName(dto.getPartName());
        if (dto.getPartCode() != null) bom.setPartCode(dto.getPartCode());
        if (dto.getMaterialGrade() != null) bom.setMaterialGrade(dto.getMaterialGrade());
        if (dto.getSpecDesc() != null) bom.setSpecDesc(dto.getSpecDesc());
        if (dto.getNetWeight() != null) bom.setNetWeight(dto.getNetWeight());
        if (dto.getGrossWeight() != null) bom.setGrossWeight(dto.getGrossWeight());
        if (dto.getScrapRate() != null) bom.setScrapRate(dto.getScrapRate());
        if (dto.getTechNote() != null) bom.setTechNote(dto.getTechNote());
        if (dto.getQuantity() != null) bom.setQuantity(dto.getQuantity());
        if (dto.getUnit() != null) bom.setUnit(dto.getUnit());
        if (dto.getDrawingNo() != null) bom.setDrawingNo(dto.getDrawingNo());
        if (dto.getIsPurchased() != null) bom.setIsPurchased(dto.getIsPurchased());
        if (dto.getSupplierName() != null) bom.setSupplierName(dto.getSupplierName());

        // 上汽报价单 - 材料成本扩展字段
        if (dto.getPurchaseType() != null) bom.setPurchaseType(dto.getPurchaseType());
        if (dto.getMaterialTotalCost() != null) bom.setMaterialTotalCost(dto.getMaterialTotalCost());
        if (dto.getMaterialName() != null) bom.setMaterialName(dto.getMaterialName());
        if (dto.getMaterialSupplier() != null) bom.setMaterialSupplier(dto.getMaterialSupplier());
        if (dto.getMaterialSupplierDuns() != null) bom.setMaterialSupplierDuns(dto.getMaterialSupplierDuns());
        if (dto.getUnitPriceInclTax() != null) bom.setUnitPriceInclTax(dto.getUnitPriceInclTax());
        if (dto.getAmountInclTax() != null) bom.setAmountInclTax(dto.getAmountInclTax());
        if (dto.getUnitPriceExclTax() != null) bom.setUnitPriceExclTax(dto.getUnitPriceExclTax());

        updateById(bom);

        // 自动递归更新父节点重量
        recalculateParentWeight(bom.getParentId());

        log.info("更新BOM节点: id={}, partName={}", dto.getId(), dto.getPartName());
        return bom;
    }

    /**
     * 删除BOM节点（级联删除子节点）
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteNode(Long id) {
        QuoteBom bom = getById(id);
        if (bom == null) {
            throw new RuntimeException("BOM节点不存在");
        }

        // 校验报价单状态
        QuoteOrder order = orderMapper.selectById(bom.getOrderId());
        if (order == null || !QuoteStatusEnum.PENDING_TECH.getCode().equals(order.getStatus())) {
            throw new RuntimeException("只有技术状态的报价单可以编辑BOM");
        }

        Long parentId = bom.getParentId();

        // 递归删除子节点
        deleteNodeAndChildren(id);

        // 重新计算父节点重量
        if (parentId != null) {
            recalculateParentWeight(parentId);
        }

        log.info("删除BOM节点: id={}", id);
    }

    /**
     * 递归删除节点及其子节点
     */
    private void deleteNodeAndChildren(Long id) {
        List<QuoteBom> children = bomMapper.selectByParentId(id);
        for (QuoteBom child : children) {
            deleteNodeAndChildren(child.getId());
        }
        removeById(id);
    }

    /**
     * 获取完整BOM树
     */
    public List<BomTreeNodeVO> getBomTree(Long orderId) {
        List<QuoteBom> allBoms = bomMapper.selectByOrderId(orderId);
        if (allBoms.isEmpty()) {
            return new ArrayList<>();
        }

        // 转换为VO
        Map<Long, BomTreeNodeVO> voMap = new HashMap<>();
        for (QuoteBom bom : allBoms) {
            BomTreeNodeVO vo = convertToTreeNode(bom);
            voMap.put(bom.getId(), vo);
        }

        // 构建树
        List<BomTreeNodeVO> roots = new ArrayList<>();
        for (QuoteBom bom : allBoms) {
            BomTreeNodeVO vo = voMap.get(bom.getId());
            if (bom.getParentId() == null) {
                roots.add(vo);
            } else {
                BomTreeNodeVO parent = voMap.get(bom.getParentId());
                if (parent != null) {
                    if (parent.getChildren() == null) {
                        parent.setChildren(new ArrayList<>());
                    }
                    parent.getChildren().add(vo);
                }
            }
        }

        // 排序
        sortTree(roots);
        return roots;
    }

    private BomTreeNodeVO convertToTreeNode(QuoteBom bom) {
        BomTreeNodeVO vo = new BomTreeNodeVO();
        vo.setId(bom.getId());
        vo.setOrderId(bom.getOrderId());
        vo.setParentId(bom.getParentId());
        vo.setLevel(bom.getLevelDepth());
        vo.setSortOrder(bom.getSortOrder());
        vo.setPartName(bom.getPartName());
        vo.setPartCode(bom.getPartCode());
        vo.setMaterialGrade(bom.getMaterialGrade());
        vo.setSpecDesc(bom.getSpecDesc());
        vo.setNetWeight(bom.getNetWeight());
        vo.setGrossWeight(bom.getGrossWeight());
        vo.setScrapRate(bom.getScrapRate());
        vo.setTechNote(bom.getTechNote());
        vo.setQuantity(bom.getQuantity());
        vo.setUnit(bom.getUnit());
        vo.setDrawingNo(bom.getDrawingNo());
        vo.setIsPurchased(bom.getIsPurchased());
        vo.setSupplierName(bom.getSupplierName());
        vo.setCalculatedWeight(bom.getCalculatedWeight());

        // 上汽报价单 - 材料成本扩展字段
        vo.setPurchaseType(bom.getPurchaseType());
        vo.setMaterialTotalCost(bom.getMaterialTotalCost());
        vo.setMaterialName(bom.getMaterialName());
        vo.setMaterialSupplier(bom.getMaterialSupplier());
        vo.setMaterialSupplierDuns(bom.getMaterialSupplierDuns());
        vo.setUnitPriceInclTax(bom.getUnitPriceInclTax());
        vo.setAmountInclTax(bom.getAmountInclTax());
        vo.setUnitPriceExclTax(bom.getUnitPriceExclTax());
        vo.setToolingCostPerUnit(bom.getToolingCostPerUnit());

        return vo;
    }

    private void sortTree(List<BomTreeNodeVO> nodes) {
        if (nodes == null) return;
        nodes.sort(Comparator.comparing(BomTreeNodeVO::getSortOrder, Comparator.nullsLast(Comparator.naturalOrder())));
        for (BomTreeNodeVO node : nodes) {
            sortTree(node.getChildren());
        }
    }

    /**
     * 递归向上更新父节点重量
     */
    private void recalculateParentWeight(Long parentId) {
        if (parentId == null) return;

        QuoteBom parent = getById(parentId);
        if (parent == null) return;

        // 计算所有子节点的重量之和
        List<QuoteBom> children = bomMapper.selectByParentId(parentId);
        BigDecimal childrenWeight = BigDecimal.ZERO;
        for (QuoteBom child : children) {
            if (child.getCalculatedWeight() != null) {
                childrenWeight = childrenWeight.add(child.getCalculatedWeight());
            } else if (child.getNetWeight() != null && child.getQuantity() != null) {
                childrenWeight = childrenWeight.add(child.getNetWeight().multiply(child.getQuantity()));
            }
        }

        // 父节点自身重量
        BigDecimal selfWeight = BigDecimal.ZERO;
        if (parent.getNetWeight() != null && parent.getQuantity() != null) {
            selfWeight = parent.getNetWeight().multiply(parent.getQuantity());
        }

        parent.setCalculatedWeight(selfWeight.add(childrenWeight));
        updateById(parent);

        // 继续向上递归
        recalculateParentWeight(parent.getParentId());
    }

    // ==================== 原有方法 ====================

    /**
     * 导入BOM Excel/CSV文件
     */
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> importBom(Long orderId, MultipartFile file) throws IOException {
        QuoteOrder order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }
        if (!QuoteStatusEnum.PENDING_TECH.getCode().equals(order.getStatus())) {
            throw new RuntimeException("只有技术状态的报价单可以导入BOM");
        }

        bomMapper.deleteByOrderId(orderId);

        BomExcelListener listener = new BomExcelListener(orderId);
        EasyExcel.read(file.getInputStream(), BomExcelRowDTO.class, listener).sheet().doRead();

        if (listener.hasErrors()) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("errors", listener.getErrors());
            return result;
        }

        List<QuoteBom> bomList = listener.getBomList();
        saveBomWithParentId(bomList);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("count", bomList.size());
        return result;
    }

    private void saveBomWithParentId(List<QuoteBom> bomList) {
        Map<Integer, Long> tempIdToRealId = new HashMap<>();

        for (int i = 0; i < bomList.size(); i++) {
            QuoteBom bom = bomList.get(i);
            Long tempParentId = bom.getParentId();

            if (tempParentId != null) {
                Long realParentId = tempIdToRealId.get(tempParentId.intValue());
                bom.setParentId(realParentId);
            }

            save(bom);
            tempIdToRealId.put(i, bom.getId());
        }
    }

    public List<QuoteBom> getBomByOrderId(Long orderId) {
        return bomMapper.selectByOrderId(orderId);
    }

    public List<QuoteBom> getTopLevelBom(Long orderId) {
        return bomMapper.selectTopLevel(orderId);
    }

    public List<QuoteBom> getChildBom(Long parentId) {
        return bomMapper.selectByParentId(parentId);
    }

    @Transactional(rollbackFor = Exception.class)
    public BigDecimal calculateTotalWeight(Long orderId) {
        List<QuoteBom> topLevelBoms = bomMapper.selectTopLevel(orderId);
        BigDecimal totalWeight = BigDecimal.ZERO;

        for (QuoteBom bom : topLevelBoms) {
            BigDecimal weight = calculateNodeWeight(bom);
            totalWeight = totalWeight.add(weight);
        }

        QuoteOrder order = orderMapper.selectById(orderId);
        if (order != null) {
            order.setNetWeight(totalWeight);
            orderMapper.updateById(order);
        }

        return totalWeight;
    }

    private BigDecimal calculateNodeWeight(QuoteBom bom) {
        BigDecimal selfWeight = BigDecimal.ZERO;
        if (bom.getNetWeight() != null && bom.getQuantity() != null) {
            selfWeight = bom.getNetWeight().multiply(bom.getQuantity());
        }

        List<QuoteBom> children = bomMapper.selectByParentId(bom.getId());
        BigDecimal childrenWeight = BigDecimal.ZERO;
        for (QuoteBom child : children) {
            childrenWeight = childrenWeight.add(calculateNodeWeight(child));
        }

        BigDecimal totalWeight = selfWeight.add(childrenWeight);
        bom.setCalculatedWeight(totalWeight);
        updateById(bom);

        return totalWeight;
    }

    @Transactional(rollbackFor = Exception.class)
    public void submitBom(Long orderId) {
        QuoteOrder order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("报价单不存在");
        }
        if (!QuoteStatusEnum.PENDING_TECH.getCode().equals(order.getStatus())) {
            throw new RuntimeException("只有技术状态的报价单可以提交BOM");
        }

        List<QuoteBom> bomList = bomMapper.selectByOrderId(orderId);
        if (bomList.isEmpty()) {
            throw new RuntimeException("请先添加BOM数据");
        }

        calculateTotalWeight(orderId);

        if (order.getCurrentHandlerId() != null) {
            SysUser tech = sysUserMapper.selectById(order.getCurrentHandlerId());
            if (tech != null) {
                if (tech.getTechProcessUserId() != null) {
                    order.setProcessHandlerId(tech.getTechProcessUserId());
                }
                if (tech.getTechLogisticsUserId() != null) {
                    order.setLogisticsHandlerId(tech.getTechLogisticsUserId());
                }
            }
        }
        if (order.getProcessHandlerId() == null) {
            SysUser creator = order.getCreatorId() != null ? sysUserMapper.selectById(order.getCreatorId()) : null;
            if (creator != null) {
                order.setProcessHandlerId(creator.getProcessUserId());
            }
        }
        order.setStatus(QuoteStatusEnum.PENDING_PROCESS.getCode());
        if (order.getProcessHandlerId() == null) {
            throw new RuntimeException("请先配置归属生产员");
        }
        order.setCurrentHandlerId(order.getProcessHandlerId());
        orderMapper.updateById(order);

        log.info("报价单[{}]BOM提交完成，流转到工艺工程师", orderId);
    }

    public void updateNetWeight(Long bomId, BigDecimal netWeight) {
        QuoteBom bom = getById(bomId);
        if (bom == null) {
            throw new RuntimeException("BOM项不存在");
        }
        bom.setNetWeight(netWeight);
        updateById(bom);
    }

    /**
     * 批量更新BOM工装分摊
     */
    @Transactional(rollbackFor = Exception.class)
    public void batchUpdateToolingCost(List<Map<String, Object>> updates) {
        if (updates == null || updates.isEmpty()) {
            return;
        }
        for (Map<String, Object> item : updates) {
            Long id = item.get("id") != null ? Long.valueOf(item.get("id").toString()) : null;
            if (id == null) continue;

            QuoteBom bom = getById(id);
            if (bom == null) continue;

            Object toolingValue = item.get("toolingCostPerUnit");
            if (toolingValue != null) {
                bom.setToolingCostPerUnit(new BigDecimal(toolingValue.toString()));
            } else {
                bom.setToolingCostPerUnit(null);
            }
            updateById(bom);
        }
        log.info("批量更新BOM工装分摊: {} 条", updates.size());
    }
}
