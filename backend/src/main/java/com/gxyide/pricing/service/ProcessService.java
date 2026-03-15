package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.entity.ProcessDict;
import com.gxyide.pricing.entity.SysUser;
import com.gxyide.pricing.mapper.ProcessDictMapper;
import com.gxyide.pricing.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProcessService extends ServiceImpl<ProcessDictMapper, ProcessDict> {

    private static final String PUBLIC_PRESET_PERMISSION = "SYSTEM_PROCESS_PRESET_CENTER";

    private final SysUserMapper sysUserMapper;
    private final RbacService rbacService;

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username));
        return user.getId();
    }

    private boolean canManagePublicPresets(Long userId) {
        return rbacService.hasPermission(userId, PUBLIC_PRESET_PERMISSION);
    }

    public List<ProcessDict> listActive() {
        return list(new LambdaQueryWrapper<ProcessDict>()
                .eq(ProcessDict::getIsPublic, 1)
                .eq(ProcessDict::getIsActive, 1)
                .orderByAsc(ProcessDict::getSortOrder)
                .orderByDesc(ProcessDict::getUpdateTime));
    }

    public List<ProcessDict> listAllPublic() {
        return list(new LambdaQueryWrapper<ProcessDict>()
                .eq(ProcessDict::getIsPublic, 1)
                .orderByAsc(ProcessDict::getSortOrder)
                .orderByDesc(ProcessDict::getUpdateTime));
    }

    public List<ProcessDict> listVisibleForCurrentUser() {
        Long userId = getCurrentUserId();
        return list(new LambdaQueryWrapper<ProcessDict>()
                .and(wrapper -> wrapper.eq(ProcessDict::getIsPublic, 1)
                        .or()
                        .eq(ProcessDict::getOwnerUserId, userId))
                .orderByAsc(ProcessDict::getSortOrder)
                .orderByDesc(ProcessDict::getUpdateTime));
    }

    public void createManaged(ProcessDict process) {
        Long userId = getCurrentUserId();
        boolean createPublic = Integer.valueOf(1).equals(process.getIsPublic());
        if (createPublic && !canManagePublicPresets(userId)) {
            throw new IllegalStateException("无权创建公共预设");
        }
        if (createPublic) {
            process.setOwnerUserId(process.getOwnerUserId() != null ? userId : null);
        } else {
            process.setOwnerUserId(userId);
        }
        process.setIsPublic(createPublic ? 1 : 0);
        if (process.getIsActive() == null) {
            process.setIsActive(1);
        }
        save(process);
    }

    public boolean updateManaged(Long id, ProcessDict process) {
        Long userId = getCurrentUserId();
        ProcessDict existing = getById(id);
        if (existing == null) {
            return false;
        }
        if (Integer.valueOf(1).equals(existing.getIsPublic())) {
            if (!canManagePublicPresets(userId)) {
                return false;
            }
        } else if (existing.getOwnerUserId() == null || !existing.getOwnerUserId().equals(userId)) {
            return false;
        }
        existing.setProcessName(process.getProcessName());
        existing.setUnitType(process.getUnitType());
        existing.setUnitPrice(process.getUnitPrice());
        existing.setLaborRate(process.getLaborRate());
        existing.setLaborTime(process.getLaborTime());
        existing.setOperators(process.getOperators());
        existing.setMachineModel(process.getMachineModel());
        existing.setMachineType(process.getMachineType());
        existing.setVarCost(process.getVarCost());
        existing.setFixCost(process.getFixCost());
        existing.setIsActive(process.getIsActive());
        existing.setSectionKey(process.getSectionKey());
        existing.setSectionLabel(process.getSectionLabel());
        existing.setColumnsJson(process.getColumnsJson());
        existing.setSortOrder(process.getSortOrder());
        return updateById(existing);
    }

    public boolean deleteManaged(Long id) {
        Long userId = getCurrentUserId();
        ProcessDict existing = getById(id);
        if (existing == null) {
            return false;
        }
        if (Integer.valueOf(1).equals(existing.getIsPublic())) {
            if (!canManagePublicPresets(userId)) {
                return false;
            }
        } else if (existing.getOwnerUserId() == null || !existing.getOwnerUserId().equals(userId)) {
            return false;
        }
        return removeById(id);
    }
}
