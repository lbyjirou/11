package com.gxyide.pricing.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gxyide.pricing.entity.BasePackDict;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface BasePackDictMapper extends BaseMapper<BasePackDict> {

    /**
     * 查询所有启用的包装类型
     */
    @Select("SELECT * FROM base_pack_dict WHERE is_active = 1 ORDER BY sort_order")
    List<BasePackDict> selectActiveList();
}
