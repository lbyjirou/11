package com.gxyide.pricing.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gxyide.pricing.entity.QuoteOrderHidden;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface QuoteOrderHiddenMapper extends BaseMapper<QuoteOrderHidden> {

    @Select("SELECT order_id FROM quote_order_hidden WHERE user_id = #{userId}")
    List<Long> selectHiddenOrderIds(@Param("userId") Long userId);
}
