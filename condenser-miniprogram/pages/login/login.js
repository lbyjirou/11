const api = require('../../utils/request')
const auth = require('../../utils/auth')

Page({
  data: {
    username: '',
    password: '',
    loading: false
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  async onLogin() {
    const { username, password } = this.data
    if (!username || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      const res = await api.login(username, password)
      auth.setToken(res.token)
      auth.setUserInfo({
        username: res.username,
        realName: res.realName,
        role: res.role,
        roles: res.roles || []
      })
      auth.setPermissions(res.permissions || [])
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/home/home' })
      }, 1000)
    } catch (err) {
      console.error('登录失败', err)
    } finally {
      this.setData({ loading: false })
    }
  }
})
