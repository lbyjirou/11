const api = require('../../utils/request')
const auth = require('../../utils/auth')

Page({
  data: {
    partPresets: [],
    presetManagerTab: 'ALL',
    editingPartPreset: null,
    partPresetForm: { name: '', partNo: '', category: 'A', material: '', params: [], defaultValues: {} },
    processFeePresets: [],
    processFeeSearchResults: [],
    showProcessFeeDropdown: false,
    showProcessFeeModal: false,
    editingProcessFeePreset: null,
    pfModalForm: { label: '', defaultRate: '' },
    showMaterialCostModal: false,
    mcPresetTab: 'COLLECTOR',
    mcPresetList: [],
    mcEditingPreset: null,
    mcForm: { spec: '', factor: '', weight: '', thickness: '' },
    mcInlineSearch: '',
    mcInlineDropdownVisible: false,
    mcInlineFilteredList: [],
    mcInlineFullList: [],
    mcTypeLocked: false,
    loading: false
  },

  onLoad() {
    const userInfo = auth.getUserInfo()
    if (!userInfo || !['TECH', 'PROCESS', 'ADMIN'].includes(userInfo.role)) {
      wx.showToast({ title: '无权限访问', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.loadPartPresets()
  },

  goBack() {
    wx.navigateBack()
  },

  // --- 模版列表 ---
  loadPartPresets() {
    this.setData({ loading: true })
    api.getPartPresets().then(list => {
      this.setData({ partPresets: list || [] })
    }).catch(() => {}).finally(() => {
      this.setData({ loading: false })
    })
  },
  switchPresetManagerTab(e) {
    this.setData({ presetManagerTab: e.currentTarget.dataset.tab })
  },

  // --- 模版 CRUD ---
  newPartPreset() {
    this.setData({
      editingPartPreset: { id: 0 },
      partPresetForm: {
        name: '', partNo: '', category: 'A', material: '', params: [], defaultValues: {},
        hasProcessFee: false, processFeeLabel: '', processFeeDefault: '',
        specTableJson: '[]', formulasJson: '{}',
        mcSelectedType: '', mcSelectedLabel: '', mcSelectedSpec: '',
        mcSelectedFactor: '', mcSelectedWeight: '', mcSelectedThickness: ''
      },
      mcInlineSearch: '',
      mcInlineDropdownVisible: false,
      mcInlineFilteredList: [],
      mcInlineFullList: [],
      mcTypeLocked: false
    })
  },
  editPartPreset(e) {
    const id = e.currentTarget.dataset.id
    const preset = this.data.partPresets.find(p => p.id === parseInt(id))
    if (!preset) return
    let params = []
    try { params = JSON.parse(preset.columnsJson || '[]') } catch (e) {}
    params.forEach((p, i) => { p._uid = Date.now() + '_' + i })
    let defaultValues = {}
    try { defaultValues = JSON.parse(preset.defaultValuesJson || '{}') } catch (e) {}
    let mc = null
    try { mc = JSON.parse(preset.materialCostJson || 'null') } catch (e) {}
    const mcLabel = mc ? ((mc.type === 'COLLECTOR' ? '集流管米重' : mc.type === 'FIN' ? '翅片单波重' : mc.type === 'FOLD_TUBE' ? '折叠扁管' : '扁管米重') + ' ' + mc.spec) : ''
    this.setData({
      editingPartPreset: preset,
      partPresetForm: {
        name: preset.name || '', partNo: preset.partNo || '', category: preset.category || 'A', material: preset.material || '',
        params, defaultValues,
        hasProcessFee: preset.hasProcessFee === 1,
        processFeeLabel: preset.processFeeLabel || '',
        processFeeDefault: preset.processFeeDefault || '',
        specTableJson: preset.specTableJson || '[]',
        formulasJson: preset.formulasJson || '{}',
        mcSelectedType: mc ? mc.type : '',
        mcSelectedLabel: mcLabel,
        mcSelectedSpec: mc ? mc.spec : '',
        mcSelectedFactor: mc ? mc.factor : '',
        mcSelectedWeight: mc ? mc.weight : '',
        mcSelectedThickness: mc ? mc.thickness : ''
      },
      mcInlineSearch: mc ? mc.spec : '',
      mcInlineDropdownVisible: false,
      mcTypeLocked: !!(mc && mc.spec)
    })
    if (mc && mc.type) this._loadMcInlineList(mc.type)
  },
  copyPartPreset(e) {
    const id = e.currentTarget.dataset.id
    const preset = this.data.partPresets.find(p => p.id === parseInt(id))
    if (!preset) return
    let params = []
    try { params = JSON.parse(preset.columnsJson || '[]') } catch (e) {}
    params.forEach((p, i) => { p._uid = Date.now() + '_' + i })
    let defaultValues = {}
    try { defaultValues = JSON.parse(preset.defaultValuesJson || '{}') } catch (e) {}
    let mc = null
    try { mc = JSON.parse(preset.materialCostJson || 'null') } catch (e) {}
    const mcLabel = mc ? ((mc.type === 'COLLECTOR' ? '集流管米重' : mc.type === 'FIN' ? '翅片单波重' : mc.type === 'FOLD_TUBE' ? '折叠扁管' : '扁管米重') + ' ' + mc.spec) : ''
    this.setData({
      editingPartPreset: { id: 0 },
      partPresetForm: {
        name: (preset.name || '') + '(副本)', partNo: '', category: preset.category || 'A', material: preset.material || '',
        params: JSON.parse(JSON.stringify(params)), defaultValues: JSON.parse(JSON.stringify(defaultValues)),
        hasProcessFee: preset.hasProcessFee === 1,
        processFeeLabel: preset.processFeeLabel || '',
        processFeeDefault: preset.processFeeDefault || '',
        specTableJson: preset.specTableJson || '[]',
        formulasJson: preset.formulasJson || '{}',
        mcSelectedType: mc ? mc.type : '',
        mcSelectedLabel: mcLabel,
        mcSelectedSpec: mc ? mc.spec : '',
        mcSelectedFactor: mc ? mc.factor : '',
        mcSelectedWeight: mc ? mc.weight : '',
        mcSelectedThickness: mc ? mc.thickness : ''
      },
      mcInlineSearch: mc ? mc.spec : '',
      mcInlineDropdownVisible: false,
      mcTypeLocked: !!(mc && mc.spec)
    })
    if (mc && mc.type) this._loadMcInlineList(mc.type)
  },
  deletePartPreset(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除', content: '删除后不可恢复',
      success: res => {
        if (!res.confirm) return
        api.deletePartPreset(id).then(() => {
          wx.showToast({ title: '已删除' })
          this.loadPartPresets()
        })
      }
    })
  },
  savePartPreset() {
    const form = this.data.partPresetForm
    if (!form.name) { wx.showToast({ title: '请填写名称', icon: 'none' }); return }
    if (!form.params.length) { wx.showToast({ title: '请至少添加一个参数', icon: 'none' }); return }
    for (const p of form.params) {
      if (!p.key || !p.label) { wx.showToast({ title: '参数名称和变量名不能为空', icon: 'none' }); return }
    }
    const data = {
      name: form.name,
      partNo: form.partNo || '',
      category: form.category,
      material: form.material || '',
      columnsJson: JSON.stringify(form.params),
      defaultValuesJson: JSON.stringify(form.defaultValues || {}),
      specTableJson: form.specTableJson || '[]',
      hasProcessFee: form.hasProcessFee ? 1 : 0,
      processFeeLabel: form.processFeeLabel || '',
      processFeeDefault: form.processFeeDefault || null,
      formulasJson: form.formulasJson || '{}',
      materialCostJson: form.mcSelectedType ? JSON.stringify({
        type: form.mcSelectedType,
        spec: form.mcSelectedSpec || '',
        factor: form.mcSelectedFactor || '',
        weight: form.mcSelectedWeight || '',
        thickness: form.mcSelectedThickness || ''
      }) : null
    }
    const editing = this.data.editingPartPreset
    const promise = editing.id ? api.updatePartPreset(editing.id, data) : api.createPartPreset(data)
    promise.then(() => {
      wx.showToast({ title: '保存成功' })
      this.setData({ editingPartPreset: null })
      this.loadPartPresets()
    }).catch(() => wx.showToast({ title: '保存失败', icon: 'none' }))
  },
  cancelEditPreset() {
    this.setData({ editingPartPreset: null })
  },

  // --- 表单输入 ---
  onPresetFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`partPresetForm.${field}`]: e.detail.value })
  },
  onPresetCategoryChange(e) {
    this.setData({ 'partPresetForm.category': ['A', 'B', 'C', 'D'][e.detail.value] })
  },
  addPresetParam(e) {
    const ptype = (e.currentTarget.dataset.type) || 'spec'
    const existing = this.data.partPresetForm.params
    const group = ptype === 'common' ? '' : (existing.length ? (existing.filter(p => p.group).slice(-1)[0] || {}).group || '材料规格' : '材料规格')
    const params = [...existing, { key: '', label: '', type: 'number', unit: '', role: 'input', formula: '', group, _uid: Date.now() + '_' + existing.length }]
    this.setData({ 'partPresetForm.params': params })
  },
  onPresetParamInput(e) {
    const { idx, field } = e.currentTarget.dataset
    const i = parseInt(idx)
    if (field === 'group') {
      const params = this.data.partPresetForm.params
      const oldGroup = params[i].group || ''
      const newGroup = e.detail.value
      const updates = { [`partPresetForm.params[${i}].group`]: newGroup }
      for (let j = i + 1; j < params.length; j++) {
        if ((params[j].group || '') === oldGroup) updates[`partPresetForm.params[${j}].group`] = newGroup
        else break
      }
      this.setData(updates)
    } else {
      this.setData({ [`partPresetForm.params[${i}].${field}`]: e.detail.value })
    }
  },
  onPresetParamRoleChange(e) {
    const idx = e.currentTarget.dataset.idx
    this.setData({ [`partPresetForm.params[${idx}].role`]: ['input', 'output'][e.detail.value] })
  },
  onPresetParamTypeChange(e) {
    const idx = e.currentTarget.dataset.idx
    this.setData({ [`partPresetForm.params[${idx}].type`]: ['number', 'text'][e.detail.value] })
  },
  movePresetParam(e) {
    const { idx, dir } = e.currentTarget.dataset
    const params = [...this.data.partPresetForm.params]
    const i = parseInt(idx)
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= params.length) return
    ;[params[i], params[j]] = [params[j], params[i]]
    this.setData({ 'partPresetForm.params': params })
  },
  deletePresetParam(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    const params = this.data.partPresetForm.params.filter((_, i) => i !== idx)
    this.setData({ 'partPresetForm.params': params })
  },
  onPresetDefaultInput(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ [`partPresetForm.defaultValues.${key}`]: e.detail.value })
  },

  // --- 加工费 ---
  onPresetProcessFeeToggle(e) {
    this.setData({ 'partPresetForm.hasProcessFee': e.detail.value })
  },
  onProcessFeeLabelInput(e) {
    const val = e.detail.value
    this.setData({ 'partPresetForm.processFeeLabel': val })
    if (this._pfTimer) clearTimeout(this._pfTimer)
    this._pfTimer = setTimeout(() => {
      api.searchProcessFeePresets(val || '').then(list => {
        this.setData({
          processFeeSearchResults: list || [],
          showProcessFeeDropdown: !!(list && list.length)
        })
      })
    }, 300)
  },
  selectProcessFeePreset(e) {
    const idx = e.currentTarget.dataset.idx
    const item = this.data.processFeeSearchResults[idx]
    if (!item) return
    this.setData({
      'partPresetForm.processFeeLabel': item.label,
      'partPresetForm.processFeeDefault': item.defaultRate || '',
      showProcessFeeDropdown: false
    })
  },
  hideProcessFeeDropdown() {
    setTimeout(() => this.setData({ showProcessFeeDropdown: false }), 200)
  },
  openProcessFeePresetModal() {
    this.setData({
      showProcessFeeModal: true,
      pfModalForm: { label: '', defaultRate: '' },
      editingProcessFeePreset: null
    })
    this._loadPfModalList()
  },
  closeProcessFeePresetModal() {
    this.setData({ showProcessFeeModal: false })
  },
  onPfModalInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`pfModalForm.${field}`]: e.detail.value })
  },
  savePfModalPreset() {
    const { pfModalForm, editingProcessFeePreset } = this.data
    if (!pfModalForm.label) {
      wx.showToast({ title: '请填写名称', icon: 'none' }); return
    }
    const payload = {
      label: pfModalForm.label,
      defaultRate: pfModalForm.defaultRate || null
    }
    const promise = editingProcessFeePreset
      ? api.updateProcessFeePreset(editingProcessFeePreset.id, payload)
      : api.createProcessFeePreset(payload)
    promise.then(() => {
      wx.showToast({ title: '保存成功' })
      this.setData({
        pfModalForm: { label: '', defaultRate: '' },
        editingProcessFeePreset: null
      })
      this._loadPfModalList()
    }).catch(() => wx.showToast({ title: '保存失败', icon: 'none' }))
  },
  editPfPresetItem(e) {
    const idx = e.currentTarget.dataset.idx
    const item = this.data.processFeePresets[idx]
    if (!item) return
    this.setData({
      pfModalForm: { label: item.label, defaultRate: item.defaultRate || '' },
      editingProcessFeePreset: item
    })
  },
  deletePfPresetItem(e) {
    const idx = e.currentTarget.dataset.idx
    const item = this.data.processFeePresets[idx]
    if (!item) return
    wx.showModal({
      title: '确认删除', content: '删除「' + item.label + '」？',
      success: res => {
        if (!res.confirm) return
        api.deleteProcessFeePreset(item.id).then(() => {
          wx.showToast({ title: '已删除' })
          this._loadPfModalList()
        })
      }
    })
  },
  cancelPfEdit() {
    this.setData({
      pfModalForm: { label: '', defaultRate: '' },
      editingProcessFeePreset: null
    })
  },
  _loadPfModalList() {
    api.searchProcessFeePresets('').then(list => {
      this.setData({ processFeePresets: list || [] })
    }).catch(() => {
      this.setData({ processFeePresets: [] })
    })
  },

  // --- 材料预算系数弹窗 ---
  openMaterialCostModal() {
    this.setData({
      showMaterialCostModal: true,
      mcPresetTab: 'COLLECTOR',
      mcEditingPreset: null,
      mcForm: { spec: '', factor: '', weight: '', thickness: '' }
    })
    this._loadMcPresetList('COLLECTOR')
  },
  closeMaterialCostModal() {
    this.setData({ showMaterialCostModal: false })
  },
  switchMcTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      mcPresetTab: tab,
      mcEditingPreset: null,
      mcForm: { spec: '', factor: '', weight: '', thickness: '' }
    })
    this._loadMcPresetList(tab)
  },
  onMcFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`mcForm.${field}`]: e.detail.value })
  },
  saveMcPreset() {
    const { mcForm, mcPresetTab, mcEditingPreset } = this.data
    if (!mcForm.spec) {
      wx.showToast({ title: '请填写规格', icon: 'none' }); return
    }
    const payload = {
      type: mcPresetTab,
      spec: mcForm.spec,
      factor: mcForm.factor || null,
      weight: mcPresetTab === 'FIN' ? null : (mcForm.weight || null),
      thickness: mcPresetTab === 'FIN' ? (mcForm.thickness || null) : null
    }
    const promise = mcEditingPreset
      ? api.updateMaterialCostPreset(mcEditingPreset.id, payload)
      : api.createMaterialCostPreset(payload)
    promise.then(() => {
      wx.showToast({ title: '保存成功' })
      this.setData({
        mcEditingPreset: null,
        mcForm: { spec: '', factor: '', weight: '', thickness: '' }
      })
      this._loadMcPresetList(mcPresetTab)
    }).catch(() => wx.showToast({ title: '保存失败', icon: 'none' }))
  },
  editMcPreset(e) {
    const item = this.data.mcPresetList[e.currentTarget.dataset.idx]
    if (!item) return
    this.setData({
      mcEditingPreset: item,
      mcForm: {
        spec: item.spec || '',
        factor: item.factor || '',
        weight: item.weight || '',
        thickness: item.thickness || ''
      }
    })
  },
  deleteMcPreset(e) {
    const item = this.data.mcPresetList[e.currentTarget.dataset.idx]
    if (!item) return
    wx.showModal({
      title: '确认删除', content: '删除「' + item.spec + '」？',
      success: res => {
        if (!res.confirm) return
        api.deleteMaterialCostPreset(item.id).then(() => {
          wx.showToast({ title: '已删除' })
          this._loadMcPresetList(this.data.mcPresetTab)
        })
      }
    })
  },
  cancelMcEdit() {
    this.setData({
      mcEditingPreset: null,
      mcForm: { spec: '', factor: '', weight: '', thickness: '' }
    })
  },
  selectMcPreset(e) {
    const item = this.data.mcPresetList[e.currentTarget.dataset.idx]
    if (!item) return
    const tab = this.data.mcPresetTab
    const label = tab === 'COLLECTOR' ? '集流管米重'
      : tab === 'FIN' ? '翅片单波重'
      : tab === 'FOLD_TUBE' ? '折叠扁管' : '扁管米重'
    this.setData({
      showMaterialCostModal: false,
      'partPresetForm.mcSelectedType': tab,
      'partPresetForm.mcSelectedLabel': label + ' ' + item.spec,
      'partPresetForm.mcSelectedSpec': item.spec,
      'partPresetForm.mcSelectedFactor': item.factor || '',
      'partPresetForm.mcSelectedWeight': item.weight || '',
      'partPresetForm.mcSelectedThickness': item.thickness || ''
    })
  },
  clearMcSelected() {
    this.setData({
      'partPresetForm.mcSelectedType': '',
      'partPresetForm.mcSelectedLabel': '',
      'partPresetForm.mcSelectedSpec': '',
      'partPresetForm.mcSelectedFactor': '',
      'partPresetForm.mcSelectedWeight': '',
      'partPresetForm.mcSelectedThickness': '',
      mcInlineSearch: '',
      mcInlineDropdownVisible: false,
      mcInlineFilteredList: [],
      mcTypeLocked: false
    })
  },
  onMcInlineTypeSelect(e) {
    const type = e.currentTarget.dataset.type
    if (type === this.data.partPresetForm.mcSelectedType) return
    this.setData({
      'partPresetForm.mcSelectedType': type,
      'partPresetForm.mcSelectedSpec': '',
      'partPresetForm.mcSelectedLabel': '',
      'partPresetForm.mcSelectedFactor': '',
      'partPresetForm.mcSelectedWeight': '',
      'partPresetForm.mcSelectedThickness': '',
      mcInlineSearch: '',
      mcInlineDropdownVisible: false,
      mcInlineFilteredList: []
    })
    this._loadMcInlineList(type)
  },
  _loadMcInlineList(type) {
    api.getMaterialCostPresets(type).then(list => {
      this.setData({ mcInlineFullList: list || [], mcInlineFilteredList: list || [] })
    }).catch(() => this.setData({ mcInlineFullList: [], mcInlineFilteredList: [] }))
  },
  onMcInlineSearchInput(e) {
    const key = (e.detail.value || '').trim().toLowerCase()
    const full = this.data.mcInlineFullList || []
    const filtered = key ? full.filter(item => (item.spec || '').toLowerCase().includes(key)) : full
    this.setData({ mcInlineSearch: e.detail.value, mcInlineFilteredList: filtered, mcInlineDropdownVisible: true })
  },
  showMcInlineDropdown() {
    const key = (this.data.mcInlineSearch || '').trim().toLowerCase()
    const full = this.data.mcInlineFullList || []
    const filtered = key ? full.filter(item => (item.spec || '').toLowerCase().includes(key)) : full
    this.setData({ mcInlineDropdownVisible: true, mcInlineFilteredList: filtered })
  },
  hideMcInlineDropdown() {
    setTimeout(() => this.setData({ mcInlineDropdownVisible: false }), 200)
  },
  onMcInlineSelect(e) {
    const item = this.data.mcInlineFilteredList[e.currentTarget.dataset.idx]
    if (!item) return
    const type = this.data.partPresetForm.mcSelectedType
    const label = type === 'COLLECTOR' ? '集流管米重'
      : type === 'FIN' ? '翅片单波重'
      : type === 'FOLD_TUBE' ? '折叠扁管' : '扁管米重'
    this.setData({
      'partPresetForm.mcSelectedSpec': item.spec,
      'partPresetForm.mcSelectedLabel': label + ' ' + item.spec,
      'partPresetForm.mcSelectedFactor': item.factor || '',
      'partPresetForm.mcSelectedWeight': item.weight || '',
      'partPresetForm.mcSelectedThickness': item.thickness || '',
      mcInlineSearch: item.spec,
      mcInlineDropdownVisible: false,
      mcTypeLocked: true
    })
  },
  unlockMcType() {
    this.setData({ mcTypeLocked: false })
  },
  _loadMcPresetList(type) {
    api.getMaterialCostPresets(type).then(list => {
      this.setData({ mcPresetList: list || [] })
    }).catch(() => this.setData({ mcPresetList: [] }))
  }
})
