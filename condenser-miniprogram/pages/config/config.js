const auth = require('../../utils/auth')
const api = require('../../utils/request')

const BASE_URL = 'http://localhost:8080/api'

Page({
  data: {
    aluminumPrice: '20.5',
    lossRatio: '1.02',
    profitRate: '10',
    logisticsYear: '',
    logisticsCount: 0,
    backendUrl: 'localhost:8080',
    currentUser: ''
  },

  onLoad() {
    const userInfo = auth.getUserInfo()
    if (!userInfo || userInfo.role !== 'ADMIN') {
      wx.showToast({ title: '无权限访问', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.setData({ currentUser: userInfo.realName || userInfo.username })
    this.loadConfig()
    this.loadLogisticsInfo()
  },

  loadConfig() {
    // 加载铝价
    api.getAluminumPrice().then(res => {
      if (res !== null && res !== undefined) {
        this.setData({ aluminumPrice: String(res) })
      }
    }).catch(() => {})

    // 加载其他配置（如果后端有接口）
    const token = auth.getToken()
    wx.request({
      url: BASE_URL + '/admin/config/loss-ratio',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: res => {
        if (res.data.code === 200 && res.data.data) {
          this.setData({ lossRatio: String(res.data.data) })
        }
      }
    })

    wx.request({
      url: BASE_URL + '/admin/config/profit-rate',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: res => {
        if (res.data.code === 200 && res.data.data) {
          this.setData({ profitRate: String(res.data.data * 100) })
        }
      }
    })
  },

  loadLogisticsInfo() {
    const token = auth.getToken()
    wx.request({
      url: BASE_URL + '/logistics/outbound/destinations',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: res => {
        if (res.data.code === 200 && res.data.data) {
          this.setData({
            logisticsCount: res.data.data.length,
            logisticsYear: '2025'
          })
        }
      }
    })
  },

  onAluminumPriceInput(e) {
    this.setData({ aluminumPrice: e.detail.value })
  },

  onLossRatioInput(e) {
    this.setData({ lossRatio: e.detail.value })
  },

  onProfitRateInput(e) {
    this.setData({ profitRate: e.detail.value })
  },

  saveAluminumPrice() {
    const price = parseFloat(this.data.aluminumPrice)
    if (isNaN(price) || price <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' })
      return
    }

    api.updateAluminumPrice(price).then(() => {
      wx.showToast({ title: '铝价已更新', icon: 'success' })
    }).catch(err => {
      console.error('更新铝价失败', err)
      wx.showToast({ title: '更新失败', icon: 'none' })
    })
  },

  saveLossRatio() {
    const ratio = parseFloat(this.data.lossRatio)
    if (isNaN(ratio) || ratio <= 0) {
      wx.showToast({ title: '请输入有效数值', icon: 'none' })
      return
    }

    const token = auth.getToken()
    wx.request({
      url: BASE_URL + '/admin/config/loss-ratio?value=' + ratio,
      method: 'PUT',
      header: { 'Authorization': 'Bearer ' + token },
      success: res => {
        if (res.data.code === 200) {
          wx.showToast({ title: '损耗比已更新', icon: 'success' })
        } else {
          wx.showToast({ title: '更新失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  saveProfitRate() {
    const rate = parseFloat(this.data.profitRate)
    if (isNaN(rate) || rate < 0) {
      wx.showToast({ title: '请输入有效数值', icon: 'none' })
      return
    }

    const token = auth.getToken()
    wx.request({
      url: BASE_URL + '/admin/config/profit-rate?value=' + (rate / 100),
      method: 'PUT',
      header: { 'Authorization': 'Bearer ' + token },
      success: res => {
        if (res.data.code === 200) {
          wx.showToast({ title: '利润率已更新', icon: 'success' })
        } else {
          wx.showToast({ title: '更新失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  showLogisticsInfo() {
    wx.showModal({
      title: '物流数据',
      content: `当前已导入 ${this.data.logisticsCount} 条物流报价数据。\n\n如需更新，请通过后台管理系统导入新的 Excel 文件。`,
      showCancel: false
    })
  },

  copyLink(e) {
    const url = e.currentTarget.dataset.url
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'success' })
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
