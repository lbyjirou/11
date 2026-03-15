const auth = require('../../utils/auth')
const api = require('../../utils/request')

const DEFAULT_PROCESS_COLUMN = {
  key: 'name',
  label: '工序名称',
  type: 'text',
  role: 'input',
  unit: '',
  formula: '',
  defaultValue: ''
}

const DEFAULT_DEVICE_VAR = {
  key: '',
  label: '',
  type: 'number',
  unit: '',
  role: 'input',
  formula: '',
  defaultValue: ''
}

function emptyProcessForm() {
  return {
    id: null,
    name: '',
    sectionLabel: '',
    sectionKey: '',
    columns: [{ ...DEFAULT_PROCESS_COLUMN }]
  }
}

function emptyDeviceForm() {
  return {
    id: null,
    name: '',
    sectionKey: '',
    variables: [],
    subGroups: [],
    sourceMeta: null
  }
}

function emptyTemplateForm() {
  return {
    id: null,
    name: '',
    templateJson: '',
    sourceMeta: null
  }
}

function parseTemplateSummary(templateJson) {
  try {
    const data = JSON.parse(templateJson || '{}')
    const processCount = (data.sections || []).length
    const energyCount = (data.energySections || []).length
    const moldCount = (data.moldFeeSections || []).length
    const summaryCount = (data.summary || []).length
    return `工序区 ${processCount} / 能耗区 ${energyCount} / 模具区 ${moldCount} / 汇总项 ${summaryCount}`
  } catch (err) {
    return '模板结构异常'
  }
}

function parsePublicSourceMeta(templateJson) {
  try {
    const data = JSON.parse(templateJson || '{}')
    const meta = data._publicSource || null
    if (meta && meta.type === 'personal_preset') {
      return '个人来源'
    }
  } catch (err) {}
  return ''
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data))
}

function createTemplateTableSection() {
  return {
    label: '',
    key: '',
    columns: [{ ...DEFAULT_PROCESS_COLUMN }],
    rows: []
  }
}

function createTemplateEnergySection() {
  return {
    label: '',
    key: '',
    subtype: 'device',
    rows: []
  }
}

function createTemplateEnergyRow() {
  return {
    name: '',
    params: [],
    subGroups: []
  }
}

function createTemplateSummaryItem() {
  return {
    key: '',
    label: '',
    formula: '',
    value: ''
  }
}

function emptyTemplateEditor() {
  return {
    sections: [],
    energySections: [],
    moldFeeSections: [],
    summary: []
  }
}

function normalizeColumn(item, fallback) {
  const column = {
    ...(fallback || DEFAULT_PROCESS_COLUMN),
    ...(item || {})
  }
  return {
    key: column.key || '',
    label: column.label || '',
    type: column.type || 'number',
    role: column.role || 'input',
    unit: column.unit || '',
    formula: column.formula || '',
    defaultValue: column.defaultValue !== undefined && column.defaultValue !== null ? String(column.defaultValue) : ''
  }
}

function normalizeTemplateEnergyRow(row) {
  const normalized = cloneData(row || {})
  normalized.name = row && row.name ? row.name : ''
  normalized.params = ((row && row.params) || []).map(item => normalizeColumn(item, DEFAULT_DEVICE_VAR))
  normalized.subGroups = ((row && row.subGroups) || []).map(group => ({
      label: group && group.label ? group.label : '',
      variables: ((group && group.variables) || []).map(item => normalizeColumn(item, DEFAULT_DEVICE_VAR))
    }))
  return normalized
}

function normalizeTemplateStructure(input) {
  let data = {}
  if (typeof input === 'string') {
    data = JSON.parse(input || '{}')
  } else if (input && typeof input === 'object') {
    data = cloneData(input)
  }
  return {
    sections: (data.sections || []).map(section => ({
      label: section.label || '',
      key: section.key || '',
      columns: (section.columns || []).length
        ? (section.columns || []).map(item => normalizeColumn(item, DEFAULT_PROCESS_COLUMN))
        : [{ ...DEFAULT_PROCESS_COLUMN }],
      rows: Array.isArray(section.rows) ? cloneData(section.rows) : []
    })),
    energySections: (data.energySections || []).map(section => ({
      label: section.label || '',
      key: section.key || '',
      subtype: section.subtype === 'material' ? 'material' : 'device',
      rows: (section.rows || []).map(row => normalizeTemplateEnergyRow(row))
    })),
    moldFeeSections: (data.moldFeeSections || []).map(section => ({
      label: section.label || '',
      key: section.key || '',
      columns: (section.columns || []).length
        ? (section.columns || []).map(item => normalizeColumn(item, DEFAULT_PROCESS_COLUMN))
        : [{ ...DEFAULT_PROCESS_COLUMN }],
      rows: Array.isArray(section.rows) ? cloneData(section.rows) : []
    })),
    summary: (data.summary || []).map(item => ({
      key: item.key || '',
      label: item.label || '',
      formula: item.formula || '',
      value: item.value !== undefined && item.value !== null ? String(item.value) : ''
    }))
  }
}

function serializeTemplateEditor(editor, baseData) {
  const data = baseData && typeof baseData === 'object' ? cloneData(baseData) : {}
  data.mode = data.mode || 'custom'
  data.sections = (editor.sections || []).map(section => ({
    label: section.label || '',
    key: section.key || '',
    columns: (section.columns || []).map(item => ({
      key: item.key || '',
      label: item.label || '',
      type: item.type || 'number',
      role: item.role || 'input',
      unit: item.unit || '',
      formula: item.formula || '',
      defaultValue: item.defaultValue || ''
    })),
    rows: Array.isArray(section.rows) ? cloneData(section.rows) : []
  }))
  data.energySections = (editor.energySections || []).map(section => ({
    label: section.label || '',
    key: section.key || '',
    subtype: section.subtype === 'material' ? 'material' : 'device',
    rows: (section.rows || []).map(row => ({
      name: row.name || '',
      params: (row.params || []).map(item => ({
        key: item.key || '',
        label: item.label || '',
        type: item.type || 'number',
        role: item.role || 'input',
        unit: item.unit || '',
        formula: item.formula || '',
        defaultValue: item.defaultValue || ''
      })),
      subGroups: (row.subGroups || []).map(group => ({
        label: group.label || '',
        variables: (group.variables || []).map(item => ({
          key: item.key || '',
          label: item.label || '',
          type: item.type || 'number',
          role: item.role || 'input',
          unit: item.unit || '',
          formula: item.formula || '',
          defaultValue: item.defaultValue || ''
        }))
      }))
    }))
  }))
  data.moldFeeSections = (editor.moldFeeSections || []).map(section => ({
    label: section.label || '',
    key: section.key || '',
    columns: (section.columns || []).map(item => ({
      key: item.key || '',
      label: item.label || '',
      type: item.type || 'number',
      role: item.role || 'input',
      unit: item.unit || '',
      formula: item.formula || '',
      defaultValue: item.defaultValue || ''
    })),
    rows: Array.isArray(section.rows) ? cloneData(section.rows) : []
  }))
  data.summary = (editor.summary || []).map(item => ({
    key: item.key || '',
    label: item.label || '',
    formula: item.formula || '',
    value: item.value || ''
  }))
  delete data.energySummary
  return data
}

Page({
  data: {
    tabs: [
      { key: 'process', label: '工序' },
      { key: 'energy', label: '能耗' },
      { key: 'mold', label: '模具' },
      { key: 'template', label: '模板' }
    ],
    currentTab: 'process',
    energyCategories: [
      { key: 'device', label: '设备能耗' },
      { key: 'material', label: '辅料' }
    ],
    currentEnergyCategory: 'device',
    loading: false,
    processList: [],
    energyList: [],
    materialList: [],
    moldList: [],
    templateList: [],
    showProcessModal: false,
    showDeviceModal: false,
    showTemplateModal: false,
    showTemplatePreview: false,
    previewTemplateTitle: '',
    previewTemplateText: '',
    previewTemplateData: null,
    processForm: emptyProcessForm(),
    processSectionSearch: '',
    processSectionMatched: false,
    processFilteredSections: [],
    showProcessSectionDropdown: false,
    deviceModalTitle: '公共能耗预设',
    deviceCategory: 'device',
    deviceForm: emptyDeviceForm(),
    templateForm: emptyTemplateForm(),
    templateEditorTab: 'process',
    templateEditor: emptyTemplateEditor(),
    templateJsonValid: true
  },

  onLoad() {
    const userInfo = auth.getUserInfo()
    const perms = auth.getPermissions() || []
    const canManage = !!userInfo && (userInfo.role === 'ADMIN' || perms.indexOf('SYSTEM_PROCESS_PRESET_CENTER') !== -1)
    if (!canManage) {
      wx.showToast({ title: '无权访问', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.loadAll()
  },

  loadAll() {
    this.setData({ loading: true })
    Promise.all([
      this.loadPublicProcessList(),
      this.loadPublicEnergyList(),
      this.loadPublicMaterialList(),
      this.loadPublicMoldList(),
      this.loadPublicTemplateList()
    ]).finally(() => {
      this.setData({ loading: false })
    })
  },

  loadPublicProcessList() {
    return api.getPublicProcessList().then(list => {
      const processList = (list || []).map(item => ({
        ...item,
        name: item.processName || item.name || '',
        isPublic: 1,
        sourceTagText: item.ownerUserId ? '来源：个人预设' : ''
      }))
      this.setData({ processList })
      return processList
    }).catch(() => {
      this.setData({ processList: [] })
      return []
    })
  },

  loadPublicEnergyList() {
    return api.getEnergyDeviceTemplates('device', 'public').then(list => {
      this.setData({
        energyList: (list || []).map(item => ({
          ...item,
          isPublic: 1,
          sourceTagText: parsePublicSourceMeta(item.templateJson)
        }))
      })
      return list || []
    }).catch(() => {
      this.setData({ energyList: [] })
      return []
    })
  },

  loadPublicMaterialList() {
    return api.getEnergyDeviceTemplates('material', 'public').then(list => {
      this.setData({
        materialList: (list || []).map(item => ({
          ...item,
          isPublic: 1,
          sourceTagText: parsePublicSourceMeta(item.templateJson)
        }))
      })
      return list || []
    }).catch(() => {
      this.setData({ materialList: [] })
      return []
    })
  },

  loadPublicMoldList() {
    return api.getEnergyDeviceTemplates('mold', 'public').then(list => {
      this.setData({
        moldList: (list || []).map(item => ({
          ...item,
          isPublic: 1,
          sourceTagText: parsePublicSourceMeta(item.templateJson)
        }))
      })
      return list || []
    }).catch(() => {
      this.setData({ moldList: [] })
      return []
    })
  },

  loadPublicTemplateList() {
    return api.getProcessTemplates('public').then(list => {
      const templateList = (list || []).map(item => ({
        ...item,
        isPublic: 1,
        summaryText: parseTemplateSummary(item.templateJson),
        sourceTagText: parsePublicSourceMeta(item.templateJson)
      }))
      this.setData({ templateList })
      return templateList
    }).catch(() => {
      this.setData({ templateList: [] })
      return []
    })
  },

  switchTab(e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab })
  },

  switchEnergyCategory(e) {
    this.setData({ currentEnergyCategory: e.currentTarget.dataset.category })
  },

  goBack() {
    wx.navigateBack()
  },

  openAddModal() {
    const tab = this.data.currentTab
    if (tab === 'process') {
      this.setData({
        showProcessModal: true,
        processForm: emptyProcessForm(),
        processSectionSearch: '',
        processSectionMatched: false,
        processFilteredSections: [],
        showProcessSectionDropdown: false
      })
      return
    }
    if (tab === 'energy' || tab === 'mold') {
      this.setData({
        showDeviceModal: true,
        deviceCategory: tab === 'energy' ? this.data.currentEnergyCategory : 'mold',
        deviceModalTitle: tab === 'energy'
          ? (this.data.currentEnergyCategory === 'material' ? '公共辅料预设' : '公共设备能耗预设')
          : '公共模具预设',
        deviceForm: emptyDeviceForm()
      })
      return
    }
    this.setData({
      showTemplateModal: true,
      templateForm: emptyTemplateForm(),
      templateEditorTab: 'process',
      templateEditor: emptyTemplateEditor(),
      templateJsonValid: true
    })
  },

  closeProcessModal() {
    this.setData({ showProcessModal: false })
  },

  closeDeviceModal() {
    this.setData({ showDeviceModal: false })
  },

  closeTemplateModal() {
    this.setData({
      showTemplateModal: false,
      templateEditorTab: 'process',
      templateEditor: emptyTemplateEditor(),
      templateJsonValid: true
    })
  },

  closeTemplatePreview() {
    this.setData({
      showTemplatePreview: false,
      previewTemplateTitle: '',
      previewTemplateText: '',
      previewTemplateData: null
    })
  },

  onProcessFieldInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['processForm.' + field]: e.detail.value })
  },

  getProcessSections() {
    const map = {}
    ;(this.data.processList || []).forEach(item => {
      if (item.sectionKey && item.sectionLabel && !map[item.sectionKey]) {
        map[item.sectionKey] = { key: item.sectionKey, label: item.sectionLabel }
      }
    })
    return Object.values(map)
  },

  onProcessSectionSearchInput(e) {
    const keyword = e.detail.value
    this.setData({
      processSectionSearch: keyword,
      'processForm.sectionLabel': keyword,
      'processForm.sectionKey': '',
      processSectionMatched: false
    })
    if (!keyword.trim()) {
      this.setData({ processFilteredSections: [], showProcessSectionDropdown: false })
      return
    }
    const kw = keyword.trim().toLowerCase()
    const processFilteredSections = this.getProcessSections().filter(item => item.label.toLowerCase().includes(kw))
    this.setData({
      processFilteredSections,
      showProcessSectionDropdown: processFilteredSections.length > 0
    })
  },

  selectProcessSection(e) {
    const key = e.currentTarget.dataset.key
    const target = this.getProcessSections().find(item => item.key === key)
    if (!target) return
    this.setData({
      processSectionSearch: target.label,
      'processForm.sectionLabel': target.label,
      'processForm.sectionKey': target.key,
      processSectionMatched: true,
      processFilteredSections: [],
      showProcessSectionDropdown: false
    })
  },

  hideProcessSectionDropdown() {
    setTimeout(() => {
      this.setData({ showProcessSectionDropdown: false })
    }, 200)
  },

  onProcessSectionKeyInput(e) {
    this.setData({ 'processForm.sectionKey': (e.detail.value || '').trim() })
  },

  onProcessColumnInput(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const field = e.currentTarget.dataset.field
    this.setData({ [`processForm.columns[${idx}].${field}`]: e.detail.value })
  },

  onProcessColumnRoleChange(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.setData({ [`processForm.columns[${idx}].role`]: Number(e.detail.value) === 0 ? 'input' : 'output' })
  },

  addProcessColumn() {
    const columns = [...(this.data.processForm.columns || []), { ...DEFAULT_PROCESS_COLUMN, key: '', label: '' }]
    this.setData({ 'processForm.columns': columns })
  },

  deleteProcessColumn(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const columns = [...(this.data.processForm.columns || [])]
    if (columns[idx] && columns[idx].key === 'name') {
      wx.showToast({ title: '工序名称列不能删除', icon: 'none' })
      return
    }
    columns.splice(idx, 1)
    this.setData({ 'processForm.columns': columns })
  },

  saveProcessPreset() {
    const form = this.data.processForm
    if (!(form.name || '').trim()) {
      wx.showToast({ title: '请填写工序名称', icon: 'none' })
      return
    }
    if (!(form.sectionLabel || '').trim()) {
      wx.showToast({ title: '请填写所属区域', icon: 'none' })
      return
    }
    if (!(form.sectionKey || '').trim()) {
      wx.showToast({ title: '请填写区域标识', icon: 'none' })
      return
    }
    for (const column of form.columns || []) {
      if (!(column.key || '').trim() || !(column.label || '').trim()) {
        wx.showToast({ title: '列名和变量名都要填', icon: 'none' })
        return
      }
    }
    const columnsJson = JSON.stringify((form.columns || []).map(item => {
      const column = {
        key: item.key,
        label: item.label,
        type: item.type || 'number',
        role: item.role || 'input'
      }
      if (item.unit) column.unit = item.unit
      if (item.formula) column.formula = item.formula
      if (item.defaultValue !== '' && item.defaultValue !== undefined) column.defaultValue = item.defaultValue
      return column
    }))
    const payload = {
      processName: form.name.trim(),
      sectionLabel: form.sectionLabel.trim(),
      sectionKey: form.sectionKey.trim(),
      columnsJson,
      isActive: 1,
      isPublic: 1
    }
    const action = form.id ? api.updateProcess(form.id, payload) : api.createProcess(payload)
    wx.showLoading({ title: '保存中' })
    action.then(() => {
      wx.hideLoading()
      wx.showToast({ title: '公共工序已保存', icon: 'success' })
      this.closeProcessModal()
      this.loadPublicProcessList()
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: (err && err.message) || '保存失败', icon: 'none' })
    })
  },

  editProcessItem(e) {
    const item = e.currentTarget.dataset.item
    let columns = [{ ...DEFAULT_PROCESS_COLUMN }]
    try {
      if (item.columnsJson) {
        const parsed = JSON.parse(item.columnsJson)
        if (parsed.length) columns = parsed
      }
    } catch (err) {}
    this.setData({
      showProcessModal: true,
      processForm: {
        id: item.id,
        name: item.processName || item.name || '',
        sectionLabel: item.sectionLabel || '',
        sectionKey: item.sectionKey || '',
        columns: columns.map(col => ({
          key: col.key || '',
          label: col.label || '',
          type: col.type || 'number',
          role: col.role || 'input',
          unit: col.unit || '',
          formula: col.formula || '',
          defaultValue: col.defaultValue !== undefined ? String(col.defaultValue) : ''
        }))
      },
      processSectionSearch: item.sectionLabel || '',
      processSectionMatched: true,
      processFilteredSections: [],
      showProcessSectionDropdown: false
    })
  },

  copyProcessItem(e) {
    const item = e.currentTarget.dataset.item
    let columns = [{ ...DEFAULT_PROCESS_COLUMN }]
    try {
      if (item.columnsJson) {
        const parsed = JSON.parse(item.columnsJson)
        if (parsed.length) columns = parsed
      }
    } catch (err) {}
    this.setData({
      showProcessModal: true,
      processForm: {
        id: null,
        name: ((item.processName || item.name || '') + ' - 副本').trim(),
        sectionLabel: item.sectionLabel || '',
        sectionKey: item.sectionKey || '',
        columns: columns.map(col => ({
          key: col.key || '',
          label: col.label || '',
          type: col.type || 'number',
          role: col.role || 'input',
          unit: col.unit || '',
          formula: col.formula || '',
          defaultValue: col.defaultValue !== undefined ? String(col.defaultValue) : ''
        }))
      },
      processSectionSearch: item.sectionLabel || '',
      processSectionMatched: true,
      processFilteredSections: [],
      showProcessSectionDropdown: false
    })
  },

  deleteProcessItem(e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: '删除公共工序',
      content: `确定删除“${item.processName || item.name}”吗？`,
      success: (res) => {
        if (!res.confirm) return
        api.deleteProcess(item.id).then(() => {
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadPublicProcessList()
        }).catch(err => {
          wx.showToast({ title: (err && err.message) || '删除失败', icon: 'none' })
        })
      }
    })
  },

  onDeviceFieldInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`deviceForm.${field}`]: e.detail.value })
  },

  addDeviceVariable() {
    const variables = [...(this.data.deviceForm.variables || []), { ...DEFAULT_DEVICE_VAR }]
    this.setData({ 'deviceForm.variables': variables })
  },

  deleteDeviceVariable(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const variables = [...(this.data.deviceForm.variables || [])]
    variables.splice(idx, 1)
    this.setData({ 'deviceForm.variables': variables })
  },

  onDeviceVariableInput(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const field = e.currentTarget.dataset.field
    this.setData({ [`deviceForm.variables[${idx}].${field}`]: e.detail.value })
  },

  onDeviceVariableRoleChange(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.setData({ [`deviceForm.variables[${idx}].role`]: Number(e.detail.value) === 0 ? 'input' : 'output' })
  },

  addDeviceSubGroup() {
    const subGroups = [...(this.data.deviceForm.subGroups || []), { label: '', variables: [] }]
    this.setData({ 'deviceForm.subGroups': subGroups })
  },

  deleteDeviceSubGroup(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const subGroups = [...(this.data.deviceForm.subGroups || [])]
    subGroups.splice(idx, 1)
    this.setData({ 'deviceForm.subGroups': subGroups })
  },

  onDeviceSubGroupInput(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.setData({ [`deviceForm.subGroups[${idx}].label`]: e.detail.value })
  },

  addDeviceSubGroupVar(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const subGroups = [...(this.data.deviceForm.subGroups || [])]
    subGroups[idx].variables.push({ ...DEFAULT_DEVICE_VAR })
    this.setData({ 'deviceForm.subGroups': subGroups })
  },

  deleteDeviceSubGroupVar(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const vidx = Number(e.currentTarget.dataset.vidx)
    const subGroups = [...(this.data.deviceForm.subGroups || [])]
    subGroups[idx].variables.splice(vidx, 1)
    this.setData({ 'deviceForm.subGroups': subGroups })
  },

  onDeviceSubGroupVarInput(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const vidx = Number(e.currentTarget.dataset.vidx)
    const field = e.currentTarget.dataset.field
    this.setData({ [`deviceForm.subGroups[${idx}].variables[${vidx}].${field}`]: e.detail.value })
  },

  onDeviceSubGroupVarRoleChange(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const vidx = Number(e.currentTarget.dataset.vidx)
    this.setData({ [`deviceForm.subGroups[${idx}].variables[${vidx}].role`]: Number(e.detail.value) === 0 ? 'input' : 'output' })
  },

  saveDevicePreset() {
    const form = this.data.deviceForm
    if (!(form.name || '').trim()) {
      wx.showToast({ title: '请填写预设名称', icon: 'none' })
      return
    }
    const isMaterial = this.data.deviceCategory === 'material'
    const isDevice = this.data.deviceCategory === 'device'
    const sectionKey = isDevice ? String(form.sectionKey || '').trim() : ''
    if (isDevice && sectionKey && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(sectionKey)) {
      wx.showToast({ title: '设备能耗变量名只能用英文、数字和下划线', icon: 'none' })
      return
    }
    const normalizedVars = (form.variables || []).map(item => ({
      key: item.key,
      label: item.label,
      type: item.type || 'number',
      unit: item.unit || '',
      role: item.role || 'input',
      formula: item.formula || '',
      defaultValue: item.defaultValue || ''
    }))
    const templateData = isMaterial
      ? {
        params: normalizedVars
      }
      : {
        ...(isDevice && sectionKey ? { sectionKey, sectionLabel: form.name.trim() } : {}),
        variables: normalizedVars,
        subGroups: (form.subGroups || []).map(group => ({
          label: group.label,
          variables: (group.variables || []).map(item => ({
            key: item.key,
            label: item.label,
            type: item.type || 'number',
            unit: item.unit || '',
            role: item.role || 'input',
            formula: item.formula || '',
            defaultValue: item.defaultValue || ''
          }))
        }))
      }
    if (form.sourceMeta) {
      templateData._publicSource = form.sourceMeta
    }
    const templateJson = JSON.stringify(templateData)
    const payload = {
      name: form.name.trim(),
      category: this.data.deviceCategory,
      templateJson,
      isPublic: 1
    }
    const action = form.id ? api.updateEnergyDeviceTemplate(form.id, payload) : api.createEnergyDeviceTemplate(payload)
    wx.showLoading({ title: '保存中' })
    action.then(() => {
      wx.hideLoading()
      wx.showToast({ title: '公共预设已保存', icon: 'success' })
      this.closeDeviceModal()
      if (this.data.deviceCategory === 'device') {
        this.loadPublicEnergyList()
      } else if (this.data.deviceCategory === 'material') {
        this.loadPublicMaterialList()
      } else {
        this.loadPublicMoldList()
      }
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: (err && err.message) || '保存失败', icon: 'none' })
    })
  },

  editDeviceItem(e) {
    const item = e.currentTarget.dataset.item
    let parsed = { variables: [], subGroups: [] }
    try {
      parsed = JSON.parse(item.templateJson || '{}')
    } catch (err) {}
    const category = item.category || (this.data.currentTab === 'mold' ? 'mold' : 'device')
    const isMaterial = category === 'material'
    this.setData({
      showDeviceModal: true,
      deviceCategory: category,
      deviceModalTitle: category === 'mold'
        ? '公共模具预设'
        : (category === 'material' ? '公共辅料预设' : '公共设备能耗预设'),
      deviceForm: {
        id: item.id,
        name: item.name || '',
        sectionKey: category === 'device' ? (((parsed && parsed.sectionKey) || '').trim() || 'qianhan') : '',
        variables: isMaterial
          ? (parsed.params || []).map(variable => ({ ...DEFAULT_DEVICE_VAR, ...variable }))
          : (parsed.variables || []).map(variable => ({ ...DEFAULT_DEVICE_VAR, ...variable })),
        subGroups: isMaterial
          ? []
          : (parsed.subGroups || []).map(group => ({
            label: group.label || '',
            variables: (group.variables || []).map(variable => ({ ...DEFAULT_DEVICE_VAR, ...variable }))
          })),
        sourceMeta: parsed._publicSource || null
      }
    })
  },

  copyDeviceItem(e) {
    const item = e.currentTarget.dataset.item
    let parsed = { variables: [], subGroups: [] }
    try {
      parsed = JSON.parse(item.templateJson || '{}')
    } catch (err) {}
    const category = item.category || (this.data.currentTab === 'mold' ? 'mold' : 'device')
    const isMaterial = category === 'material'
    this.setData({
      showDeviceModal: true,
      deviceCategory: category,
      deviceModalTitle: category === 'mold'
        ? '公共模具预设'
        : (category === 'material' ? '公共辅料预设' : '公共设备能耗预设'),
      deviceForm: {
        id: null,
        name: ((item.name || '') + ' - 副本').trim(),
        sectionKey: category === 'device' ? (((parsed && parsed.sectionKey) || '').trim() || 'qianhan') : '',
        variables: isMaterial
          ? (parsed.params || []).map(variable => ({ ...DEFAULT_DEVICE_VAR, ...variable }))
          : (parsed.variables || []).map(variable => ({ ...DEFAULT_DEVICE_VAR, ...variable })),
        subGroups: isMaterial
          ? []
          : (parsed.subGroups || []).map(group => ({
            label: group.label || '',
            variables: (group.variables || []).map(variable => ({ ...DEFAULT_DEVICE_VAR, ...variable }))
          })),
        sourceMeta: parsed._publicSource || null
      }
    })
  },

  deleteDeviceItem(e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: '删除公共预设',
      content: `确定删除“${item.name}”吗？`,
      success: (res) => {
        if (!res.confirm) return
        api.deleteEnergyDeviceTemplate(item.id).then(() => {
          wx.showToast({ title: '已删除', icon: 'success' })
          if ((item.category || '') === 'mold') {
            this.loadPublicMoldList()
          } else if ((item.category || '') === 'material') {
            this.loadPublicMaterialList()
          } else {
            this.loadPublicEnergyList()
          }
        }).catch(err => {
          wx.showToast({ title: (err && err.message) || '删除失败', icon: 'none' })
        })
      }
    })
  },

  onTemplateFieldInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`templateForm.${field}`]: e.detail.value })
  },

  syncTemplateEditor(editor) {
    const normalized = normalizeTemplateStructure(editor)
    let baseData = {}
    try {
      baseData = JSON.parse(this.data.templateForm.templateJson || '{}')
    } catch (err) {}
    if (this.data.templateForm.sourceMeta) {
      baseData._publicSource = this.data.templateForm.sourceMeta
    }
    const templateJson = JSON.stringify(serializeTemplateEditor(normalized, baseData), null, 2)
    this.setData({
      templateEditor: normalized,
      templateJsonValid: true,
      'templateForm.templateJson': templateJson
    })
  },

  updateTemplateEditor(mutator) {
    const editor = cloneData(this.data.templateEditor || emptyTemplateEditor())
    mutator(editor)
    this.syncTemplateEditor(editor)
  },

  onTemplateJsonInput(e) {
    const value = e.detail.value
    const nextState = {
      'templateForm.templateJson': value
    }
    try {
      nextState.templateEditor = normalizeTemplateStructure(value)
      nextState.templateJsonValid = true
    } catch (err) {
      nextState.templateJsonValid = false
    }
    this.setData(nextState)
  },

  switchTemplateEditorTab(e) {
    this.setData({ templateEditorTab: e.currentTarget.dataset.tab })
  },

  addTemplateSection(e) {
    const type = e.currentTarget.dataset.type
    this.updateTemplateEditor(editor => {
      const arrKey = type === 'energy'
        ? 'energySections'
        : (type === 'mold' ? 'moldFeeSections' : 'sections')
      editor[arrKey].push(type === 'energy' ? createTemplateEnergySection() : createTemplateTableSection())
    })
  },

  deleteTemplateSection(e) {
    const type = e.currentTarget.dataset.type
    const idx = Number(e.currentTarget.dataset.idx)
    this.updateTemplateEditor(editor => {
      const arrKey = type === 'energy'
        ? 'energySections'
        : (type === 'mold' ? 'moldFeeSections' : 'sections')
      editor[arrKey].splice(idx, 1)
    })
  },

  onTemplateSectionFieldInput(e) {
    const type = e.currentTarget.dataset.type
    const idx = Number(e.currentTarget.dataset.idx)
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.updateTemplateEditor(editor => {
      const arrKey = type === 'energy'
        ? 'energySections'
        : (type === 'mold' ? 'moldFeeSections' : 'sections')
      editor[arrKey][idx][field] = value
    })
  },

  onTemplateEnergySectionSubtypeChange(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.updateTemplateEditor(editor => {
      editor.energySections[idx].subtype = Number(e.detail.value) === 1 ? 'material' : 'device'
    })
  },

  addTemplateSectionColumn(e) {
    const type = e.currentTarget.dataset.type
    const idx = Number(e.currentTarget.dataset.idx)
    this.updateTemplateEditor(editor => {
      const arrKey = type === 'mold' ? 'moldFeeSections' : 'sections'
      editor[arrKey][idx].columns.push({ ...DEFAULT_PROCESS_COLUMN, key: '', label: '' })
    })
  },

  deleteTemplateSectionColumn(e) {
    const type = e.currentTarget.dataset.type
    const idx = Number(e.currentTarget.dataset.idx)
    const cidx = Number(e.currentTarget.dataset.cidx)
    this.updateTemplateEditor(editor => {
      const arrKey = type === 'mold' ? 'moldFeeSections' : 'sections'
      if ((editor[arrKey][idx].columns || []).length <= 1) return
      editor[arrKey][idx].columns.splice(cidx, 1)
    })
  },

  onTemplateSectionColumnInput(e) {
    const type = e.currentTarget.dataset.type
    const idx = Number(e.currentTarget.dataset.idx)
    const cidx = Number(e.currentTarget.dataset.cidx)
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.updateTemplateEditor(editor => {
      const arrKey = type === 'mold' ? 'moldFeeSections' : 'sections'
      editor[arrKey][idx].columns[cidx][field] = value
    })
  },

  onTemplateSectionColumnRoleChange(e) {
    const type = e.currentTarget.dataset.type
    const idx = Number(e.currentTarget.dataset.idx)
    const cidx = Number(e.currentTarget.dataset.cidx)
    this.updateTemplateEditor(editor => {
      const arrKey = type === 'mold' ? 'moldFeeSections' : 'sections'
      editor[arrKey][idx].columns[cidx].role = Number(e.detail.value) === 1 ? 'output' : 'input'
    })
  },

  addTemplateEnergyRow(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.updateTemplateEditor(editor => {
      editor.energySections[idx].rows.push(createTemplateEnergyRow())
    })
  },

  deleteTemplateEnergyRow(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const ridx = Number(e.currentTarget.dataset.ridx)
    this.updateTemplateEditor(editor => {
      editor.energySections[idx].rows.splice(ridx, 1)
    })
  },

  onTemplateEnergyRowInput(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const ridx = Number(e.currentTarget.dataset.ridx)
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.updateTemplateEditor(editor => {
      editor.energySections[idx].rows[ridx][field] = value
    })
  },

  addTemplateEnergyParam(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const ridx = Number(e.currentTarget.dataset.ridx)
    this.updateTemplateEditor(editor => {
      editor.energySections[idx].rows[ridx].params.push({ ...DEFAULT_DEVICE_VAR })
    })
  },

  deleteTemplateEnergyParam(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const ridx = Number(e.currentTarget.dataset.ridx)
    const pidx = Number(e.currentTarget.dataset.pidx)
    this.updateTemplateEditor(editor => {
      editor.energySections[idx].rows[ridx].params.splice(pidx, 1)
    })
  },

  onTemplateEnergyParamInput(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const ridx = Number(e.currentTarget.dataset.ridx)
    const pidx = Number(e.currentTarget.dataset.pidx)
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.updateTemplateEditor(editor => {
      editor.energySections[idx].rows[ridx].params[pidx][field] = value
    })
  },

  onTemplateEnergyParamRoleChange(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const ridx = Number(e.currentTarget.dataset.ridx)
    const pidx = Number(e.currentTarget.dataset.pidx)
    this.updateTemplateEditor(editor => {
      editor.energySections[idx].rows[ridx].params[pidx].role = Number(e.detail.value) === 1 ? 'output' : 'input'
    })
  },

  addTemplateEnergySubGroup(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const ridx = Number(e.currentTarget.dataset.ridx)
    this.updateTemplateEditor(editor => {
      editor.energySections[idx].rows[ridx].subGroups.push({ label: '', variables: [] })
    })
  },

  deleteTemplateEnergySubGroup(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const ridx = Number(e.currentTarget.dataset.ridx)
    const sidx = Number(e.currentTarget.dataset.sidx)
    this.updateTemplateEditor(editor => {
      editor.energySections[idx].rows[ridx].subGroups.splice(sidx, 1)
    })
  },

  onTemplateEnergySubGroupInput(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const ridx = Number(e.currentTarget.dataset.ridx)
    const sidx = Number(e.currentTarget.dataset.sidx)
    this.updateTemplateEditor(editor => {
      editor.energySections[idx].rows[ridx].subGroups[sidx].label = e.detail.value
    })
  },

  addTemplateEnergySubGroupVar(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const ridx = Number(e.currentTarget.dataset.ridx)
    const sidx = Number(e.currentTarget.dataset.sidx)
    this.updateTemplateEditor(editor => {
      editor.energySections[idx].rows[ridx].subGroups[sidx].variables.push({ ...DEFAULT_DEVICE_VAR })
    })
  },

  deleteTemplateEnergySubGroupVar(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const ridx = Number(e.currentTarget.dataset.ridx)
    const sidx = Number(e.currentTarget.dataset.sidx)
    const vidx = Number(e.currentTarget.dataset.vidx)
    this.updateTemplateEditor(editor => {
      editor.energySections[idx].rows[ridx].subGroups[sidx].variables.splice(vidx, 1)
    })
  },

  onTemplateEnergySubGroupVarInput(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const ridx = Number(e.currentTarget.dataset.ridx)
    const sidx = Number(e.currentTarget.dataset.sidx)
    const vidx = Number(e.currentTarget.dataset.vidx)
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.updateTemplateEditor(editor => {
      editor.energySections[idx].rows[ridx].subGroups[sidx].variables[vidx][field] = value
    })
  },

  onTemplateEnergySubGroupVarRoleChange(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const ridx = Number(e.currentTarget.dataset.ridx)
    const sidx = Number(e.currentTarget.dataset.sidx)
    const vidx = Number(e.currentTarget.dataset.vidx)
    this.updateTemplateEditor(editor => {
      editor.energySections[idx].rows[ridx].subGroups[sidx].variables[vidx].role = Number(e.detail.value) === 1 ? 'output' : 'input'
    })
  },

  addTemplateSummaryItem() {
    this.updateTemplateEditor(editor => {
      editor.summary.push(createTemplateSummaryItem())
    })
  },

  deleteTemplateSummaryItem(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.updateTemplateEditor(editor => {
      editor.summary.splice(idx, 1)
    })
  },

  onTemplateSummaryInput(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.updateTemplateEditor(editor => {
      editor.summary[idx][field] = value
    })
  },

  fillLastUsedTemplate() {
    api.getLastUsedProcessStructure().then(result => {
      if (!result) {
        wx.showToast({ title: '最近没有可用结构', icon: 'none' })
        return
      }
      this.setData({
        templateEditor: normalizeTemplateStructure(result),
        templateJsonValid: true,
        'templateForm.templateJson': result
      })
      wx.showToast({ title: '已读取最近结构', icon: 'success' })
    }).catch(err => {
      wx.showToast({ title: (err && err.message) || '读取失败', icon: 'none' })
    })
  },

  previewTemplateItem(e) {
    const item = e.currentTarget.dataset.item
    let previewTemplateData = null
    try {
      previewTemplateData = normalizeTemplateStructure(item.templateJson || '{}')
    } catch (err) {
      previewTemplateData = emptyTemplateEditor()
    }
    this.setData({
      showTemplatePreview: true,
      previewTemplateTitle: item.name || '模板预览',
      previewTemplateText: parseTemplateSummary(item.templateJson),
      previewTemplateData
    })
  },

  editTemplateItem(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      showTemplateModal: true,
      templateForm: {
        id: item.id,
        name: item.name || '',
        templateJson: item.templateJson || '',
        sourceMeta: (() => {
          try {
            const parsed = JSON.parse(item.templateJson || '{}')
            return parsed._publicSource || null
          } catch (err) {
            return null
          }
        })()
      },
      templateEditorTab: 'process',
      templateEditor: normalizeTemplateStructure(item.templateJson || '{}'),
      templateJsonValid: true
    })
  },

  copyTemplateItem(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      showTemplateModal: true,
      templateForm: {
        id: null,
        name: ((item.name || '') + ' - 副本').trim(),
        templateJson: item.templateJson || '',
        sourceMeta: (() => {
          try {
            const parsed = JSON.parse(item.templateJson || '{}')
            return parsed._publicSource || null
          } catch (err) {
            return null
          }
        })()
      },
      templateEditorTab: 'process',
      templateEditor: normalizeTemplateStructure(item.templateJson || '{}'),
      templateJsonValid: true
    })
  },

  saveTemplate() {
    const form = this.data.templateForm
    if (!(form.name || '').trim()) {
      wx.showToast({ title: '请填写模板名称', icon: 'none' })
      return
    }
    if (!(form.templateJson || '').trim()) {
      wx.showToast({ title: '请填写模板结构', icon: 'none' })
      return
    }
    try {
      JSON.parse(form.templateJson)
    } catch (err) {
      wx.showToast({ title: '模板结构不是有效JSON', icon: 'none' })
      return
    }
    let finalTemplateJson = form.templateJson
    try {
      const parsed = JSON.parse(form.templateJson)
      if (form.sourceMeta) {
        parsed._publicSource = form.sourceMeta
      }
      finalTemplateJson = JSON.stringify(parsed)
    } catch (err) {}
    const payload = {
      name: form.name.trim(),
      templateJson: finalTemplateJson,
      isPublic: 1
    }
    const action = form.id ? api.updateProcessTemplate(form.id, payload) : api.createProcessTemplate(payload)
    wx.showLoading({ title: '保存中' })
    action.then(() => {
      wx.hideLoading()
      wx.showToast({ title: '公共模板已保存', icon: 'success' })
      this.closeTemplateModal()
      this.loadPublicTemplateList()
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: (err && err.message) || '保存失败', icon: 'none' })
    })
  },

  deleteTemplateItem(e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: '删除公共模板',
      content: `确定删除“${item.name}”吗？`,
      success: (res) => {
        if (!res.confirm) return
        api.deleteProcessTemplate(item.id).then(() => {
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadPublicTemplateList()
        }).catch(err => {
          wx.showToast({ title: (err && err.message) || '删除失败', icon: 'none' })
        })
      }
    })
  }
})
