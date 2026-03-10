const calc = require('../../utils/calc.js')
const api = require('../../utils/request')
const auth = require('../../utils/auth')

Page({
  data: {
    productType: '蒸发器',
    mainTab: 'summary',
    calcSubTab: 'collector',
    isCalculating: false,
    alPrice: 20.2,
    lossRatio: 1.02,
    profitRate: 0.1,
    processList: [],
    processQtys: {},
    processSubtotals: {},
    processCost: 0,
    destinationList: [],
    selectedDestination: '',
    logisticsLoading: false,
    logisticsResult: null,
    collectorSpecs: [],
    finSpecs: [],
    tubeSpecs: [],
    summaryCollectorIndex: 0,
    summaryCollectorQty: 2,
    summaryCollectorPrice: 0,
    summaryCollectorSubtotal: 0,
    summaryFinIndex: 0,
    summaryFinQty: 33,
    summaryFinPrice: 0,
    summaryFinSubtotal: 0,
    summaryTubeIndex: 0,
    summaryTubeType: 'normal',
    summaryTubeQty: 34,
    summaryTubePrice: 0,
    summaryTubeSubtotal: 0,
    collectorPresetNames: ['-- 手动输入 --'],
    collectorPresetIndex: 0,
    collectorArea: 47.1239,
    collectorLen: 326,
    collectorFee: 16.5,
    collectorResult: { weight: 0, unitPrice: 0 },
    finPresetNames: ['-- 手动输入 --'],
    finPresetIndex: 0,
    finWidth: 12,
    finWaveLen: 12,
    finWaveCount: 240,
    finTotalWaveLen: 2880,
    finThickness: 0.1,
    finFee: 7,
    finPartFee: 0.001,
    finResult: { weight: 0, unitPrice: 0 },
    tubePresetNames: ['-- 手动输入 --'],
    tubePresetIndex: 0,
    tubeMeterWeight: 0.027,
    tubeLen: 735,
    tubeFee: 7.436,
    tubeZincFee: 11.9,
    tubeResult: { weight: 0, normalPrice: 0, zincPrice: 0 },
    mfgCost: 25,
    freight: 4,
    summaryData: { materialCost: 0, componentCost: 0, profit: 0, finalPrice: 0 },
    components: [],
    componentQtys: {},
    componentSubtotals: {},
    componentExpanded: false,
    componentShowCount: 3
  },

  onLoad() {
    if (!auth.checkAuth()) return
    this.loadConfig()
    this.loadSpecs()
    this.loadComponents()
    this.loadProcessList()
    this.loadDestinations()
  },

  loadComponents() {
    api.getComponentSpecs().then(res => {
      if (res && res.length) {
        const components = res.map(c => ({
          id: c.id,
          name: c.name,
          material: c.material,
          spec: c.params?.spec || '',
          unit_price: c.params?.unitPrice || c.unitPrice || 0,
          unit: c.params?.unit || '个',
          remark: c.params?.remark || ''
        }))
        const componentQtys = {}
        components.forEach(c => { componentQtys[c.id] = 0 })
        this.setData({ components, componentQtys })
      }
    }).catch(() => {})
  },

  loadConfig() {
    Promise.all([
      api.getAluminumPrice().catch(() => null),
      api.getLossRatio().catch(() => null),
      api.getProfitRate().catch(() => null)
    ]).then(([alPrice, lossRatio, profitRate]) => {
      const updates = {}
      if (alPrice !== null && alPrice !== undefined) updates.alPrice = alPrice
      if (lossRatio !== null && lossRatio !== undefined) updates.lossRatio = lossRatio
      if (profitRate !== null && profitRate !== undefined) updates.profitRate = profitRate
      if (Object.keys(updates).length) this.setData(updates)
      this.updateSummaryPrices()
    })
  },

  loadProcessList() {
    api.getProcessList().then(res => {
      if (res && res.length) {
        const processList = res.map(p => ({
          id: p.id,
          name: p.processName,
          unitType: p.unitType || '次',
          unitPrice: p.unitPrice || 0
        }))
        const processQtys = {}
        processList.forEach(p => { processQtys[p.id] = 0 })
        this.setData({ processList, processQtys })
      }
    }).catch(() => {})
  },

  loadDestinations() {
    api.getOutboundDestinations().then(res => {
      if (res && res.length) this.setData({ destinationList: res })
    }).catch(() => {})
  },

  getLocalSpecs() {
    return {
      collector: [
        { id: 1, name: '16x1.1', area: 47.1239, length: 326, fee: 16.5 },
        { id: 2, name: '20x1.15', area: 68.1019, length: 364, fee: 16.5 },
        { id: 3, name: '22x1.27', area: 82.709, length: 0, fee: 16.5 },
        { id: 4, name: '25x1.5', area: 110.684, length: 325, fee: 16.5 },
        { id: 5, name: '30x1.5', area: 150, length: 467, fee: 16.5 },
        { id: 6, name: '40x2', area: 238.8, length: 461, fee: 16.5 },
        { id: 7, name: '12x1.2', area: 40.715, length: 923, fee: 16.5 }
      ],
      fin: [
        { id: 1, name: '12mm宽', width: 12, waveLen: 12, waveCount: 240, thickness: 0.1, fee: 7, partFee: 0.001 },
        { id: 2, name: '16mm宽', width: 16, waveLen: 10, waveCount: 209, thickness: 0.08, fee: 7, partFee: 0.001 },
        { id: 3, name: '18mm宽', width: 18, waveLen: 16, waveCount: 62, thickness: 0.1, fee: 7, partFee: 0.001 },
        { id: 4, name: '20mm宽', width: 20, waveLen: 16, waveCount: 152, thickness: 0.1, fee: 7, partFee: 0.001 },
        { id: 5, name: '26mm宽', width: 26, waveLen: 16, waveCount: 364, thickness: 0.1, fee: 7, partFee: 0.001 }
      ],
      tube: [
        { id: 1, name: '12x1.4', meterWeight: 0.027, length: 735, fee: 7.436, zincFee: 11.9 },
        { id: 2, name: '16x2', meterWeight: 0.04, length: 500, fee: 7.436, zincFee: 11.9 },
        { id: 3, name: '18x2', meterWeight: 0.0508, length: 0, fee: 7.436, zincFee: 11.9 },
        { id: 4, name: '20x2', meterWeight: 0.052, length: 488, fee: 7.436, zincFee: 11.9 },
        { id: 5, name: '26x2', meterWeight: 0.063, length: 956, fee: 7.436, zincFee: 11.9 },
        { id: 6, name: '32x2', meterWeight: 0.09, length: 590, fee: 7.436, zincFee: 14 }
      ]
    }
  },

  loadSpecs() {
    const local = this.getLocalSpecs()
    Promise.all([
      api.getCollectorSpecs().catch(() => null),
      api.getFinSpecs().catch(() => null),
      api.getTubeSpecs().catch(() => null)
    ]).then(([collectors, fins, tubes]) => {
      const collectorSpecs = (collectors && collectors.length) ? collectors.map(c => ({
        id: c.id, name: c.name, area: c.params?.area || c.area, length: c.params?.length || c.length, fee: c.params?.fee || c.fee || 16.5
      })) : local.collector

      const finSpecs = (fins && fins.length) ? fins.map(f => ({
        id: f.id, name: f.name || (f.params?.width + 'mm宽'), width: f.params?.width || f.width, waveLen: f.params?.waveLen || f.wave_len,
        waveCount: f.params?.waveCount || f.wave_count || 0, thickness: f.params?.thickness || 0.1, fee: f.params?.fee || f.fee || 7, partFee: f.params?.partFee || f.part_fee || 0.001
      })) : local.fin

      const tubeSpecs = (tubes && tubes.length) ? tubes.map(t => ({
        id: t.id, name: t.name || ((t.params?.width || '') + 'x' + (t.params?.thickness || '')), meterWeight: t.params?.meterWeight || t.meter_weight,
        length: t.params?.length || t.length, fee: t.params?.fee || t.fee, zincFee: t.params?.zincFee || t.zinc_fee
      })) : local.tube

      this.setData({
        collectorSpecs,
        collectorPresetNames: ['-- 手动输入 --', ...collectorSpecs.map(s => s.name)],
        finSpecs,
        finPresetNames: ['-- 手动输入 --', ...finSpecs.map(s => s.name)],
        tubeSpecs,
        tubePresetNames: ['-- 手动输入 --', ...tubeSpecs.map(s => s.name)]
      })
      this.updateSummaryPrices()
    })
  },

  switchMainTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ mainTab: tab })
    if (tab === 'summary') this.updateSummary()
  },

  switchCalcSubTab(e) {
    this.setData({ calcSubTab: e.currentTarget.dataset.tab })
  },

  goBack() {
    wx.navigateBack({ delta: 1 })
  },

  onAlPriceInput(e) {
    const value = e.detail.value
    this.setData({ alPrice: value })
    if (value && !isNaN(parseFloat(value))) this.updateSummaryPrices()
  },
  onLossRatioInput(e) {
    const value = e.detail.value
    this.setData({ lossRatio: value })
    if (value && !isNaN(parseFloat(value))) this.updateSummaryPrices()
  },
  onProfitRateInput(e) {
    const value = e.detail.value
    this.setData({ profitRate: value })
    if (value && !isNaN(parseFloat(value))) this.updateSummary()
  },

  saveConfig() {
    const { alPrice, lossRatio, profitRate } = this.data
    const alPriceNum = parseFloat(alPrice)
    const lossRatioNum = parseFloat(lossRatio)
    const profitRateNum = parseFloat(profitRate)
    if (isNaN(alPriceNum) || isNaN(lossRatioNum) || isNaN(profitRateNum)) {
      wx.showToast({ title: '请输入有效数字', icon: 'none' })
      return
    }
    wx.showLoading({ title: '保存中...' })
    Promise.all([
      api.updateAluminumPrice(alPriceNum),
      api.updateLossRatio(lossRatioNum),
      api.updateProfitRate(profitRateNum)
    ]).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  },

  copyAlPriceLink() {
    wx.setClipboardData({
      data: 'https://www.ccmn.cn/',
      success: () => wx.showToast({ title: '链接已复制', icon: 'none', duration: 2000 })
    })
  },

  onSummaryCollectorChange(e) {
    this.setData({ summaryCollectorIndex: parseInt(e.detail.value) })
    this.updateSummaryPrices()
  },
  onSummaryCollectorQtyInput(e) {
    this.setData({ summaryCollectorQty: parseInt(e.detail.value) || 0 })
    this.updateSummary()
  },
  onSummaryFinChange(e) {
    this.setData({ summaryFinIndex: parseInt(e.detail.value) })
    this.updateSummaryPrices()
  },
  onSummaryFinQtyInput(e) {
    this.setData({ summaryFinQty: parseInt(e.detail.value) || 0 })
    this.updateSummary()
  },
  onSummaryTubeChange(e) {
    this.setData({ summaryTubeIndex: parseInt(e.detail.value) })
    this.updateSummaryPrices()
  },
  onSummaryTubeTypeChange(e) {
    this.setData({ summaryTubeType: e.detail.value })
    this.updateSummaryPrices()
  },
  onSummaryTubeQtyInput(e) {
    this.setData({ summaryTubeQty: parseInt(e.detail.value) || 0 })
    this.updateSummary()
  },

  updateSummaryPrices() {
    const { collectorSpecs, finSpecs, tubeSpecs, summaryCollectorIndex, summaryFinIndex, summaryTubeIndex, summaryTubeType, alPrice, lossRatio } = this.data
    const alPriceNum = parseFloat(alPrice) || 0
    const lossRatioNum = parseFloat(lossRatio) || 1

    let summaryCollectorPrice = 0, summaryFinPrice = 0, summaryTubePrice = 0

    if (summaryCollectorIndex > 0 && collectorSpecs.length >= summaryCollectorIndex) {
      const spec = collectorSpecs[summaryCollectorIndex - 1]
      const result = calc.calcCollector(spec.area, spec.length, spec.fee, alPriceNum, lossRatioNum)
      summaryCollectorPrice = result.unitPrice
    }
    if (summaryFinIndex > 0 && finSpecs.length >= summaryFinIndex) {
      const spec = finSpecs[summaryFinIndex - 1]
      const totalWaveLen = spec.waveLen * spec.waveCount
      const result = calc.calcFin(spec.width, totalWaveLen, spec.thickness, spec.fee, spec.partFee, alPriceNum)
      summaryFinPrice = result.unitPrice
    }
    if (summaryTubeIndex > 0 && tubeSpecs.length >= summaryTubeIndex) {
      const spec = tubeSpecs[summaryTubeIndex - 1]
      const result = calc.calcTube(spec.meterWeight, spec.length, spec.fee, spec.zincFee, false, alPriceNum)
      summaryTubePrice = summaryTubeType === 'zinc' ? result.zincPrice : result.normalPrice
    }

    this.setData({
      summaryCollectorPrice: summaryCollectorPrice.toFixed(2),
      summaryFinPrice: summaryFinPrice.toFixed(2),
      summaryTubePrice: summaryTubePrice.toFixed(2)
    })
    this.updateSummary()
  },

  updateSummary() {
    const { summaryCollectorPrice, summaryCollectorQty, summaryFinPrice, summaryFinQty, summaryTubePrice, summaryTubeQty, mfgCost, freight, components, componentQtys, processList, processQtys, profitRate } = this.data
    const mfgCostNum = parseFloat(mfgCost) || 0
    const freightNum = parseFloat(freight) || 0
    const profitRateNum = parseFloat(profitRate) || 0

    const collectorSubtotal = parseFloat(summaryCollectorPrice) * summaryCollectorQty
    const finSubtotal = parseFloat(summaryFinPrice) * summaryFinQty
    const tubeSubtotal = parseFloat(summaryTubePrice) * summaryTubeQty
    const materialCost = collectorSubtotal + finSubtotal + tubeSubtotal

    let componentCost = 0
    const componentSubtotals = {}
    components.forEach(c => {
      const qty = componentQtys[c.id] || 0
      const subtotal = c.unit_price * qty
      componentSubtotals[c.id] = subtotal.toFixed(2)
      componentCost += subtotal
    })

    let processCost = 0
    const processSubtotals = {}
    processList.forEach(p => {
      const qty = processQtys[p.id] || 0
      const subtotal = p.unitPrice * qty
      processSubtotals[p.id] = subtotal.toFixed(2)
      processCost += subtotal
    })

    const totalMaterial = materialCost + componentCost
    const profit = (totalMaterial + mfgCostNum + processCost) * profitRateNum
    const finalPrice = totalMaterial + mfgCostNum + processCost + profit + freightNum

    this.setData({
      summaryCollectorSubtotal: collectorSubtotal.toFixed(2),
      summaryFinSubtotal: finSubtotal.toFixed(2),
      summaryTubeSubtotal: tubeSubtotal.toFixed(2),
      componentSubtotals,
      processSubtotals,
      processCost: processCost.toFixed(2),
      summaryData: {
        materialCost: materialCost.toFixed(2),
        componentCost: componentCost.toFixed(2),
        processCost: processCost.toFixed(2),
        profit: profit.toFixed(2),
        finalPrice: finalPrice.toFixed(2)
      }
    })
  },

  onMfgCostInput(e) {
    const value = e.detail.value
    this.setData({ mfgCost: value })
    if (value === '' || !isNaN(parseFloat(value))) this.updateSummary()
  },
  onFreightInput(e) {
    const value = e.detail.value
    this.setData({ freight: value })
    if (value === '' || !isNaN(parseFloat(value))) this.updateSummary()
  },

  onComponentQtyInput(e) {
    const id = e.currentTarget.dataset.id
    const qty = parseInt(e.detail.value) || 0
    this.setData({ ['componentQtys.' + id]: qty })
    this.updateSummary()
  },

  onProcessQtyInput(e) {
    const id = e.currentTarget.dataset.id
    const qty = parseInt(e.detail.value) || 0
    this.setData({ ['processQtys.' + id]: qty })
    this.updateSummary()
  },

  onDestinationChange(e) {
    const idx = parseInt(e.detail.value)
    const destination = this.data.destinationList[idx] || ''
    this.setData({ selectedDestination: destination, logisticsResult: null })
    if (destination) this.calculateLogistics()
  },

  calculateLogistics() {
    const { selectedDestination, summaryData } = this.data
    if (!selectedDestination) return
    const estimatedVolume = Math.max(1, Math.round(parseFloat(summaryData.materialCost || 0) / 100))
    this.setData({ logisticsLoading: true })
    api.calculateOutboundLogistics(selectedDestination, estimatedVolume).then(res => {
      const logisticsResult = {
        recommendedType: res.recommended?.type || 'SCATTER',
        recommendedCompany: res.recommended?.company || '',
        recommendedPrice: res.recommended?.price || 0,
        allOptions: res.allOptions || []
      }
      this.setData({ logisticsResult, freight: logisticsResult.recommendedPrice, logisticsLoading: false })
      this.updateSummary()
    }).catch(() => {
      this.setData({ logisticsLoading: false })
    })
  },

  toggleComponentExpand() {
    this.setData({ componentExpanded: !this.data.componentExpanded })
  },

  onCollectorPresetChange(e) {
    const idx = parseInt(e.detail.value)
    if (idx > 0) {
      const spec = this.data.collectorSpecs[idx - 1]
      this.setData({ collectorPresetIndex: idx, collectorArea: spec.area, collectorLen: spec.length, collectorFee: spec.fee })
    } else this.setData({ collectorPresetIndex: 0 })
    this.calcCollector()
  },
  onCollectorAreaInput(e) { this.setData({ collectorArea: e.detail.value }) },
  onCollectorLenInput(e) { this.setData({ collectorLen: e.detail.value }) },
  onCollectorFeeInput(e) { this.setData({ collectorFee: e.detail.value }) },
  calcCollector() {
    this.setData({ isCalculating: true })
    setTimeout(() => {
      const { collectorArea, collectorLen, collectorFee, alPrice, lossRatio } = this.data
      const result = calc.calcCollector(parseFloat(collectorArea) || 0, parseFloat(collectorLen) || 0, parseFloat(collectorFee) || 0, parseFloat(alPrice) || 0, parseFloat(lossRatio) || 1)
      this.setData({ collectorResult: { weight: result.weight.toFixed(4), unitPrice: result.unitPrice.toFixed(2) }, isCalculating: false })
    }, 300)
  },

  onFinPresetChange(e) {
    const idx = parseInt(e.detail.value)
    if (idx > 0) {
      const spec = this.data.finSpecs[idx - 1]
      const totalWaveLen = spec.waveLen * spec.waveCount
      this.setData({ finPresetIndex: idx, finWidth: spec.width, finWaveLen: spec.waveLen, finWaveCount: spec.waveCount, finTotalWaveLen: totalWaveLen, finThickness: spec.thickness, finFee: spec.fee, finPartFee: spec.partFee })
    } else this.setData({ finPresetIndex: 0 })
    this.calcFin()
  },
  onFinWidthInput(e) { this.setData({ finWidth: e.detail.value }) },
  onFinWaveLenInput(e) {
    const waveLen = e.detail.value
    this.setData({ finWaveLen: waveLen, finTotalWaveLen: (parseFloat(waveLen) || 0) * (parseInt(this.data.finWaveCount) || 0) })
  },
  onFinWaveCountInput(e) {
    const waveCount = e.detail.value
    this.setData({ finWaveCount: waveCount, finTotalWaveLen: (parseFloat(this.data.finWaveLen) || 0) * (parseInt(waveCount) || 0) })
  },
  onFinThicknessInput(e) { this.setData({ finThickness: e.detail.value }) },
  onFinFeeInput(e) { this.setData({ finFee: e.detail.value }) },
  onFinPartFeeInput(e) { this.setData({ finPartFee: e.detail.value }) },
  calcFin() {
    this.setData({ isCalculating: true })
    setTimeout(() => {
      const { finWidth, finTotalWaveLen, finThickness, finFee, finPartFee, alPrice } = this.data
      const result = calc.calcFin(parseFloat(finWidth) || 0, parseFloat(finTotalWaveLen) || 0, parseFloat(finThickness) || 0, parseFloat(finFee) || 0, parseFloat(finPartFee) || 0, parseFloat(alPrice) || 0)
      this.setData({ finResult: { weight: result.weight.toFixed(4), unitPrice: result.unitPrice.toFixed(2) }, isCalculating: false })
    }, 300)
  },

  onTubePresetChange(e) {
    const idx = parseInt(e.detail.value)
    if (idx > 0) {
      const spec = this.data.tubeSpecs[idx - 1]
      this.setData({ tubePresetIndex: idx, tubeMeterWeight: spec.meterWeight, tubeLen: spec.length, tubeFee: spec.fee, tubeZincFee: spec.zincFee })
    } else this.setData({ tubePresetIndex: 0 })
    this.calcTube()
  },
  onTubeMeterWeightInput(e) { this.setData({ tubeMeterWeight: e.detail.value }) },
  onTubeLenInput(e) { this.setData({ tubeLen: e.detail.value }) },
  onTubeFeeInput(e) { this.setData({ tubeFee: e.detail.value }) },
  onTubeZincFeeInput(e) { this.setData({ tubeZincFee: e.detail.value }) },
  calcTube() {
    this.setData({ isCalculating: true })
    setTimeout(() => {
      const { tubeMeterWeight, tubeLen, tubeFee, tubeZincFee, alPrice } = this.data
      const result = calc.calcTube(parseFloat(tubeMeterWeight) || 0, parseFloat(tubeLen) || 0, parseFloat(tubeFee) || 0, parseFloat(tubeZincFee) || 0, false, parseFloat(alPrice) || 0)
      this.setData({ tubeResult: { weight: result.weight.toFixed(4), normalPrice: result.normalPrice.toFixed(2), zincPrice: result.zincPrice.toFixed(2) }, isCalculating: false })
    }, 300)
  },

  exportQuote() {
    const { alPrice, collectorSpecs, finSpecs, tubeSpecs, summaryCollectorIndex, summaryFinIndex, summaryTubeIndex, summaryTubeType,
      summaryCollectorQty, summaryFinQty, summaryTubeQty, summaryCollectorPrice, summaryFinPrice, summaryTubePrice,
      mfgCost, freight, processList, processQtys, selectedDestination, logisticsResult, productType } = this.data

    const collectors = [], fins = [], tubes = [], processes = []

    if (summaryCollectorIndex > 0 && collectorSpecs.length >= summaryCollectorIndex) {
      const spec = collectorSpecs[summaryCollectorIndex - 1]
      collectors.push({ specId: spec.id, name: spec.name, area: spec.area, length: spec.length, fee: spec.fee, count: summaryCollectorQty, unitPrice: parseFloat(summaryCollectorPrice), subtotal: parseFloat(summaryCollectorPrice) * summaryCollectorQty })
    }
    if (summaryFinIndex > 0 && finSpecs.length >= summaryFinIndex) {
      const spec = finSpecs[summaryFinIndex - 1]
      fins.push({ specId: spec.id, name: spec.name, width: spec.width, waveLen: spec.waveLen, waveCount: spec.waveCount, thickness: spec.thickness, fee: spec.fee, partFee: spec.partFee, count: summaryFinQty, unitPrice: parseFloat(summaryFinPrice), subtotal: parseFloat(summaryFinPrice) * summaryFinQty })
    }
    if (summaryTubeIndex > 0 && tubeSpecs.length >= summaryTubeIndex) {
      const spec = tubeSpecs[summaryTubeIndex - 1]
      tubes.push({ specId: spec.id, name: spec.name, meterWeight: spec.meterWeight, length: spec.length, fee: summaryTubeType === 'zinc' ? spec.zincFee : spec.fee, isZinc: summaryTubeType === 'zinc', count: summaryTubeQty, unitPrice: parseFloat(summaryTubePrice), subtotal: parseFloat(summaryTubePrice) * summaryTubeQty })
    }

    processList.forEach(p => {
      const qty = processQtys[p.id] || 0
      if (qty > 0) processes.push({ processId: p.id, processName: p.name, unitType: p.unitType, unitPrice: p.unitPrice, count: qty, subtotal: p.unitPrice * qty })
    })
    if (mfgCost > 0) processes.push({ processName: '制造费用', unitPrice: mfgCost, count: 1, subtotal: mfgCost })

    const previewData = {
      customerName: '',
      productType: productType,
      quantity: 1,
      alPrice: parseFloat(alPrice) || 0,
      collectors, fins, tubes, processes,
      freight: parseFloat(freight) || 0,
      destination: selectedDestination,
      logisticsResult
    }

    wx.setStorageSync('previewQuoteData', previewData)
    wx.navigateTo({ url: '/pages/preview/preview' })
  }
})
