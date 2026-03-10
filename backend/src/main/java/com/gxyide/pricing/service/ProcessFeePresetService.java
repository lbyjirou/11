package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.entity.ProcessFeePreset;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.mapper.ProcessFeePresetMapper;
import com.gxyide.pricing.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProcessFeePresetService extends ServiceImpl<ProcessFeePresetMapper, ProcessFeePreset> {

    private final SysUserMapper sysUserMapper;

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username));
        return user.getId();
    }

    public List<ProcessFeePreset> search(String keyword) {
        LambdaQueryWrapper<ProcessFeePreset> qw = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) {
            qw.like(ProcessFeePreset::getLabel, keyword);
        }
        qw.orderByDesc(ProcessFeePreset::getUpdateTime);
        return list(qw);
    }

    public void createPreset(ProcessFeePreset preset) {
        preset.setUserId(getCurrentUserId());
        save(preset);
    }

    public boolean deleteOwn(Long id) {
        Long userId = getCurrentUserId();
        ProcessFeePreset existing = getById(id);
        if (existing == null || !existing.getUserId().equals(userId)) return false;
        return removeById(id);
    }

    public boolean updateOwn(Long id, ProcessFeePreset preset) {
        Long userId = getCurrentUserId();
        ProcessFeePreset existing = getById(id);
        if (existing == null || !existing.getUserId().equals(userId)) return false;
        existing.setLabel(preset.getLabel());
        existing.setDefaultRate(preset.getDefaultRate());
        return updateById(existing);
    }
}
