package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.entity.EnergyDeviceTemplate;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.mapper.EnergyDeviceTemplateMapper;
import com.gxyide.pricing.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EnergyDeviceTemplateService extends ServiceImpl<EnergyDeviceTemplateMapper, EnergyDeviceTemplate> {

    private static final String PUBLIC_PRESET_PERMISSION = "SYSTEM_PROCESS_PRESET_CENTER";

    private final SysUserMapper sysUserMapper;
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

    public List<EnergyDeviceTemplate> listVisible(String category) {
        Long userId = getCurrentUserId();
        return list(new LambdaQueryWrapper<EnergyDeviceTemplate>()
                .eq(EnergyDeviceTemplate::getCategory, category)
                .and(wrapper -> wrapper.eq(EnergyDeviceTemplate::getIsPublic, 1)
                        .or()
                        .eq(EnergyDeviceTemplate::getUserId, userId))
                .orderByDesc(EnergyDeviceTemplate::getUpdateTime));
    }

    public List<EnergyDeviceTemplate> listPublic(String category) {
        return list(new LambdaQueryWrapper<EnergyDeviceTemplate>()
                .eq(EnergyDeviceTemplate::getCategory, category)
                .eq(EnergyDeviceTemplate::getIsPublic, 1)
                .orderByDesc(EnergyDeviceTemplate::getUpdateTime));
    }

    public List<EnergyDeviceTemplate> search(String keyword, String category, boolean publicOnly) {
        Long userId = getCurrentUserId();
        LambdaQueryWrapper<EnergyDeviceTemplate> wrapper = new LambdaQueryWrapper<EnergyDeviceTemplate>()
                .eq(EnergyDeviceTemplate::getCategory, category);
        if (publicOnly) {
            wrapper.eq(EnergyDeviceTemplate::getIsPublic, 1);
        } else {
            wrapper.and(qw -> qw.eq(EnergyDeviceTemplate::getIsPublic, 1)
                    .or()
                    .eq(EnergyDeviceTemplate::getUserId, userId));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            wrapper.like(EnergyDeviceTemplate::getName, keyword.trim());
        }
        return list(wrapper.orderByDesc(EnergyDeviceTemplate::getUpdateTime));
    }

    public void createTemplate(EnergyDeviceTemplate template) {
        Long userId = getCurrentUserId();
        boolean createPublic = Integer.valueOf(1).equals(template.getIsPublic());
        if (createPublic && !canManagePublicPresets(userId)) {
            throw new IllegalStateException("无权创建公共预设");
        }
        template.setUserId(userId);
        template.setIsPublic(createPublic ? 1 : 0);
        if (template.getCategory() == null) {
            template.setCategory("device");
        }
        save(template);
    }

    public boolean updateManagedTemplate(Long id, EnergyDeviceTemplate template) {
        Long userId = getCurrentUserId();
        EnergyDeviceTemplate existing = getById(id);
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
        existing.setTemplateJson(template.getTemplateJson());
        existing.setCategory(template.getCategory());
        return updateById(existing);
    }

    public boolean deleteManagedTemplate(Long id) {
        Long userId = getCurrentUserId();
        EnergyDeviceTemplate existing = getById(id);
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
}
