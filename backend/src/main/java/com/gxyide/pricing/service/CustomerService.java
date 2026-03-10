package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.entity.Customer;
import com.gxyide.pricing.mapper.CustomerMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService extends ServiceImpl<CustomerMapper, Customer> {

    public List<Customer> search(String keyword) {
        LambdaQueryWrapper<Customer> wrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) {
            wrapper.like(Customer::getName, keyword)
                   .or().like(Customer::getCode, keyword);
        }
        wrapper.orderByDesc(Customer::getUpdateTime);
        wrapper.last("LIMIT 20");
        return list(wrapper);
    }
}
