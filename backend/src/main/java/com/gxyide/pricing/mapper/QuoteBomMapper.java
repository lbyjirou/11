package com.gxyide.pricing.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gxyide.pricing.entity.QuoteBom;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface QuoteBomMapper extends BaseMapper<QuoteBom> {

    /**
     * 查询指定报价单的所有BOM项（按层次排序）
     */
    @Select("SELECT * FROM quote_bom WHERE order_id = #{orderId} ORDER BY sort_order")
    List<QuoteBom> selectByOrderId(@Param("orderId") Long orderId);

    /**
     * 查询指定父节点的子项
     */
    @Select("SELECT * FROM quote_bom WHERE parent_id = #{parentId} ORDER BY sort_order")
    List<QuoteBom> selectByParentId(@Param("parentId") Long parentId);

    /**
     * 查询顶级节点（parent_id为NULL）
     */
    @Select("SELECT * FROM quote_bom WHERE order_id = #{orderId} AND parent_id IS NULL ORDER BY sort_order")
    List<QuoteBom> selectTopLevel(@Param("orderId") Long orderId);

    /**
     * 删除指定报价单的所有BOM
     */
    @Delete("DELETE FROM quote_bom WHERE order_id = #{orderId}")
    void deleteByOrderId(@Param("orderId") Long orderId);

    /**
     * 查询同级最大排序号
     */
    @Select("<script>" +
            "SELECT MAX(sort_order) FROM quote_bom WHERE order_id = #{orderId} " +
            "<if test='parentId != null'>AND parent_id = #{parentId}</if>" +
            "<if test='parentId == null'>AND parent_id IS NULL</if>" +
            "</script>")
    Integer selectMaxSortOrder(@Param("orderId") Long orderId, @Param("parentId") Long parentId);
}
