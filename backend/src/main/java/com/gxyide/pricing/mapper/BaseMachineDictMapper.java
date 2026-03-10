package com.gxyide.pricing.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gxyide.pricing.entity.BaseMachineDict;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface BaseMachineDictMapper extends BaseMapper<BaseMachineDict> {

    /**
     * 查询所有启用的设备
     */
    @Select("SELECT * FROM base_machine_dict WHERE is_active = 1 ORDER BY sort_order")
    List<BaseMachineDict> selectActiveList();

    /**
     * 根据设备编码查询
     */
    @Select("SELECT * FROM base_machine_dict WHERE machine_code = #{code} AND is_active = 1")
    BaseMachineDict selectByCode(@Param("code") String code);
}
