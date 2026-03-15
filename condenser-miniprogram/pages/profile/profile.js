const auth = require('../../utils/auth')

Page({
  data: {
    userInfo: {},
    roleText: '',
    isAdmin: false,
    canManageUser: false,
    canManageAssignment: false,
    canManageRole: false,
    canManageConfig: false,
    canManageProcessCenter: false,
    canManageSpec: false,
    canViewLogistics: false
  },

  onShow() {
    const userInfo = auth.getUserInfo()
    if (!userInfo) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    const roleMap = {
      ADMIN: '管理员',
      TECH: '技术员',
      SALES: '销售员',
      PROCESS: '工艺员',
      LOGISTICS: '物流员',
      MANAGER: '报价经理'
    }

    const role = userInfo.role
    const perms = auth.getPermissions() || []
    const hasPerm = (code) => perms.indexOf(code) !== -1
    this.setData({
      userInfo,
      roleText: roleMap[role] || role,
      isAdmin: role === 'ADMIN',
      canManageUser: hasPerm('SYSTEM_USER_MANAGE') || role === 'ADMIN',
      canManageAssignment: role === 'MANAGER' || role === 'ADMIN',
      canManageRole: hasPerm('SYSTEM_ROLE_MANAGE') || role === 'ADMIN',
      canManageConfig: hasPerm('SYSTEM_CONFIG') || role === 'ADMIN',
      canManageProcessCenter: hasPerm('SYSTEM_PROCESS_PRESET_CENTER') || role === 'ADMIN',
      canManageSpec: hasPerm('SYSTEM_SPEC_MANAGE') || role === 'ADMIN',
      canViewLogistics: hasPerm('DATA_VIEW_LOGISTICS') || role === 'ADMIN'
    })
  },

  goToProcessManage() {
    wx.navigateTo({ url: '/pages/process-manage/process-manage' })
  },

  goToSpecManage() {
    wx.navigateTo({ url: '/pages/spec-manage/spec-manage' })
  },

  goToLogisticsView() {
    wx.navigateTo({ url: '/pages/logistics-view/logistics-view' })
  },

  goToUserManage() {
    wx.navigateTo({ url: '/pages/user-manage/user-manage' })
  },

  goToAssignmentManage() {
    wx.navigateTo({ url: '/pages/assignment-manage/assignment-manage' })
  },

  goToRoleManage() {
    wx.navigateTo({ url: '/pages/role-manage/role-manage' })
  },

  goToConfig() {
    wx.navigateTo({ url: '/pages/config/config' })
  },

  goToDeadlineSettings() {
    wx.navigateTo({ url: '/pages/deadline-settings/deadline-settings' })
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          auth.logout()
        }
      }
    })
  }
})
