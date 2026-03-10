package com.gxyide.pricing.utils;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class CalcUtils {

    public static final BigDecimal AL_DENSITY = new BigDecimal("2.75");
    public static final BigDecimal DIFF_RATIO = new BigDecimal("1.0");
    public static final BigDecimal LOSS_RATIO = new BigDecimal("1.02");
    public static final BigDecimal PROFIT_RATE = new BigDecimal("0.10");

    private CalcUtils() {}

    public static BigDecimal calcCollectorWeight(BigDecimal area, BigDecimal length) {
        return area.multiply(length)
                .multiply(DIFF_RATIO)
                .multiply(LOSS_RATIO)
                .multiply(AL_DENSITY)
                .divide(new BigDecimal("1000000"), 6, RoundingMode.HALF_UP);
    }

    public static BigDecimal calcCollectorPrice(BigDecimal weight, BigDecimal alPrice, BigDecimal fee) {
        return weight.multiply(alPrice.add(fee)).setScale(4, RoundingMode.HALF_UP);
    }

    public static BigDecimal calcFinWeight(BigDecimal width, BigDecimal waveLen, int waveCount,
                                           BigDecimal thickness) {
        BigDecimal totalWaveLen = waveLen.multiply(new BigDecimal(waveCount));
        return width.multiply(totalWaveLen)
                .multiply(thickness)
                .multiply(AL_DENSITY)
                .divide(new BigDecimal("1000000"), 6, RoundingMode.HALF_UP);
    }

    public static BigDecimal calcFinPrice(BigDecimal weight, BigDecimal alPrice,
                                          BigDecimal fee, BigDecimal partFee) {
        return weight.multiply(alPrice.add(fee)).add(partFee).setScale(4, RoundingMode.HALF_UP);
    }

    public static BigDecimal calcTubeWeight(BigDecimal meterWeight, BigDecimal length) {
        return meterWeight.multiply(length).divide(new BigDecimal("1000"), 6, RoundingMode.HALF_UP);
    }

    public static BigDecimal calcTubePrice(BigDecimal weight, BigDecimal alPrice, BigDecimal fee) {
        return weight.multiply(alPrice.add(fee)).setScale(4, RoundingMode.HALF_UP);
    }

    public static BigDecimal calcProfit(BigDecimal materialCost, BigDecimal mfgCost) {
        return materialCost.add(mfgCost).multiply(PROFIT_RATE).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal calcFinalPrice(BigDecimal materialCost, BigDecimal mfgCost,
                                            BigDecimal profit, BigDecimal freight) {
        return materialCost.add(mfgCost).add(profit).add(freight).setScale(2, RoundingMode.HALF_UP);
    }
}
