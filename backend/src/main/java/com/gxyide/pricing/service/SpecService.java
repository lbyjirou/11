package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.entity.BaseSpec;
import com.gxyide.pricing.mapper.BaseSpecMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SpecService extends ServiceImpl<BaseSpecMapper, BaseSpec> {

    public List<BaseSpec> listByType(String type) {
        return list(new LambdaQueryWrapper<BaseSpec>()
                .eq(BaseSpec::getType, type)
                .eq(BaseSpec::getStatus, 1)
                .orderByAsc(BaseSpec::getId));
    }
}
