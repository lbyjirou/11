const app = getApp()

function request(url, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.apiBase + url,
      method,
      data,
      header: { 'Content-Type': 'application/json' },
      success: res => resolve(res.data),
      fail: err => reject(err)
    })
  })
}

// 获取当前铝价
function getPrice() {
  return request('/api/price')
}

// 更新铝价
function updatePrice(price, diffRatio, lossRatio) {
  return request('/api/price', 'POST', { price, diff_ratio: diffRatio, loss_ratio: lossRatio })
}

// 获取集流管规格
function getCollectorSpecs() {
  return request('/api/spec/collector')
}

// 获取翅片规格
function getFinSpecs() {
  return request('/api/spec/fin')
}

// 获取扁管规格
function getTubeSpecs() {
  return request('/api/spec/tube')
}

// 保存报价
function saveQuote(data) {
  return request('/api/quote/save', 'POST', data)
}

// 获取通用部件
function getComponents() {
  return request('/api/spec/component')
}

// 导出报价单
function exportExcel(data) {
  const app = getApp()
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url: app.globalData.apiBase + '/api/export/excel',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: JSON.stringify(data),
      success: res => {
        if (res.statusCode === 200) {
          resolve(res.tempFilePath)
        } else {
          reject(new Error('导出失败'))
        }
      },
      fail: err => reject(err)
    })
  })
}

module.exports = { getPrice, updatePrice, getCollectorSpecs, getFinSpecs, getTubeSpecs, saveQuote, getComponents, exportExcel }
