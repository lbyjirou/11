package com.gxyide.pricing.controller;

import com.gxyide.pricing.common.Result;
import com.gxyide.pricing.entity.Customer;
import com.gxyide.pricing.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "客户管理")
@RestController
@RequestMapping("/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @Operation(summary = "模糊搜索客户")
    @GetMapping("/search")
    @PreAuthorize("@perm.check('DATA_VIEW_SALES')")
    public Result<List<Customer>> search(@RequestParam(required = false) String keyword) {
        return Result.success(customerService.search(keyword));
    }

    @Operation(summary = "新增客户")
    @PostMapping
    @PreAuthorize("@perm.check('TAB_EDIT_SALES')")
    public Result<Customer> create(@RequestBody Customer customer) {
        customerService.save(customer);
        return Result.success(customer);
    }

    @Operation(summary = "更新客户")
    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_SALES')")
    public Result<Void> update(@PathVariable Long id, @RequestBody Customer customer) {
        customer.setId(id);
        customerService.updateById(customer);
        return Result.success();
    }

    @Operation(summary = "删除客户")
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('TAB_EDIT_SALES')")
    public Result<Void> delete(@PathVariable Long id) {
        customerService.removeById(id);
        return Result.success();
    }
}
