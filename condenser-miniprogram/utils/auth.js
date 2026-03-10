const TOKEN_KEY = 'auth_token'
const USER_KEY = 'user_info'
const PERMS_KEY = 'user_permissions'

function getToken() {
  return wx.getStorageSync(TOKEN_KEY)
}

function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token)
}

function removeToken() {
  wx.removeStorageSync(TOKEN_KEY)
}

function getUserInfo() {
  const info = wx.getStorageSync(USER_KEY)
  return info ? JSON.parse(info) : null
}

function setUserInfo(user) {
  wx.setStorageSync(USER_KEY, JSON.stringify(user))
}

function removeUserInfo() {
  wx.removeStorageSync(USER_KEY)
}

function getPermissions() {
  const perms = wx.getStorageSync(PERMS_KEY)
  return perms ? JSON.parse(perms) : []
}

function setPermissions(perms) {
  wx.setStorageSync(PERMS_KEY, JSON.stringify(perms || []))
}

function hasPermission(code) {
  return getPermissions().indexOf(code) !== -1
}

function isLoggedIn() {
  return !!getToken()
}

function logout() {
  removeToken()
  removeUserInfo()
  wx.removeStorageSync(PERMS_KEY)
  wx.reLaunch({ url: '/pages/login/login' })
}

function checkAuth() {
  if (!isLoggedIn()) {
    wx.redirectTo({ url: '/pages/login/login' })
    return false
  }
  return true
}

module.exports = {
  getToken,
  setToken,
  removeToken,
  getUserInfo,
  setUserInfo,
  removeUserInfo,
  getPermissions,
  setPermissions,
  hasPermission,
  isLoggedIn,
  logout,
  checkAuth
}
