package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gxyide.pricing.entity.SysConfig;
import com.gxyide.pricing.mapper.SysConfigMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ConfigService {

    private final SysConfigMapper sysConfigMapper;

    public String getValue(String key) {
        SysConfig config = sysConfigMapper.selectOne(
                new LambdaQueryWrapper<SysConfig>().eq(SysConfig::getConfigKey, key)
        );
        return config != null ? config.getConfigValue() : null;
    }

    public BigDecimal getAluminumPrice() {
        String value = getValue("ALUMINUM_PRICE");
        return value != null ? new BigDecimal(value).divide(new BigDecimal("1000")) : BigDecimal.ZERO;
    }

    public BigDecimal getLossRatio() {
        String value = getValue("LOSS_RATIO");
        return value != null ? new BigDecimal(value) : new BigDecimal("1.02");
    }

    public BigDecimal getProfitRate() {
        String value = getValue("PROFIT_RATE");
        return value != null ? new BigDecimal(value) : new BigDecimal("0.10");
    }

    public void updateValue(String key, String value) {
        SysConfig config = sysConfigMapper.selectOne(
                new LambdaQueryWrapper<SysConfig>().eq(SysConfig::getConfigKey, key)
        );
        if (config != null) {
            config.setConfigValue(value);
            sysConfigMapper.updateById(config);
        } else {
            config = new SysConfig();
            config.setConfigKey(key);
            config.setConfigValue(value);
            sysConfigMapper.insert(config);
        }
    }
}
