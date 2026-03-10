package com.gxyide.pricing.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gxyide.pricing.entity.QuoteLogistics;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface QuoteLogisticsMapper extends BaseMapper<QuoteLogistics> {

    /**
     * 根据报价单ID查询物流信息
     */
    @Select("SELECT * FROM quote_logistics WHERE order_id = #{orderId}")
    QuoteLogistics selectByOrderId(@Param("orderId") Long orderId);

    /**
     * 删除报价单的物流信息
     */
    @Delete("DELETE FROM quote_logistics WHERE order_id = #{orderId}")
    void deleteByOrderId(@Param("orderId") Long orderId);
}
