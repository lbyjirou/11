const api = require('../../utils/request')
const auth = require('../../utils/auth')

Page({
  data: {
    roles: [],
    permissions: [],
    editingRole: null,
    showPermPanel: false,
    currentRoleId: null,
    currentPerms: [],
    permCheckedMap: {}
  },

  onLoad() {
    if (!auth.checkAuth()) return
    this.loadRoles()
    this.loadPermissions()
  },

  loadRoles() {
    api.getRoleList().then(roles => {
      this.setData({ roles: roles || [] })
    })
  },

  loadPermissions() {
    api.getAllPermissions().then(perms => {
      const grouped = {}
      ;(perms || []).forEach(p => {
        // DATA_VIEW 已被 TAB_VIEW 覆盖，无需单独展示
        if (p.permGroup === 'DATA_VIEW') return
        if (!grouped[p.permGroup]) grouped[p.permGroup] = { name: p.permGroup, items: [] }
        grouped[p.permGroup].items.push(p)
      })
      this.setData({ permissions: Object.values(grouped) })
    })
  },

  onAddRole() {
    this.setData({
      editingRole: { roleName: '', roleCode: '', description: '', workflowStage: '' }
    })
  },

  onEditRole(e) {
    const role = e.currentTarget.dataset.role
    this.setData({ editingRole: { ...role } })
  },

  onRoleInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['editingRole.' + field]: e.detail.value })
  },

  onSaveRole() {
    const role = this.data.editingRole
    if (!role.roleName || !role.roleCode) {
      wx.showToast({ title: '请填写角色编码和名称', icon: 'none' })
      return
    }
    const promise = role.id
      ? api.updateRole(role.id, role)
      : api.createRole(role)
    promise.then(() => {
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.setData({ editingRole: null })
      this.loadRoles()
    }).catch(err => {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    })
  },

  onCancelEdit() {
    this.setData({ editingRole: null })
  },

  onDeleteRole(e) {
    const role = e.currentTarget.dataset.role
    if (role.isSystem === 1) {
      wx.showToast({ title: '系统角色不可删除', icon: 'none' })
      return
    }
    wx.showModal({
      title: '确认删除',
      content: '确定删除角色 ' + role.roleName + '？',
      success: res => {
        if (!res.confirm) return
        api.deleteRole(role.id).then(() => {
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadRoles()
        })
      }
    })
  },

  onManagePerms(e) {
    const role = e.currentTarget.dataset.role
    this.setData({ currentRoleId: role.id, showPermPanel: true, currentPerms: [], permCheckedMap: {} })
    api.getRolePermissions(role.id).then(perms => {
      const ids = (perms || []).map(p => p.id)
      const map = {}
      ids.forEach(id => { map[id] = true })
      this.setData({ currentPerms: ids, permCheckedMap: map })
    })
  },

  onTogglePerm(e) {
    const permId = e.currentTarget.dataset.id
    let perms = [...this.data.currentPerms]
    const map = { ...this.data.permCheckedMap }
    const idx = perms.indexOf(permId)
    if (idx === -1) {
      perms.push(permId)
      map[permId] = true
    } else {
      perms.splice(idx, 1)
      delete map[permId]
    }
    this.setData({ currentPerms: perms, permCheckedMap: map })
  },

  onSavePerms() {
    const { currentRoleId, currentPerms } = this.data
    api.assignRolePermissions(currentRoleId, currentPerms).then(() => {
      wx.showToast({ title: '权限已更新', icon: 'success' })
      this.setData({ showPermPanel: false, currentRoleId: null, currentPerms: [], permCheckedMap: {} })
    }).catch(err => {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    })
  },

  onClosePermPanel() {
    this.setData({ showPermPanel: false, currentRoleId: null, currentPerms: [], permCheckedMap: {} })
  },

  noop() {}
})