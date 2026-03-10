const auth = require('./auth')

const BASE_URL = 'http://localhost:8080/api'

function request(url, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    const token = auth.getToken()
    const header = { 'Content-Type': 'application/json' }
    if (token) {
      header['Authorization'] = 'Bearer ' + token
    }

    wx.request({
      url: BASE_URL + url,
      method,
      data,
      header,
      success: res => {
        if (res.statusCode === 401) {
          auth.logout()
          reject(new Error('登录已过期'))
          return
        }
        if (res.statusCode === 403) {
          wx.showToast({ title: '权限不足', icon: 'none' })
          reject(new Error('权限不足'))
          return
        }
        if (res.data.code !== 200) {
          wx.showToast({ title: res.data.message || '请求失败', icon: 'none' })
          reject(new Error(res.data.message))
          return
        }
        resolve(res.data.data)
      },
      fail: err => {
        wx.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      }
    })
  })
}

function login(username, password) {
  return request('/auth/login', 'POST', { username, password })
}

function getCurrentUser() {
  return request('/auth/me')
}

function getAluminumPrice() {
  return request('/admin/config/aluminum-price')
}

function getLossRatio() {
  return request('/admin/config/loss-ratio/public')
}

function getProfitRate() {
  return request('/admin/config/profit-rate/public')
}

function updateAluminumPrice(price) {
  return request('/admin/config/aluminum-price?price=' + price, 'PUT')
}

function updateLossRatio(value) {
  return request('/admin/config/loss-ratio?value=' + value, 'PUT')
}

function updateProfitRate(value) {
  return request('/admin/config/profit-rate?value=' + value, 'PUT')
}

function getCollectorSpecs() {
  return request('/spec/collector')
}

function getFinSpecs() {
  return request('/spec/fin')
}

function getTubeSpecs() {
  return request('/spec/tube')
}

function getComponentSpecs() {
  return request('/spec/component')
}

function saveSpec(spec) {
  return request('/spec', 'POST', spec)
}

function updateSpec(id, spec) {
  return request('/spec/' + id, 'PUT', spec)
}

function deleteSpec(id) {
  return request('/spec/' + id, 'DELETE')
}

function getProcessList() {
  return request('/process/list')
}

function createProcess(data) {
  return request('/process', 'POST', data)
}

function updateProcess(id, data) {
  return request('/process/' + id, 'PUT', data)
}

function deleteProcess(id) {
  return request('/process/' + id, 'DELETE')
}

function getDestinations() {
  return request('/logistics/destinations')
}

function getOutboundDestinations() {
  return request('/logistics/outbound/destinations')
}

function getInboundOrigins() {
  return request('/logistics/inbound/origins')
}

function calculateLogistics(destination, weight) {
  return request('/logistics/quote?destination=' + encodeURIComponent(destination) + '&weight=' + weight)
}

function calculateOutboundLogistics(destination, volume) {
  return request('/logistics/outbound/quote?destination=' + encodeURIComponent(destination) + '&volume=' + volume)
}

function calculateInboundLogistics(origin, volume) {
  return request('/logistics/inbound/quote?origin=' + encodeURIComponent(origin) + '&volume=' + volume)
}

function getOutboundPrices(destination) {
  return request('/logistics/outbound/prices?destination=' + encodeURIComponent(destination))
}

function getInboundPrices(origin) {
  return request('/logistics/inbound/prices?origin=' + encodeURIComponent(origin))
}

function calculateQuote(data) {
  return request('/quote/calculate', 'POST', data)
}

function saveQuote(data) {
  return request('/quote/save', 'POST', data)
}

function getQuoteList(page, size) {
  return request('/quote/list?page=' + page + '&size=' + size)
}

function deleteQuote(id) {
  return request('/quote/' + id, 'DELETE')
}

function downloadQuoteExcel(data) {
  const token = auth.getToken()
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + '/quote/export',
      method: 'POST',
      data: data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      responseType: 'arraybuffer',
      success: res => {
        if (res.statusCode === 200) {
          const fs = wx.getFileSystemManager()
          const filePath = wx.env.USER_DATA_PATH + '/quote_' + Date.now() + '.xlsx'
          fs.writeFile({
            filePath: filePath,
            data: res.data,
            encoding: 'binary',
            success: () => resolve(filePath),
            fail: err => reject(new Error('保存文件失败'))
          })
        } else {
          reject(new Error('导出失败'))
        }
      },
      fail: err => reject(err)
    })
  })
}

// ==================== 新版报价单流程 API ====================

// 报价单列表（分页 + 状态筛选）
function getQuoteOrderList(page = 1, size = 10, status = '') {
  let url = '/quote/list?page=' + page + '&size=' + size
  if (status) url += '&status=' + status
  return request(url)
}

// 获取报价单详情
function getQuoteOrderDetail(id) {
  return request('/quote/' + id)
}

// 创建报价单（销售员）
function createQuoteOrder(data) {
  return request('/quote/create', 'POST', data)
}

// 更新报价单
function updateQuoteOrder(id, data) {
  return request('/quote/' + id, 'PUT', data)
}

// 提交报价单到下一环节
function submitQuoteOrder(id) {
  return request('/quote/' + id + '/submit', 'POST')
}

// 推进报价单状态（TECH/PROCESS/LOGISTICS 角色使用）
function advanceQuoteStatus(id) {
  return request('/quote/' + id + '/advance', 'POST')
}

// 提交工艺核算
function submitProcessCalc(orderId) {
  return request('/process-calc/submit/' + orderId, 'POST')
}

// 获取工单已保存的工序列表
function getOrderProcesses(orderId) {
  return request('/process-calc/list/' + orderId)
}

// 经理审批通过
function approveOrder(orderId) {
  return request('/manager/approve/' + orderId, 'POST')
}

// 计算装箱方案
function calcBinPacking(data) {
  return request('/bin-packing/calculate', 'POST', data)
}

// 方案编辑后重新计算
function recalculateBinPacking(data) {
  return request('/bin-packing/recalculate', 'POST', data)
}

// 获取报价单流程进度
function getOrderProgress(id) {
  return request('/quote/' + id + '/progress')
}

// ==================== 修改流程 API ====================

function initiateModification(orderId, reason) {
  return request('/quote/modification/' + orderId + '/initiate', 'POST', { reason: reason || '' })
}

function confirmNoChange(orderId) {
  return request('/quote/modification/' + orderId + '/confirm', 'POST')
}

function resubmitModification(orderId, dataJson) {
  return request('/quote/modification/' + orderId + '/resubmit', 'POST', { dataJson: dataJson })
}

function getModificationStatus(orderId) {
  return request('/quote/modification/' + orderId + '/status')
}

// ==================== 角色管理 API ====================

function getRoleList() {
  return request('/admin/role/list')
}

function getAllPermissions() {
  return request('/admin/role/permissions')
}

function getRolePermissions(roleId) {
  return request('/admin/role/' + roleId + '/permissions')
}

function createRole(data) {
  return request('/admin/role', 'POST', data)
}

function updateRole(id, data) {
  return request('/admin/role/' + id, 'PUT', data)
}

function deleteRole(id) {
  return request('/admin/role/' + id, 'DELETE')
}

function assignRolePermissions(roleId, permissionIds) {
  return request('/admin/role/' + roleId + '/permissions', 'POST', permissionIds)
}

function assignUserRoles(userId, roleIds) {
  return request('/admin/user/' + userId + '/roles', 'POST', roleIds)
}

function getUserRoles(userId) {
  return request('/admin/user/' + userId + '/roles')
}

// 客户库
function searchCustomers(keyword) {
  return request('/customer/search?keyword=' + encodeURIComponent(keyword || ''))
}

function createCustomer(data) {
  return request('/customer', 'POST', data)
}

function updateCustomer(id, data) {
  return request('/customer/' + id, 'PUT', data)
}

function deleteCustomer(id) {
  return request('/customer/' + id, 'DELETE')
}

// 交期配置（管理员）
function getDeadlineConfig() {
  return request('/admin/deadline/config')
}

function saveDeadlineConfig(config) {
  return request('/admin/deadline/config', 'POST', config)
}

// 通知
function getNotifications() {
  return request('/notification/list')
}

function getUnreadCount() {
  return request('/notification/unread-count')
}

function markNotificationRead(id) {
  return request('/notification/' + id + '/read', 'POST')
}

function markAllNotificationsRead() {
  return request('/notification/read-all', 'POST')
}

// 报价单截止时间
function getQuoteDeadlines(quoteId) {
  return request('/notification/deadlines/' + quoteId)
}

// ==================== 工艺模版 API ====================

function getPartPresets() {
  return request('/part-preset/all')
}
function createPartPreset(data) {
  return request('/part-preset', 'POST', data)
}
function updatePartPreset(id, data) {
  return request('/part-preset/' + id, 'PUT', data)
}
function deletePartPreset(id) {
  return request('/part-preset/' + id, 'DELETE')
}

function searchProcessFeePresets(keyword) {
  return request('/process-fee-preset/search?keyword=' + encodeURIComponent(keyword || ''))
}
function createProcessFeePreset(data) {
  return request('/process-fee-preset', 'POST', data)
}
function updateProcessFeePreset(id, data) {
  return request('/process-fee-preset/' + id, 'PUT', data)
}
function deleteProcessFeePreset(id) {
  return request('/process-fee-preset/' + id, 'DELETE')
}

function getMaterialCostPresets(type) {
  return request('/material-cost-preset/list?type=' + encodeURIComponent(type))
}
function createMaterialCostPreset(data) {
  return request('/material-cost-preset', 'POST', data)
}
function updateMaterialCostPreset(id, data) {
  return request('/material-cost-preset/' + id, 'PUT', data)
}
function deleteMaterialCostPreset(id) {
  return request('/material-cost-preset/' + id, 'DELETE')
}

function getProcessTemplates() {
  return request('/process-template/list')
}

function createProcessTemplate(data) {
  return request('/process-template', 'POST', data)
}

function updateProcessTemplate(id, data) {
  return request('/process-template/' + id, 'PUT', data)
}

function deleteProcessTemplate(id) {
  return request('/process-template/' + id, 'DELETE')
}

function getLastUsedProcessStructure() {
  return request('/process-template/last-used')
}

// ==================== 统一能耗模版 API（device/mold/material） ====================

function getEnergyDeviceTemplates(category) {
  return request('/energy-device-template/list?category=' + encodeURIComponent(category || 'device'))
}

function searchEnergyDeviceTemplates(keyword, category) {
  return request('/energy-device-template/search?keyword=' + encodeURIComponent(keyword || '') + '&category=' + encodeURIComponent(category || 'device'))
}

function createEnergyDeviceTemplate(data) {
  return request('/energy-device-template', 'POST', data)
}

function updateEnergyDeviceTemplate(id, data) {
  return request('/energy-device-template/' + id, 'PUT', data)
}

function deleteEnergyDeviceTemplate(id) {
  return request('/energy-device-template/' + id, 'DELETE')
}

module.exports = {
  // 认证
  login,
  getCurrentUser,
  // 系统配置
  getAluminumPrice,
  getLossRatio,
  getProfitRate,
  updateAluminumPrice,
  updateLossRatio,
  updateProfitRate,
  // 规格库
  getCollectorSpecs,
  getFinSpecs,
  getTubeSpecs,
  getComponentSpecs,
  saveSpec,
  updateSpec,
  deleteSpec,
  getProcessList,
  createProcess,
  updateProcess,
  deleteProcess,
  // 物流查询
  getDestinations,
  getOutboundDestinations,
  getInboundOrigins,
  calculateLogistics,
  calculateOutboundLogistics,
  calculateInboundLogistics,
  getOutboundPrices,
  getInboundPrices,
  // 报价
  calculateQuote,
  saveQuote,
  getQuoteList,
  deleteQuote,
  downloadQuoteExcel,
  // 报价单流程
  getQuoteOrderList,
  getQuoteOrderDetail,
  createQuoteOrder,
  updateQuoteOrder,
  submitQuoteOrder,
  advanceQuoteStatus,
  submitProcessCalc,
  getOrderProcesses,
  approveOrder,
  // 装箱计算
  calcBinPacking,
  recalculateBinPacking,
  // 流程进度
  getOrderProgress,
  // 修改流程
  initiateModification,
  confirmNoChange,
  resubmitModification,
  getModificationStatus,
  // 角色管理
  getRoleList,
  getAllPermissions,
  getRolePermissions,
  createRole,
  updateRole,
  deleteRole,
  assignRolePermissions,
  assignUserRoles,
  getUserRoles,
  // 客户库
  searchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  // 交期配置
  getDeadlineConfig,
  saveDeadlineConfig,
  // 通知
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  // 报价单截止时间
  getQuoteDeadlines,
  // 工艺模版
  getProcessTemplates,
  createProcessTemplate,
  updateProcessTemplate,
  deleteProcessTemplate,
  getLastUsedProcessStructure,
  // 零件模版
  getPartPresets,
  createPartPreset,
  updatePartPreset,
  deletePartPreset,
  // 加工费预存
  searchProcessFeePresets,
  createProcessFeePreset,
  updateProcessFeePreset,
  deleteProcessFeePreset,
  // 材料预算系数
  getMaterialCostPresets,
  createMaterialCostPreset,
  updateMaterialCostPreset,
  deleteMaterialCostPreset,
  // 设备能耗模版
  getEnergyDeviceTemplates,
  searchEnergyDeviceTemplates,
  createEnergyDeviceTemplate,
  updateEnergyDeviceTemplate,
  deleteEnergyDeviceTemplate
}
