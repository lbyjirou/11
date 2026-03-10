const api = require('../../utils/request')
const auth = require('../../utils/auth')

Page({
  data: {
    // 客户信息
    customerName: '',
    contactPerson: '',
    contactPhone: '',
    quantity: 1,
    validDays: 7,

    // 产品信息
    productType: '冷凝器',
    productSpec: '',

    // 材料明细
    collector: { name: '', unitPrice: 0, count: 0, subtotal: 0 },
    fin: { name: '', unitPrice: 0, count: 0, subtotal: 0 },
    tube: { name: '', unitPrice: 0, count: 0, subtotal: 0, isZinc: false },

    // 费用
    materialCost: 0,
    mfgCost: 0,
    freight: 0,
    profitRate: 10,
    profit: 0,
    subtotal: 0,
    finalPrice: 0,
    unitPrice: 0,

    // 备注
    remark: '',

    // 原始数据（用于导出）
    rawData: {}
  },

  onLoad(options) {
    if (!auth.checkAuth()) return

    // 从缓存获取报价数据
    const quoteData = wx.getStorageSync('previewQuoteData')
    if (!quoteData) {
      wx.showToast({ title: '数据加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.initData(quoteData)
  },

  initData(data) {
    const specs = []

    // 集流管
    let collector = { name: '', unitPrice: 0, count: 0, subtotal: 0 }
    if (data.collectors && data.collectors.length) {
      const c = data.collectors[0]
      collector = {
        name: c.name,
        unitPrice: parseFloat(c.unitPrice || 0).toFixed(2),
        count: c.count,
        subtotal: parseFloat(c.subtotal || 0).toFixed(2)
      }
      specs.push(c.name + '集流管')
    }

    // 翅片
    let fin = { name: '', unitPrice: 0, count: 0, subtotal: 0 }
    if (data.fins && data.fins.length) {
      const f = data.fins[0]
      fin = {
        name: f.name,
        unitPrice: parseFloat(f.unitPrice || 0).toFixed(2),
        count: f.count,
        subtotal: parseFloat(f.subtotal || 0).toFixed(2)
      }
      specs.push(f.name + '翅片')
    }

    // 扁管
    let tube = { name: '', unitPrice: 0, count: 0, subtotal: 0, isZinc: false }
    if (data.tubes && data.tubes.length) {
      const t = data.tubes[0]
      tube = {
        name: t.name,
        unitPrice: parseFloat(t.unitPrice || 0).toFixed(2),
        count: t.count,
        subtotal: parseFloat(t.subtotal || 0).toFixed(2),
        isZinc: t.isZinc || false
      }
      specs.push(t.name + '扁管' + (t.isZinc ? '(喷锌)' : ''))
    }

    // 制造费用
    let mfgCost = 0
    if (data.processes && data.processes.length) {
      data.processes.forEach(p => {
        mfgCost += parseFloat(p.unitPrice || 0) * (p.count || 1)
      })
    }

    this.setData({
      productType: data.productType || '冷凝器',
      productSpec: specs.join(' + '),
      collector,
      fin,
      tube,
      mfgCost: mfgCost.toFixed(2),
      freight: parseFloat(data.freight || 0).toFixed(2),
      quantity: data.quantity || 1,
      rawData: data
    })

    this.recalculate()
  },

  recalculate() {
    const { collector, fin, tube, mfgCost, freight, profitRate, quantity } = this.data

    // 重算材料小计
    const collectorSubtotal = parseFloat(collector.unitPrice) * collector.count
    const finSubtotal = parseFloat(fin.unitPrice) * fin.count
    const tubeSubtotal = parseFloat(tube.unitPrice) * tube.count
    const materialCost = collectorSubtotal + finSubtotal + tubeSubtotal

    // 成本小计
    const subtotal = materialCost + parseFloat(mfgCost)

    // 利润
    const profit = subtotal * (parseFloat(profitRate) / 100)

    // 最终报价
    const finalPrice = subtotal + profit + parseFloat(freight)

    // 单台价格
    const unitPrice = quantity > 0 ? finalPrice / quantity : finalPrice

    this.setData({
      'collector.subtotal': collectorSubtotal.toFixed(2),
      'fin.subtotal': finSubtotal.toFixed(2),
      'tube.subtotal': tubeSubtotal.toFixed(2),
      materialCost: materialCost.toFixed(2),
      subtotal: subtotal.toFixed(2),
      profit: profit.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      unitPrice: unitPrice.toFixed(2)
    })
  },

  // 客户信息输入
  onCustomerNameInput(e) { this.setData({ customerName: e.detail.value }) },
  onContactPersonInput(e) { this.setData({ contactPerson: e.detail.value }) },
  onContactPhoneInput(e) { this.setData({ contactPhone: e.detail.value }) },
  onQuantityInput(e) {
    this.setData({ quantity: parseInt(e.detail.value) || 1 })
    this.recalculate()
  },
  onValidDaysInput(e) { this.setData({ validDays: parseInt(e.detail.value) || 7 }) },

  // 成本编辑
  onCostInput(e) {
    const field = e.currentTarget.dataset.field
    const value = parseFloat(e.detail.value) || 0
    this.setData({ [field]: value.toFixed(2) })
    this.recalculate()
  },

  // 费用输入
  onMfgCostInput(e) {
    this.setData({ mfgCost: parseFloat(e.detail.value) || 0 })
    this.recalculate()
  },
  onFreightInput(e) {
    this.setData({ freight: parseFloat(e.detail.value) || 0 })
    this.recalculate()
  },
  onProfitRateInput(e) {
    this.setData({ profitRate: parseFloat(e.detail.value) || 0 })
    this.recalculate()
  },

  // 备注
  onRemarkInput(e) { this.setData({ remark: e.detail.value }) },

  // 返回
  goBack() {
    wx.navigateBack()
  },

  // 确认导出
  confirmExport() {
    const {
      customerName, contactPerson, contactPhone, quantity, validDays,
      productType, collector, fin, tube, mfgCost, freight, profitRate,
      materialCost, subtotal, profit, finalPrice, remark, rawData
    } = this.data

    // 组装导出数据
    const exportData = {
      customerName: customerName || '',
      contactPerson: contactPerson || '',
      contactPhone: contactPhone || '',
      productType: productType,
      quantity: quantity,
      validDays: validDays,
      alPrice: rawData.alPrice || 20.5,
      collectors: [],
      fins: [],
      tubes: [],
      processes: [],
      remark: remark
    }

    // 集流管
    if (collector.name && collector.count > 0) {
      const rawCollector = rawData.collectors && rawData.collectors[0]
      exportData.collectors.push({
        specId: rawCollector?.specId,
        name: collector.name,
        area: rawCollector?.area,
        length: rawCollector?.length,
        fee: rawCollector?.fee,
        count: collector.count
      })
    }

    // 翅片
    if (fin.name && fin.count > 0) {
      const rawFin = rawData.fins && rawData.fins[0]
      exportData.fins.push({
        specId: rawFin?.specId,
        name: fin.name,
        width: rawFin?.width,
        waveLen: rawFin?.waveLen,
        waveCount: rawFin?.waveCount,
        thickness: rawFin?.thickness,
        fee: rawFin?.fee,
        partFee: rawFin?.partFee,
        count: fin.count
      })
    }

    // 扁管
    if (tube.name && tube.count > 0) {
      const rawTube = rawData.tubes && rawData.tubes[0]
      exportData.tubes.push({
        specId: rawTube?.specId,
        name: tube.name,
        meterWeight: rawTube?.meterWeight,
        length: rawTube?.length,
        fee: rawTube?.fee,
        isZinc: tube.isZinc,
        count: tube.count
      })
    }

    // 制造费用作为工序
    if (parseFloat(mfgCost) > 0) {
      exportData.processes.push({
        processName: '制造费用',
        unitPrice: parseFloat(mfgCost),
        count: 1
      })
    }

    wx.showLoading({ title: '生成中...' })

    // 先保存报价记录到数据库
    const saveData = {
      customerName: customerName || '未命名客户',
      productType: productType,
      quantity: quantity,
      materialCost: parseFloat(materialCost) || 0,
      processCost: parseFloat(mfgCost) || 0,
      logisticsCost: parseFloat(freight) || 0,
      totalPrice: parseFloat(finalPrice) || 0,
      status: 1,
      fullJsonData: exportData
    }

    api.saveQuote(saveData).then(() => {
      // 保存成功后再导出 Excel
      return api.downloadQuoteExcel(exportData)
    }).then(filePath => {
      wx.hideLoading()
      wx.removeStorageSync('previewQuoteData')

      wx.openDocument({
        filePath: filePath,
        fileType: 'xlsx',
        success: () => {
          wx.showToast({ title: '导出成功', icon: 'success' })
        },
        fail: () => {
          wx.showToast({ title: '打开失败，文件已保存', icon: 'none' })
        }
      })
    }).catch(err => {
      wx.hideLoading()
      console.error('导出失败', err)
      wx.showToast({ title: '导出失败', icon: 'none' })
    })
  }
})
