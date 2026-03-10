const api = require('../../utils/request')
const auth = require('../../utils/auth')

Page({
  data: {
    users: [],
    loading: false,
    refreshing: false,
    showModal: false,
    isEdit: false,
    formData: {
      id: null,
      username: '',
      password: '',
      realName: '',
      phone: '',
      role: ''
    },
    roleIndex: 0,
    roleOptions: [],
    roleMap: {}
  },

  onLoad() {
    const userInfo = auth.getUserInfo()
    if (!userInfo || userInfo.role !== 'ADMIN') {
      wx.showToast({ title: '无权限访问', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
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