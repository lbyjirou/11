const auth = require('../../utils/auth')

const BASE_URL = 'http://localhost:8080/api'
const DEFAULT_COL = { key: 'name', label: '工序名称', type: 'text', role: 'input', unit: '', formula: '', defaultValue: '' }

function emptyForm() {
  return {
    id: null, processName: '', sectionLabel: '', sectionKey: '',
    columns: [{ ...DEFAULT_COL }]
  }
}

Page({
  data: {
    processList: [],
    loading: false,
    refreshing: false,
    showModal: false,
    isEdit: false,
    formData: emptyForm(),
    sectionSearch: '',
    sectionMatched: false,
    filteredSections: [],
    showSectionDropdown: false
  },

  onLoad() {
    const userInfo = auth.getUserInfo()
    if (!userInfo || (userInfo.role !== 'ADMIN' && userInfo.role !== 'TECH' && userInfo.role !== 'PROCESS')) {
      wx.showToast({ title: '无权限访问', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.loadProcessList()
  },

  loadProcessList() {
    this.setData({ loading: true })
    const token = auth.getToken()
    wx.request({
      url: BASE_URL + '/process/all',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: res => {
        if (res.data.code === 200) {
          this.setData({ processList: res.data.data || [] })
        } else {
          wx.showToast({ title: res.data.message || '加载失败', icon: 'none' })
        }
      },
      fail: () => { wx.showToast({ title: '网络错误', icon: 'none' }) },
      complete: () => { this.setData({ loading: false, refreshing: false }) }
    })
  },

  onRefresh() {
    this.setData({ refreshing: true })
    this.loadProcessList()
  },

  showAddModal() {
    this.setData({
      showModal: true, isEdit: false, formData: emptyForm(),
      sectionSearch: '', sectionMatched: false, filteredSections: [], showSectionDropdown: false
    })
  },

  editProcess(e) {
    const item = e.currentTarget.dataset.item
    let columns = [{ ...DEFAULT_COL }]
    try {
      if (item.columnsJson) columns = JSON.parse(item.columnsJson)
    } catch (err) {}
    const sections = this._getUniqueSections()
    const matched = !!sections.find(s => s.key === item.sectionKey)
    this.setData({
      showModal: true, isEdit: true,
      formData: {
        id: item.id,
        processName: item.processName || '',
        sectionLabel: item.sectionLabel || '',
        sectionKey: item.sectionKey || '',
        columns: columns.map(c => ({
          key: c.key || '', label: c.label || '', type: c.type || 'number',
          role: c.role || 'input', unit: c.unit || '', formula: c.formula || '',
          defaultValue: c.defaultValue !== undefined ? String(c.defaultValue) : ''
        }))
      },
      sectionSearch: item.sectionLabel || '',
      sectionMatched: matched,
      filteredSections: [], showSectionDropdown: false
    })
  },

  hideModal() { this.setData({ showModal: false }) },

  onFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['formData.' + field]: e.detail.value })
  },

  // 列定义操作
  onColumnInput(e) {
    const { idx, field } = e.currentTarget.dataset
    this.setData({ ['formData.columns[' + idx + '].' + field]: e.detail.value })
  },

  onColumnRoleChange(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    const role = parseInt(e.detail.value) === 0 ? 'input' : 'output'
    this.setData({ ['formData.columns[' + idx + '].role']: role })
  },

  addColumn() {
    const cols = this.data.formData.columns
    cols.push({ key: '', label: '', type: 'number', role: 'input', unit: '', formula: '', defaultValue: '' })
    this.setData({ 'formData.columns': cols })
  },

  deleteColumn(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    const cols = this.data.formData.columns
    if (cols[idx].key === 'name') { wx.showToast({ title: '工序名称列不可删除', icon: 'none' }); return }
    cols.splice(idx, 1)
    this.setData({ 'formData.columns': cols })
  },

  // 从已有预设中提取不重复的区域列表
  _getUniqueSections() {
    const map = {}
    ;(this.data.processList || []).forEach(p => {
      if (p.sectionKey && p.sectionLabel && !map[p.sectionKey]) {
        map[p.sectionKey] = { key: p.sectionKey, label: p.sectionLabel }
      }
    })
    return Object.values(map)
  },

  onSectionSearchInput(e) {
    const keyword = e.detail.value
    this.setData({
      sectionSearch: keyword, 'formData.sectionLabel': keyword,
      'formData.sectionKey': '', sectionMatched: false
    })
    if (!keyword.trim()) {
      this.setData({ filteredSections: [], showSectionDropdown: false })
      return
    }
    const kw = keyword.trim().toLowerCase()
    const filtered = this._getUniqueSections().filter(s => s.label.toLowerCase().includes(kw))
    this.setData({ filteredSections: filtered, showSectionDropdown: filtered.length > 0 })
  },

  selectSection(e) {
    const key = e.currentTarget.dataset.key
    const sec = this._getUniqueSections().find(s => s.key === key)
    if (!sec) return
    this.setData({
      sectionSearch: sec.label,
      'formData.sectionLabel': sec.label,
      'formData.sectionKey': sec.key,
      sectionMatched: true,
      filteredSections: [], showSectionDropdown: false
    })
  },

  hideSectionDropdown() {
    setTimeout(() => { this.setData({ showSectionDropdown: false }) }, 200)
  },

  onSectionKeyInput(e) {
    this.setData({ 'formData.sectionKey': e.detail.value.trim() })
  },

  saveProcess() {
    const { formData, isEdit } = this.data
    if (!formData.processName.trim()) { wx.showToast({ title: '请输入工序名称', icon: 'none' }); return }
    if (!formData.sectionLabel.trim()) { wx.showToast({ title: '请输入所属区域', icon: 'none' }); return }
    for (const col of formData.columns) {
      if (!col.key || !col.label) { wx.showToast({ title: '列的名称和变量名不能为空', icon: 'none' }); return }
    }
    let sectionKey = formData.sectionKey
    if (!sectionKey) {
      wx.showToast({ title: '请输入区域变量名', icon: 'none' }); return
    }

    const columnsForSave = formData.columns.map(c => {
      const col = { key: c.key, label: c.label, type: c.type, role: c.role }
      if (c.unit) col.unit = c.unit
      if (c.formula) col.formula = c.formula
      if (c.defaultValue !== undefined && c.defaultValue !== '') col.defaultValue = c.defaultValue
      return col
    })

    const token = auth.getToken()
    const url = isEdit ? BASE_URL + '/process/' + formData.id : BASE_URL + '/process'
    const method = isEdit ? 'PUT' : 'POST'
    const data = {
      processName: formData.processName.trim(),
      sectionKey, sectionLabel: formData.sectionLabel.trim(),
      columnsJson: JSON.stringify(columnsForSave),
      isActive: 1
    }

    wx.showLoading({ title: '保存中...' })
    wx.request({
      url, method,
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      data,
      success: res => {
        wx.hideLoading()
        if (res.data.code === 200) {
          wx.showToast({ title: '保存成功', icon: 'success' })
          this.hideModal()
          this.loadProcessList()
        } else {
          wx.showToast({ title: res.data.message || '保存失败', icon: 'none' })
        }
      },
      fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }) }
    })
  },

  deleteProcess(e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: '确认删除',
      content: '确定要删除预设工序"' + item.processName + '"吗？',
      success: res => {
        if (!res.confirm) return
        const token = auth.getToken()
        wx.showLoading({ title: '删除中...' })
        wx.request({
          url: BASE_URL + '/process/' + item.id,
          method: 'DELETE',
          header: { 'Authorization': 'Bearer ' + token },
          success: res => {
            wx.hideLoading()
            if (res.data.code === 200) {
              wx.showToast({ title: '删除成功', icon: 'success' })
              this.loadProcessList()
            } else {
              wx.showToast({ title: res.data.message || '删除失败', icon: 'none' })
            }
          },
          fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }) }
        })
      }
    })
  },

  toggleActive(e) {
    const item = e.currentTarget.dataset.item
    const newStatus = item.isActive === 1 ? 0 : 1
    const token = auth.getToken()
    wx.showLoading({ title: '更新中...' })
    wx.request({
      url: BASE_URL + '/process/' + item.id,
      method: 'PUT',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      data: { ...item, isActive: newStatus },
      success: res => {
        wx.hideLoading()
        if (res.data.code === 200) {
          wx.showToast({ title: newStatus === 1 ? '已启用' : '已禁用', icon: 'success' })
          this.loadProcessList()
        } else {
          wx.showToast({ title: res.data.message || '更新失败', icon: 'none' })
        }
      },
      fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }) }
    })
  },

  goBack() { wx.navigateBack() }
})