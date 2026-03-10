const auth = require('../../utils/auth')

Page({
  data: {
    loaded: false
  },

  onLoad() {
    setTimeout(() => {
      this.setData({ loaded: true })
    }, 100)
  },

  enterApp() {
    // 检查登录状态
    const token = auth.getToken()
    if (token) {
      // 已登录，直接进入首页
      wx.switchTab({
        url: '/pages/home/home'
      })
    } else {
      // 未登录，跳转登录页
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
  },

  makeCall(e) {
    const phone = e.currentTarget.dataset.phone
    wx.makePhoneCall({ phoneNumber: phone })
  },

  copyEmail() {
    wx.setClipboardData({
      data: 'xiaoshoubu@gxyide.com',
      success: () => {
        wx.showToast({ title: '邮箱已复制', icon: 'success' })
      }
    })
  },

  openMap() {
    wx.openLocation({
      latitude: 24.3254,
      longitude: 109.4281,
      name: '广西易德科技有限责任公司',
      address: '柳州市河西高新技术产业开发区欣悦路8号'
    })
  }
})
