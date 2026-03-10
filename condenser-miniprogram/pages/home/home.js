const auth = require('../../utils/auth')

Page({
  data: {
    loaded: false,
    userInfo: null,
    devices: [
      { id: 'condenser', name: '冷凝器', desc: '高效换热解决方案', available: true },
      { id: 'radiator', name: '散热器', desc: '智能温控系统', available: true },
      { id: 'evaporator', name: '蒸发器', desc: '节能环保设计', available: true },
      { id: 'liquid-cooling', name: '液冷板', desc: '新能源热管理', available: true }
    ],
    quickActions: []
  },

  onLoad() {
    setTimeout(() => {
      this.setData({ loaded: true })
    }, 100)
  },

  onShow() {
    const userInfo = auth.getUserInfo()
    this.setData({ userInfo })

    const perms = auth.getPermissions()
    const role = userInfo?.role

    // 根据权限或角色动态设置快捷操作
    const allActions = [
      { id: 'logistics', icon: '🚚', name: '物流查询', perm: 'DATA_VIEW_LOGISTICS', roles: ['LOGISTICS', 'ADMIN'] },
      { id: 'process', icon: '🔧', name: '工序管理', perm: 'DATA_VIEW_PROCESS', roles: ['PROCESS', 'ADMIN'] },
      { id: 'spec', icon: '📦', name: '规格库', roles: ['TECH', 'ADMIN'] },
      { id: 'role-manage', icon: '👥', name: '角色管理', perm: 'SYSTEM_ROLE_MANAGE', roles: ['ADMIN'] }
    ]
    const quickActions = allActions.filter(action => {
      if (action.perm && perms && perms.length > 0) {
        return perms.indexOf(action.perm) !== -1
      }
      return action.roles.includes(role)
    })
    this.setData({ quickActions })
  },

  onDeviceTap(e) {
    const { id } = e.currentTarget.dataset
    const device = this.data.devices.find(d => d.id === id)
    if (device && !device.available) {
      wx.showToast({ title: '敬请期待', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/${id}/${id}` })
  },

  onQuickAction(e) {
    const { id } = e.currentTarget.dataset
    switch (id) {
      case 'logistics':
        wx.navigateTo({ url: '/pages/logistics-view/logistics-view' })
        break
      case 'process':
        wx.navigateTo({ url: '/pages/process-manage/process-manage' })
        break
      case 'spec':
        wx.navigateTo({ url: '/pages/spec-manage/spec-manage' })
        break
      case 'role-manage':
        wx.navigateTo({ url: '/pages/role-manage/role-manage' })
        break
    }
  },

  goBack() {
    wx.redirectTo({ url: '/pages/splash/splash' })
  }
})
