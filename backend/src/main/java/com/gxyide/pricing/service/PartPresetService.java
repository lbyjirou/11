package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.entity.PartPreset;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.mapper.PartPresetMapper;
import com.gxyide.pricing.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PartPresetService extends ServiceImpl<PartPresetMapper, PartPreset> {

    private final SysUserMapper sysUserMapper;

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username)
        );
        return user.getId();
    }

    public List<PartPreset> listByCurrentUser() {
        Long userId = getCurrentUserId();
        return list(new LambdaQueryWrapper<PartPreset>()
                .eq(PartPreset::getUserId, userId)
                .orderByAsc(PartPreset::getCategory)
                .orderByAsc(PartPreset::getSortOrder));
    }

    public List<PartPreset> listAll() {
        return list(new LambdaQueryWrapper<PartPreset>()
                .orderByAsc(PartPreset::getCategory)
                .orderByAsc(PartPreset::getSortOrder));
    }

    public void createPreset(PartPreset preset) {
        preset.setUserId(getCurrentUserId());
        save(preset);
    }

    public boolean updateOwnPreset(Long id, PartPreset preset) {
        Long userId = getCurrentUserId();
        PartPreset existing = getById(id);
        if (existing == null || !existing.getUserId().equals(userId)) return false;
        preset.setId(id);
        preset.setUserId(userId);
        return updateById(preset);
    }

    public boolean deleteOwnPreset(Long id) {
        Long userId = getCurrentUserId();
        PartPreset existing = getById(id);
        if (existing == null || !existing.getUserId().equals(userId)) return false;
        return removeById(id);
    }
}
