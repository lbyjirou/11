package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.entity.ProcessTemplate;
import com.gxyide.pricing.entity.QuoteOrder;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.mapper.ProcessTemplateMapper;
import com.gxyide.pricing.mapper.QuoteOrderMapper;
import com.gxyide.pricing.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProcessTemplateService extends ServiceImpl<ProcessTemplateMapper, ProcessTemplate> {

    private static final String PUBLIC_PRESET_PERMISSION = "SYSTEM_PROCESS_PRESET_CENTER";

    private final SysUserMapper sysUserMapper;
    private final QuoteOrderMapper quoteOrderMapper;
    private final RbacService rbacService;

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username)
        );
        return user.getId();
    }

    private boolean canManagePublicPresets(Long userId) {
        return rbacService.hasPermission(userId, PUBLIC_PRESET_PERMISSION);
    }

    public List<ProcessTemplate> listVisibleForCurrentUser() {
        Long userId = getCurrentUserId();
        return list(new LambdaQueryWrapper<ProcessTemplate>()
                .and(wrapper -> wrapper.eq(ProcessTemplate::getIsPublic, 1)
                        .or()
                        .eq(ProcessTemplate::getUserId, userId))
                .orderByDesc(ProcessTemplate::getUpdateTime));
    }

    public List<ProcessTemplate> listPublic() {
        return list(new LambdaQueryWrapper<ProcessTemplate>()
                .eq(ProcessTemplate::getIsPublic, 1)
                .orderByDesc(ProcessTemplate::getUpdateTime));
    }

    public void createTemplate(ProcessTemplate template) {
        Long userId = getCurrentUserId();
        boolean createPublic = Integer.valueOf(1).equals(template.getIsPublic());
        if (createPublic && !canManagePublicPresets(userId)) {
            throw new IllegalStateException("无权创建公共模板");
        }
        template.setUserId(userId);
        template.setIsPublic(createPublic ? 1 : 0);
        save(template);
    }

    public boolean updateManagedTemplate(Long id, ProcessTemplate template) {
        Long userId = getCurrentUserId();
        ProcessTemplate existing = getById(id);
        if (existing == null) {
            return false;
        }
        if (Integer.valueOf(1).equals(existing.getIsPublic())) {
            if (!canManagePublicPresets(userId)) {
                return false;
            }
        } else if (!existing.getUserId().equals(userId)) {
            return false;
        }
        existing.setName(template.getName());
        if (template.getTemplateJson() != null) {
            existing.setTemplateJson(template.getTemplateJson());
        }
        return updateById(existing);
    }

    public boolean deleteManagedTemplate(Long id) {
        Long userId = getCurrentUserId();
        ProcessTemplate existing = getById(id);
        if (existing == null) {
            return false;
        }
        if (Integer.valueOf(1).equals(existing.getIsPublic())) {
            if (!canManagePublicPresets(userId)) {
                return false;
            }
        } else if (!existing.getUserId().equals(userId)) {
            return false;
        }
        return removeById(id);
    }

    public String getLastUsedStructure() {
        Long userId = getCurrentUserId();
        QuoteOrder order = quoteOrderMapper.selectOne(
                new LambdaQueryWrapper<QuoteOrder>()
                        .eq(QuoteOrder::getCreatorId, userId)
                        .isNotNull(QuoteOrder::getProcessDataJson)
                        .ne(QuoteOrder::getProcessDataJson, "")
                        .orderByDesc(QuoteOrder::getUpdateTime)
                        .last("LIMIT 1")
        );
        return order != null ? order.getProcessDataJson() : null;
    }
}
