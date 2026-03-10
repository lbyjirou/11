package com.gxyide.pricing.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gxyide.pricing.entity.BaseVehicleDict;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface BaseVehicleDictMapper extends BaseMapper<BaseVehicleDict> {

    /**
     * 查询所有启用的车型
     */
    @Select("SELECT * FROM base_vehicle_dict WHERE is_active = 1 ORDER BY sort_order")
    List<BaseVehicleDict> selectActiveList();
}
