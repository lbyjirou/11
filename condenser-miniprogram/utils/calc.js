// 铝密度 g/cm³
const AL_DENSITY = 2.75
// 理论实际差异比
const ACTUAL_DIFF_RATIO = 1
// 利润率
const PROFIT_RATE = 0.1

// 集流管计算
function calcCollector(area, len, fee, alPrice, lossRatio) {
  const weight = area * len * ACTUAL_DIFF_RATIO * lossRatio * AL_DENSITY / 1000000
  const unitPrice = weight * (alPrice + fee)
  return { weight, unitPrice }
}

// 翅片计算
function calcFin(width, totalWaveLen, thickness, fee, partFee, alPrice) {
  const weight = width * totalWaveLen * thickness * AL_DENSITY / 1000000
  const unitPrice = weight * (alPrice + fee) + partFee
  return { weight, unitPrice }
}

// 扁管计算
function calcTube(meterWeight, len, fee, zincFee, isZinc, alPrice) {
  const weight = meterWeight * len / 1000
  const normalPrice = weight * (alPrice + fee)
  const zincPrice = weight * (alPrice + zincFee)
  const unitPrice = isZinc ? zincPrice : normalPrice
  return { weight, normalPrice, zincPrice, unitPrice }
}

// 汇总计算
function calcSummary(collectorPrice, collectorQty, finPrice, finQty, tubePrice, tubeQty, mfgCost, freight) {
  const collectorSubtotal = collectorPrice * collectorQty
  const finSubtotal = finPrice * finQty
  const tubeSubtotal = tubePrice * tubeQty
  const materialCost = collectorSubtotal + finSubtotal + tubeSubtotal
  const profit = (materialCost + mfgCost) * PROFIT_RATE
  const finalPrice = materialCost + mfgCost + profit + freight
  return { collectorSubtotal, finSubtotal, tubeSubtotal, materialCost, profit, finalPrice }
}

module.exports = { calcCollector, calcFin, calcTube, calcSummary, AL_DENSITY, ACTUAL_DIFF_RATIO, PROFIT_RATE }
