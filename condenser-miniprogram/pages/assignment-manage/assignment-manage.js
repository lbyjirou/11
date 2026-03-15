const auth = require('../../utils/auth')

const API_BASE = 'http://localhost:8080/api'

const FILTER_OPTIONS = [
  { value: 'ALL', label: '全部销售' },
  { value: 'NO_TECH', label: '未分配技术' },
  { value: 'HAS_TECH', label: '已分配技术' }
]

const MAIN_TABS = [
  { value: 'SALES', label: '销售' },
  { value: 'TECH', label: '技术' },
  { value: 'PROCESS', label: '生产' },
  { value: 'LOGISTICS', label: '物流' }
]

const TAB_LABELS = {
  SALES: '销售',
  TECH: '技术',
  PROCESS: '生产',
  LOGISTICS: '物流',
  APPROVAL: '审批'
}

function normalizeId(value) {
  return value === null || value === undefined || value === '' ? '' : String(value)
}

function getDisplayName(user) {
  if (!user) return ''
  return user.realName || user.username || ''
}

function buildOption(user) {
  return {
    value: normalizeId(user.id),
    label: getDisplayName(user),
    desc: user.username ? '@' + user.username : ''
  }
}

Page({
  data: {
    loading: false,
    refreshing: false,
    activeTab: 'SALES',
    tabs: MAIN_TABS,
    filterOptions: FILTER_OPTIONS,
    filterIndex: 0,
    searchText: '',
    selectedSalesIds: [],

    allUsers: [],
    salesUsers: [],
    techUsers: [],
    processUsers: [],
    logisticsUsers: [],
    managerUsers: [],
    userIdMap: {},

    salesUsersView: [],
    techUsersView: [],
    processUsersView: [],
    logisticsUsersView: [],

    showAssignModal: false,
    assignRole: '',
    assignUserId: '',
    assignMode: 'single',
    assignTargetIds: [],
    assignForm: {},
    assignOriginal: {},
    modalTitle: '归属分配',
    modalTabs: [],
    modalTab: '',
    modalSearchText: '',
    modalList: [],
    summaryTags: []
  },

  onLoad() {
    const userInfo = auth.getUserInfo()
    if (!userInfo || (userInfo.role !== 'MANAGER' && userInfo.role !== 'ADMIN')) {
      wx.showToast({ title: '无权限访问', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({
      assignForm: this.createEmptyAssignForm(),
      assignOriginal: this.createEmptyAssignOriginal()
    })
    this.loadUsers()
  },

  createEmptyAssignForm() {
    return {
      techUserId: '',
      techProcessUserId: '',
      processLogisticsUserId: '',
      logisticsApproveUserId: '',
      techSalesIds: [],
      processTechIds: [],
      logisticsProcessIds: []
    }
  },

  createEmptyAssignOriginal() {
    return {
      techSalesIds: [],
      processTechIds: [],
      logisticsProcessIds: []
    }
  },

  onRefresh() {
    this.setData({ refreshing: true })
    this.loadUsers()
  },

  loadUsers() {
    this.setData({ loading: true })
    wx.request({
      url: API_BASE + '/admin/user/list?page=1&size=500',
      method: 'GET',
      header: { Authorization: 'Bearer ' + auth.getToken() },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          const data = res.data.data || {}
          const records = data.records || data || []
          const users = records.map((item) => this.normalizeUser(item))
          const userIdMap = {}
          users.forEach((user) => {
            userIdMap[user.id] = getDisplayName(user)
          })

          this.setData({
            allUsers: users,
            salesUsers: users.filter((item) => item.role === 'SALES'),
            techUsers: users.filter((item) => item.role === 'TECH'),
            processUsers: users.filter((item) => item.role === 'PROCESS'),
            logisticsUsers: users.filter((item) => item.role === 'LOGISTICS'),
            managerUsers: users.filter((item) => item.role === 'MANAGER'),
            userIdMap
          }, () => {
            this.rebuildUserViews()
            if (this.data.showAssignModal) {
              this.refreshModalState()
            }
          })
        } else {
          wx.showToast({ title: (res.data && res.data.message) || '加载用户失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络请求失败', icon: 'none' })
      },
      complete: () => {
        this.setData({ loading: false, refreshing: false })
      }
    })
  },

  normalizeUser(user) {
    return Object.assign({}, user, {
      id: normalizeId(user.id),
      techUserId: normalizeId(user.techUserId),
      processUserId: normalizeId(user.processUserId),
      logisticsUserId: normalizeId(user.logisticsUserId),
      techProcessUserId: normalizeId(user.techProcessUserId),
      techLogisticsUserId: normalizeId(user.techLogisticsUserId),
      processLogisticsUserId: normalizeId(user.processLogisticsUserId),
      logisticsApproveUserId: normalizeId(user.logisticsApproveUserId)
    })
  },

  rebuildUserViews() {
    const salesByTech = this.buildPreviewMap(this.data.salesUsers, 'techUserId')
    const techByProcess = this.buildPreviewMap(this.data.techUsers, 'techProcessUserId')
    const processByLogistics = this.buildPreviewMap(this.data.processUsers, 'processLogisticsUserId')

    const selectedSales = new Set(this.data.selectedSalesIds)
    const keyword = (this.data.searchText || '').trim().toLowerCase()
    const filterValue = (this.data.filterOptions[this.data.filterIndex] || {}).value || 'ALL'

    const salesUsersView = this.data.salesUsers
      .filter((item) => {
        const name = getDisplayName(item).toLowerCase()
        const username = (item.username || '').toLowerCase()
        const matchKeyword = !keyword || name.indexOf(keyword) !== -1 || username.indexOf(keyword) !== -1
        if (!matchKeyword) return false
        if (filterValue === 'NO_TECH') return !item.techUserId
        if (filterValue === 'HAS_TECH') return !!item.techUserId
        return true
      })
      .map((item) => ({
        id: item.id,
        role: item.role,
        name: getDisplayName(item),
        username: item.username,
        avatarText: (getDisplayName(item) || '销').slice(0, 1),
        techLabel: this.getUserName(item.techUserId),
        selected: selectedSales.has(item.id)
      }))

    const techUsersView = this.data.techUsers.map((item) => ({
      id: item.id,
      role: item.role,
      name: getDisplayName(item),
      username: item.username,
      avatarText: (getDisplayName(item) || '技').slice(0, 1),
      salesCount: salesByTech[item.id] ? salesByTech[item.id].count : 0,
      salesPreview: salesByTech[item.id] ? salesByTech[item.id].preview : '',
      processLabel: this.getUserName(item.techProcessUserId)
    }))

    const processUsersView = this.data.processUsers.map((item) => ({
      id: item.id,
      role: item.role,
      name: getDisplayName(item),
      username: item.username,
      avatarText: (getDisplayName(item) || '产').slice(0, 1),
      techCount: techByProcess[item.id] ? techByProcess[item.id].count : 0,
      techPreview: techByProcess[item.id] ? techByProcess[item.id].preview : '',
      logisticsLabel: this.getUserName(item.processLogisticsUserId)
    }))

    const logisticsUsersView = this.data.logisticsUsers.map((item) => ({
      id: item.id,
      role: item.role,
      name: getDisplayName(item),
      username: item.username,
      avatarText: (getDisplayName(item) || '物').slice(0, 1),
      processCount: processByLogistics[item.id] ? processByLogistics[item.id].count : 0,
      processPreview: processByLogistics[item.id] ? processByLogistics[item.id].preview : '',
      approvalLabel: this.getUserName(item.logisticsApproveUserId)
    }))

    this.setData({
      salesUsersView,
      techUsersView,
      processUsersView,
      logisticsUsersView
    })
  },

  buildPreviewMap(list, fieldName) {
    const grouped = {}
    ;(list || []).forEach((item) => {
      const targetId = normalizeId(item[fieldName])
      if (!targetId) return
      if (!grouped[targetId]) {
        grouped[targetId] = []
      }
      grouped[targetId].push(getDisplayName(item))
    })

    const result = {}
    Object.keys(grouped).forEach((key) => {
      const names = grouped[key]
      result[key] = {
        count: names.length,
        preview: this.formatNameList(names)
      }
    })
    return result
  },

  formatNameList(names) {
    if (!names || !names.length) return ''
    if (names.length <= 3) return names.join('、')
    return names.slice(0, 3).join('、') + ' 等' + names.length + '人'
  },

  getUserName(userId) {
    const key = normalizeId(userId)
    if (!key) return '未分配'
    return this.data.userIdMap[key] || '未分配'
  },

  onSearchInput(e) {
    this.setData({ searchText: e.detail.value || '' }, () => this.rebuildUserViews())
  },

  onFilterChange(e) {
    this.setData({ filterIndex: Number(e.detail.value || 0) }, () => this.rebuildUserViews())
  },

  setActiveTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  toggleSelect(e) {
    const id = normalizeId(e.currentTarget.dataset.id)
    const selected = new Set(this.data.selectedSalesIds)
    if (selected.has(id)) {
      selected.delete(id)
    } else {
      selected.add(id)
    }
    this.setData({ selectedSalesIds: Array.from(selected) }, () => this.rebuildUserViews())
  },

  clearSelection() {
    this.setData({ selectedSalesIds: [] }, () => this.rebuildUserViews())
  },

  showBatchAssign() {
    if (!this.data.selectedSalesIds.length) {
      wx.showToast({ title: '请先选择销售人员', icon: 'none' })
      return
    }
    this.setData({
      showAssignModal: true,
      assignRole: 'SALES',
      assignUserId: '',
      assignMode: 'batch',
      assignTargetIds: this.data.selectedSalesIds.slice(),
      assignForm: this.createEmptyAssignForm(),
      assignOriginal: this.createEmptyAssignOriginal(),
      modalTabs: [{ value: 'TECH', label: '技术' }],
      modalTab: 'TECH',
      modalSearchText: ''
    }, () => this.refreshModalState())
  },

  openAssignModal(e) {
    const role = e.currentTarget.dataset.role
    const userId = normalizeId(e.currentTarget.dataset.id)
    const user = this.findUser(role, userId)
    if (!user) {
      wx.showToast({ title: '未找到对应用户', icon: 'none' })
      return
    }

    const assignForm = this.createEmptyAssignForm()
    const assignOriginal = this.createEmptyAssignOriginal()

    if (role === 'SALES') {
      assignForm.techUserId = user.techUserId || ''
    }

    if (role === 'TECH') {
      assignForm.techProcessUserId = user.techProcessUserId || ''
      assignForm.techSalesIds = this.data.salesUsers
        .filter((item) => item.techUserId === user.id)
        .map((item) => item.id)
      assignOriginal.techSalesIds = assignForm.techSalesIds.slice()
    }

    if (role === 'PROCESS') {
      assignForm.processLogisticsUserId = user.processLogisticsUserId || ''
      assignForm.processTechIds = this.data.techUsers
        .filter((item) => item.techProcessUserId === user.id)
        .map((item) => item.id)
      assignOriginal.processTechIds = assignForm.processTechIds.slice()
    }

    if (role === 'LOGISTICS') {
      assignForm.logisticsApproveUserId = user.logisticsApproveUserId || ''
      assignForm.logisticsProcessIds = this.data.processUsers
        .filter((item) => item.processLogisticsUserId === user.id)
        .map((item) => item.id)
      assignOriginal.logisticsProcessIds = assignForm.logisticsProcessIds.slice()
    }

    const modalTabs = this.getModalTabs(role)
    this.setData({
      showAssignModal: true,
      assignRole: role,
      assignUserId: user.id,
      assignMode: 'single',
      assignTargetIds: [user.id],
      assignForm,
      assignOriginal,
      modalTabs,
      modalTab: modalTabs.length ? modalTabs[0].value : '',
      modalSearchText: ''
    }, () => this.refreshModalState())
  },

  findUser(role, userId) {
    const sourceMap = {
      SALES: this.data.salesUsers,
      TECH: this.data.techUsers,
      PROCESS: this.data.processUsers,
      LOGISTICS: this.data.logisticsUsers,
      MANAGER: this.data.managerUsers
    }
    return (sourceMap[role] || []).find((item) => item.id === userId)
  },

  getModalTabs(role) {
    if (role === 'SALES') return [{ value: 'TECH', label: '技术' }]
    if (role === 'TECH') return [{ value: 'SALES', label: '销售' }, { value: 'PROCESS', label: '生产' }]
    if (role === 'PROCESS') return [{ value: 'TECH', label: '技术' }, { value: 'LOGISTICS', label: '物流' }]
    if (role === 'LOGISTICS') return [{ value: 'PROCESS', label: '生产' }, { value: 'APPROVAL', label: '审批' }]
    return []
  },

  hideAssignModal() {
    this.setData({
      showAssignModal: false,
      assignRole: '',
      assignUserId: '',
      assignTargetIds: [],
      assignForm: this.createEmptyAssignForm(),
      assignOriginal: this.createEmptyAssignOriginal(),
      modalTabs: [],
      modalTab: '',
      modalSearchText: '',
      modalList: [],
      summaryTags: [],
      modalTitle: '归属分配'
    })
  },

  setModalTab(e) {
    this.setData({
      modalTab: e.currentTarget.dataset.tab,
      modalSearchText: ''
    }, () => this.refreshModalState())
  },

  onModalSearchInput(e) {
    this.setData({ modalSearchText: e.detail.value || '' }, () => this.refreshModalState())
  },

  refreshModalState() {
    this.setData({
      modalList: this.buildModalList(),
      summaryTags: this.buildSummaryTags(),
      modalTitle: (TAB_LABELS[this.data.assignRole] || '') + '归属分配'
    })
  },

  buildSummaryTags() {
    const { assignRole, assignForm } = this.data
    const tags = []

    if (assignRole === 'SALES') {
      tags.push('归属技术：' + this.getUserName(assignForm.techUserId))
    }
    if (assignRole === 'TECH') {
      tags.push('负责销售：' + (assignForm.techSalesIds || []).length + '人')
      tags.push('流向生产：' + this.getUserName(assignForm.techProcessUserId))
    }
    if (assignRole === 'PROCESS') {
      tags.push('负责技术：' + (assignForm.processTechIds || []).length + '人')
      tags.push('流向物流：' + this.getUserName(assignForm.processLogisticsUserId))
    }
    if (assignRole === 'LOGISTICS') {
      tags.push('负责生产：' + (assignForm.logisticsProcessIds || []).length + '人')
      tags.push('流向审批：' + this.getUserName(assignForm.logisticsApproveUserId))
    }

    return tags
  },

  buildModalList() {
    const { assignRole, modalTab, modalSearchText } = this.data
    const keyword = (modalSearchText || '').trim().toLowerCase()
    const source = this.getModalSourceList(assignRole, modalTab)

    let list = source
      .filter((item) => {
        const label = (item.label || '').toLowerCase()
        const desc = (item.desc || '').toLowerCase()
        return !keyword || label.indexOf(keyword) !== -1 || desc.indexOf(keyword) !== -1
      })
      .map((item) => Object.assign({}, item, {
        checked: this.isOptionChecked(assignRole, modalTab, item.value)
      }))

    if (this.isMultiSelectTab(assignRole, modalTab)) {
      list = list.sort((left, right) => {
        if (left.checked === right.checked) {
          return left.label.localeCompare(right.label)
        }
        return left.checked ? -1 : 1
      })
    }

    return list
  },

  getModalSourceList(assignRole, modalTab) {
    if (!modalTab) return []

    if (this.isMultiSelectTab(assignRole, modalTab)) {
      if (modalTab === 'SALES') return this.data.salesUsers.map(buildOption)
      if (modalTab === 'TECH') return this.data.techUsers.map(buildOption)
      if (modalTab === 'PROCESS') return this.data.processUsers.map(buildOption)
      return []
    }

    if (modalTab === 'TECH') {
      return [{ value: '', label: '未分配', desc: '清空当前技术归属' }].concat(this.data.techUsers.map(buildOption))
    }
    if (modalTab === 'PROCESS') {
      return [{ value: '', label: '未分配', desc: '清空当前生产归属' }].concat(this.data.processUsers.map(buildOption))
    }
    if (modalTab === 'LOGISTICS') {
      return [{ value: '', label: '未分配', desc: '清空当前物流归属' }].concat(this.data.logisticsUsers.map(buildOption))
    }
    if (modalTab === 'APPROVAL') {
      return [{ value: '', label: '未分配', desc: '清空当前审批归属' }].concat(this.data.managerUsers.map(buildOption))
    }
    return []
  },

  isMultiSelectTab(assignRole, modalTab) {
    return (assignRole === 'TECH' && modalTab === 'SALES')
      || (assignRole === 'PROCESS' && modalTab === 'TECH')
      || (assignRole === 'LOGISTICS' && modalTab === 'PROCESS')
  },

  isOptionChecked(assignRole, modalTab, value) {
    const form = this.data.assignForm || {}
    if (assignRole === 'SALES' && modalTab === 'TECH') return form.techUserId === value
    if (assignRole === 'TECH' && modalTab === 'SALES') return (form.techSalesIds || []).indexOf(value) !== -1
    if (assignRole === 'TECH' && modalTab === 'PROCESS') return form.techProcessUserId === value
    if (assignRole === 'PROCESS' && modalTab === 'TECH') return (form.processTechIds || []).indexOf(value) !== -1
    if (assignRole === 'PROCESS' && modalTab === 'LOGISTICS') return form.processLogisticsUserId === value
    if (assignRole === 'LOGISTICS' && modalTab === 'PROCESS') return (form.logisticsProcessIds || []).indexOf(value) !== -1
    if (assignRole === 'LOGISTICS' && modalTab === 'APPROVAL') return form.logisticsApproveUserId === value
    return false
  },

  selectModalUser(e) {
    const value = normalizeId(e.currentTarget.dataset.id)
    const { assignRole, modalTab } = this.data
    const assignForm = Object.assign({}, this.data.assignForm)

    if (this.isMultiSelectTab(assignRole, modalTab)) {
      let field = ''
      if (assignRole === 'TECH' && modalTab === 'SALES') field = 'techSalesIds'
      if (assignRole === 'PROCESS' && modalTab === 'TECH') field = 'processTechIds'
      if (assignRole === 'LOGISTICS' && modalTab === 'PROCESS') field = 'logisticsProcessIds'

      const next = new Set(assignForm[field] || [])
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      assignForm[field] = Array.from(next)
    } else {
      if (assignRole === 'SALES' && modalTab === 'TECH') assignForm.techUserId = value
      if (assignRole === 'TECH' && modalTab === 'PROCESS') assignForm.techProcessUserId = value
      if (assignRole === 'PROCESS' && modalTab === 'LOGISTICS') assignForm.processLogisticsUserId = value
      if (assignRole === 'LOGISTICS' && modalTab === 'APPROVAL') assignForm.logisticsApproveUserId = value
    }

    this.setData({ assignForm }, () => this.refreshModalState())
  },

  saveAssignments() {
    const { assignRole, assignUserId, assignTargetIds, assignForm, assignOriginal } = this.data
    const tasks = []
    const pushTask = (ids, payload) => {
      const list = (ids || []).map(normalizeId).filter(Boolean)
      if (!list.length) return
      tasks.push({ ids: list, payload })
    }

    if (assignRole === 'SALES') {
      pushTask(assignTargetIds, { techUserId: assignForm.techUserId || null })
    }

    if (assignRole === 'TECH') {
      pushTask([assignUserId], { techProcessUserId: assignForm.techProcessUserId || null })
      const current = new Set(assignForm.techSalesIds || [])
      const original = new Set(assignOriginal.techSalesIds || [])
      pushTask(Array.from(current).filter((id) => !original.has(id)), { techUserId: assignUserId })
      pushTask(Array.from(original).filter((id) => !current.has(id)), { techUserId: null })
    }

    if (assignRole === 'PROCESS') {
      pushTask([assignUserId], { processLogisticsUserId: assignForm.processLogisticsUserId || null })
      const current = new Set(assignForm.processTechIds || [])
      const original = new Set(assignOriginal.processTechIds || [])
      pushTask(Array.from(current).filter((id) => !original.has(id)), { techProcessUserId: assignUserId })
      pushTask(Array.from(original).filter((id) => !current.has(id)), { techProcessUserId: null })
    }

    if (assignRole === 'LOGISTICS') {
      pushTask([assignUserId], { logisticsApproveUserId: assignForm.logisticsApproveUserId || null })
      const current = new Set(assignForm.logisticsProcessIds || [])
      const original = new Set(assignOriginal.logisticsProcessIds || [])
      pushTask(Array.from(current).filter((id) => !original.has(id)), { processLogisticsUserId: assignUserId })
      pushTask(Array.from(original).filter((id) => !current.has(id)), { processLogisticsUserId: null })
    }

    if (!tasks.length) {
      wx.showToast({ title: '没有需要保存的变更', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })
    this.runAssignmentTasks(tasks)
      .then(() => {
        wx.hideLoading()
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.hideAssignModal()
        this.clearSelection()
        this.loadUsers()
      })
      .catch((message) => {
        wx.hideLoading()
        wx.showToast({ title: message || '保存失败', icon: 'none' })
      })
  },

  runAssignmentTasks(tasks) {
    const token = auth.getToken()
    return tasks.reduce((promise, task) => {
      return promise.then(() => this.applyAssignments(task.ids, task.payload, token))
    }, Promise.resolve())
  },

  applyAssignments(ids, payload, token) {
    const list = (ids || []).map(normalizeId).filter(Boolean)
    if (!list.length) {
      return Promise.resolve()
    }

    let chain = Promise.resolve()
    list.forEach((id) => {
      chain = chain.then(() => new Promise((resolve, reject) => {
        wx.request({
          url: API_BASE + '/admin/user/' + id + '/assignments',
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
          },
          data: payload,
          success: (res) => {
            if (res.data && res.data.code === 200) {
              resolve()
            } else {
              reject((res.data && res.data.message) || '保存失败')
            }
          },
          fail: () => reject('网络请求失败')
        })
      }))
    })
    return chain
  },

  goBack() {
    wx.navigateBack()
  }
})
