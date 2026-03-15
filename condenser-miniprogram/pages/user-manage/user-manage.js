const api = require('../../utils/request')
const auth = require('../../utils/auth')

Page({
  data: {
    users: [],
    loading: false,
    refreshing: false,
    showModal: false,
    showAssignModal: false,
    isEdit: false,
    isAdmin: false,
    formData: {
      id: null,
      username: '',
      password: '',
      realName: '',
      phone: '',
      role: ''
    },
    assignUserId: null,
    assignForm: {
      techUserId: '',
      processUserId: '',
      logisticsUserId: ''
    },
    techOptions: [],
    processOptions: [],
    logisticsOptions: [],
    techIndex: 0,
    processIndex: 0,
    logisticsIndex: 0,
    roleIndex: 0,
    roleOptions: [],
    roleMap: {},
    userIdMap: {}
  },

  onLoad() {
    const userInfo = auth.getUserInfo()
    if (!userInfo || userInfo.role !== 'ADMIN') {
      wx.showToast({ title: '无权限访问', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({ isAdmin: userInfo.role === 'ADMIN' })
    this.loadRoles()
    this.loadUsers()
  },

  loadRoles() {
    api.getRoleList().then(roles => {
      if (!roles || !roles.length) return
      const roleOptions = roles.map(r => ({ value: r.roleCode, label: r.roleName }))
      const roleMap = {}
      roles.forEach(r => { roleMap[r.roleCode] = r.roleName })
      this.setData({ roleOptions, roleMap })
    })
  },

  loadUsers() {
    this.setData({ loading: true })
    const token = auth.getToken()
    wx.request({
      url: 'http://localhost:8080/api/admin/user/list',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: res => {
        if (res.data.code === 200) {
          const data = res.data.data
          const users = data.records || data || []
          this.setData({ users })
          this.buildAssignmentOptions(users)
        } else {
          wx.showToast({ title: res.data.message || '加载失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        this.setData({ loading: false, refreshing: false })
      }
    })
  },

  buildAssignmentOptions(users) {
    const toOption = u => ({ value: String(u.id), label: u.realName || u.username })
    const userIdMap = {}
    users.forEach(u => { userIdMap[String(u.id)] = u.realName || u.username })
    const techOptions = [{ value: '', label: '未分配' }].concat(
      users.filter(u => u.role === 'TECH').map(toOption)
    )
    const processOptions = [{ value: '', label: '未分配' }].concat(
      users.filter(u => u.role === 'PROCESS').map(toOption)
    )
    const logisticsOptions = [{ value: '', label: '未分配' }].concat(
      users.filter(u => u.role === 'LOGISTICS').map(toOption)
    )
    this.setData({ techOptions, processOptions, logisticsOptions, userIdMap })
  },

  onRefresh() {
    this.setData({ refreshing: true })
    this.loadUsers()
  },

  showAddModal() {
    const defaultRole = this.data.roleOptions.length > 0 ? this.data.roleOptions[0].value : ''
    this.setData({
      showModal: true,
      isEdit: false,
      formData: {
        id: null, username: '', password: '', realName: '', phone: '',
        role: defaultRole
      },
      roleIndex: 0
    })
  },

  editUser(e) {
    const user = e.currentTarget.dataset.user
    const roleIndex = this.data.roleOptions.findIndex(r => r.value === user.role)
    this.setData({
      showModal: true,
      isEdit: true,
      formData: {
        id: user.id, username: user.username, password: '',
        realName: user.realName || '', phone: user.phone || '',
        role: user.role
      },
      roleIndex: roleIndex >= 0 ? roleIndex : 0
    })
  },

  hideModal() {
    this.setData({ showModal: false })
  },

  showAssignModal(e) {
    const user = e.currentTarget.dataset.user
    if (user.role !== 'SALES') {
      wx.showToast({ title: '仅销售可分配归属', icon: 'none' })
      return
    }
    const techUserId = user.techUserId ? String(user.techUserId) : ''
    const processUserId = user.processUserId ? String(user.processUserId) : ''
    const logisticsUserId = user.logisticsUserId ? String(user.logisticsUserId) : ''
    const techIndex = this.data.techOptions.findIndex(o => o.value === techUserId)
    const processIndex = this.data.processOptions.findIndex(o => o.value === processUserId)
    const logisticsIndex = this.data.logisticsOptions.findIndex(o => o.value === logisticsUserId)
    this.setData({
      showAssignModal: true,
      assignUserId: user.id,
      assignForm: { techUserId, processUserId, logisticsUserId },
      techIndex: techIndex >= 0 ? techIndex : 0,
      processIndex: processIndex >= 0 ? processIndex : 0,
      logisticsIndex: logisticsIndex >= 0 ? logisticsIndex : 0
    })
  },

  hideAssignModal() {
    this.setData({ showAssignModal: false })
  },

  onAssignChange(e) {
    const field = e.currentTarget.dataset.field
    const index = parseInt(e.detail.value)
    const optionsMap = {
      techUserId: this.data.techOptions,
      processUserId: this.data.processOptions,
      logisticsUserId: this.data.logisticsOptions
    }
    const value = optionsMap[field][index].value
    this.setData({
      [`assignForm.${field}`]: value,
      [`${field.replace('UserId', '')}Index`]: index
    })
  },

  saveAssignments() {
    const { assignUserId, assignForm } = this.data
    const token = auth.getToken()
    wx.showLoading({ title: '保存中...' })
    wx.request({
      url: 'http://localhost:8080/api/admin/user/' + assignUserId + '/assignments',
      method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      data: {
        techUserId: assignForm.techUserId || null,
        processUserId: assignForm.processUserId || null,
        logisticsUserId: assignForm.logisticsUserId || null
      },
      success: res => {
        wx.hideLoading()
        if (res.data.code === 200) {
          wx.showToast({ title: '保存成功', icon: 'success' })
          this.hideAssignModal()
          this.loadUsers()
        } else {
          wx.showToast({ title: res.data.message || '保存失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  onFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`formData.${field}`]: e.detail.value })
  },

  onRoleChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      roleIndex: index,
      'formData.role': this.data.roleOptions[index].value
    })
  },

  saveUser() {
    const { formData, isEdit } = this.data
    if (!formData.username) {
      wx.showToast({ title: '请输入账号', icon: 'none' })
      return
    }
    if (!isEdit && !formData.password) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    if (!formData.role) {
      wx.showToast({ title: '请选择角色', icon: 'none' })
      return
    }

    const token = auth.getToken()
    const url = isEdit
      ? 'http://localhost:8080/api/admin/user/' + formData.id
      : 'http://localhost:8080/api/admin/user'
    const method = isEdit ? 'PUT' : 'POST'

    wx.showLoading({ title: '保存中...' })
    wx.request({
      url, method,
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      data: formData,
      success: res => {
        wx.hideLoading()
        if (res.data.code === 200) {
          wx.showToast({ title: '保存成功', icon: 'success' })
          this.hideModal()
          this.loadUsers()
        } else {
          wx.showToast({ title: res.data.message || '保存失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  resetPassword(e) {
    const user = e.currentTarget.dataset.user
    const token = auth.getToken()
    wx.showModal({
      title: '重置密码',
      content: '确定将 "' + (user.realName || user.username) + '" 的密码重置为 123456？',
      success: res => {
        if (!res.confirm) return
        wx.showLoading({ title: '重置中...' })
        wx.request({
          url: 'http://localhost:8080/api/admin/user/' + user.id + '/reset-pwd',
          method: 'PUT',
          header: { 'Authorization': 'Bearer ' + token },
          success: res => {
            wx.hideLoading()
            if (res.data.code === 200) {
              wx.showToast({ title: '密码已重置为 123456', icon: 'success' })
            } else {
              wx.showToast({ title: res.data.message || '重置失败', icon: 'none' })
            }
          },
          fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }) }
        })
      }
    })
  },

  toggleStatus(e) {
    const user = e.currentTarget.dataset.user
    const newStatus = user.status === 1 ? 0 : 1
    const token = auth.getToken()
    wx.showModal({
      title: '提示',
      content: '确定要' + (newStatus === 1 ? '启用' : '禁用') + '该用户吗？',
      success: res => {
        if (!res.confirm) return
        wx.request({
          url: 'http://localhost:8080/api/admin/user/' + user.id + '/status?status=' + newStatus,
          method: 'PUT',
          header: { 'Authorization': 'Bearer ' + token },
          success: res => {
            if (res.data.code === 200) {
              wx.showToast({ title: '操作成功', icon: 'success' })
              this.loadUsers()
            } else {
              wx.showToast({ title: res.data.message || '操作失败', icon: 'none' })
            }
          },
          fail: () => { wx.showToast({ title: '网络错误', icon: 'none' }) }
        })
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
