package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.entity.MaterialCostPreset;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.mapper.MaterialCostPresetMapper;
import com.gxyide.pricing.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MaterialCostPresetService extends ServiceImpl<MaterialCostPresetMapper, MaterialCostPreset> {

    private final SysUserMapper sysUserMapper;

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username));
        return user.getId();
    }

    public List<MaterialCostPreset> listByType(String type) {
        return list(new LambdaQueryWrapper<MaterialCostPreset>()
                .eq(MaterialCostPreset::getType, type)
                .orderByDesc(MaterialCostPreset::getUpdateTime));
    }

    public void createPreset(MaterialCostPreset preset) {
        preset.setUserId(getCurrentUserId());
        save(preset);
    }

    public boolean updateOwn(Long id, MaterialCostPreset preset) {
        Long userId = getCurrentUserId();
        MaterialCostPreset existing = getById(id);
        if (existing == null || !existing.getUserId().equals(userId)) return false;
        existing.setSpec(preset.getSpec());
        existing.setFactor(preset.getFactor());
        existing.setWeight(preset.getWeight());
        existing.setThickness(preset.getThickness());
        return updateById(existing);
    }

    public boolean deleteOwn(Long id) {
        Long userId = getCurrentUserId();
        MaterialCostPreset existing = getById(id);
        if (existing == null || !existing.getUserId().equals(userId)) return false;
        return removeById(id);
    }
}
