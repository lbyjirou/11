const api = require('../../utils/request')

Page({
  data: {
    mode: 'PERCENTAGE',
    stages: [
      { key: 'DEADLINE_TECH', label: '技术定义', value: '30' },
      { key: 'DEADLINE_PROCESS', label: '成本核算', value: '25' },
      { key: 'DEADLINE_LOGISTICS', label: '物流测算', value: '20' },
      { key: 'DEADLINE_APPROVE', label: '审批', value: '25' }
    ],
    escalationHours: '24',
    warningHours: '4',
    totalPct: 100
  },

  onLoad() {
    this.loadConfig()
  },

  loadConfig() {
    api.getDeadlineConfig().then(config => {
      if (!config) return
      const stages = this.data.stages.map(s => ({
        ...s,
        value: config[s.key] || s.value
      }))
      this.setData({
        mode: config.DEADLINE_MODE || 'PERCENTAGE',
        stages,
        escalationHours: config.DEADLINE_ESCALATION_HOURS || '24',
        warningHours: config.DEADLINE_WARNING_HOURS || '4'
      })
      this.calcTotal()
    })
  },

  onModeChange(e) {
    this.setData({ mode: e.currentTarget.dataset.mode })
  },

  onStageInput(e) {
    const key = e.currentTarget.dataset.key
    const val = e.detail.value
    const stages = this.data.stages.map(s =>
      s.key === key ? { ...s, value: val } : s
    )
    this.setData({ stages })
    this.calcTotal()
  },

  onEscalationInput(e) {
    this.setData({ escalationHours: e.detail.value })
  },

  onWarningInput(e) {
    this.setData({ warningHours: e.detail.value })
  },

  calcTotal() {
    const total = this.data.stages.reduce((sum, s) => sum + (parseFloat(s.value) || 0), 0)
    this.setData({ totalPct: total })
  },

  onSave() {
    const { mode, stages, escalationHours, warningHours } = this.data
    if (mode === 'PERCENTAGE') {
      const total = stages.reduce((sum, s) => sum + (parseFloat(s.value) || 0), 0)
      if (Math.abs(total - 100) > 0.01) {
        wx.showToast({ title: '百分比合计需为100%', icon: 'none' })
        return
      }
    }
    const config = { DEADLINE_MODE: mode, DEADLINE_ESCALATION_HOURS: escalationHours, DEADLINE_WARNING_HOURS: warningHours }
    stages.forEach(s => { config[s.key] = s.value })

    api.saveDeadlineConfig(config).then(() => {
      wx.showToast({ title: '保存成功', icon: 'success' })
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
