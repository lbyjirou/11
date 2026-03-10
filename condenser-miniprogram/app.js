const auth = require('./utils/auth')

App({
  onLaunch() {
    if (!auth.isLoggedIn()) {
      wx.redirectTo({ url: '/pages/login/login' })
    }
  },

  globalData: {
    alPrice: 20.5,
    lossRatio: 1.02,
    collector: { unitPrice: 0 },
    fin: { unitPrice: 0 },
    tube: { unitPrice: 0 },
    apiBase: 'http://localhost:8080/api'
  }
})
