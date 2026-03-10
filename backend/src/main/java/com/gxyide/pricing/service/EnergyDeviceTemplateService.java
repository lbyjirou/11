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

    // 统一承载 device/mold/material 三类模板，始终按当前用户隔离

    private final SysUserMapper sysUserMapper;

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username)
        );
        return user.getId();
    }

    public List<EnergyDeviceTemplate> listByCurrentUser(String category) {
        Long userId = getCurrentUserId();
        return list(new LambdaQueryWrapper<EnergyDeviceTemplate>()
                .eq(EnergyDeviceTemplate::getUserId, userId)
                .eq(EnergyDeviceTemplate::getCategory, category)
                .orderByDesc(EnergyDeviceTemplate::getUpdateTime));
    }

    public List<EnergyDeviceTemplate> search(String keyword, String category) {
        Long userId = getCurrentUserId();
        LambdaQueryWrapper<EnergyDeviceTemplate> wrapper = new LambdaQueryWrapper<EnergyDeviceTemplate>()
                .eq(EnergyDeviceTemplate::getUserId, userId)
                .eq(EnergyDeviceTemplate::getCategory, category);
        if (keyword != null && !keyword.trim().isEmpty()) {
            wrapper.like(EnergyDeviceTemplate::getName, keyword.trim());
        }
        return list(wrapper.orderByDesc(EnergyDeviceTemplate::getUpdateTime));
    }

    public void createTemplate(EnergyDeviceTemplate template) {
        template.setUserId(getCurrentUserId());
        if (template.getCategory() == null) template.setCategory("device");
        save(template);
    }

    public boolean updateOwnTemplate(Long id, EnergyDeviceTemplate template) {
        Long userId = getCurrentUserId();
        EnergyDeviceTemplate existing = getById(id);
        if (existing == null || !existing.getUserId().equals(userId)) return false;
        template.setId(id);
        template.setUserId(userId);
        return updateById(template);
    }

    public boolean deleteOwnTemplate(Long id) {
        Long userId = getCurrentUserId();
        EnergyDeviceTemplate existing = getById(id);
        if (existing == null || !existing.getUserId().equals(userId)) return false;
        return removeById(id);
    }
}
