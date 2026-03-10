package com.gxyide.pricing.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gxyide.pricing.entity.QuoteItemProcess;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface QuoteItemProcessMapper extends BaseMapper<QuoteItemProcess> {

    /**
     * 查询报价单的所有工序
     */
    @Select("SELECT * FROM quote_item_process WHERE order_id = #{orderId} ORDER BY bom_id, sort_order")
    List<QuoteItemProcess> selectByOrderId(@Param("orderId") Long orderId);

    /**
     * 查询某个BOM零件的所有工序
     */
    @Select("SELECT * FROM quote_item_process WHERE bom_id = #{bomId} ORDER BY sort_order")
    List<QuoteItemProcess> selectByBomId(@Param("bomId") Long bomId);

    /**
     * 删除报价单的所有工序
     */
    @Delete("DELETE FROM quote_item_process WHERE order_id = #{orderId}")
    void deleteByOrderId(@Param("orderId") Long orderId);

    /**
     * 删除某个BOM零件的所有工序
     */
    @Delete("DELETE FROM quote_item_process WHERE bom_id = #{bomId}")
    void deleteByBomId(@Param("bomId") Long bomId);
}
