// 通用报价单物流算法（单件成本分摊模型）
// 保留备用，后续优化冷凝器物流功能时参考

// 单件包装摊销费 = 箱单价 / 包装寿命(次) / 每箱装件数(SNP)
function calcPackCost(packPrice, packLife, snp) {
  if (!packPrice || !packLife || packLife <= 0 || !snp || snp <= 0) return 0
  return packPrice / packLife / snp
}

// 单件运费（基于年产量分摊）
// isReturnable: 可回收包装返空系数1.5，一次性1.0
function calcFreightCost(snp, boxesPerVehicle, freightPrice, annualQty, isReturnable) {
  if (!snp || !boxesPerVehicle || !freightPrice || !annualQty) {
    return { partsPerVehicle: 0, annualVehicles: 0, annualFreight: 0, unitFreightCost: 0 }
  }
  const partsPerVehicle = snp * boxesPerVehicle
  const annualVehicles = Math.ceil(annualQty / partsPerVehicle)
  let annualFreight = freightPrice * annualVehicles
  if (isReturnable) annualFreight *= 1.5
  const unitFreightCost = annualFreight / annualQty
  return { partsPerVehicle, annualVehicles, annualFreight, unitFreightCost }
}

// 物流成本合计 = 单件物流总费(自动) + 三方仓费 + 额外运费 + 返回运费
function calcGrandTotal(unitPackCost, unitFreightCost, warehouseFee, freightFee, returnFreightFee) {
  const auto = (unitPackCost || 0) + (unitFreightCost || 0)
  const manual = (warehouseFee || 0) + (freightFee || 0) + (returnFreightFee || 0)
  return auto + manual
}

module.exports = { calcPackCost, calcFreightCost, calcGrandTotal }
