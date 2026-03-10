package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.entity.ProcessDict;
import com.gxyide.pricing.mapper.ProcessDictMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProcessService extends ServiceImpl<ProcessDictMapper, ProcessDict> {

    /** 获取启用的工序（汇总页使用） */
    public List<ProcessDict> listActive() {
        return list(new LambdaQueryWrapper<ProcessDict>()
                .eq(ProcessDict::getIsActive, 1)
                .orderByAsc(ProcessDict::getSortOrder));
    }

    /** 获取所有工序（工序管理页使用） */
    public List<ProcessDict> listAll() {
        return list(new LambdaQueryWrapper<ProcessDict>()
                .orderByAsc(ProcessDict::getSortOrder));
    }
}
