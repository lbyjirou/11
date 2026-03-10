package com.gxyide.pricing.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gxyide.pricing.entity.BaseLaborRate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface BaseLaborRateMapper extends BaseMapper<BaseLaborRate> {

    /**
     * 获取默认人工费率
     */
    @Select("SELECT * FROM base_labor_rate WHERE is_default = 1 LIMIT 1")
    BaseLaborRate selectDefault();
}
