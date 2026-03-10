const auth = require('../../utils/auth')

const BASE_URL = 'http://localhost:8080/api'

const FIELD_LABELS = {
  origin: '出发地',
  destination: '到站',
  company_name: '物流公司',
  price_scatter: '散货',
  price_4_2m: '4.2米',
  price_6_8m: '6.8米',
  price_9_6m: '9.6米',
  price_13_5m: '13.5米',
  price_17_5m: '17.5米',
  price_16m_box: '16米厢车',
  min_charge_val: '最低收费'
}

Page({
  data: {
    direction: 'OUTBOUND',
    locationList: [],
    selectedLocation: '',
    priceList: [],
    loading: false,
    canImport: false,
    showPreviewModal: false,
    analyzeResult: null,
    importing: false,
    fieldLabels: FIELD_LABELS,
    expireInfo: null
  },

  onLoad() {
    const userInfo = auth.getUserInfo()
    const canImport = userInfo && (userInfo.role === 'ADMIN' || userInfo.role === 'LOGISTICS')
    this.setData({ canImport })
    this.loadLocationList()
    this.loadExpireInfo()
  },

  loadExpireInfo() {
    const token = auth.getToken()
    wx.request({
      url: BASE_URL + '/logistics/expire-info',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: res => {
        if (res.data.code === 200) {
          this.setData({ expireInfo: res.data.data })
        }
      }
    })
  },

  switchDirection(e) {
    const direction = e.currentTarget.dataset.direction
    if (direction === this.data.direction) return

    this.setData({
      direction,
      locationList: [],
      selectedLocation: '',
      priceList: []
    })
    this.loadLocationList()
  },

  loadLocationList() {
    const token = auth.getToken()
    const { direction } = this.data
    const url = direction === 'OUTBOUND'
      ? BASE_URL + '/logistics/outbound/destinations'
      : BASE_URL + '/logistics/inbound/origins'

    wx.request({
      url,
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: res => {
        if (res.data.code === 200) {
          this.setData({ locationList: res.data.data || [] })
        } else {
          wx.showToast({ title: res.data.message || '加载失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  selectLocation(e) {
    const location = e.currentTarget.dataset.location
    this.setData({ selectedLocation: location })
    this.loadPriceList(location)
  },

  loadPriceList(location) {
    this.setData({ loading: true, priceList: [] })
    const token = auth.getToken()
    const { direction } = this.data

    const url = direction === 'OUTBOUND'
      ? BASE_URL + '/logistics/outbound/prices?destination=' + encodeURIComponent(location)
      : BASE_URL + '/logistics/inbound/prices?origin=' + encodeURIComponent(location)

    wx.request({
      url,
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: res => {
        if (res.data.code === 200) {
          this.setData({ priceList: res.data.data || [] })
        } else {
          wx.showToast({ title: res.data.message || '加载失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  goBack() {
    wx.navigateBack()
  },

  // ==================== 导入功能 ====================

  onImportTap() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls'],
      success: res => {
        const file = res.tempFiles[0]
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
          wx.showToast({ title: '请选择Excel文件', icon: 'none' })
          return
        }
        this.analyzeExcel(file.path, file.name)
      }
    })
  },

  analyzeExcel(filePath, fileName) {
    wx.showLoading({ title: '解析中...' })
    const token = auth.getToken()

    wx.uploadFile({
      url: BASE_URL + '/logistics/analyze',
      filePath: filePath,
      name: 'file',
      header: { 'Authorization': 'Bearer ' + token },
      success: res => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 200 && data.data) {
            const result = data.data
            if (result.success) {
              this.setData({
                analyzeResult: result,
                showPreviewModal: true
              })
            } else {
              wx.showToast({ title: result.errorMessage || '解析失败', icon: 'none' })
            }
          } else {
            wx.showToast({ title: data.message || '解析失败', icon: 'none' })
          }
        } catch (e) {
          wx.showToast({ title: '解析响应失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '上传失败', icon: 'none' })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  closePreviewModal() {
    this.setData({ showPreviewModal: false, analyzeResult: null })
  },

  preventClose() {},

  confirmImport() {
    const { analyzeResult } = this.data
    if (!analyzeResult || !analyzeResult.fileKey) {
      wx.showToast({ title: '数据异常', icon: 'none' })
      return
    }

    this.setData({ importing: true })
    const token = auth.getToken()

    wx.request({
      url: BASE_URL + '/logistics/import',
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      data: {
        fileKey: analyzeResult.fileKey,
        regions: analyzeResult.regions
      },
      success: res => {
        if (res.data.code === 200 && res.data.data) {
          const result = res.data.data
          if (result.success) {
            wx.showModal({
              title: '导入成功',
              content: `新增 ${result.insertedCount} 条\n更新 ${result.updatedCount} 条\n失败 ${result.failedCount} 条`,
              showCancel: false,
              success: () => {
                this.closePreviewModal()
                this.loadLocationList()
                this.loadExpireInfo()
                // 如果当前已选中地点，刷新价格列表
                if (this.data.selectedLocation) {
                  this.loadPriceList(this.data.selectedLocation)
                }
              }
            })
          } else {
            wx.showToast({ title: result.errorMessage || '导入失败', icon: 'none' })
          }
        } else {
          wx.showToast({ title: res.data.message || '导入失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        this.setData({ importing: false })
      }
    })
  }
})
