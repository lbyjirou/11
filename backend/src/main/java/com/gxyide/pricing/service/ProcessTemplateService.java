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

    private final SysUserMapper sysUserMapper;
    private final QuoteOrderMapper quoteOrderMapper;

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username)
        );
        return user.getId();
    }

    public List<ProcessTemplate> listByCurrentUser() {
        Long userId = getCurrentUserId();
        return list(new LambdaQueryWrapper<ProcessTemplate>()
                .eq(ProcessTemplate::getUserId, userId)
                .orderByDesc(ProcessTemplate::getUpdateTime));
    }

    public void createTemplate(ProcessTemplate template) {
        template.setUserId(getCurrentUserId());
        save(template);
    }

    public boolean updateOwnTemplate(Long id, ProcessTemplate template) {
        Long userId = getCurrentUserId();
        ProcessTemplate existing = getById(id);
        if (existing == null || !existing.getUserId().equals(userId)) return false;
        template.setId(id);
        template.setUserId(userId);
        return updateById(template);
    }

    public boolean deleteOwnTemplate(Long id) {
        Long userId = getCurrentUserId();
        ProcessTemplate existing = getById(id);
        if (existing == null || !existing.getUserId().equals(userId)) return false;
        return removeById(id);
    }

    /**
     * 查询当前用户最近一个有processDataJson的报价单，返回其结构JSON
     */
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
