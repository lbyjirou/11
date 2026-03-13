const calc = require('../../utils/calc.js')
const api = require('../../utils/request')
const auth = require('../../utils/auth')
const formula = require('../../utils/formula.js')
const regionPicker = require('../../utils/region-picker')

// 标签页权限定义
const TAB_PERMISSIONS = {
  setting: ['SALES', 'TECH', 'MANAGER', 'ADMIN'],
  sales: ['SALES', 'TECH', 'PROCESS', 'MANAGER', 'ADMIN'],
  tech: ['TECH', 'PROCESS', 'LOGISTICS', 'MANAGER', 'ADMIN'],
  prod: ['PROCESS', 'MANAGER', 'ADMIN'],
  logistics: ['LOGISTICS', 'MANAGER', 'ADMIN'],
  approve: ['MANAGER', 'ADMIN']
}

// 所有标签页定义
const ALL_TABS = [
  { key: 'setting', label: '铝价' },
  { key: 'sales', label: '销售' },
  { key: 'tech', label: '技术' },
  { key: 'prod', label: '生产' },
  { key: 'logistics', label: '物流' },
  { key: 'approve', label: '审批' }
]

// 铝密度常量
const ALUMINUM_DENSITY = 0.00000275

Page({
  data: {
    // ==================== 报价单工作流 ====================
    pageMode: 'list',  // 'list' | 'edit'
    quoteList: [],
    quoteListLoading: false,
    currentQuote: null,  // 当前编辑的报价单
    currentQuoteId: null,
    isSaving: false,
    isSubmitting: false,
    // 各Tab只读状态
    salesReadonly: false,
    techReadonly: false,
    prodReadonly: false,
    logisticsReadonly: false,

    // 流程进度
    orderProgress: null,

    // 修改流程
    modificationStatus: null,
    isInModification: false,
    needsMyReconfirm: false,
    isModInitiator: false,
    canRequestModify: false,
    canEditSubmit: true,

    // 截止时间
    currentStageDeadline: '',
    currentStageOverdue: false,
    deadlineRemaining: '',

    // 通知中心
    unreadCount: 0,
    showNotificationPanel: false,
    notifications: [],

    // 用户角色与权限
    userRole: '',
    visibleTabs: [],
    // Tab控制
    mainTab: 'setting',
    calcSubTab: 'collector',
    isCalculating: false,
    // 销售Tab数据
    salesData: {
      rfqId: '', quoteId: '', quoteVersion: 'V0', commercialStatus: 'DRAFT',
      owner: '', customerName: '', oemTier: '', vehicleProject: '',
      sopDate: '', eopDate: '', currency: 'CNY', incoterm: 'EXW',
      deliveryLocation: '', validUntil: '',
      annualVolume1y: '', annualVolume3y: '', annualVolumePeak: '',
      rampProfile: '', moldShared: false, moldSharedQty: '',
      deadlineMode: '', deadlineTech: '', deadlineProcess: '', deadlineLogistics: '', deadlineApprove: ''
    },
    commercialStatusOptions: [
      { value: 'DRAFT', label: '草稿' },
      { value: 'SUBMITTED', label: '已提交客户' },
      { value: 'AWARDED', label: '已中标' },
      { value: 'LOST', label: '已落标' },
      { value: 'EXPIRED', label: '已过期' }
    ],
    commercialStatusIndex: 0,
    oemTierOptions: ['OEM', 'TIER1', 'TIER2'],
    currencyOptions: ['CNY', 'USD', 'EUR', 'JPY'],
    incotermOptions: ['EXW', 'FOB', 'CIF', 'DDP', 'DAP'],
    // 客户管理
    customerSearchResults: [],
    customerSuggestions: [],
    showCustomerDropdown: false,
    showCustomerPanel: false,
    customerKeyword: '',
    showAddCustomerModal: false,
    editingCustomerId: null,
    newCustomer: { name: '', code: '', oemTier: '', contactName: '', contactPhone: '' },
    // 技术Tab数据
    specData: {
      partNo: '',
      sizeL: '', sizeW: '', sizeH: '',
      coreCenter: '', coreWidth: '', coreThickness: '',
      heatExchange: '', refrigerant: '', windSpeed: '', pressureDrop: ''
    },
    techSpecExpanded: true,
    techPerfExpanded: true,
    refrigerantOptions: ['R134a', 'R1234yf'],
    // 技术Tab材料数据（动态分类表格）
    techMaterialData: {
      globalVars: {},
      categories: [
        { key: 'A', label: 'A类', rows: [], collapsed: false, mergedColumns: [], specColumns: [], commonColumns: [], specColCount: 0, subtotal: '0.00', hasProcessFeeRows: false, _filteredPresets: [] },
        { key: 'B', label: 'B类', rows: [], collapsed: false, mergedColumns: [], specColumns: [], commonColumns: [], specColCount: 0, subtotal: '0.00', hasProcessFeeRows: false, _filteredPresets: [] },
        { key: 'C', label: 'C类', rows: [], collapsed: false, mergedColumns: [], specColumns: [], commonColumns: [], specColCount: 0, subtotal: '0.00', hasProcessFeeRows: false, _filteredPresets: [] },
        { key: 'D', label: 'D类', rows: [], collapsed: false, mergedColumns: [], specColumns: [], commonColumns: [], specColCount: 0, subtotal: '0.00', hasProcessFeeRows: false, _filteredPresets: [] }
      ]
    },
    techMaterialTotal: 0,
    techViewMode: 'overview',
    techExpandedRowId: null,
    techEditing: false,
    showTechAddMenu: false,
    showCategoryAddMenu: '',
    showTechPartPresetMenu: false,
    techFocusedCellAddress: '',
    partPresets: [],
    showPartPresetManager: false,
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
    showAddPartModal: false,
    addPartCategory: 'A',
    showAddPartSearchModal: false,
    addPartSearchKey: '',
    addPartSearchCategory: 'A',
    addPartSearchResults: [],
    addPartExpandedId: null,
    addPartEditValues: {},
    addPartSubtotal: '0',
    addPartQuickQty: {},
    addPartBatchCount: 0,
    showTechColumnEditor: false,
    techEditingCategoryKey: '',
    techEditingColumns: [],
    showTechAddColumnModal: false,
    techNewColumnData: { key: '', label: '', type: 'number', unit: '', role: 'input', formula: '' },
    // 生产工序Tab数据
    prodTotalLabor: 0,
    prodTotalMfg: 0,
    prodTotalEnergy: 0,
    prodGrandTotal: 0,
    processAreaTotal: 0,
    energyAreaTotal: 0,
    moldFeeAreaTotal: 0,
    showAreaSummaryModal: false,
    areaSummaryDtype: '',
    prodEditing: false,
    showProdAddMenu: false,
    showProdTplMenu: false,
    focusedCellAddress: '',
    editingDtype: 'process',
    editingSubtype: '',
    customProcessData: null,
    showColumnEditor: false,
    editingColumnSectionKey: '',
    editingColumns: [],
    showAddColumnModal: false,
    newColumnData: { key: '', label: '', type: 'number', unit: '', role: 'input', formula: '' },
    showSummaryEditor: false,
    editingSummary: [],
    showAddSectionModal: false,
    isRenamingSection: false,
    renameSectionOriginalKey: '',
    newSectionName: '',
    newSectionKey: '',
    showCustomProcessModal: false,
    customProcessSectionKey: '',
    customProcessFormData: {},
    customProcessSelectedPreset: null,
    presetIsNewSection: false,
    batchSelectedPresets: [],
    // 预设工序
    processPresets: [],
    energyMaterialPresets: [],
    filteredEnergyPresets: [],
    showEnergyPresetDropdown: false,
    showMaterialPresetManager: false,
    editingMaterialPresetId: null,
    materialPresetForm: { name: '', params: [] },
    energyManualAmount: '',
    energyManualParams: [],
    // 设备能耗模版（同时用于模具费，通过 templateCategory 区分）
    showDeviceTemplateSelector: false,
    deviceTemplateSearchKeyword: '',
    deviceTemplateResults: [],
    showDeviceTemplateDropdown: false,
    selectedDeviceTemplate: null,
    deviceCardValues: {},
    showDevicePresetManager: false,
    devicePresets: [],
    editingDevicePresetId: null,
    devicePresetForm: { name: '', variables: [], subGroups: [] },
    templateCategory: 'device',
    // 行级公式
    customProcessFormFormulas: {},
    editingRowFormula: null,
    showPresetManager: false,
    editingPresetId: null,
    presetForm: { name: '', sectionLabel: '', sectionKey: '', columns: [] },
    presetSearchKeyword: '',
    filteredPresets: [],
    showPresetDropdown: false,
    presetSectionSearch: '',
    presetFilteredSections: [],
    showPresetSectionDropdown: false,
    presetSectionMatched: false,
    // 模版管理
    processTemplates: [],
    showTemplateManager: false,
    showApplyTemplate: false,
    newTemplateName: '',
    previewTemplateData: null,
    previewTemplateName: '',
    // 审批Tab数据
    approveData: {
      materialCost: 0, manufactureCost: 0, freight: 0, cashCost: 0,
      mgmtRate: '', mgmtValue: '',
      warehouseRate: '', warehouseValue: '',
      financeRate: '', financeValue: '',
      qualityRate: '', qualityValue: '',
      profitRate: '', profitValue: '',
      moldShare: '',
      taxRate: '',
      preTax: '',
      postTax: '',
      approved: false
    },
    // 铝价设置（从后端获取）
    alPrice: 20.2,
    lossRatio: 1.02,
    diffRatio: 1.0,
    profitRate: 0.1,
    // 工序选择
    processList: [],
    processQtys: {},
    processSubtotals: {},
    processCost: 0,
    processExpanded: false,  // 工序列表是否展开
    // 物流查询
    originList: [],           // 出发地列表
    destinationList: [],      // 目的地列表
    selectedOrigin: '柳州',   // 选中的出发地
    selectedDestination: '',  // 选中的目的地
    logisticsDirection: 'outbound', // outbound=送货, inbound=返货
    logisticsPrices: [],      // 当前路线的物流价格列表
    logisticsLoading: false,
    showLogisticsModal: false, // 物流方案弹窗
    // 散货选择
    scatterOptions: [],       // 散货选项列表 [{company, price, checked, volume, subtotal}]
    // 整车选择（按车型分组）
    truckGroups: [],          // 整车分组 [{type, options: [{company, price, checked, qty, subtotal}]}]
    // 选中的方案汇总
    logisticsTotalFreight: 0, // 合计运费
    selectedLogisticsSummary: '', // 已选方案描述
    totalVolume: '',              // 货物总立方数
    allocatedVolume: 0,           // 已分配立方数
    lastQueryRoute: null,         // 上次查询的路线 {origin, destination, direction}
    showRecommend: false,         // 是否显示推荐方案
    recommendPlans: [],           // 推荐方案列表
    // 3D装箱相关
    packTypes: ['围板箱', '木箱', '托', '铁框', '纸箱'],
    cargoList: [],
    binPackingLoading: false,
    binPackingSolutions: [],
    currentSolutionIdx: -1,
    currentSolution: null,
    show3DPreview: false,
    current3DTruckIdx: 0,
    totalPackFee: 0,
    // 方案编辑相关
    showEditModal: false,
    editingSolutionIdx: -1,
    editingTrucks: [],
    editingScatterVolume: '',
    editPreviewCost: 0,
    editWarning: '',
    truckTypeOptions: ['4.2米', '6.8米', '9.6米', '13.5米', '17.5米'],
    truckStyleOptions: ['厢式', '高栏', '平板'],
    // 省市区三级联动
    destRegionRange: [[], [], []],
    destRegionIndex: [0, 0, 0],
    destRegionDisplay: '',
    originRegionRange: [[], [], []],
    originRegionIndex: [0, 0, 0],
    originRegionDisplay: '',
    // 城市搜索
    destSearchText: '',
    destSearchResults: [],
    showDestSuggest: false,
    originSearchText: '',
    originSearchResults: [],
    showOriginSuggest: false,
    canQueryLogistics: false,     // 是否可以查询运费
    // 运输信息
    transportDistance: '',         // 运输距离(km)
    ratedLoad: '',                 // 核定载质量(t)
    boxSpecs: [],                  // 货箱规格列表 [{length, width, height, volume, partsPerBox, quantity}]
    totalParts: 0,                 // 零件总数
    perPartFreight: '',            // 每个零件运输费用
    selectedVehicleType: '',       // 已选方案的车辆类型
    // 预设规格数据
    collectorSpecs: [],
    finSpecs: [],
    tubeSpecs: [],
    // 汇总页 - 购物车模式
    cartCollectors: [],
    cartFins: [],
    cartTubes: [],
    showSpecPicker: false,
    specPickerType: '',
    specPickerList: [],
    // 购物车规格名称编辑
    cartEditingType: '',
    cartEditingIdx: -1,
    cartSuggestList: [],
    cartOriginalName: '',
    // 自定义规格页 - 集流管
    collectorPresetNames: ['-- 手动输入 --'],
    collectorPresetIndex: 0,
    collectorSpecName: '',
    collectorArea: 47.1239,
    collectorLen: 326,
    collectorFee: 16.5,
    collectorResult: { weight: 0, unitPrice: 0 },
    // 自定义规格页 - 翅片
    finPresetNames: ['-- 手动输入 --'],
    finPresetIndex: 0,
    finSpecName: '',
    finWidth: 12,
    finWaveLen: 12,
    finWaveCount: 240,
    finTotalWaveLen: 2880,
    finThickness: 0.1,
    finFee: 7,
    finPartFee: 0.001,
    finResult: { weight: 0, unitPrice: 0 },
    // 自定义规格页 - 扁管
    tubePresetNames: ['-- 手动输入 --'],
    tubePresetIndex: 0,
    tubeSpecName: '',
    tubeMeterWeight: 0.027,
    tubeLen: 735,
    tubeFee: 7.436,
    tubeZincFee: 11.9,
    tubeResult: { weight: 0, normalPrice: 0, zincPrice: 0 },
    // 费用
    mfgCost: 25,
    freight: 4,
    // 汇总数据
    summaryData: { materialCost: 0, componentCost: 0, profit: 0, finalPrice: 0 },
    // 通用部件
    components: [],
    componentQtys: {},
    componentSubtotals: {},
    componentExpanded: false,
    componentShowCount: 3
  },

  onLoad() {
    if (!auth.checkAuth()) return
    this.initUserPermissions()
    this.initRegionPicker()
    this.loadQuoteList()  // 加载报价单列表
    this._loadUnreadCount()
    this.loadConfig()
    this.loadSpecs()
    this.loadComponents()
    this.loadProcessList()
    this.loadLocationLists()
  },

  // 初始化用户权限
  initUserPermissions(options = {}) {
    const { setMainTab = true } = options
    const userInfo = auth.getUserInfo() || {}
    const role = (userInfo.role || 'SALES').toUpperCase()
    const perms = auth.getPermissions()

    let visibleTabs
    if (perms && perms.length > 0) {
      // 新RBAC模式：根据 TAB_VIEW_* 权限过滤
      const permTabMap = {
        setting: 'TAB_VIEW_SETTING', sales: 'TAB_VIEW_SALES',
        tech: 'TAB_VIEW_TECH', prod: 'TAB_VIEW_PROCESS',
        logistics: 'TAB_VIEW_LOGISTICS', approve: 'TAB_VIEW_APPROVE'
      }
      visibleTabs = ALL_TABS.filter(tab => perms.indexOf(permTabMap[tab.key]) !== -1)
    } else {
      // Fallback: 旧硬编码模式
      visibleTabs = ALL_TABS.filter(tab => TAB_PERMISSIONS[tab.key].includes(role))
    }

    const defaultTab = visibleTabs.length > 0 ? visibleTabs[0].key : 'setting'
    const nextData = { userRole: role, visibleTabs }
    if (setMainTab) nextData.mainTab = defaultTab
    this.setData(nextData)
  },

  // ==================== 报价单列表 ====================
  loadQuoteList() {
    this.setData({ quoteListLoading: true })
    api.getQuoteOrderList(1, 50).then(res => {
      const list = (res.records || res || []).map(item => ({
        ...item,
        statusText: this.getStatusText(item.status)
      }))
      this.setData({ quoteList: list, quoteListLoading: false })
    }).catch(() => {
      this.setData({ quoteListLoading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  getStatusText(status) {
    const map = {
      DRAFT: '销售',
      PENDING_TECH: '技术',
      PENDING_PROCESS: '生产',
      PENDING_LOGISTICS: '物流',
      PENDING_APPROVAL: '审批',
      APPROVED: '已通过',
      REJECTED: '已驳回'
    }
    return map[status] || status
  },

  // 选择报价单进入编辑模式
  selectQuote(e) {
    const id = e.currentTarget.dataset.id
    this.loadQuoteDetail(id)
  },

  // 创建新报价单
  createNewQuote() {
    const perms = auth.getPermissions()
    const canCreate = (perms && perms.indexOf('WORKFLOW_CREATE') !== -1) || this.data.userRole === 'ADMIN'
    if (!canCreate) {
      wx.showToast({ title: '无创建权限', icon: 'none' })
      return
    }
    // 进入编辑模式，空报价单
    this.setData({
      pageMode: 'edit',
      currentQuote: null,
      currentQuoteId: null,
      orderProgress: null,
      mainTab: 'sales'
    })
    this.resetFormData()
  },

  // 加载报价单详情
  loadQuoteDetail(id) {
    wx.showLoading({ title: '加载中...' })
    Promise.all([
      api.getQuoteOrderDetail(id),
      api.getOrderProgress(id),
      api.getModificationStatus(id),
      api.getCurrentUser(),
      api.getQuoteDeadlines(id)
    ]).then(([quote, progress, modStatus, freshUser, deadlines]) => {
      wx.hideLoading()
      // 刷新本地权限缓存
      if (freshUser && freshUser.permissions) {
        auth.setPermissions(freshUser.permissions)
      }
      if (freshUser && freshUser.roles) {
        const info = auth.getUserInfo() || {}
        info.roles = freshUser.roles
        auth.setUserInfo(info)
      }
      this.initUserPermissions({ setMainTab: false })
      const perms = auth.getPermissions()
      const hasModifyPerm = perms.indexOf('WORKFLOW_MODIFY') !== -1

      const stageOrder = ['DRAFT', 'PENDING_TECH', 'PENDING_PROCESS', 'PENDING_LOGISTICS', 'PENDING_APPROVAL', 'APPROVED']
      const roleToStatus = { SALES: 'DRAFT', TECH: 'PENDING_TECH', PROCESS: 'PENDING_PROCESS', LOGISTICS: 'PENDING_LOGISTICS', MANAGER: 'PENDING_APPROVAL' }
      const myStatus = roleToStatus[this.data.userRole]
      const myIdx = stageOrder.indexOf(myStatus)
      const curIdx = stageOrder.indexOf(quote.status)
      // 工单在当前角色负责的阶段 → 可编辑提交
      const canEditSubmit = myIdx >= 0 && curIdx === myIdx
      // 工单已过当前角色阶段 + 有修改权限 → 可申请修改
      const canRequestModify = hasModifyPerm && myIdx >= 0 && curIdx > myIdx

      this.setData({
        pageMode: 'edit',
        currentQuote: quote,
        currentQuoteId: id,
        orderProgress: progress,
        modificationStatus: modStatus,
        isInModification: false,
        needsMyReconfirm: false,
        isModInitiator: false,
        canRequestModify: canRequestModify,
        canEditSubmit: canEditSubmit
      })
      // 处理截止时间
      this._processDeadlines(deadlines, quote.status)
      this.fillFormFromQuote(quote)
      this.setDefaultTab()
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // 根据角色设置默认Tab和只读状态
  setDefaultTab() {
    const { userRole, visibleTabs, pageMode } = this.data
    const perms = auth.getPermissions()
    let defaultTab = visibleTabs.length > 0 ? visibleTabs[0].key : 'setting'
    // 各角色默认进入自己负责的Tab
    if (userRole === 'SALES') defaultTab = 'sales'
    else if (userRole === 'TECH') defaultTab = 'tech'
    else if (userRole === 'PROCESS') defaultTab = 'prod'
    else if (userRole === 'LOGISTICS') defaultTab = 'logistics'
    else if (userRole === 'MANAGER') defaultTab = 'approve'
    const roleDefaultTab = defaultTab
    if (pageMode === 'edit' && perms && perms.length > 0) {
      const editPermMap = {
        setting: 'TAB_EDIT_SETTING', sales: 'TAB_EDIT_SALES', tech: 'TAB_EDIT_TECH',
        prod: 'TAB_EDIT_PROCESS', logistics: 'TAB_EDIT_LOGISTICS', approve: 'TAB_EDIT_APPROVE'
      }
      const visibleKeys = new Set(visibleTabs.map(tab => tab.key))
      const editableTab = ALL_TABS.find(tab => visibleKeys.has(tab.key) && perms.indexOf(editPermMap[tab.key]) !== -1)
      if (editableTab) defaultTab = editableTab.key
      else defaultTab = roleDefaultTab
    }
    // 确保Tab在可见列表中
    if (!visibleTabs.find(t => t.key === defaultTab)) {
      defaultTab = visibleTabs[0]?.key || 'setting'
    }
    // 设置各Tab只读状态
    const isAdmin = userRole === 'ADMIN'
    const quote = this.data.currentQuote
    const status = quote ? quote.status : null
    // 工单状态 → 哪个角色可编辑的映射
    const statusEditMap = {
      DRAFT: 'SALES', PENDING_TECH: 'TECH', PENDING_PROCESS: 'PROCESS',
      PENDING_LOGISTICS: 'LOGISTICS', PENDING_APPROVAL: 'MANAGER'
    }
    const activeRole = statusEditMap[status] || null
    let settingRO, salesRO, techRO, prodRO, logisticsRO
    if (perms && perms.length > 0) {
      settingRO = !isAdmin && perms.indexOf('TAB_EDIT_SETTING') === -1
      salesRO = !isAdmin && (perms.indexOf('TAB_EDIT_SALES') === -1 || (status && activeRole !== 'SALES'))
      techRO = !isAdmin && (perms.indexOf('TAB_EDIT_TECH') === -1 || (status && activeRole !== 'TECH'))
      prodRO = !isAdmin && (perms.indexOf('TAB_EDIT_PROCESS') === -1 || (status && activeRole !== 'PROCESS'))
      logisticsRO = !isAdmin && (perms.indexOf('TAB_EDIT_LOGISTICS') === -1 || (status && activeRole !== 'LOGISTICS'))
    } else {
      settingRO = !isAdmin && userRole !== 'SALES' && userRole !== 'TECH'
      salesRO = !isAdmin && (userRole !== 'SALES' || (status && activeRole !== 'SALES'))
      techRO = !isAdmin && (userRole !== 'TECH' || (status && activeRole !== 'TECH'))
      prodRO = !isAdmin && (userRole !== 'PROCESS' || (status && activeRole !== 'PROCESS'))
      logisticsRO = !isAdmin && (userRole !== 'LOGISTICS' || (status && activeRole !== 'LOGISTICS'))
    }
    this.setData({
      mainTab: defaultTab,
      settingReadonly: settingRO,
      salesReadonly: salesRO,
      techReadonly: techRO,
      prodReadonly: prodRO,
      logisticsReadonly: logisticsRO,
      techEditing: techRO ? false : this.data.techEditing,
      prodEditing: prodRO ? false : this.data.prodEditing
    })
  },

  // 从报价单填充表单
  fillFormFromQuote(quote) {
    if (!quote) return
    // 还原审批数据
    this.setData({ 'approveData.approved': quote.status === 'APPROVED' })
    if (quote.approveDataJson) {
      try {
        var ad = JSON.parse(quote.approveDataJson)
        // 只还原费率/配置字段，成本汇总由 calcApproveData 实时计算
        var restoreKeys = ['mgmtRate','warehouseRate','financeRate','qualityRate','profitRate','moldShare','taxRate']
        restoreKeys.forEach(function (k) {
          if (ad[k] !== undefined && ad[k] !== null) {
            this.setData({ ['approveData.' + k]: String(ad[k]) })
          }
        }.bind(this))
      } catch (e) { console.error('解析approveDataJson失败', e) }
    }
    // 填充销售数据（后端字段 → 前端字段）
    this.setData({
      'salesData.rfqId': quote.rfqId || '',
      'salesData.quoteId': quote.quoteNo || '',
      'salesData.quoteVersion': quote.quoteVersion || 'V0',
      'salesData.commercialStatus': quote.commercialStatus || 'DRAFT',
      'salesData.owner': quote.owner || '',
      'salesData.customerName': (quote.customerName && quote.customerName !== '未填写') ? quote.customerName : '',
      'salesData.oemTier': quote.oemTier || '',
      'salesData.vehicleProject': quote.vehicleProject || '',
      'salesData.sopDate': quote.sopDate || '',
      'salesData.eopDate': quote.eopDate || '',
      'salesData.currency': quote.currency || 'CNY',
      'salesData.incoterm': quote.incoterm || 'EXW',
      'salesData.deliveryLocation': quote.deliveryLocation || '',
      'salesData.validUntil': quote.validUntil || '',
      'salesData.annualVolume1y': quote.annualVolume1y ? String(quote.annualVolume1y) : '',
      'salesData.annualVolume3y': quote.annualVolume3y ? String(quote.annualVolume3y) : '',
      'salesData.annualVolumePeak': quote.annualVolumePeak ? String(quote.annualVolumePeak) : '',
      'salesData.rampProfile': quote.rampProfile || '',
      'salesData.moldShared': quote.moldShared === 1,
      'salesData.moldSharedQty': quote.moldSharedQty ? String(quote.moldSharedQty) : '',
      'salesData.deadlineMode': quote.deadlineMode || '',
      'salesData.deadlineTech': quote.deadlineTech != null ? String(quote.deadlineTech) : '',
      'salesData.deadlineProcess': quote.deadlineProcess != null ? String(quote.deadlineProcess) : '',
      'salesData.deadlineLogistics': quote.deadlineLogistics != null ? String(quote.deadlineLogistics) : '',
      'salesData.deadlineApprove': quote.deadlineApprove != null ? String(quote.deadlineApprove) : '',
      commercialStatusIndex: this.data.commercialStatusOptions.findIndex(o => o.value === (quote.commercialStatus || 'DRAFT')) || 0
    })
    // 填充技术材料数据
    if (quote.techDataJson) {
      try {
        const parsed = JSON.parse(quote.techDataJson)
        if (parsed && parsed.categories) {
          this._migrateTechData(parsed)
          this.setData({ techMaterialData: parsed })
        }
      } catch (e) {
        console.error('解析techDataJson失败', e)
      }
    }
    var _r = this.data.userRole
    if (_r === 'TECH' || _r === 'PROCESS' || _r === 'ADMIN') {
      this.loadPartPresets()
    }
    this._rebuildAllMergedColumns()
    this._calcTechMaterialTotal()
    // 填充产品规格/性能参数
    this.setData({
      'specData.partNo': quote.partNo || '',
      'specData.sizeL': quote.sizeL != null ? String(quote.sizeL) : '',
      'specData.sizeW': quote.sizeW != null ? String(quote.sizeW) : '',
      'specData.sizeH': quote.sizeH != null ? String(quote.sizeH) : '',
      'specData.coreCenter': quote.coreCenter != null ? String(quote.coreCenter) : '',
      'specData.coreWidth': quote.coreWidth != null ? String(quote.coreWidth) : '',
      'specData.coreThickness': quote.coreThickness != null ? String(quote.coreThickness) : '',
      'specData.heatExchange': quote.heatExchange != null ? String(quote.heatExchange) : '',
      'specData.refrigerant': quote.refrigerant || '',
      'specData.windSpeed': quote.windSpeed != null ? String(quote.windSpeed) : '',
      'specData.pressureDrop': quote.pressureDrop != null ? String(quote.pressureDrop) : ''
    })
    // 填充物流数据
    if (quote.logisticsDataJson) {
      try {
        const ld = JSON.parse(quote.logisticsDataJson)
        this.setData({
          selectedOrigin: ld.selectedOrigin || '柳州',
          selectedDestination: ld.selectedDestination || '',
          logisticsDirection: ld.logisticsDirection || 'outbound',
          totalVolume: ld.totalVolume || '',
          logisticsTotalFreight: ld.logisticsTotalFreight || 0,
          selectedLogisticsSummary: ld.selectedLogisticsSummary || '',
          scatterOptions: ld.scatterOptions || [],
          truckGroups: ld.truckGroups || [],
          cargoList: ld.cargoList || [],
          currentSolution: ld.currentSolution || null,
          totalPackFee: ld.totalPackFee || 0,
          destRegionDisplay: ld.destRegionDisplay || '',
          originRegionDisplay: ld.originRegionDisplay || '',
          transportDistance: ld.transportDistance || '',
          ratedLoad: ld.ratedLoad || '',
          boxSpecs: ld.boxSpecs || [],
          selectedVehicleType: ld.selectedVehicleType || '',
          freight: ld.logisticsTotalFreight || 0
        })
        // 反查 picker 索引回显
        this._restoreRegionPicker(ld)
        this.calcPerPartFreight()
      } catch (e) {
        console.error('解析logisticsDataJson失败', e)
      }
    }
    // 填充工艺工序数据（仅有工艺权限的角色才加载）
    const hasProcessPerm = auth.hasPermission('TAB_VIEW_PROCESS') || auth.hasPermission('DATA_VIEW_PROCESS')
    const hasApprovePerm = auth.hasPermission('TAB_VIEW_APPROVE') || this.data.userRole === 'MANAGER' || this.data.userRole === 'ADMIN'
    if (hasProcessPerm || hasApprovePerm) {
      if (quote.processDataJson) {
        try {
          const parsed = JSON.parse(quote.processDataJson)
          if (Array.isArray(parsed)) {
            const sections = [{
              key: 'standard', label: '工序', collapsed: false,
              columns: [
                { key: 'name', label: '工序描述', type: 'text', role: 'input' },
                { key: 'rate', label: '费率', type: 'number', role: 'input', unit: '元/H' },
                { key: 'time', label: '工时', type: 'number', role: 'input', unit: 'S' },
                { key: 'operators', label: '人数', type: 'number', role: 'input' },
                { key: 'laborCost', label: '人工成本', type: 'number', role: 'output', formula: 'rate / 3600 * time * operators' },
                { key: 'machineModel', label: '机器型号', type: 'text', role: 'input' },
                { key: 'machineType', label: '类别', type: 'text', role: 'input' },
                { key: 'varCost', label: '可变费', type: 'number', role: 'input' },
                { key: 'fixCost', label: '固定费', type: 'number', role: 'input' },
                { key: 'mfgCost', label: '制造费', type: 'number', role: 'output', formula: 'varCost + fixCost' }
              ],
              rows: parsed.map((p, i) => ({ id: i + 1, ...p }))
            }]
            const customData = {
              mode: 'custom', sections,
              summary: [
                { key: 'totalLabor', label: '总直接人工', formula: 'SUM(standard.laborCost)' },
                { key: 'totalMfg', label: '总制造费', formula: 'SUM(standard.mfgCost)' }
              ],
              energySections: [],
              moldFeeSections: []
            }
            this.setData({ customProcessData: customData })
            this.recalcAllSections()
            this.recalcSummary()
          } else if (parsed && parsed.mode === 'custom') {
            if (!parsed.energySections) parsed.energySections = []
            if (!parsed.moldFeeSections) parsed.moldFeeSections = []
            // 兼容旧数据：合并 energySummary 到 summary
            if (parsed.energySummary && parsed.energySummary.length) {
              parsed.summary = [].concat(parsed.summary || [], parsed.energySummary)
              delete parsed.energySummary
            }
            ;[].concat(parsed.sections || [], parsed.energySections, parsed.moldFeeSections).forEach(sec => {
              if (sec && sec.columns) sec.columns.forEach(col => { if (!col.label) col.label = col.key })
            })
            // 兼容旧能耗数据：没有 subtype 的默认为 device
            ;(parsed.energySections || []).forEach(sec => {
              if (!sec.subtype) {
                sec.subtype = (sec.columns && sec.columns.length) ? 'device' : 'material'
              }
              if (sec.subtype === 'material') {
                sec.rows.forEach(row => {
                  if (row.amount === undefined) row.amount = 0
                })
              }
            })
            this.setData({ customProcessData: parsed })
            this.recalcAllSections()
            this.recalcSummary()
          }
        } catch (e) {
          console.error('解析processDataJson失败', e)
        }
      } else {
        this.loadLastUsedStructure()
      }
      if (quote.id) {
        this.loadSavedProcesses(quote.id)
      }
    }
    this._loadDeadlineDefaults()
    // 统一计算审批数据（确保技术+工序+物流数据都已加载后）
    this.calcApproveData()
  },

  // 从后端加载已保存的工序数据（兼容旧数据）
  loadSavedProcesses(orderId) {
    api.getOrderProcesses(orderId).then(list => {
      if (!list || !list.length) return
      // 如果已有customProcessData则不覆盖
      if (this.data.customProcessData && this.data.customProcessData.sections && this.data.customProcessData.sections.length) return
      const processes = list.map(p => ({
        id: p.id,
        name: p.processName || '',
        rate: p.machineHourlyRate || 25,
        time: p.cycleTime || 0,
        operators: p.crewSize || 1,
        machineModel: p.machineName || '',
        machineType: p.machineCategory || '',
        varCost: p.variableCost || 0,
        fixCost: p.fixedCost || 0
      }))
      // 转换为自定义格式
      const sections = [{
        key: 'standard', label: '工序', collapsed: false,
        columns: [
          { key: 'name', label: '工序描述', type: 'text', role: 'input' },
          { key: 'rate', label: '费率', type: 'number', role: 'input', unit: '元/H' },
          { key: 'time', label: '工时', type: 'number', role: 'input', unit: 'S' },
          { key: 'operators', label: '人数', type: 'number', role: 'input' },
          { key: 'laborCost', label: '人工成本', type: 'number', role: 'output', formula: 'rate / 3600 * time * operators' },
          { key: 'machineModel', label: '机器型号', type: 'text', role: 'input' },
          { key: 'machineType', label: '类别', type: 'text', role: 'input' },
          { key: 'varCost', label: '可变费', type: 'number', role: 'input' },
          { key: 'fixCost', label: '固定费', type: 'number', role: 'input' },
          { key: 'mfgCost', label: '制造费', type: 'number', role: 'output', formula: 'varCost + fixCost' }
        ],
        rows: processes
      }]
      this.setData({
        customProcessData: {
          mode: 'custom', sections,
          summary: [
            { key: 'totalLabor', label: '总直接人工', formula: 'SUM(standard.laborCost)' },
            { key: 'totalMfg', label: '总制造费', formula: 'SUM(standard.mfgCost)' }
          ],
          energySections: [],
          moldFeeSections: []
        }
      })
      this.recalcAllSections()
      this.recalcSummary()
    }).catch(() => {})
  },

  // 重置表单数据
  resetFormData() {
    this.setData({
      salesData: {
        rfqId: '', quoteId: '', quoteVersion: 'V0', commercialStatus: 'DRAFT',
        owner: '', customerName: '', oemTier: '', vehicleProject: '',
        sopDate: '', eopDate: '', currency: 'CNY', incoterm: 'EXW',
        deliveryLocation: '', validUntil: '',
        annualVolume1y: '', annualVolume3y: '', annualVolumePeak: '',
        rampProfile: '', moldShared: false, moldSharedQty: ''
      },
      specData: {
        partNo: '',
        sizeL: '', sizeW: '', sizeH: '',
        coreCenter: '', coreWidth: '', coreThickness: '',
        heatExchange: '', refrigerant: '', windSpeed: '', pressureDrop: ''
      },
      techMaterialData: {
        globalVars: {},
        categories: [
          { key: 'A', label: 'A类', rows: [], collapsed: false, mergedColumns: [], subtotal: '0.00', hasProcessFeeRows: false, _filteredPresets: [] },
          { key: 'B', label: 'B类', rows: [], collapsed: false, mergedColumns: [], subtotal: '0.00', hasProcessFeeRows: false, _filteredPresets: [] },
          { key: 'C', label: 'C类', rows: [], collapsed: false, mergedColumns: [], subtotal: '0.00', hasProcessFeeRows: false, _filteredPresets: [] },
          { key: 'D', label: 'D类', rows: [], collapsed: false, mergedColumns: [], subtotal: '0.00', hasProcessFeeRows: false, _filteredPresets: [] }
        ]
      },
      techMaterialTotal: 0,
      techViewMode: 'overview',
      techExpandedRowId: null,
      techEditing: false,
      showTechAddMenu: false
    })
  },

  // 退出编辑模式
  exitEditMode() {
    this.setData({
      pageMode: 'list',
      currentQuote: null,
      currentQuoteId: null,
      orderProgress: null,
      modificationStatus: null,
      isInModification: false,
      needsMyReconfirm: false,
      isModInitiator: false,
      canRequestModify: false,
      canEditSubmit: true
    })
    this.loadQuoteList()
  },

  // 保存报价单（草稿）
  saveQuoteDraft() {
    const { currentQuoteId, salesData, userRole } = this.data
    this.setData({ isSaving: true })
    // 同步直接赋值的物流字段
    if (userRole === 'LOGISTICS' || userRole === 'ADMIN') {
      this.setData({
        transportDistance: this.data.transportDistance,
        ratedLoad: this.data.ratedLoad,
        boxSpecs: this.data.boxSpecs
      })
    }

    const dto = this.buildQuoteDTO()

    const promise = currentQuoteId
      ? api.updateQuoteOrder(currentQuoteId, dto)
      : api.createQuoteOrder(dto)

    promise.then(res => {
      this.setData({ isSaving: false })
      if (!currentQuoteId && res) {
        this.setData({ currentQuoteId: res })
      }
      wx.showToast({ title: '保存成功', icon: 'success' })
    }).catch(err => {
      this.setData({ isSaving: false })
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    })
  },

  // 提交报价单
  submitQuote() {
    const { currentQuoteId, userRole } = this.data
    if (!currentQuoteId) {
      wx.showToast({ title: '请先保存', icon: 'none' })
      return
    }
    if (userRole === 'SALES' && !this.data.salesData.validUntil) {
      wx.showToast({ title: '请先填写报价有效期', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认提交',
      content: '提交后将进入下一环节，确定吗？',
      success: res => {
        if (!res.confirm) return
        this.setData({ isSubmitting: true })
        this.doSubmit()
      }
    })
  },

  doSubmit() {
    const { currentQuoteId, userRole } = this.data
    // 提交前同步直接赋值的物流字段，确保 buildQuoteDTO 能读到最新值
    if (userRole === 'LOGISTICS' || userRole === 'ADMIN') {
      this.setData({
        transportDistance: this.data.transportDistance,
        ratedLoad: this.data.ratedLoad,
        boxSpecs: this.data.boxSpecs
      })
    }
    let promise

    if (userRole === 'SALES') {
      const dto = this.buildQuoteDTO()
      promise = api.updateQuoteOrder(currentQuoteId, dto)
        .then(() => api.submitQuoteOrder(currentQuoteId))
    } else if (userRole === 'TECH') {
      const dto = this.buildQuoteDTO()
      promise = api.updateQuoteOrder(currentQuoteId, dto)
        .then(() => api.advanceQuoteStatus(currentQuoteId))
    } else if (userRole === 'PROCESS') {
      const dto = this.buildQuoteDTO()
      promise = api.updateQuoteOrder(currentQuoteId, dto)
        .then(() => api.submitProcessCalc(currentQuoteId))
    } else if (userRole === 'LOGISTICS') {
      const dto = this.buildQuoteDTO()
      promise = api.updateQuoteOrder(currentQuoteId, dto)
        .then(() => api.advanceQuoteStatus(currentQuoteId))
    } else if (userRole === 'MANAGER') {
      const dto = this.buildQuoteDTO()
      promise = api.updateQuoteOrder(currentQuoteId, dto)
        .then(() => api.approveOrder(currentQuoteId))
    } else {
      promise = api.submitQuoteOrder(currentQuoteId)
    }

    promise.then(res => {
      this.setData({ isSubmitting: false })
      const statusName = res && res.statusName ? res.statusName : '下一环节'
      wx.showToast({ title: '已提交至' + statusName, icon: 'success' })
      setTimeout(() => this.exitEditMode(), 1500)
    }).catch(err => {
      this.setData({ isSubmitting: false })
      wx.showToast({ title: err.message || '提交失败', icon: 'none' })
    })
  },

  // 申请修改
  requestModification() {
    const { currentQuoteId } = this.data
    wx.showModal({
      title: '申请修改',
      content: '发起修改后，下游环节需要重新确认，确定吗？',
      editable: true,
      placeholderText: '请输入修改原因（选填）',
      success: res => {
        if (!res.confirm) return
        api.initiateModification(currentQuoteId, res.content || '').then(() => {
          wx.showToast({ title: '已发起修改', icon: 'success' })
          this.loadQuoteDetail(currentQuoteId)
        }).catch(err => {
          wx.showToast({ title: err.message || '操作失败', icon: 'none' })
        })
      }
    })
  },

  // 确认无需修改
  confirmNoModification() {
    const { currentQuoteId } = this.data
    wx.showModal({
      title: '确认',
      content: '确认本环节无需修改，直接放行？',
      success: res => {
        if (!res.confirm) return
        api.confirmNoChange(currentQuoteId).then(() => {
          wx.showToast({ title: '已确认', icon: 'success' })
          setTimeout(() => this.exitEditMode(), 1500)
        }).catch(err => {
          wx.showToast({ title: err.message || '操作失败', icon: 'none' })
        })
      }
    })
  },

  // 修改后重新提交
  resubmitAfterModification() {
    const { currentQuoteId } = this.data
    const dto = this.buildQuoteDTO()
    api.updateQuoteOrder(currentQuoteId, dto).then(() => {
      return api.resubmitModification(currentQuoteId, JSON.stringify(dto))
    }).then(() => {
      wx.showToast({ title: '已重新提交', icon: 'success' })
      setTimeout(() => this.exitEditMode(), 1500)
    }).catch(err => {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    })
  },

  // 构建报价单DTO（角色感知，只发送当前角色负责的字段）
  buildQuoteDTO() {
    const { salesData, techData, specData, userRole } = this.data
    const dto = {
      rfqId: salesData.rfqId || null,
      quoteNo: salesData.quoteId || null,
      quoteVersion: salesData.quoteVersion || 'V0',
      commercialStatus: salesData.commercialStatus || 'DRAFT',
      owner: salesData.owner || null,
      customerName: salesData.customerName || null,
      oemTier: salesData.oemTier || null,
      vehicleProject: salesData.vehicleProject || null,
      sopDate: salesData.sopDate || null,
      eopDate: salesData.eopDate || null,
      currency: salesData.currency || 'CNY',
      incoterm: salesData.incoterm || null,
      deliveryLocation: salesData.deliveryLocation || null,
      validUntil: salesData.validUntil || null,
      annualVolume1y: salesData.annualVolume1y ? parseInt(salesData.annualVolume1y) : null,
      annualVolume3y: salesData.annualVolume3y ? parseInt(salesData.annualVolume3y) : null,
      annualVolumePeak: salesData.annualVolumePeak ? parseInt(salesData.annualVolumePeak) : null,
      rampProfile: salesData.rampProfile || null,
      moldShared: salesData.moldShared ? 1 : 0,
      moldSharedQty: salesData.moldSharedQty ? parseInt(salesData.moldSharedQty) : null,
      deadlineMode: salesData.deadlineMode || null,
      deadlineTech: salesData.deadlineTech ? parseInt(salesData.deadlineTech) : null,
      deadlineProcess: salesData.deadlineProcess ? parseInt(salesData.deadlineProcess) : null,
      deadlineLogistics: salesData.deadlineLogistics ? parseInt(salesData.deadlineLogistics) : null,
      deadlineApprove: salesData.deadlineApprove ? parseInt(salesData.deadlineApprove) : null
    }
    // 技术角色才发送 techDataJson + 规格/性能字段
    const perms = auth.getPermissions()
    const hasPerm = (code) => perms && perms.indexOf(code) !== -1
    if (hasPerm('TAB_EDIT_TECH') || userRole === 'ADMIN') {
      // 序列化时清理运行时字段
      const techData = JSON.parse(JSON.stringify(this.data.techMaterialData))
      if (techData.categories) {
        techData.categories.forEach(cat => {
          delete cat.mergedColumns
          delete cat.specColumns
          delete cat.commonColumns
          delete cat.specColCount
          delete cat._filteredPresets
          delete cat.hasProcessFeeRows
          delete cat.subtotal
        })
      }
      dto.techDataJson = JSON.stringify(techData)
      dto.partNo = specData.partNo || null
      dto.sizeL = specData.sizeL ? Number(specData.sizeL) : null
      dto.sizeW = specData.sizeW ? Number(specData.sizeW) : null
      dto.sizeH = specData.sizeH ? Number(specData.sizeH) : null
      dto.coreCenter = specData.coreCenter ? Number(specData.coreCenter) : null
      dto.coreWidth = specData.coreWidth ? Number(specData.coreWidth) : null
      dto.coreThickness = specData.coreThickness ? Number(specData.coreThickness) : null
      dto.heatExchange = specData.heatExchange ? Number(specData.heatExchange) : null
      dto.refrigerant = specData.refrigerant || null
      dto.windSpeed = specData.windSpeed ? Number(specData.windSpeed) : null
      dto.pressureDrop = specData.pressureDrop ? Number(specData.pressureDrop) : null
    }
    // 工艺角色发送 processDataJson
    if (hasPerm('TAB_EDIT_PROCESS') || userRole === 'ADMIN') {
      if (this.data.customProcessData) {
        const cpd = JSON.parse(JSON.stringify(this.data.customProcessData))
        cpd.mode = 'custom'
        // 清除计算属性和UI状态
        ;[].concat(cpd.sections || [], cpd.energySections || [], cpd.moldFeeSections || []).forEach(function (s) {
          delete s._numCols; delete s.subtotalValue; delete s.subtotalLabel
          ;(s.rows || []).forEach(function (r) { delete r._collapsed })
        })
        dto.processDataJson = JSON.stringify(cpd)
      }
    }
    // 物流角色才发送 logisticsDataJson
    if (hasPerm('TAB_EDIT_LOGISTICS') || userRole === 'ADMIN') {
      const logisticsData = {
        selectedOrigin: this.data.selectedOrigin,
        selectedDestination: this.data.selectedDestination,
        logisticsDirection: this.data.logisticsDirection,
        totalVolume: this.data.totalVolume,
        logisticsTotalFreight: this.data.logisticsTotalFreight,
        selectedLogisticsSummary: this.data.selectedLogisticsSummary,
        scatterOptions: this.data.scatterOptions,
        truckGroups: this.data.truckGroups,
        cargoList: this.data.cargoList,
        currentSolution: this.data.currentSolution,
        totalPackFee: this.data.totalPackFee,
        destRegionDisplay: this.data.destRegionDisplay,
        originRegionDisplay: this.data.originRegionDisplay,
        transportDistance: this.data.transportDistance,
        ratedLoad: this.data.ratedLoad,
        boxSpecs: this.data.boxSpecs,
        selectedVehicleType: this.data.selectedVehicleType
      }
      dto.logisticsDataJson = JSON.stringify(logisticsData)
    }
    // 审批角色保存审批数据
    if (userRole === 'MANAGER' || userRole === 'ADMIN') {
      var ad = JSON.parse(JSON.stringify(this.data.approveData))
      delete ad.approved
      dto.approveDataJson = JSON.stringify(ad)
    }
    return dto
  },

  // 判断当前角色是否可编辑
  canEdit() {
    const { currentQuote, userRole } = this.data
    if (!currentQuote) return userRole === 'SALES' || userRole === 'ADMIN'
    const status = currentQuote.status
    if (userRole === 'SALES') return status === 'DRAFT'
    if (userRole === 'TECH') return status === 'PENDING_TECH'
    if (userRole === 'PROCESS') return status === 'PENDING_PROCESS'
    if (userRole === 'LOGISTICS') return status === 'PENDING_LOGISTICS'
    if (userRole === 'MANAGER') return status === 'PENDING_APPROVAL'
    if (userRole === 'ADMIN') return true
    return false
  },

  loadComponents() {
    api.getComponentSpecs().then(res => {
      if (res && res.length) {
        // 适配新后端数据格式：params JSON -> 平铺字段
        const components = res.map(c => ({
          id: c.id,
          name: c.name,
          material: c.material,
          spec: c.params?.spec || '',
          unit_price: c.params?.unitPrice || c.unitPrice || 0,
          unit: c.params?.unit || '个',
          remark: c.params?.remark || ''
        }))
        const componentQtys = {}
        components.forEach(c => { componentQtys[c.id] = 0 })
        this.setData({ components, componentQtys })
      }
    }).catch(() => {})
  },

  loadConfig() {
    // 从本地存储读取 diffRatio
    const storedDiffRatio = wx.getStorageSync('diffRatio')
    if (storedDiffRatio) {
      this.setData({ diffRatio: parseFloat(storedDiffRatio) || 1.0 })
    }
    // 并行加载铝价、损耗比、利润率
    Promise.all([
      api.getAluminumPrice().catch(() => null),
      api.getLossRatio().catch(() => null),
      api.getProfitRate().catch(() => null)
    ]).then(([alPrice, lossRatio, profitRate]) => {
      const updates = {}
      if (alPrice !== null && alPrice !== undefined) updates.alPrice = alPrice
      if (lossRatio !== null && lossRatio !== undefined) updates.lossRatio = lossRatio
      if (profitRate !== null && profitRate !== undefined) updates.profitRate = profitRate
      if (Object.keys(updates).length) {
        this.setData(updates)
      }
      this.updateSummary()
    })
  },

  loadProcessList() {
    return api.getProcessList().then(res => {
      const processList = (res || []).map(p => ({
        id: p.id,
        name: p.processName,
        unitType: p.unitType || '次',
        unitPrice: p.unitPrice || 0,
        sectionKey: p.sectionKey || '',
        sectionLabel: p.sectionLabel || '',
        columnsJson: p.columnsJson || ''
      }))
      const processQtys = {}
      processList.forEach(p => { processQtys[p.id] = 0 })
      this.setData({ processList, processQtys })
      this.loadProcessPresets()
    }).catch(() => {})
  },

  loadLocationLists() {
    Promise.all([
      api.getOutboundDestinations(),
      api.getInboundOrigins()
    ]).then(([destinations, origins]) => {
      this.setData({
        destinationList: destinations || [],
        originList: origins || []
      })
    }).catch(() => {})
  },

  loadSpecs() {
    Promise.all([
      api.getCollectorSpecs().catch(() => []),
      api.getFinSpecs().catch(() => []),
      api.getTubeSpecs().catch(() => [])
    ]).then(([collectors, fins, tubes]) => {
      // 适配新后端数据格式：params JSON -> 平铺字段
      const collectorSpecs = (collectors || []).map(c => ({
        id: c.id,
        name: c.name,
        area: c.params?.area || c.area,
        length: c.params?.length || c.length,
        fee: c.params?.fee || c.fee || 16.5
      }))

      const finSpecs = (fins || []).map(f => ({
        id: f.id,
        name: f.name || (f.params?.width + 'mm宽'),
        width: f.params?.width || f.width,
        waveLen: f.params?.waveLen || f.wave_len,
        waveCount: f.params?.waveCount || f.wave_count || 0,
        thickness: f.params?.thickness || 0.1,
        fee: f.params?.fee || f.fee || 7,
        partFee: f.params?.partFee || f.part_fee || 0.001
      }))

      const tubeSpecs = (tubes || []).map(t => ({
        id: t.id,
        name: t.name || ((t.params?.width || '') + 'x' + (t.params?.thickness || '')),
        meterWeight: t.params?.meterWeight || t.meter_weight,
        length: t.params?.length || t.length,
        fee: t.params?.fee || t.fee,
        zincFee: t.params?.zincFee || t.zinc_fee
      }))

      this.setData({
        collectorSpecs,
        collectorPresetNames: ['-- 手动输入 --', ...collectorSpecs.map(s => s.name)],
        finSpecs,
        finPresetNames: ['-- 手动输入 --', ...finSpecs.map(s => s.name)],
        finWidthOptions: [...new Set(finSpecs.map(s => s.width).filter(Boolean))].sort((a, b) => a - b),
        finWaveLenOptions: [...new Set(finSpecs.map(s => s.waveLen).filter(Boolean))].sort((a, b) => a - b),
        tubeSpecs,
        tubePresetNames: ['-- 手动输入 --', ...tubeSpecs.map(s => s.name)]
      })
      this.updateSummary()
    })
  },

  // 一级Tab切换
  switchMainTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ mainTab: tab })
    if (tab === 'sales') this.initSalesFromSettings()
    if (tab === 'summary') this.updateSummary()
    if (tab === 'logistics') this.calcTotalVolume()
    if (tab === 'tech') this.calcTechCosts()
    if (tab === 'prod') { this.recalcAllSections(); this.recalcSummary() }
    if (tab === 'approve') this.calcApproveData()
  },

  // 从设置页初始化销售页数据
  initSalesFromSettings() {
    const { alPrice, lossRatio, diffRatio } = this.data
    this.setData({
      'salesData.aluminumPrice': String(alPrice || ''),
      'salesData.diffRatio': String(diffRatio || '1.0'),
      'salesData.lossRatio': String(lossRatio || '1.03')
    })
  },

  // 二级Tab切换
  switchCalcSubTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ calcSubTab: tab })
  },

  // 返回首页
  goBack() {
    wx.navigateBack({ delta: 1 })
  },

  // ==================== 设置页 ====================
  onAlPriceInput(e) {
    const value = e.detail.value
    this.setData({ alPrice: value })
    // 只在有效数字时更新计算
    if (value && !isNaN(parseFloat(value))) {
      this.updateSummary()
    }
  },
  onLossRatioInput(e) {
    const value = e.detail.value
    this.setData({ lossRatio: value })
    if (value && !isNaN(parseFloat(value))) {
      this.updateSummary()
    }
  },
  onDiffRatioInput(e) {
    const value = e.detail.value
    this.setData({ diffRatio: value })
  },
  onProfitRateInput(e) {
    const value = e.detail.value
    this.setData({ profitRate: value })
    if (value && !isNaN(parseFloat(value))) {
      this.updateSummary()
    }
  },

  saveConfig() {
    const alPriceNum = parseFloat(this.data.alPrice)
    if (isNaN(alPriceNum)) {
      wx.showToast({ title: '请输入有效铝价', icon: 'none' })
      return
    }
    wx.showLoading({ title: '保存中...' })
    api.updateAluminumPrice(alPriceNum).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  },

  copyAlPriceLink() {
    wx.setClipboardData({
      data: 'https://www.ccmn.cn/',
      success: () => wx.showToast({ title: '链接已复制', icon: 'none', duration: 2000 })
    })
  },

  // ==================== 汇总页 - 规格选择（购物车模式） ====================
  // 打开规格选择弹窗
  openSpecPicker(e) {
    const type = e.currentTarget.dataset.type
    const { collectorSpecs, finSpecs, tubeSpecs } = this.data
    let list = []
    if (type === 'collector') list = collectorSpecs
    else if (type === 'fin') list = finSpecs
    else if (type === 'tube') list = tubeSpecs
    this.setData({ showSpecPicker: true, specPickerType: type, specPickerList: list })
  },

  closeSpecPicker() {
    this.setData({ showSpecPicker: false })
  },

  // 选择规格添加到购物车
  onSelectSpec(e) {
    const { idx, isZinc } = e.currentTarget.dataset
    const { specPickerType, specPickerList, cartCollectors, cartFins, cartTubes, alPrice, lossRatio } = this.data
    const spec = specPickerList[idx]
    if (!spec) return

    const alPriceNum = parseFloat(alPrice) || 0
    const lossRatioNum = parseFloat(lossRatio) || 1

    if (specPickerType === 'collector') {
      const result = calc.calcCollector(spec.area, spec.length, spec.fee, alPriceNum, lossRatioNum)
      const unitPrice = parseFloat(result.unitPrice.toFixed(2))
      cartCollectors.push({
        specId: spec.id, name: spec.name, unitPrice: unitPrice, qty: 1, subtotal: unitPrice
      })
      this.setData({ cartCollectors, showSpecPicker: false })
    } else if (specPickerType === 'fin') {
      const totalWaveLen = spec.waveLen * spec.waveCount
      const result = calc.calcFin(spec.width, totalWaveLen, spec.thickness, spec.fee, spec.partFee, alPriceNum)
      const unitPrice = parseFloat(result.unitPrice.toFixed(2))
      cartFins.push({
        specId: spec.id, name: spec.name, unitPrice: unitPrice, qty: 1, subtotal: unitPrice
      })
      this.setData({ cartFins, showSpecPicker: false })
    } else if (specPickerType === 'tube') {
      const result = calc.calcTube(spec.meterWeight, spec.length, spec.fee, spec.zincFee, false, alPriceNum)
      const unitPrice = parseFloat((isZinc ? result.zincPrice : result.normalPrice).toFixed(2))
      cartTubes.push({
        specId: spec.id, name: spec.name + (isZinc ? '(喷锌)' : ''), isZinc: !!isZinc,
        unitPrice: unitPrice, qty: 1, subtotal: unitPrice
      })
      this.setData({ cartTubes, showSpecPicker: false })
    }
    this.updateSummary()
  },

  // 修改购物车数量
  onCartQtyInput(e) {
    const { type, idx } = e.currentTarget.dataset
    const qty = parseInt(e.detail.value) || 0
    const key = type === 'collector' ? 'cartCollectors' : type === 'fin' ? 'cartFins' : 'cartTubes'
    const cart = this.data[key]
    if (cart[idx]) {
      cart[idx].qty = qty
      cart[idx].subtotal = parseFloat((cart[idx].unitPrice * qty).toFixed(2))
      this.setData({ [key]: cart })
      this.updateSummary()
    }
  },

  // 购物车数量减少
  onCartQtyMinus(e) {
    const { type, idx } = e.currentTarget.dataset
    const key = type === 'collector' ? 'cartCollectors' : type === 'fin' ? 'cartFins' : 'cartTubes'
    const cart = this.data[key]
    if (cart[idx] && cart[idx].qty > 1) {
      cart[idx].qty -= 1
      cart[idx].subtotal = parseFloat((cart[idx].unitPrice * cart[idx].qty).toFixed(2))
      this.setData({ [key]: cart })
      this.updateSummary()
    }
  },

  // 购物车数量增加
  onCartQtyPlus(e) {
    const { type, idx } = e.currentTarget.dataset
    const key = type === 'collector' ? 'cartCollectors' : type === 'fin' ? 'cartFins' : 'cartTubes'
    const cart = this.data[key]
    if (cart[idx]) {
      cart[idx].qty += 1
      cart[idx].subtotal = parseFloat((cart[idx].unitPrice * cart[idx].qty).toFixed(2))
      this.setData({ [key]: cart })
      this.updateSummary()
    }
  },

  // 删除购物车项
  onCartDelete(e) {
    const { type, idx } = e.currentTarget.dataset
    const key = type === 'collector' ? 'cartCollectors' : type === 'fin' ? 'cartFins' : 'cartTubes'
    const cart = this.data[key]
    cart.splice(idx, 1)
    this.setData({ [key]: cart })
    this.updateSummary()
  },

  // 购物车规格名称聚焦
  onCartNameFocus(e) {
    const { type, idx } = e.currentTarget.dataset
    const key = type === 'collector' ? 'cartCollectors' : type === 'fin' ? 'cartFins' : 'cartTubes'
    const cart = this.data[key]
    const specsKey = type === 'collector' ? 'collectorSpecs' : type === 'fin' ? 'finSpecs' : 'tubeSpecs'
    this.setData({
      cartEditingType: type,
      cartEditingIdx: idx,
      cartOriginalName: cart[idx].name,
      cartSuggestList: this.data[specsKey]
    })
  },

  // 购物车规格名称输入
  onCartNameInput(e) {
    const { type, idx } = e.currentTarget.dataset
    const value = e.detail.value
    const specsKey = type === 'collector' ? 'collectorSpecs' : type === 'fin' ? 'finSpecs' : 'tubeSpecs'
    const specs = this.data[specsKey]
    const filtered = value ? specs.filter(s => s.name.toLowerCase().includes(value.toLowerCase())) : specs
    this.setData({ cartSuggestList: filtered })
  },

  // 购物车规格名称失焦
  onCartNameBlur(e) {
    const { type, idx } = e.currentTarget.dataset
    const value = e.detail.value
    const specsKey = type === 'collector' ? 'collectorSpecs' : type === 'fin' ? 'finSpecs' : 'tubeSpecs'
    const specs = this.data[specsKey]
    const matched = specs.find(s => s.name === value)
    // 延迟关闭，让点击事件先触发
    setTimeout(() => {
      if (!matched) {
        // 输入的不是有效规格，恢复原名称
        const key = type === 'collector' ? 'cartCollectors' : type === 'fin' ? 'cartFins' : 'cartTubes'
        const cart = this.data[key]
        if (cart[idx]) {
          cart[idx].name = this.data.cartOriginalName
          this.setData({ [key]: cart })
        }
      }
      this.setData({ cartEditingType: '', cartEditingIdx: -1, cartSuggestList: [] })
    }, 200)
  },

  // 选择补全建议
  onSelectCartSuggest(e) {
    const { type, idx, specId } = e.currentTarget.dataset
    const specsKey = type === 'collector' ? 'collectorSpecs' : type === 'fin' ? 'finSpecs' : 'tubeSpecs'
    const key = type === 'collector' ? 'cartCollectors' : type === 'fin' ? 'cartFins' : 'cartTubes'
    const specs = this.data[specsKey]
    const cart = this.data[key]
    const spec = specs.find(s => s.id === specId)
    if (!spec || !cart[idx]) return

    // 计算新规格的单价
    const { alPrice } = this.data
    let unitPrice = 0
    if (type === 'collector') {
      const result = calc.calcCollector(spec.area, spec.length, alPrice, spec.fee)
      unitPrice = parseFloat(result.unitPrice.toFixed(2))
    } else if (type === 'fin') {
      const result = calc.calcFin(spec.width, spec.waveLen, spec.waveCount, spec.thickness, alPrice, spec.fee, spec.partFee)
      unitPrice = parseFloat(result.unitPrice.toFixed(2))
    } else if (type === 'tube') {
      const isZinc = cart[idx].isZinc
      const result = calc.calcTube(spec.meterWeight, spec.length, alPrice, isZinc ? spec.zincFee : spec.fee)
      unitPrice = parseFloat(result.unitPrice.toFixed(2))
    }

    // 更新购物车项
    cart[idx].specId = spec.id
    cart[idx].name = spec.name
    cart[idx].unitPrice = unitPrice
    cart[idx].subtotal = parseFloat((unitPrice * cart[idx].qty).toFixed(2))

    this.setData({
      [key]: cart,
      cartEditingType: '',
      cartEditingIdx: -1,
      cartSuggestList: []
    })
    this.updateSummary()
  },

  // 更新汇总计算
  updateSummary() {
    const { cartCollectors, cartFins, cartTubes, mfgCost, freight, components, componentQtys, processList, processQtys, profitRate } = this.data
    const mfgCostNum = parseFloat(mfgCost) || 0
    const freightNum = parseFloat(freight) || 0
    const profitRateNum = parseFloat(profitRate) || 0

    const collectorCost = cartCollectors.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    const finCost = cartFins.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    const tubeCost = cartTubes.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    const materialCost = collectorCost + finCost + tubeCost

    // 通用部件成本
    let componentCost = 0
    const componentSubtotals = {}
    components.forEach(c => {
      const qty = componentQtys[c.id] || 0
      const subtotal = c.unit_price * qty
      componentSubtotals[c.id] = subtotal.toFixed(2)
      componentCost += subtotal
    })

    // 工序成本
    let processCost = 0
    const processSubtotals = {}
    processList.forEach(p => {
      const qty = processQtys[p.id] || 0
      const subtotal = p.unitPrice * qty
      processSubtotals[p.id] = subtotal.toFixed(2)
      processCost += subtotal
    })

    const totalMaterial = materialCost + componentCost
    const profit = (totalMaterial + mfgCostNum + processCost) * profitRateNum
    const finalPrice = totalMaterial + mfgCostNum + processCost + profit + freightNum

    this.setData({
      componentSubtotals,
      processSubtotals,
      processCost: processCost.toFixed(2),
      summaryData: {
        materialCost: materialCost.toFixed(2),
        componentCost: componentCost.toFixed(2),
        processCost: processCost.toFixed(2),
        profit: profit.toFixed(2),
        finalPrice: finalPrice.toFixed(2)
      }
    })
  },

  // 费用输入（保留原始字符串，支持小数点输入）
  onMfgCostInput(e) {
    const value = e.detail.value
    this.setData({ mfgCost: value })
    if (value === '' || !isNaN(parseFloat(value))) {
      this.updateSummary()
    }
  },
  onFreightInput(e) {
    const value = e.detail.value
    this.setData({ freight: value })
    if (value === '' || !isNaN(parseFloat(value))) {
      this.updateSummary()
      this.calcPerPartFreight()
    }
  },

  // ==================== 运输信息 ====================
  onTransportDistanceInput(e) {
    this.data.transportDistance = e.detail.value
  },
  onRatedLoadInput(e) {
    this.data.ratedLoad = e.detail.value
  },
  addBoxSpec() {
    const boxSpecs = this.data.boxSpecs.concat([
      { length: '', width: '', height: '', volume: '', partsPerBox: '', quantity: 1 }
    ])
    this.setData({ boxSpecs })
  },
  deleteBoxSpec(e) {
    const idx = e.currentTarget.dataset.idx
    const boxSpecs = this.data.boxSpecs.filter((_, i) => i !== idx)
    this.setData({ boxSpecs })
    this.calcPerPartFreight()
  },
  onBoxSpecInput(e) {
    const { idx, field } = e.currentTarget.dataset
    const value = e.detail.value
    // 直接修改不触发重渲染，避免 input 失焦
    this.data.boxSpecs[idx][field] = value
    if (field === 'length' || field === 'width' || field === 'height') {
      this.calcBoxVolume(idx)
    }
    if (field === 'partsPerBox' || field === 'quantity') {
      this.calcPerPartFreight()
    }
  },
  calcBoxVolume(idx) {
    const spec = this.data.boxSpecs[idx]
    const l = parseFloat(spec.length) || 0
    const w = parseFloat(spec.width) || 0
    const h = parseFloat(spec.height) || 0
    const volume = l > 0 && w > 0 && h > 0 ? (l / 1000 * w / 1000 * h / 1000) : 0
    this.setData({
      ['boxSpecs[' + idx + '].volume']: volume ? parseFloat(volume.toFixed(4)) : ''
    })
    this.calcPerPartFreight()
  },
  calcPerPartFreight() {
    const { boxSpecs, freight } = this.data
    let totalParts = 0
    let totalBoxVolume = 0
    boxSpecs.forEach(spec => {
      const qty = parseInt(spec.quantity) || 0
      const ppb = parseInt(spec.partsPerBox) || 0
      const vol = parseFloat(spec.volume) || 0
      totalParts += qty * ppb
      totalBoxVolume += qty * vol
    })
    const freightNum = parseFloat(freight) || 0
    const perPart = totalParts > 0 ? parseFloat((freightNum / totalParts).toFixed(2)) : ''
    const updates = { totalParts, perPartFreight: perPart }
    if (boxSpecs.length > 0) {
      updates.totalVolume = totalBoxVolume > 0 ? parseFloat(totalBoxVolume.toFixed(4)) : ''
    }
    this.setData(updates)
  },

  // 通用部件数量
  onComponentQtyInput(e) {
    const id = e.currentTarget.dataset.id
    const qty = parseInt(e.detail.value) || 0
    const key = 'componentQtys.' + id
    this.setData({ [key]: qty })
    this.updateSummary()
  },

  // 工序数量输入
  onProcessQtyInput(e) {
    const id = e.currentTarget.dataset.id
    const qty = parseInt(e.detail.value) || 0
    const key = 'processQtys.' + id
    this.setData({ [key]: qty })
    this.updateSummary()
  },

  // ==================== 物流查询 ====================

  initRegionPicker() {
    const range = regionPicker.buildPickerRange(0, 0)
    this.setData({
      destRegionRange: range, destRegionIndex: [0, 0, 0],
      originRegionRange: range, originRegionIndex: [0, 0, 0]
    })
  },

  _restoreRegionPicker(ld) {
    const direction = ld.logisticsDirection || 'outbound'
    // 目的地回显
    const destCity = direction === 'inbound' ? null : ld.selectedDestination
    if (destCity) {
      const found = regionPicker.findIndexesByCity(destCity)
      if (found) {
        const range = regionPicker.buildPickerRange(found.provinceIdx, found.cityIdx)
        const display = ld.destRegionDisplay || (range[0][found.provinceIdx] + ' ' + range[1][found.cityIdx])
        this.setData({ destRegionRange: range, destRegionIndex: [found.provinceIdx, found.cityIdx, found.districtIdx], destRegionDisplay: display, destSearchText: display })
      }
    }
    // 出发地回显
    const originCity = direction === 'outbound' ? null : ld.selectedOrigin
    if (originCity && originCity !== '柳州') {
      const found = regionPicker.findIndexesByCity(originCity)
      if (found) {
        const range = regionPicker.buildPickerRange(found.provinceIdx, found.cityIdx)
        const display = ld.originRegionDisplay || (range[0][found.provinceIdx] + ' ' + range[1][found.cityIdx])
        this.setData({ originRegionRange: range, originRegionIndex: [found.provinceIdx, found.cityIdx, found.districtIdx], originRegionDisplay: display, originSearchText: display })
      }
    }
  },

  onDestColumnChange(e) {
    const { column, value } = e.detail
    const idx = [...this.data.destRegionIndex]
    idx[column] = value
    if (column === 0) { idx[1] = 0; idx[2] = 0 }
    if (column <= 1) { idx[2] = 0 }
    const range = regionPicker.buildPickerRange(idx[0], idx[1])
    this.setData({ destRegionRange: range, destRegionIndex: idx })
  },

  onDestRegionChange(e) {
    const idx = e.detail.value.map(Number)
    const range = this.data.destRegionRange
    const province = range[0][idx[0]] || ''
    const city = range[1][idx[1]] || ''
    const district = range[2][idx[2]] || ''
    const dest = regionPicker.normalizeCityName(city)
    if (dest !== this.data.selectedDestination) {
      this.clearLogisticsSelection()
    }
    this.setData({
      destRegionIndex: idx,
      destRegionDisplay: province + ' ' + city + ' ' + district,
      selectedDestination: dest,
      destSearchText: province + ' ' + city,
      destSearchResults: [],
      showDestSuggest: false
    })
    this.updateCanQueryLogistics()
  },

  onOriginColumnChange(e) {
    const { column, value } = e.detail
    const idx = [...this.data.originRegionIndex]
    idx[column] = value
    if (column === 0) { idx[1] = 0; idx[2] = 0 }
    if (column <= 1) { idx[2] = 0 }
    const range = regionPicker.buildPickerRange(idx[0], idx[1])
    this.setData({ originRegionRange: range, originRegionIndex: idx })
  },

  onOriginRegionChange(e) {
    const idx = e.detail.value.map(Number)
    const range = this.data.originRegionRange
    const province = range[0][idx[0]] || ''
    const city = range[1][idx[1]] || ''
    const district = range[2][idx[2]] || ''
    const origin = regionPicker.normalizeCityName(city)
    if (origin !== this.data.selectedOrigin) {
      this.clearLogisticsSelection()
    }
    this.setData({
      originRegionIndex: idx,
      originRegionDisplay: province + ' ' + city + ' ' + district,
      selectedOrigin: origin,
      originSearchText: province + ' ' + city,
      originSearchResults: [],
      showOriginSuggest: false
    })
    this.updateCanQueryLogistics()
  },

  // 目的地搜索输入
  onDestSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ destSearchText: keyword })
    if (!keyword.trim()) {
      this.setData({ destSearchResults: [], showDestSuggest: false })
      return
    }
    const results = regionPicker.searchCities(keyword)
    this.setData({ destSearchResults: results, showDestSuggest: results.length > 0 })
  },

  // 选择目的地搜索结果
  onSelectDestSearchCity(e) {
    const idx = e.currentTarget.dataset.idx
    const item = this.data.destSearchResults[idx]
    if (!item) return
    const range = regionPicker.buildPickerRange(item.provinceIdx, item.cityIdx)
    const dest = regionPicker.normalizeCityName(item.city)
    if (dest !== this.data.selectedDestination) {
      this.clearLogisticsSelection()
    }
    this.setData({
      destRegionRange: range,
      destRegionIndex: [item.provinceIdx, item.cityIdx, 0],
      destRegionDisplay: item.label,
      selectedDestination: dest,
      destSearchText: item.label,
      destSearchResults: [],
      showDestSuggest: false
    })
    this.updateCanQueryLogistics()
  },

  // 出发地搜索输入
  onOriginSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ originSearchText: keyword })
    if (!keyword.trim()) {
      this.setData({ originSearchResults: [], showOriginSuggest: false })
      return
    }
    const results = regionPicker.searchCities(keyword)
    this.setData({ originSearchResults: results, showOriginSuggest: results.length > 0 })
  },

  // 选择出发地搜索结果
  onSelectOriginSearchCity(e) {
    const idx = e.currentTarget.dataset.idx
    const item = this.data.originSearchResults[idx]
    if (!item) return
    const range = regionPicker.buildPickerRange(item.provinceIdx, item.cityIdx)
    const origin = regionPicker.normalizeCityName(item.city)
    if (origin !== this.data.selectedOrigin) {
      this.clearLogisticsSelection()
    }
    this.setData({
      originRegionRange: range,
      originRegionIndex: [item.provinceIdx, item.cityIdx, 0],
      originRegionDisplay: item.label,
      selectedOrigin: origin,
      originSearchText: item.label,
      originSearchResults: [],
      showOriginSuggest: false
    })
    this.updateCanQueryLogistics()
  },

  // 交换出发地和目的地
  swapLocations() {
    const { selectedOrigin, selectedDestination, logisticsDirection,
            originRegionDisplay, destRegionDisplay,
            originRegionIndex, destRegionIndex,
            originRegionRange, destRegionRange,
            originSearchText, destSearchText } = this.data
    const newDirection = logisticsDirection === 'outbound' ? 'inbound' : 'outbound'
    this.clearLogisticsSelection()
    this.setData({
      selectedOrigin: selectedDestination || '柳州',
      selectedDestination: selectedOrigin === '柳州' ? '' : selectedOrigin,
      logisticsDirection: newDirection,
      originRegionDisplay: destRegionDisplay,
      destRegionDisplay: selectedOrigin === '柳州' ? '' : originRegionDisplay,
      originRegionIndex: destRegionIndex,
      destRegionIndex: selectedOrigin === '柳州' ? [0, 0, 0] : originRegionIndex,
      originRegionRange: destRegionRange,
      destRegionRange: selectedOrigin === '柳州' ? regionPicker.buildPickerRange(0, 0) : originRegionRange,
      originSearchText: destSearchText || '',
      destSearchText: selectedOrigin === '柳州' ? '' : (originSearchText || ''),
      destSearchResults: [], showDestSuggest: false,
      originSearchResults: [], showOriginSuggest: false
    })
    this.updateCanQueryLogistics()
  },

  // 更新是否可以查询运费
  updateCanQueryLogistics() {
    const { selectedOrigin, selectedDestination, totalVolume } = this.data
    const canQuery = !!(selectedOrigin && selectedDestination && totalVolume && parseFloat(totalVolume) > 0)
    this.setData({ canQueryLogistics: canQuery })
  },

  // 清除物流选择（路线变化时调用）
  clearLogisticsSelection() {
    this.setData({
      freight: 0,
      selectedLogisticsSummary: '',
      selectedVehicleType: '',
      lastQueryRoute: null,
      scatterOptions: [],
      truckGroups: [],
      logisticsPrices: [],
      logisticsTotalFreight: 0,
      totalVolume: '',
      allocatedVolume: 0,
      showRecommend: false,
      recommendPlans: []
    })
    this.updateSummary()
  },

  // 查询物流价格并打开弹窗
  queryLogistics() {
    const { selectedOrigin, selectedDestination, logisticsDirection, lastQueryRoute, totalVolume } = this.data

    // 验证必填项
    if (!selectedOrigin) {
      wx.showToast({ title: '请填写出发地', icon: 'none' })
      return
    }
    if (!selectedDestination) {
      wx.showToast({ title: '请填写目的地', icon: 'none' })
      return
    }
    if (!totalVolume || parseFloat(totalVolume) <= 0) {
      wx.showToast({ title: '请填写总立方数', icon: 'none' })
      return
    }

    // 判断路线是否变化
    const currentRoute = {
      origin: selectedOrigin,
      destination: selectedDestination,
      direction: logisticsDirection
    }

    // 路线相同且已有数据，直接打开弹窗
    if (lastQueryRoute &&
        lastQueryRoute.origin === currentRoute.origin &&
        lastQueryRoute.destination === currentRoute.destination &&
        lastQueryRoute.direction === currentRoute.direction &&
        this.data.logisticsPrices.length > 0) {
      this.setData({ showLogisticsModal: true })
      return
    }

    // 路线变化或首次查询，重新请求数据
    this.setData({ logisticsLoading: true })

    const apiCall = logisticsDirection === 'outbound'
      ? api.getOutboundPrices(selectedDestination)
      : api.getInboundPrices(selectedOrigin)

    apiCall.then(res => {
      if (res && res.length) {
        const { scatterOptions, truckGroups } = this.buildLogisticsOptions(res)
        this.setData({
          logisticsPrices: res,
          scatterOptions,
          truckGroups,
          logisticsTotalFreight: 0,
          showLogisticsModal: true,
          logisticsLoading: false,
          lastQueryRoute: currentRoute,
          // 路线变化时清空已选方案显示
          selectedLogisticsSummary: '',
          allocatedVolume: 0
        }, () => {
          // 自动展开智能推荐面板（但不自动勾选）
          this.smartRecommend(false)
        })
      } else {
        this.setData({ logisticsLoading: false })
        wx.showToast({ title: '该路线暂无物流数据', icon: 'none' })
      }
    }).catch(() => {
      this.setData({ logisticsLoading: false })
      wx.showToast({ title: '查询失败', icon: 'none' })
    })
  },

  // 构建物流选项数据（返回数据而非直接setData）
  buildLogisticsOptions(prices) {
    const { selectedDestination } = this.data
    const isToGuangdong = selectedDestination && (selectedDestination.includes('东莞') || selectedDestination.includes('台达'))

    // 散货选项
    const scatterOptions = []
    prices.forEach(item => {
      if (item.priceScatter) {
        // 计算附加费：桂鑫送东莞使用从备注解析的dongguanSurcharge，否则用deliveryFee
        let surcharge = item.deliveryFee ? parseFloat(item.deliveryFee) : 0
        if (item.companyName === '桂鑫' && isToGuangdong && item.dongguanSurcharge) {
          surcharge = parseFloat(item.dongguanSurcharge)
        }

        scatterOptions.push({
          company: item.companyName,
          price: parseFloat(item.priceScatter),
          minCharge: item.minChargeVal ? parseFloat(item.minChargeVal) : 0,
          surcharge: surcharge,  // 统一用surcharge表示附加费
          remark: item.scatterRemark || '',
          checked: false,
          volume: '',
          subtotal: 0
        })
      }
    })
    // 按价格排序
    scatterOptions.sort((a, b) => a.price - b.price)

    // 整车选项（按车型分组）
    const truckTypes = [
      { key: 'price42m', label: '4.2米整车' },
      { key: 'price68m', label: '6.8米整车' },
      { key: 'price96m', label: '9.6米整车' },
      { key: 'price135m', label: '13.5米整车' },
      { key: 'price175m', label: '17.5米整车' },
      { key: 'price16mBox', label: '16米厢车' }
    ]

    const truckGroups = []
    truckTypes.forEach(type => {
      const options = []
      prices.forEach(item => {
        if (item[type.key]) {
          options.push({
            company: item.companyName,
            price: parseFloat(item[type.key]),
            checked: false,
            qty: '',
            subtotal: 0
          })
        }
      })
      if (options.length) {
        // 按价格排序
        options.sort((a, b) => a.price - b.price)
        truckGroups.push({ type: type.label, options })
      }
    })

    return { scatterOptions, truckGroups }
  },

  // 散货勾选
  onScatterCheck(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    const key = `scatterOptions[${idx}].checked`
    const checked = !this.data.scatterOptions[idx].checked
    this.setData({ [key]: checked })
    if (checked) {
      const option = this.data.scatterOptions[idx]
      const totalVolume = parseFloat(this.data.totalVolume) || 1
      let baseCost = 1 * option.price
      if (option.minCharge && baseCost < option.minCharge) {
        baseCost = option.minCharge
      }
      let subtotal = baseCost
      if (totalVolume < 10 && option.surcharge) {
        subtotal = baseCost + option.surcharge
      }
      this.setData({
        [`scatterOptions[${idx}].volume`]: 1,
        [`scatterOptions[${idx}].subtotal`]: parseFloat(subtotal.toFixed(2))
      })
    } else {
      this.setData({
        [`scatterOptions[${idx}].volume`]: '',
        [`scatterOptions[${idx}].subtotal`]: 0
      })
    }
    this.calcLogisticsTotal()
  },

  // 散货体积输入
  onScatterVolumeInput(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    const volume = e.detail.value
    const option = this.data.scatterOptions[idx]
    const volumeNum = parseFloat(volume || 0)
    const totalVolume = parseFloat(this.data.totalVolume) || volumeNum

    // 计算散货费用：立方数 × 单价
    let baseCost = volumeNum * option.price

    // 如果有最低收费，取较大值
    if (option.minCharge && baseCost < option.minCharge && baseCost > 0) {
      baseCost = option.minCharge
    }

    // 附加费判断：只有总立方<10方才加附加费
    let subtotal = baseCost
    if (volumeNum > 0 && totalVolume < 10 && option.surcharge) {
      subtotal = baseCost + option.surcharge
    }

    this.setData({
      [`scatterOptions[${idx}].volume`]: volume,
      [`scatterOptions[${idx}].subtotal`]: parseFloat(subtotal.toFixed(2))
    })
    this.calcAllocatedVolume()
    this.calcLogisticsTotal()
  },

  // 散货小计手动编辑
  onScatterSubtotalInput(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    const subtotal = parseFloat(e.detail.value) || 0
    this.setData({
      [`scatterOptions[${idx}].subtotal`]: subtotal
    })
    this.calcLogisticsTotal()
  },

  // 散货立方数减少
  onScatterVolumeMinus(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    const option = this.data.scatterOptions[idx]
    const currentVolume = parseFloat(option.volume) || 0
    if (currentVolume <= 0) return
    const newVolume = Math.max(0, currentVolume - 1)
    this.updateScatterVolume(idx, newVolume)
  },

  // 散货立方数增加
  onScatterVolumePlus(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    const option = this.data.scatterOptions[idx]
    const currentVolume = parseFloat(option.volume) || 0
    const newVolume = currentVolume + 1
    this.updateScatterVolume(idx, newVolume)
  },

  // 更新散货立方数并计算费用
  updateScatterVolume(idx, volumeNum) {
    const option = this.data.scatterOptions[idx]
    const totalVolume = parseFloat(this.data.totalVolume) || volumeNum

    let baseCost = volumeNum * option.price
    if (option.minCharge && baseCost < option.minCharge && baseCost > 0) {
      baseCost = option.minCharge
    }
    let subtotal = baseCost
    if (volumeNum > 0 && totalVolume < 10 && option.surcharge) {
      subtotal = baseCost + option.surcharge
    }

    this.setData({
      [`scatterOptions[${idx}].volume`]: volumeNum > 0 ? volumeNum.toString() : '',
      [`scatterOptions[${idx}].subtotal`]: parseFloat(subtotal.toFixed(2))
    })
    this.calcAllocatedVolume()
    this.calcLogisticsTotal()
  },

  // 整车勾选（勾选时默认1辆）
  onTruckCheck(e) {
    const { gidx, oidx } = e.currentTarget.dataset
    const key = `truckGroups[${gidx}].options[${oidx}].checked`
    const checked = !this.data.truckGroups[gidx].options[oidx].checked
    const option = this.data.truckGroups[gidx].options[oidx]

    if (checked) {
      // 勾选时默认1辆
      const subtotal = option.price
      this.setData({
        [key]: checked,
        [`truckGroups[${gidx}].options[${oidx}].qty`]: 1,
        [`truckGroups[${gidx}].options[${oidx}].subtotal`]: parseFloat(subtotal.toFixed(2))
      })
    } else {
      // 取消勾选
      this.setData({
        [key]: checked,
        [`truckGroups[${gidx}].options[${oidx}].qty`]: '',
        [`truckGroups[${gidx}].options[${oidx}].subtotal`]: 0
      })
    }
    this.calcLogisticsTotal()
  },

  // 整车辆数输入
  onTruckQtyInput(e) {
    const { gidx, oidx } = e.currentTarget.dataset
    const qty = e.detail.value
    const option = this.data.truckGroups[gidx].options[oidx]
    const subtotal = parseInt(qty || 0) * option.price
    this.setData({
      [`truckGroups[${gidx}].options[${oidx}].qty`]: qty,
      [`truckGroups[${gidx}].options[${oidx}].subtotal`]: parseFloat(subtotal.toFixed(2))
    })
    this.calcLogisticsTotal()
  },

  // 整车小计手动编辑
  onTruckSubtotalInput(e) {
    const { gidx, oidx } = e.currentTarget.dataset
    const subtotal = parseFloat(e.detail.value) || 0
    this.setData({
      [`truckGroups[${gidx}].options[${oidx}].subtotal`]: subtotal
    })
    this.calcLogisticsTotal()
  },

  // 计算物流总费用
  calcLogisticsTotal() {
    let total = 0
    const summaryParts = []

    // 散货
    this.data.scatterOptions.forEach(opt => {
      if (opt.checked && opt.subtotal > 0) {
        total += opt.subtotal
        summaryParts.push(`${opt.company}散货${opt.volume}m³`)
      }
    })

    // 整车
    this.data.truckGroups.forEach(group => {
      group.options.forEach(opt => {
        if (opt.checked && opt.subtotal > 0) {
          total += opt.subtotal
          summaryParts.push(`${opt.company}${group.type}×${opt.qty}`)
        }
      })
    })

    this.setData({
      logisticsTotalFreight: parseFloat(total.toFixed(2)),
      selectedLogisticsSummary: summaryParts.join(' + ') || ''
    })
  },

  // 确认物流选择
  confirmLogistics() {
    const { scatterOptions, truckGroups, logisticsTotalFreight } = this.data

    // 检查是否有任何选中的方案
    const hasScatterSelected = scatterOptions.some(opt => opt.checked)
    const hasTruckSelected = truckGroups.some(group => group.options.some(opt => opt.checked))

    if (!hasScatterSelected && !hasTruckSelected) {
      wx.showToast({ title: '请选择物流方案', icon: 'none' })
      return
    }

    // 提取车辆类型
    const vehicleTypes = []
    if (hasScatterSelected) vehicleTypes.push('散货')
    truckGroups.forEach(group => {
      if (group.options.some(opt => opt.checked)) vehicleTypes.push(group.type)
    })

    this.setData({
      freight: logisticsTotalFreight,
      showLogisticsModal: false,
      selectedVehicleType: vehicleTypes.join('、')
    })
    this.updateSummary()
    this.calcPerPartFreight()
  },

  // 关闭物流弹窗
  closeLogisticsModal() {
    this.setData({ showLogisticsModal: false })
  },

  // 空函数，用于阻止事件冒泡
  noop() {},

  // 总立方数输入
  onTotalVolumeInput(e) {
    this.setData({
      totalVolume: e.detail.value,
      showRecommend: false,
      recommendPlans: []
    })
    this.calcAllocatedVolume()
    this.updateCanQueryLogistics()
  },

  // 车型容量定义（方）
  getTruckCapacities() {
    return [
      { key: 'price42m', label: '4.2米', capacity: 15 },
      { key: 'price68m', label: '6.8米', capacity: 30 },
      { key: 'price96m', label: '9.6米', capacity: 55 },
      { key: 'price135m', label: '13.5米', capacity: 78 },
      { key: 'price16mBox', label: '16米厢车', capacity: 100 },
      { key: 'price175m', label: '17.5米', capacity: 110 }
    ]
  },

  // 收起推荐方案
  collapseRecommend() {
    this.setData({ showRecommend: false })
  },

  // 智能推荐
  smartRecommend(autoApply = false) {
    const totalVolume = parseFloat(this.data.totalVolume) || 0
    if (totalVolume <= 0) {
      wx.showToast({ title: '请输入总立方数', icon: 'none' })
      return
    }

    const { scatterOptions, truckGroups } = this.data
    if (!scatterOptions.length && !truckGroups.length) {
      wx.showToast({ title: '请先查询物流价格', icon: 'none' })
      return
    }

    const plans = []
    const truckCapacities = this.getTruckCapacities()

    // 获取所有散货选项（包含附加费信息）
    const scatterPrices = scatterOptions.map(opt => ({
      company: opt.company,
      price: opt.price,
      minCharge: opt.minCharge || 0,
      surcharge: opt.surcharge || 0
    })).sort((a, b) => a.price - b.price)
    const bestScatter = scatterPrices[0]

    // 计算散货费用的辅助函数
    // isCombinedPlan: 是否为组合方案的散货部分（组合方案豁免附加费）
    const calcScatterCost = (volume, scatter, isCombinedPlan = false) => {
      if (!scatter || volume <= 0) return 0
      let baseCost = volume * scatter.price
      if (scatter.minCharge && baseCost < scatter.minCharge) {
        baseCost = scatter.minCharge
      }
      // 附加费判断：总立方<10方 且 不是组合方案 才加附加费
      if (!isCombinedPlan && totalVolume < 10 && scatter.surcharge) {
        baseCost += scatter.surcharge
      }
      return baseCost
    }

    // 方案1：纯散货
    if (bestScatter) {
      const scatterCost = calcScatterCost(totalVolume, bestScatter, false)
      const hasSurcharge = totalVolume < 10 && bestScatter.surcharge > 0
      plans.push({
        type: 'scatter',
        description: `散货 ${totalVolume}m³`,
        detail: `${bestScatter.company}${hasSurcharge ? '（含附加费¥' + bestScatter.surcharge + '）' : ''}`,
        totalCost: scatterCost,
        scatterVolume: totalVolume,
        scatterCompany: bestScatter.company,
        trucks: []
      })
    }

    // 方案2-N：整车方案（总立方>10方时才考虑）
    if (totalVolume > 10) {
      // 遍历每种车型，找最便宜的物流公司
      truckCapacities.forEach(truck => {
        const group = truckGroups.find(g => g.type.includes(truck.label))
        if (!group || !group.options.length) return

        const sortedOptions = [...group.options].sort((a, b) => a.price - b.price)
        const bestOption = sortedOptions[0]
        const truckCount = Math.ceil(totalVolume / truck.capacity)
        const totalCost = truckCount * bestOption.price

        plans.push({
          type: 'truck',
          description: `${truck.label} × ${truckCount}辆`,
          detail: `${bestOption.company}，容量${truck.capacity}方/辆`,
          totalCost: totalCost,
          scatterVolume: 0,
          scatterCompany: '',
          trucks: [{
            type: truck.label,
            key: truck.key,
            company: bestOption.company,
            count: truckCount,
            price: bestOption.price
          }]
        })

        // 整车 + 散货组合（剩余部分用散货，组合方案散货部分豁免附加费）
        if (bestScatter) {
          const fullTrucks = Math.floor(totalVolume / truck.capacity)
          const remainder = totalVolume - fullTrucks * truck.capacity

          if (fullTrucks > 0 && remainder > 0) {
            // 组合方案：散货部分豁免附加费（因为总立方≥10方）
            const scatterCost = calcScatterCost(remainder, bestScatter, true)
            const truckCost = fullTrucks * bestOption.price
            const combinedCost = truckCost + scatterCost

            plans.push({
              type: 'combined',
              description: `${truck.label} × ${fullTrucks}辆 + 散货 ${remainder.toFixed(1)}m³`,
              detail: `${bestOption.company} + ${bestScatter.company}散货`,
              totalCost: combinedCost,
              scatterVolume: remainder,
              scatterCompany: bestScatter.company,
              trucks: [{
                type: truck.label,
                key: truck.key,
                company: bestOption.company,
                count: fullTrucks,
                price: bestOption.price
              }]
            })
          }
        }
      })
    }

    // 按价格排序，取前5个（增加选择范围）
    plans.sort((a, b) => a.totalCost - b.totalCost)
    const topPlans = plans.slice(0, 5)

    if (topPlans.length === 0) {
      wx.showToast({ title: '无可用方案', icon: 'none' })
      return
    }

    this.setData({
      showRecommend: true,
      recommendPlans: topPlans
    }, () => {
      // 自动应用最优方案（在 setData 回调中确保数据已就绪）
      if (autoApply && topPlans.length > 0) {
        this.selectRecommendPlan(0)
        // 应用后保持推荐面板展开
        this.setData({ showRecommend: true })
      }
    })
  },

  // 选择推荐方案（支持直接传入索引或从 event 获取）
  selectRecommendPlan(e) {
    const idx = typeof e === 'number' ? e : e.currentTarget.dataset.idx
    const plan = this.data.recommendPlans[idx]
    if (!plan) return

    const totalVolume = parseFloat(this.data.totalVolume) || 0
    const isCombinedPlan = plan.type === 'combined'

    // 先清空所有选择
    const { scatterOptions, truckGroups } = this.data
    scatterOptions.forEach((opt, i) => {
      scatterOptions[i].checked = false
      scatterOptions[i].volume = ''
      scatterOptions[i].subtotal = 0
    })
    truckGroups.forEach((group, gi) => {
      group.options.forEach((opt, oi) => {
        truckGroups[gi].options[oi].checked = false
        truckGroups[gi].options[oi].qty = ''
        truckGroups[gi].options[oi].subtotal = 0
      })
    })

    // 应用推荐方案
    // 散货部分
    if (plan.scatterVolume > 0 && plan.scatterCompany) {
      const scatterIdx = scatterOptions.findIndex(opt => opt.company === plan.scatterCompany)
      if (scatterIdx >= 0) {
        const opt = scatterOptions[scatterIdx]
        let subtotal = plan.scatterVolume * opt.price
        if (opt.minCharge && subtotal < opt.minCharge) {
          subtotal = opt.minCharge
        }
        // 附加费判断：总立方<10方 且 不是组合方案 才加附加费
        if (!isCombinedPlan && totalVolume < 10 && opt.surcharge) {
          subtotal += opt.surcharge
        }
        scatterOptions[scatterIdx].checked = true
        scatterOptions[scatterIdx].volume = plan.scatterVolume.toString()
        scatterOptions[scatterIdx].subtotal = parseFloat(subtotal.toFixed(2))
      }
    }

    // 整车部分
    plan.trucks.forEach(truck => {
      const groupIdx = truckGroups.findIndex(g => g.type.includes(truck.type))
      if (groupIdx >= 0) {
        const optIdx = truckGroups[groupIdx].options.findIndex(opt => opt.company === truck.company)
        if (optIdx >= 0) {
          const subtotal = truck.count * truck.price
          truckGroups[groupIdx].options[optIdx].checked = true
          truckGroups[groupIdx].options[optIdx].qty = truck.count
          truckGroups[groupIdx].options[optIdx].subtotal = parseFloat(subtotal.toFixed(2))
        }
      }
    })

    this.setData({
      scatterOptions,
      truckGroups,
      showRecommend: false
    }, () => {
      this.calcAllocatedVolume()
      this.calcLogisticsTotal()
    })
  },

  // 计算已分配立方数
  calcAllocatedVolume() {
    let allocated = 0
    this.data.scatterOptions.forEach(opt => {
      if (opt.checked && opt.volume) {
        allocated += parseFloat(opt.volume) || 0
      }
    })
    this.setData({ allocatedVolume: parseFloat(allocated.toFixed(2)) })
  },

  // 整车数量减少
  onTruckQtyMinus(e) {
    const { gidx, oidx } = e.currentTarget.dataset
    const option = this.data.truckGroups[gidx].options[oidx]
    const currentQty = parseInt(option.qty) || 1
    if (currentQty <= 1) return
    const newQty = currentQty - 1
    const subtotal = newQty * option.price
    this.setData({
      [`truckGroups[${gidx}].options[${oidx}].qty`]: newQty,
      [`truckGroups[${gidx}].options[${oidx}].subtotal`]: parseFloat(subtotal.toFixed(2))
    })
    this.calcLogisticsTotal()
  },

  // 整车数量增加
  onTruckQtyPlus(e) {
    const { gidx, oidx } = e.currentTarget.dataset
    const option = this.data.truckGroups[gidx].options[oidx]
    const currentQty = parseInt(option.qty) || 1
    const newQty = currentQty + 1
    const subtotal = newQty * option.price
    this.setData({
      [`truckGroups[${gidx}].options[${oidx}].qty`]: newQty,
      [`truckGroups[${gidx}].options[${oidx}].subtotal`]: parseFloat(subtotal.toFixed(2))
    })
    this.calcLogisticsTotal()
  },

  // 展开/收起其他部件
  toggleComponentExpand() {
    this.setData({ componentExpanded: !this.data.componentExpanded })
  },

  // 展开/收起工序列表
  toggleProcessExpand() {
    this.setData({ processExpanded: !this.data.processExpanded })
  },

  // ==================== 自定义规格页 ====================
  onCollectorPresetChange(e) {
    const idx = parseInt(e.detail.value)
    if (idx > 0) {
      const spec = this.data.collectorSpecs[idx - 1]
      this.setData({ collectorPresetIndex: idx, collectorSpecName: spec.name, collectorArea: spec.area, collectorLen: spec.length, collectorFee: spec.fee })
    } else this.setData({ collectorPresetIndex: 0, collectorSpecName: '' })
    this.calcCollector()
  },
  onCollectorSpecNameInput(e) { this.setData({ collectorSpecName: e.detail.value }) },
  onCollectorAreaInput(e) { this.setData({ collectorArea: e.detail.value }) },
  onCollectorLenInput(e) { this.setData({ collectorLen: e.detail.value }) },
  onCollectorFeeInput(e) { this.setData({ collectorFee: e.detail.value }) },
  calcCollector() {
    this.setData({ isCalculating: true })
    setTimeout(() => {
      const { collectorArea, collectorLen, collectorFee, alPrice, lossRatio } = this.data
      const result = calc.calcCollector(
        parseFloat(collectorArea) || 0,
        parseFloat(collectorLen) || 0,
        parseFloat(collectorFee) || 0,
        parseFloat(alPrice) || 0,
        parseFloat(lossRatio) || 1
      )
      this.setData({
        collectorResult: { weight: result.weight.toFixed(4), unitPrice: result.unitPrice.toFixed(2) },
        isCalculating: false
      })
    }, 300)
  },

  onFinPresetChange(e) {
    const idx = parseInt(e.detail.value)
    if (idx > 0) {
      const spec = this.data.finSpecs[idx - 1]
      const totalWaveLen = spec.waveLen * spec.waveCount
      this.setData({ finPresetIndex: idx, finSpecName: spec.name, finWidth: spec.width, finWaveLen: spec.waveLen, finWaveCount: spec.waveCount, finTotalWaveLen: totalWaveLen, finThickness: spec.thickness, finFee: spec.fee, finPartFee: spec.partFee })
    } else this.setData({ finPresetIndex: 0, finSpecName: '' })
    this.calcFin()
  },
  onFinSpecNameInput(e) { this.setData({ finSpecName: e.detail.value }) },
  onFinWidthInput(e) { this.setData({ finWidth: e.detail.value }) },
  onFinWaveLenInput(e) {
    const waveLen = e.detail.value
    const waveLenNum = parseFloat(waveLen) || 0
    this.setData({ finWaveLen: waveLen, finTotalWaveLen: waveLenNum * (parseInt(this.data.finWaveCount) || 0) })
  },
  onFinWaveCountInput(e) {
    const waveCount = e.detail.value
    const waveCountNum = parseInt(waveCount) || 0
    this.setData({ finWaveCount: waveCount, finTotalWaveLen: (parseFloat(this.data.finWaveLen) || 0) * waveCountNum })
  },
  onFinThicknessInput(e) { this.setData({ finThickness: e.detail.value }) },
  onFinFeeInput(e) { this.setData({ finFee: e.detail.value }) },
  onFinPartFeeInput(e) { this.setData({ finPartFee: e.detail.value }) },
  calcFin() {
    this.setData({ isCalculating: true })
    setTimeout(() => {
      const { finWidth, finTotalWaveLen, finThickness, finFee, finPartFee, alPrice } = this.data
      const result = calc.calcFin(
        parseFloat(finWidth) || 0,
        parseFloat(finTotalWaveLen) || 0,
        parseFloat(finThickness) || 0,
        parseFloat(finFee) || 0,
        parseFloat(finPartFee) || 0,
        parseFloat(alPrice) || 0
      )
      this.setData({
        finResult: { weight: result.weight.toFixed(4), unitPrice: result.unitPrice.toFixed(2) },
        isCalculating: false
      })
    }, 300)
  },

  onTubePresetChange(e) {
    const idx = parseInt(e.detail.value)
    if (idx > 0) {
      const spec = this.data.tubeSpecs[idx - 1]
      this.setData({ tubePresetIndex: idx, tubeSpecName: spec.name, tubeMeterWeight: spec.meterWeight, tubeLen: spec.length, tubeFee: spec.fee, tubeZincFee: spec.zincFee })
    } else this.setData({ tubePresetIndex: 0, tubeSpecName: '' })
    this.calcTube()
  },
  onTubeSpecNameInput(e) { this.setData({ tubeSpecName: e.detail.value }) },
  onTubeMeterWeightInput(e) { this.setData({ tubeMeterWeight: e.detail.value }) },
  onTubeLenInput(e) { this.setData({ tubeLen: e.detail.value }) },
  onTubeFeeInput(e) { this.setData({ tubeFee: e.detail.value }) },
  onTubeZincFeeInput(e) { this.setData({ tubeZincFee: e.detail.value }) },
  calcTube() {
    this.setData({ isCalculating: true })
    setTimeout(() => {
      const { tubeMeterWeight, tubeLen, tubeFee, tubeZincFee, alPrice } = this.data
      const result = calc.calcTube(
        parseFloat(tubeMeterWeight) || 0,
        parseFloat(tubeLen) || 0,
        parseFloat(tubeFee) || 0,
        parseFloat(tubeZincFee) || 0,
        false,
        parseFloat(alPrice) || 0
      )
      this.setData({
        tubeResult: { weight: result.weight.toFixed(4), normalPrice: result.normalPrice.toFixed(2), zincPrice: result.zincPrice.toFixed(2) },
        isCalculating: false
      })
    }, 300)
  },

  // 保存集流管规格到数据库
  saveCollectorSpec() {
    const { collectorSpecName, collectorArea, collectorLen, collectorFee, collectorPresetIndex, collectorSpecs } = this.data
    if (!collectorSpecName.trim()) {
      wx.showToast({ title: '请输入规格名称', icon: 'none' })
      return
    }
    const spec = {
      type: 'COLLECTOR',
      name: collectorSpecName.trim(),
      params: { area: parseFloat(collectorArea) || 0, length: parseFloat(collectorLen) || 0, fee: parseFloat(collectorFee) || 0 }
    }
    wx.showLoading({ title: '保存中...' })
    const isUpdate = collectorPresetIndex > 0
    const existingSpec = isUpdate ? collectorSpecs[collectorPresetIndex - 1] : null
    const promise = isUpdate ? api.updateSpec(existingSpec.id, spec) : api.saveSpec(spec)
    promise.then(() => {
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.loadSpecs()
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    })
  },

  // 保存翅片规格到数据库
  saveFinSpec() {
    const { finSpecName, finWidth, finWaveLen, finWaveCount, finThickness, finFee, finPartFee, finPresetIndex, finSpecs } = this.data
    if (!finSpecName.trim()) {
      wx.showToast({ title: '请输入规格名称', icon: 'none' })
      return
    }
    const spec = {
      type: 'FIN',
      name: finSpecName.trim(),
      params: {
        width: parseFloat(finWidth) || 0, waveLen: parseFloat(finWaveLen) || 0, waveCount: parseInt(finWaveCount) || 0,
        thickness: parseFloat(finThickness) || 0, fee: parseFloat(finFee) || 0, partFee: parseFloat(finPartFee) || 0
      }
    }
    wx.showLoading({ title: '保存中...' })
    const isUpdate = finPresetIndex > 0
    const existingSpec = isUpdate ? finSpecs[finPresetIndex - 1] : null
    const promise = isUpdate ? api.updateSpec(existingSpec.id, spec) : api.saveSpec(spec)
    promise.then(() => {
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.loadSpecs()
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    })
  },

  // 保存扁管规格到数据库
  saveTubeSpec() {
    const { tubeSpecName, tubeMeterWeight, tubeLen, tubeFee, tubeZincFee, tubePresetIndex, tubeSpecs } = this.data
    if (!tubeSpecName.trim()) {
      wx.showToast({ title: '请输入规格名称', icon: 'none' })
      return
    }
    const spec = {
      type: 'TUBE',
      name: tubeSpecName.trim(),
      params: {
        meterWeight: parseFloat(tubeMeterWeight) || 0, length: parseFloat(tubeLen) || 0,
        fee: parseFloat(tubeFee) || 0, zincFee: parseFloat(tubeZincFee) || 0
      }
    }
    wx.showLoading({ title: '保存中...' })
    const isUpdate = tubePresetIndex > 0
    const existingSpec = isUpdate ? tubeSpecs[tubePresetIndex - 1] : null
    const promise = isUpdate ? api.updateSpec(existingSpec.id, spec) : api.saveSpec(spec)
    promise.then(() => {
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.loadSpecs()
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    })
  },

  // 删除集流管规格
  deleteCollectorSpec() {
    const { collectorPresetIndex, collectorSpecs } = this.data
    if (collectorPresetIndex <= 0) return
    const spec = collectorSpecs[collectorPresetIndex - 1]
    wx.showModal({
      title: '确认删除',
      content: `确定删除规格"${spec.name}"吗？`,
      success: res => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          api.deleteSpec(spec.id).then(() => {
            wx.hideLoading()
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.setData({ collectorPresetIndex: 0, collectorSpecName: '' })
            this.loadSpecs()
          }).catch(err => {
            wx.hideLoading()
            wx.showToast({ title: err.message || '删除失败', icon: 'none' })
          })
        }
      }
    })
  },

  // 删除翅片规格
  deleteFinSpec() {
    const { finPresetIndex, finSpecs } = this.data
    if (finPresetIndex <= 0) return
    const spec = finSpecs[finPresetIndex - 1]
    wx.showModal({
      title: '确认删除',
      content: `确定删除规格"${spec.name}"吗？`,
      success: res => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          api.deleteSpec(spec.id).then(() => {
            wx.hideLoading()
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.setData({ finPresetIndex: 0, finSpecName: '' })
            this.loadSpecs()
          }).catch(err => {
            wx.hideLoading()
            wx.showToast({ title: err.message || '删除失败', icon: 'none' })
          })
        }
      }
    })
  },

  // 删除扁管规格
  deleteTubeSpec() {
    const { tubePresetIndex, tubeSpecs } = this.data
    if (tubePresetIndex <= 0) return
    const spec = tubeSpecs[tubePresetIndex - 1]
    wx.showModal({
      title: '确认删除',
      content: `确定删除规格"${spec.name}"吗？`,
      success: res => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          api.deleteSpec(spec.id).then(() => {
            wx.hideLoading()
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.setData({ tubePresetIndex: 0, tubeSpecName: '' })
            this.loadSpecs()
          }).catch(err => {
            wx.hideLoading()
            wx.showToast({ title: err.message || '删除失败', icon: 'none' })
          })
        }
      }
    })
  },

  // ==================== 3D装箱 ====================
  addCargo() {
    const { cargoList } = this.data
    cargoList.push({
      packType: '围板箱',
      length: '',
      width: '',
      height: '',
      quantity: 1,
      weight: '',
      packFee: 0,
      maxStack: 3
    })
    this.setData({ cargoList })
  },

  deleteCargo(e) {
    const idx = e.currentTarget.dataset.idx
    const { cargoList } = this.data
    cargoList.splice(idx, 1)
    this.setData({ cargoList })
    this.calcTotalPackFee()
    this.calcTotalVolume()
  },

  onCargoInput(e) {
    const { idx, field } = e.currentTarget.dataset
    const value = e.detail.value
    const key = `cargoList[${idx}].${field}`
    this.setData({ [key]: value })
    if (field === 'packFee' || field === 'quantity') {
      this.calcTotalPackFee()
    }
    // 尺寸或数量变化时自动计算总立方数
    if (field === 'length' || field === 'width' || field === 'height' || field === 'quantity') {
      this.calcTotalVolume()
    }
  },

  onPackTypeChange(e) {
    const idx = e.currentTarget.dataset.idx
    const typeIdx = parseInt(e.detail.value)
    const packType = this.data.packTypes[typeIdx]
    this.setData({ [`cargoList[${idx}].packType`]: packType })
  },

  calcTotalPackFee() {
    const { cargoList } = this.data
    let total = 0
    cargoList.forEach(c => {
      const fee = parseFloat(c.packFee) || 0
      const qty = parseInt(c.quantity) || 0
      total += fee * qty
    })
    this.setData({ totalPackFee: total.toFixed(2) })
  },

  calcTotalVolume() {
    const { cargoList } = this.data
    let total = 0
    cargoList.forEach(c => {
      const l = parseFloat(c.length) || 0
      const w = parseFloat(c.width) || 0
      const h = parseFloat(c.height) || 0
      const qty = parseInt(c.quantity) || 0
      total += l * w * h * qty
    })
    this.setData({ totalVolume: total > 0 ? total.toFixed(2) : '' })
  },

  // 从物流价格中提取各车型最低价
  extractTruckPrices(prices) {
    if (!prices || !prices.length) return {}

    const truckKeys = [
      { key: 'price42m', type: '4.2米' },
      { key: 'price68m', type: '6.8米' },
      { key: 'price96m', type: '9.6米' },
      { key: 'price135m', type: '13.5米' },
      { key: 'price175m', type: '17.5米' }
    ]

    const result = {}
    truckKeys.forEach(({ key, type }) => {
      const validPrices = prices
        .filter(p => p[key] && parseFloat(p[key]) > 0)
        .map(p => parseFloat(p[key]))
      if (validPrices.length > 0) {
        result[type] = Math.min(...validPrices)
      }
    })
    return result
  },

  calcBinPacking() {
    const { cargoList, selectedOrigin, selectedDestination, logisticsPrices, scatterOptions } = this.data
    if (!cargoList.length) {
      wx.showToast({ title: '请先添加货物', icon: 'none' })
      return
    }
    const valid = cargoList.every(c => c.length && c.width && c.height && c.weight && c.quantity)
    if (!valid) {
      wx.showToast({ title: '请完善货物信息', icon: 'none' })
      return
    }

    // 从物流价格中提取各车型最低价
    const truckPrices = this.extractTruckPrices(logisticsPrices)
    // 获取最低散货单价
    const scatterUnitPrice = scatterOptions.length > 0
      ? Math.min(...scatterOptions.map(o => o.price)) : 280

    this.setData({ binPackingLoading: true })
    api.calcBinPacking({
      cargoList: cargoList.map(c => ({
        packType: c.packType,
        length: parseFloat(c.length),
        width: parseFloat(c.width),
        height: parseFloat(c.height),
        quantity: parseInt(c.quantity),
        weight: parseFloat(c.weight),
        packFee: parseFloat(c.packFee) || 0,
        maxStack: parseInt(c.maxStack) || 3
      })),
      origin: selectedOrigin,
      destination: selectedDestination,
      truckPrices: truckPrices,
      scatterUnitPrice: scatterUnitPrice,
      enableMixedSolution: true
    }).then(solutions => {
      this.setData({
        binPackingSolutions: solutions,
        binPackingLoading: false,
        currentSolutionIdx: solutions.length > 0 ? 0 : -1,
        currentSolution: solutions.length > 0 ? solutions[0] : null
      })
    }).catch(() => {
      this.setData({ binPackingLoading: false })
      wx.showToast({ title: '计算失败', icon: 'none' })
    })
  },

  selectSolution(e) {
    const idx = e.currentTarget.dataset.idx
    const solution = this.data.binPackingSolutions[idx]
    this.setData({
      currentSolutionIdx: idx,
      currentSolution: solution
    })
  },

  viewSolution3D(e) {
    const idx = e.currentTarget.dataset.idx
    const solution = this.data.binPackingSolutions[idx]
    this.setData({
      currentSolutionIdx: idx,
      currentSolution: solution,
      current3DTruckIdx: 0,
      show3DPreview: true
    })
  },

  prev3DTruck() {
    const { current3DTruckIdx } = this.data
    if (current3DTruckIdx > 0) {
      this.setData({ current3DTruckIdx: current3DTruckIdx - 1 })
      this.selectComponent('#binPacking3d').prevTruck()
    }
  },

  next3DTruck() {
    const { current3DTruckIdx, currentSolution } = this.data
    if (current3DTruckIdx < currentSolution.trucks.length - 1) {
      this.setData({ current3DTruckIdx: current3DTruckIdx + 1 })
      this.selectComponent('#binPacking3d').nextTruck()
    }
  },

  close3DPreview() {
    this.setData({ show3DPreview: false })
  },

  // 打开方案编辑弹窗
  editSolution(e) {
    const idx = e.currentTarget.dataset.idx
    const solution = this.data.binPackingSolutions[idx]
    // 从方案中提取车辆配置
    const truckMap = {}
    solution.trucks.forEach(t => {
      const key = t.truckType + '-' + t.truckStyle
      truckMap[key] = (truckMap[key] || 0) + 1
    })
    const editingTrucks = Object.entries(truckMap).map(([key, count]) => {
      const [type, style] = key.split('-')
      return { truckType: type, truckStyle: style, count }
    })
    this.setData({
      showEditModal: true,
      editingSolutionIdx: idx,
      editingTrucks: editingTrucks.length ? editingTrucks : [{ truckType: '9.6米', truckStyle: '厢式', count: 1 }],
      editingScatterVolume: solution.scatterVolume ? solution.scatterVolume.toString() : '',
      editPreviewCost: solution.totalCost,
      editWarning: ''
    })
  },

  closeEditModal() {
    this.setData({ showEditModal: false, editingSolutionIdx: -1 })
  },

  onEditTruckType(e) {
    const { idx } = e.currentTarget.dataset
    const typeIdx = parseInt(e.detail.value)
    this.setData({ [`editingTrucks[${idx}].truckType`]: this.data.truckTypeOptions[typeIdx] })
  },

  onEditTruckStyle(e) {
    const { idx } = e.currentTarget.dataset
    const styleIdx = parseInt(e.detail.value)
    this.setData({ [`editingTrucks[${idx}].truckStyle`]: this.data.truckStyleOptions[styleIdx] })
  },

  onEditTruckCount(e) {
    const { idx } = e.currentTarget.dataset
    const count = parseInt(e.detail.value) || 1
    this.setData({ [`editingTrucks[${idx}].count`]: Math.max(1, count) })
  },

  onAddTruck() {
    const { editingTrucks } = this.data
    editingTrucks.push({ truckType: '9.6米', truckStyle: '厢式', count: 1 })
    this.setData({ editingTrucks })
  },

  onDeleteTruck(e) {
    const { idx } = e.currentTarget.dataset
    const { editingTrucks } = this.data
    if (editingTrucks.length > 1) {
      editingTrucks.splice(idx, 1)
      this.setData({ editingTrucks })
    }
  },

  onEditScatterVolume(e) {
    this.setData({ editingScatterVolume: e.detail.value })
  },

  // 确认编辑，调用后端重算
  confirmEditSolution() {
    const { cargoList, editingTrucks, editingScatterVolume, scatterOptions } = this.data
    const scatterUnitPrice = scatterOptions.length > 0
      ? Math.min(...scatterOptions.map(o => o.price)) : 280

    api.recalculateBinPacking({
      cargoList: cargoList.map(c => ({
        packType: c.packType,
        length: parseFloat(c.length),
        width: parseFloat(c.width),
        height: parseFloat(c.height),
        quantity: parseInt(c.quantity),
        weight: parseFloat(c.weight),
        packFee: parseFloat(c.packFee) || 0,
        maxStack: parseInt(c.maxStack) || 3
      })),
      trucks: editingTrucks,
      scatterVolume: editingScatterVolume ? parseFloat(editingScatterVolume) : null,
      scatterUnitPrice: scatterUnitPrice
    }).then(solution => {
      const { binPackingSolutions, editingSolutionIdx } = this.data
      binPackingSolutions[editingSolutionIdx] = solution
      this.setData({
        binPackingSolutions,
        currentSolution: solution,
        currentSolutionIdx: editingSolutionIdx,
        showEditModal: false
      })
      wx.showToast({ title: '方案已更新', icon: 'success' })
    }).catch(() => {
      wx.showToast({ title: '重算失败', icon: 'none' })
    })
  },

  confirmBinPacking() {
    const { currentSolution, totalPackFee } = this.data
    if (!currentSolution) {
      wx.showToast({ title: '请选择方案', icon: 'none' })
      return
    }
    const totalFreight = parseFloat(currentSolution.totalFreight) + parseFloat(totalPackFee)
    this.setData({
      freight: totalFreight.toFixed(2),
      selectedLogisticsSummary: currentSolution.description
    })
    this.updateSummary()
    this.calcPerPartFreight()
    wx.showToast({ title: '已应用方案', icon: 'success' })
  },

  // ==================== 销售Tab ====================
  onSalesInput(e) {
    const { field } = e.currentTarget.dataset
    const value = e.detail.value
    this.setData({ [`salesData.${field}`]: value })
  },

  onSalesDateInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [`salesData.${field}`]: e.detail.value })
  },

  onCommercialStatusChange(e) {
    const idx = parseInt(e.detail.value)
    this.setData({
      commercialStatusIndex: idx,
      'salesData.commercialStatus': this.data.commercialStatusOptions[idx].value
    })
  },

  onOemTierChange(e) {
    this.setData({ 'salesData.oemTier': this.data.oemTierOptions[parseInt(e.detail.value)] })
  },

  onCurrencyChange(e) {
    this.setData({ 'salesData.currency': this.data.currencyOptions[parseInt(e.detail.value)] })
  },

  onIncotermChange(e) {
    this.setData({ 'salesData.incoterm': this.data.incotermOptions[parseInt(e.detail.value)] })
  },

  onMoldPaymentChange(e) {
    if (this.data.salesReadonly) return
    const mode = e.currentTarget.dataset.mode
    this.setData({ 'salesData.moldShared': mode === 'amortized' })
  },

  onDeadlineModeChange(e) {
    const modes = ['PERCENTAGE', 'FIXED_DAYS']
    this.setData({ 'salesData.deadlineMode': modes[e.detail.value] })
  },

  _loadDeadlineDefaults() {
    const sd = this.data.salesData
    if (sd.deadlineMode) return
    api.getDeadlineConfig().then(config => {
      if (!config) return
      const cur = this.data.salesData
      const updates = {}
      if (!cur.deadlineMode) updates['salesData.deadlineMode'] = config.DEADLINE_MODE || 'PERCENTAGE'
      if (!cur.deadlineTech) updates['salesData.deadlineTech'] = config.DEADLINE_TECH || '30'
      if (!cur.deadlineProcess) updates['salesData.deadlineProcess'] = config.DEADLINE_PROCESS || '25'
      if (!cur.deadlineLogistics) updates['salesData.deadlineLogistics'] = config.DEADLINE_LOGISTICS || '20'
      if (!cur.deadlineApprove) updates['salesData.deadlineApprove'] = config.DEADLINE_APPROVE || '25'
      if (Object.keys(updates).length) this.setData(updates)
    }).catch(() => {})
  },

  // ==================== 截止时间处理 ====================
  _processDeadlines(deadlines, currentStatus) {
    var empty = { currentStageDeadline: '', currentStageOverdue: false, deadlineRemaining: '' }
    // 按角色过滤：只显示自己环节的截止时间
    var roleStageMap = { SALES: 'DRAFT', TECH: 'PENDING_TECH', PROCESS: 'PENDING_PROCESS', LOGISTICS: 'PENDING_LOGISTICS', MANAGER: 'PENDING_APPROVAL' }
    var myStage = roleStageMap[this.data.userRole]
    if (!myStage || myStage !== currentStatus) {
      this.setData(empty)
      return
    }
    var quote = this.data.currentQuote
    // 固定天数模式：使用秒表计时
    if (quote && quote.deadlineMode === 'FIXED_DAYS') {
      this._processStopwatchDeadline(quote, currentStatus)
      return
    }
    // 百分比模式：使用固定截止日期
    if (!deadlines || !deadlines.length) { this.setData(empty); return }
    var current = deadlines.find(function (d) { return d.stage === currentStatus })
    if (!current) { this.setData(empty); return }
    var deadline = new Date(current.deadline.replace(/-/g, '/').replace('T', ' '))
    var now = new Date()
    var overdue = now > deadline
    var diffMs = deadline - now
    var remaining = ''
    if (!overdue) {
      var hours = Math.floor(diffMs / 3600000)
      if (hours >= 24) {
        remaining = Math.floor(hours / 24) + '天' + (hours % 24) + '小时'
      } else {
        remaining = hours + '小时'
      }
    }
    var fmt = current.deadline.substring(0, 16).replace('T', ' ')
    this.setData({ currentStageDeadline: fmt, currentStageOverdue: overdue, deadlineRemaining: remaining })
  },

  // 固定天数秒表模式
  _processStopwatchDeadline(quote, currentStatus) {
    var stageMap = {
      PENDING_TECH: { days: quote.deadlineTech, start: quote.techActiveStart, elapsed: quote.techElapsedSeconds },
      PENDING_PROCESS: { days: quote.deadlineProcess, start: quote.processActiveStart, elapsed: quote.processElapsedSeconds },
      PENDING_LOGISTICS: { days: quote.deadlineLogistics, start: quote.logisticsActiveStart, elapsed: quote.logisticsElapsedSeconds },
      PENDING_APPROVAL: { days: quote.deadlineApprove, start: quote.approveActiveStart, elapsed: quote.approveElapsedSeconds }
    }
    var info = stageMap[currentStatus]
    if (!info || !info.days) {
      this.setData({ currentStageDeadline: '', currentStageOverdue: false, deadlineRemaining: '' })
      return
    }
    var allocatedSeconds = info.days * 86400
    var elapsedSeconds = info.elapsed || 0
    // 正在计时中：加上当前活跃时间
    if (info.start) {
      var startDate = new Date(String(info.start).replace(/-/g, '/').replace('T', ' '))
      var nowMs = Date.now()
      elapsedSeconds += Math.floor((nowMs - startDate.getTime()) / 1000)
    }
    var remainingSeconds = allocatedSeconds - elapsedSeconds
    var overdue = remainingSeconds <= 0
    var remaining = ''
    if (overdue) {
      var overSec = Math.abs(remainingSeconds)
      var overHours = Math.floor(overSec / 3600)
      remaining = '已超时' + (overHours >= 24 ? Math.floor(overHours / 24) + '天' + (overHours % 24) + '小时' : overHours + '小时')
    } else {
      var hours = Math.floor(remainingSeconds / 3600)
      remaining = hours >= 24 ? Math.floor(hours / 24) + '天' + (hours % 24) + '小时' : hours + '小时'
    }
    var label = '分配' + info.days + '天'
    this.setData({ currentStageDeadline: label, currentStageOverdue: overdue, deadlineRemaining: remaining })
  },

  // ==================== 通知中心 ====================
  _loadUnreadCount() {
    api.getUnreadCount().then(res => {
      this.setData({ unreadCount: res || 0 })
    }).catch(() => {})
  },

  onOpenNotifications() {
    this.setData({ showNotificationPanel: true })
    api.getNotifications().then(res => {
      this.setData({ notifications: res || [] })
    }).catch(() => {
      this.setData({ notifications: [] })
    })
  },

  onCloseNotifications() {
    this.setData({ showNotificationPanel: false })
  },

  onMarkAllRead() {
    api.markAllNotificationsRead().then(() => {
      const list = this.data.notifications.map(n => ({ ...n, isRead: true }))
      this.setData({ notifications: list, unreadCount: 0 })
    })
  },

  onNotificationTap(e) {
    const item = e.currentTarget.dataset.item
    if (!item.isRead) {
      api.markNotificationRead(item.id).then(() => {
        const list = this.data.notifications.map(n =>
          n.id === item.id ? { ...n, isRead: true } : n
        )
        const unread = Math.max(0, this.data.unreadCount - 1)
        this.setData({ notifications: list, unreadCount: unread })
      })
    }
    if (item.quoteId) {
      this.setData({ showNotificationPanel: false })
      this.selectQuote({ currentTarget: { dataset: { id: item.quoteId } } })
    }
  },

  // ==================== 客户管理 ====================
  _customerSearchTimer: null,
  _suggestionTimer: null,

  // 客户名称输入联想
  onCustomerNameInput(e) {
    const keyword = e.detail.value
    this.setData({ 'salesData.customerName': keyword })
    clearTimeout(this._suggestionTimer)
    if (!keyword.trim()) {
      this.setData({ showCustomerDropdown: false, customerSuggestions: [] })
      return
    }
    this._suggestionTimer = setTimeout(() => {
      api.searchCustomers(keyword).then(list => {
        this.setData({ customerSuggestions: list || [], showCustomerDropdown: !!(list && list.length) })
      })
    }, 300)
  },

  onSelectCustomerSuggestion(e) {
    const customer = this.data.customerSuggestions[e.currentTarget.dataset.index]
    this.setData({
      'salesData.customerName': customer.name,
      'salesData.oemTier': customer.oemTier || this.data.salesData.oemTier,
      showCustomerDropdown: false
    })
  },

  onCustomerNameBlur() {
    setTimeout(() => this.setData({ showCustomerDropdown: false }), 200)
  },

  onOpenCustomerSearch() {
    if (this.data.salesReadonly) return
    const keyword = this.data.salesData.customerName || ''
    this.setData({ showCustomerPanel: true, customerKeyword: keyword })
    this._loadCustomers(keyword)
  },

  onCustomerKeywordInput(e) {
    const keyword = e.detail.value
    this.setData({ customerKeyword: keyword })
    clearTimeout(this._customerSearchTimer)
    this._customerSearchTimer = setTimeout(() => this._loadCustomers(keyword), 300)
  },

  onCloseCustomerPanel() {
    this.setData({ showCustomerPanel: false })
  },

  _loadCustomers(keyword) {
    api.searchCustomers(keyword).then(list => {
      this.setData({ customerSearchResults: list || [] })
    })
  },

  onSelectCustomer(e) {
    const customer = this.data.customerSearchResults[e.currentTarget.dataset.index]
    this.setData({
      'salesData.customerName': customer.name,
      'salesData.oemTier': customer.oemTier || this.data.salesData.oemTier,
      showCustomerPanel: false
    })
  },

  onShowAddCustomer() {
    this.setData({
      showAddCustomerModal: true,
      editingCustomerId: null,
      newCustomer: { name: this.data.salesData.customerName || '', code: '', oemTier: '', contactName: '', contactPhone: '' }
    })
  },

  onEditCustomer(e) {
    const customer = this.data.customerSearchResults[e.currentTarget.dataset.index]
    this.setData({
      showAddCustomerModal: true,
      editingCustomerId: customer.id,
      newCustomer: {
        name: customer.name || '',
        code: customer.code || '',
        oemTier: customer.oemTier || '',
        contactName: customer.contactName || '',
        contactPhone: customer.contactPhone || ''
      }
    })
  },

  onDeleteCustomer(e) {
    const customer = this.data.customerSearchResults[e.currentTarget.dataset.index]
    wx.showModal({
      title: '确认删除',
      content: `确定删除客户「${customer.name}」吗？`,
      success: res => {
        if (!res.confirm) return
        api.deleteCustomer(customer.id).then(() => {
          wx.showToast({ title: '已删除', icon: 'success' })
          this._loadCustomers(this.data.customerKeyword)
        })
      }
    })
  },

  onCloseAddCustomer() {
    this.setData({ showAddCustomerModal: false })
  },

  onNewCustomerInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [`newCustomer.${field}`]: e.detail.value })
  },

  onNewCustomerOemChange(e) {
    this.setData({ 'newCustomer.oemTier': this.data.oemTierOptions[parseInt(e.detail.value)] })
  },

  onConfirmAddCustomer() {
    const { newCustomer, editingCustomerId } = this.data
    if (!newCustomer.name) {
      wx.showToast({ title: '请输入客户名称', icon: 'none' })
      return
    }
    const promise = editingCustomerId
      ? api.updateCustomer(editingCustomerId, newCustomer)
      : api.createCustomer(newCustomer)

    promise.then(() => {
      this.setData({
        showAddCustomerModal: false,
        'salesData.customerName': newCustomer.name,
        'salesData.oemTier': newCustomer.oemTier || this.data.salesData.oemTier
      })
      wx.showToast({ title: editingCustomerId ? '已保存' : '客户已新增', icon: 'success' })
      this._loadCustomers(this.data.customerKeyword)
    })
  },

  // ==================== 技术Tab ====================
  toggleTechSection(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ [key]: !this.data[key] })
  },

  onSpecInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`specData.${field}`]: e.detail.value })
  },

  onRefrigerantChange(e) {
    const idx = e.detail.value
    this.setData({ 'specData.refrigerant': this.data.refrigerantOptions[idx] })
  },

  // --- 技术材料动态表格 ---
  switchTechViewMode(e) {
    const mode = e.currentTarget.dataset.mode
    if (mode === this.data.techViewMode) return
    this.setData({ techViewMode: mode, techExpandedRowId: null })
  },

  togglePartDetail(e) {
    const rowId = parseInt(e.currentTarget.dataset.id)
    this.setData({
      techExpandedRowId: this.data.techExpandedRowId === rowId ? null : rowId
    })
  },

  _buildSpecSummary(row) {
    if (!row._columns) return ''
    return row._columns
      .filter(c => c.group && row[c.key])
      .map(c => row[c.key] + (c.unit || ''))
      .join(' × ')
  },

  toggleTechEditing() {
    if (this.data.techReadonly) return
    const entering = !this.data.techEditing
    const updates = { techEditing: entering, showTechAddMenu: false }
    if (entering) {
      updates.techViewMode = 'table'
      updates.techExpandedRowId = null
    }
    this.setData(updates)
  },
  toggleTechAddMenu() {
    this.setData({ showTechAddMenu: !this.data.showTechAddMenu, showCategoryAddMenu: '' })
  },
  toggleCategoryAddMenu(e) {
    const cKey = e.currentTarget.dataset.ckey
    this.setData({ showCategoryAddMenu: this.data.showCategoryAddMenu === cKey ? '' : cKey, showTechAddMenu: false })
  },
  toggleTechCategory(e) {
    const cKey = e.currentTarget.dataset.ckey
    const cats = this.data.techMaterialData.categories
    const idx = cats.findIndex(c => c.key === cKey)
    if (idx === -1) return
    this.setData({ [`techMaterialData.categories[${idx}].collapsed`]: !cats[idx].collapsed })
  },

  onTechMaterialInput(e) {
    const { ckey, id, field } = e.currentTarget.dataset
    const cats = this.data.techMaterialData.categories
    const cIdx = cats.findIndex(c => c.key === ckey)
    if (cIdx === -1) return
    const rIdx = cats[cIdx].rows.findIndex(r => r.id === parseInt(id))
    if (rIdx === -1) return
    const path = `techMaterialData.categories[${cIdx}].rows[${rIdx}].${field}`
    this.setData({ [path]: e.detail.value })
    this._recalcTechRow(cIdx, rIdx)
  },
  onTechMaterialFieldInput(e) {
    const { ckey, id } = e.currentTarget.dataset
    const cats = this.data.techMaterialData.categories
    const cIdx = cats.findIndex(c => c.key === ckey)
    if (cIdx === -1) return
    const rIdx = cats[cIdx].rows.findIndex(r => r.id === parseInt(id))
    if (rIdx === -1) return
    this.setData({ [`techMaterialData.categories[${cIdx}].rows[${rIdx}]._material`]: e.detail.value })
  },

  onTechCellFocus(e) {
    const { ckey, id, field } = e.currentTarget.dataset
    const cats = this.data.techMaterialData.categories
    const cIdx = cats.findIndex(c => c.key === ckey)
    if (cIdx === -1) return
    const rIdx = cats[cIdx].rows.findIndex(r => r.id === parseInt(id))
    if (rIdx === -1) return
    this.setData({ techFocusedCellAddress: ckey + '.' + field + '[' + (rIdx + 1) + ']' })
  },
  onTechCellBlur() {
    this.setData({ techFocusedCellAddress: '' })
  },

  _recalcTechRow(cIdx, rIdx) {
    const cat = this.data.techMaterialData.categories[cIdx]
    const row = cat.rows[rIdx]
    const columns = row._columns || []
    const updates = {}
    const globalVars = this.data.techMaterialData.globalVars || {}
    // 用计算快照跟踪已算出的输出值，使后续公式能引用前序输出
    const computed = {}
    columns.forEach(c => { computed[c.key] = parseFloat(row[c.key]) || 0 })
    // 始终注入系统变量
    computed.processFee = parseFloat(row._processFeeValue) || 0
    computed.alPrice = parseFloat(this.data.alPrice) || 0
    const mc = row._materialCost || {}
    computed.mcFactor = parseFloat(mc.factor) || 0
    computed.mcWeight = parseFloat(mc.weight) || 0
    computed.mcThickness = parseFloat(mc.thickness) || 0
    columns.forEach(col => {
      if (col.role === 'output' && col.formula) {
        const vars = Object.assign({}, globalVars, computed)
        const val = formula.evaluate(col.formula, vars)
        computed[col.key] = val // 链式计算保留完整精度
        const decimals = this._getColumnDecimals(col.key)
        const result = this._roundTo(val || 0, decimals)
        const path = `techMaterialData.categories[${cIdx}].rows[${rIdx}].${col.key}`
        updates[path] = result
      }
    })
    if (Object.keys(updates).length) {
      this.setData(updates)
      const updatedRow = this.data.techMaterialData.categories[cIdx].rows[rIdx]
      this.setData({ [`techMaterialData.categories[${cIdx}].rows[${rIdx}]._specSummary`]: this._buildSpecSummary(updatedRow) })
    }
    this._calcTechMaterialTotal()
  },

  // epsilon 补偿舍入：解决 IEEE 754 浮点乘法在 .5 边界的微小误差
  _roundTo(value, decimals) {
    if (!value && value !== 0) return 0
    var factor = Math.pow(10, decimals)
    return Math.round(value * factor + 1e-8) / factor
  },
  _getColumnDecimals(key) {
    if (/weight|重量/i.test(key)) return 3
    if (/price|amount|金额|单价|费/i.test(key)) return 2
    return 4
  },

  _calcTechMaterialTotal() {
    const cats = this.data.techMaterialData.categories
    let total = 0
    const updates = {}
    cats.forEach((cat, cIdx) => {
      let subtotal = 0
      cat.rows.forEach(row => {
        const key = row._amountKey || 'amount'
        subtotal += parseFloat(row[key]) || 0
      })
      updates[`techMaterialData.categories[${cIdx}].subtotal`] = subtotal.toFixed(2)
      total += subtotal
    })
    updates.techMaterialTotal = total.toFixed(2)
    this.setData(updates)
  },

  calcTechCosts() {
    this._rebuildAllMergedColumns()
    this._calcTechMaterialTotal()
  },

  _nextTechRowId() {
    let max = 0
    this.data.techMaterialData.categories.forEach(cat => {
      cat.rows.forEach(r => { if (r.id > max) max = r.id })
    })
    return max + 1
  },

  // 添加零件时，按列名匹配已有列的 key，消除同名不同 key 的列膨胀
  _remapNewRowColumns(cIdx, newRow) {
    var cat = this.data.techMaterialData.categories[cIdx]
    if (!cat.rows.length) return
    var columns = newRow._columns || []
    if (!columns.length) return

    // 收集已有行的列信息，按 spec(group) 和 common 分开
    var existingSpecByGroup = {} // groupName → [{label, key}]
    var existingCommonByLabel = {} // label → key
    cat.rows.forEach(function (row) {
      (row._columns || []).forEach(function (col) {
        if (col.group) {
          if (!existingSpecByGroup[col.group]) existingSpecByGroup[col.group] = []
          var arr = existingSpecByGroup[col.group]
          if (!arr.some(function (c) { return c.key === col.key })) {
            arr.push({ label: col.label, key: col.key })
          }
        } else {
          if (col.label && !existingCommonByLabel[col.label]) {
            existingCommonByLabel[col.label] = col.key
          }
        }
      })
    })

    var keyMap = {} // oldKey → newKey

    // 1) common 列：按 label 匹配
    columns.forEach(function (col) {
      if (col.group) return
      var ek = existingCommonByLabel[col.label]
      if (ek && ek !== col.key) keyMap[col.key] = ek
    })

    // 2) spec 列：同 group 内先按 label 匹配，未匹配的按位置对齐
    var newSpecByGroup = {}
    columns.forEach(function (col) {
      if (!col.group) return
      if (!newSpecByGroup[col.group]) newSpecByGroup[col.group] = []
      newSpecByGroup[col.group].push(col)
    })
    Object.keys(newSpecByGroup).forEach(function (gn) {
      var newCols = newSpecByGroup[gn]
      var existing = existingSpecByGroup[gn] || []
      if (!existing.length) return

      var matchedEKeys = {}
      var matchedNKeys = {}
      // 先按 label 匹配
      newCols.forEach(function (col) {
        var m = existing.find(function (e) { return e.label === col.label })
        if (m && m.key !== col.key) {
          keyMap[col.key] = m.key
          matchedEKeys[m.key] = true
          matchedNKeys[col.key] = true
        } else if (m) {
          matchedEKeys[m.key] = true
          matchedNKeys[col.key] = true
        }
      })
      // 未匹配的按位置对齐
      var unmatchedE = existing.filter(function (e) { return !matchedEKeys[e.key] })
      var unmatchedN = newCols.filter(function (c) { return !matchedNKeys[c.key] })
      var pairLen = Math.min(unmatchedE.length, unmatchedN.length)
      for (var i = 0; i < pairLen; i++) {
        if (unmatchedN[i].key !== unmatchedE[i].key) {
          keyMap[unmatchedN[i].key] = unmatchedE[i].key
        }
      }
    })

    if (!Object.keys(keyMap).length) return

    // 批量迁移数据：先收集旧值，再统一写入，避免覆盖冲突
    var pending = []
    columns.forEach(function (col) {
      var nk = keyMap[col.key]
      if (!nk) return
      pending.push({ col: col, oldKey: col.key, newKey: nk, val: newRow[col.key] })
    })
    pending.forEach(function (p) { delete newRow[p.oldKey] })
    pending.forEach(function (p) {
      if (p.val !== undefined) newRow[p.newKey] = p.val
      p.col.key = p.newKey
    })

    // 更新公式中的变量引用
    columns.forEach(function (col) {
      if (col.formula) {
        Object.keys(keyMap).forEach(function (oldK) {
          col.formula = col.formula.replace(new RegExp('\\b' + oldK + '\\b', 'g'), keyMap[oldK])
        })
      }
    })
    this._buildRowMeta(newRow)
  },

  // 合并某个分区内所有行的列定义，生成表头
  _rebuildMergedColumns(cIdx) {
    const cat = this.data.techMaterialData.categories[cIdx]
    const colMap = new Map()
    cat.rows.forEach(row => {
      (row._columns || []).forEach(col => {
        if (!colMap.has(col.key)) colMap.set(col.key, col)
      })
    })
    const merged = Array.from(colMap.values())
    const specCols = merged.filter(c => c.group)
    const commonCols = merged.filter(c => !c.group)
    this.setData({
      [`techMaterialData.categories[${cIdx}].mergedColumns`]: merged,
      [`techMaterialData.categories[${cIdx}].specColumns`]: specCols,
      [`techMaterialData.categories[${cIdx}].commonColumns`]: commonCols,
      [`techMaterialData.categories[${cIdx}].specColCount`]: specCols.length
    })
  },

  _rebuildAllMergedColumns() {
    const cats = this.data.techMaterialData.categories
    const updates = {}
    cats.forEach((cat, cIdx) => {
      const colMap = new Map()
      let hasFee = false
      cat.rows.forEach((row, rIdx) => {
        (row._columns || []).forEach(col => {
          if (!colMap.has(col.key)) colMap.set(col.key, col)
        })
        if (row._hasProcessFee) hasFee = true
        updates[`techMaterialData.categories[${cIdx}].rows[${rIdx}]._specSummary`] = this._buildSpecSummary(row)
      })
      const merged = Array.from(colMap.values())
      const specCols = merged.filter(c => c.group)
      const commonCols = merged.filter(c => !c.group)
      updates[`techMaterialData.categories[${cIdx}].mergedColumns`] = merged
      updates[`techMaterialData.categories[${cIdx}].specColumns`] = specCols
      updates[`techMaterialData.categories[${cIdx}].commonColumns`] = commonCols
      updates[`techMaterialData.categories[${cIdx}].specColCount`] = specCols.length
      updates[`techMaterialData.categories[${cIdx}].hasProcessFeeRows`] = hasFee
    })
    this.setData(updates)
    this._updateFilteredPresets()
  },

  // 旧数据迁移：分类级 columns → 行级 _columns
  _migrateTechData(data) {
    if (!data || !data.categories) return
    data.categories.forEach(cat => {
      const catCols = cat.columns || []
      cat.rows.forEach(row => {
        if (!row._columns && catCols.length) {
          row._columns = JSON.parse(JSON.stringify(catCols))
          row._partName = row._partName || row.name || ''
          // 构建辅助索引
          this._buildRowMeta(row)
        }
      })
      // 保留 mergedColumns 兼容
      if (!cat.mergedColumns) cat.mergedColumns = []
      if (!cat.subtotal) cat.subtotal = '0.00'
      if (!cat._filteredPresets) cat._filteredPresets = []
    })
    if (!data.globalVars) data.globalVars = {}
  },

  // 更新每个分区的筛选后模板列表
  _updateFilteredPresets() {
    const presets = this.data.partPresets || []
    const cats = this.data.techMaterialData.categories
    const updates = {}
    cats.forEach((cat, cIdx) => {
      const filtered = presets.filter(p => p.category === cat.key)
      updates[`techMaterialData.categories[${cIdx}]._filteredPresets`] = filtered
    })
    this.setData(updates)
  },

  // 构建行的辅助索引（_colKeys, _outputKeys）
  _buildRowMeta(row) {
    row._colKeys = {}
    row._outputKeys = {}
    row._amountKey = 'amount'
    const outputs = []
    ;(row._columns || []).forEach(c => {
      row._colKeys[c.key] = true
      if (c.role === 'output' && c.formula) {
        row._outputKeys[c.key] = true
        outputs.push(c)
      }
    })
    // 找金额列：优先匹配 key/label 含"amount/金额"，否则取最后一个输出列
    const amountCol = outputs.find(c => /amount|金额/i.test(c.key) || /amount|金额/i.test(c.label))
    row._amountKey = amountCol ? amountCol.key : (outputs.length ? outputs[outputs.length - 1].key : 'amount')
  },

  onProcessFeeInput(e) {
    const { ckey, id } = e.currentTarget.dataset
    const cats = this.data.techMaterialData.categories
    const cIdx = cats.findIndex(c => c.key === ckey)
    if (cIdx === -1) return
    const rIdx = cats[cIdx].rows.findIndex(r => r.id === parseInt(id))
    if (rIdx === -1) return
    this.setData({ [`techMaterialData.categories[${cIdx}].rows[${rIdx}]._processFeeValue`]: e.detail.value })
    this._recalcTechRow(cIdx, rIdx)
  },

  addTechEmptyRow(e) {
    const cKey = e.currentTarget.dataset.ckey
    const cats = this.data.techMaterialData.categories
    const cIdx = cats.findIndex(c => c.key === cKey)
    if (cIdx === -1) return
    // 复用该分区最后一行的列定义，若无行则用简单列
    const lastRow = cats[cIdx].rows.length ? cats[cIdx].rows[cats[cIdx].rows.length - 1] : null
    const cols = lastRow && lastRow._columns ? JSON.parse(JSON.stringify(lastRow._columns)) : [
      { key: 'qty', label: '数量', type: 'number', role: 'input' },
      { key: 'weight', label: '重量(KG)', type: 'number', role: 'input' },
      { key: 'unitPrice', label: '单价', type: 'number', role: 'input' },
      { key: 'amount', label: '金额(元)', type: 'number', role: 'output', formula: 'qty*unitPrice' }
    ]
    const newRow = { id: this._nextTechRowId(), _partNo: '', _partName: '', _material: '', _columns: cols }
    this._buildRowMeta(newRow)
    cols.forEach(col => { newRow[col.key] = '' })
    this.setData({ [`techMaterialData.categories[${cIdx}].rows`]: [...cats[cIdx].rows, newRow] })
    this._rebuildMergedColumns(cIdx)
  },

  deleteTechRow(e) {
    const { ckey, id } = e.currentTarget.dataset
    const cats = this.data.techMaterialData.categories
    const cIdx = cats.findIndex(c => c.key === ckey)
    if (cIdx === -1) return
    const rows = cats[cIdx].rows.filter(r => r.id !== parseInt(id))
    this.setData({ [`techMaterialData.categories[${cIdx}].rows`]: rows })
    this._rebuildMergedColumns(cIdx)
    this._calcTechMaterialTotal()
  },
  deleteOvRow(e) {
    const { ckey, id } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      success: res => {
        if (!res.confirm) return
        this.deleteTechRow(e)
      }
    })
  },

  copyTechRow(e) {
    const { ckey, id } = e.currentTarget.dataset
    const cats = this.data.techMaterialData.categories
    const cIdx = cats.findIndex(c => c.key === ckey)
    if (cIdx === -1) return
    const src = cats[cIdx].rows.find(r => r.id === parseInt(id))
    if (!src) return
    const copy = JSON.parse(JSON.stringify(src))
    copy.id = this._nextTechRowId()
    this.setData({ [`techMaterialData.categories[${cIdx}].rows`]: [...cats[cIdx].rows, copy] })
    this._calcTechMaterialTotal()
  },

  moveTechRow(e) {
    const { ckey, id, dir } = e.currentTarget.dataset
    const cats = this.data.techMaterialData.categories
    const cIdx = cats.findIndex(c => c.key === ckey)
    if (cIdx === -1) return
    const rows = [...cats[cIdx].rows]
    const idx = rows.findIndex(r => r.id === parseInt(id))
    if (idx === -1) return
    const target = dir === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= rows.length) return
    ;[rows[idx], rows[target]] = [rows[target], rows[idx]]
    this.setData({ [`techMaterialData.categories[${cIdx}].rows`]: rows })
  },

  // --- 技术Tab列编辑 ---
  openTechColumnEditor(e) {
    const cKey = e.currentTarget.dataset.ckey
    const cats = this.data.techMaterialData.categories
    const cat = cats.find(c => c.key === cKey)
    if (!cat) return
    this.setData({
      showTechColumnEditor: true,
      techEditingCategoryKey: cKey,
      techEditingColumns: JSON.parse(JSON.stringify(cat.mergedColumns || []))
    })
  },
  closeTechColumnEditor() {
    this.setData({ showTechColumnEditor: false })
  },
  saveTechColumns() {
    const cKey = this.data.techEditingCategoryKey
    const cats = this.data.techMaterialData.categories
    const cIdx = cats.findIndex(c => c.key === cKey)
    if (cIdx === -1) return
    this.setData({
      [`techMaterialData.categories[${cIdx}].mergedColumns`]: this.data.techEditingColumns,
      showTechColumnEditor: false
    })
  },
  openTechAddColumnModal() {
    this.setData({
      showTechAddColumnModal: true,
      techNewColumnData: { key: '', label: '', type: 'number', unit: '', role: 'input', formula: '' }
    })
  },
  closeTechAddColumnModal() {
    this.setData({ showTechAddColumnModal: false })
  },
  onTechNewColInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`techNewColumnData.${field}`]: e.detail.value })
  },
  onTechNewColRoleChange(e) {
    this.setData({ 'techNewColumnData.role': ['input', 'output'][e.detail.value] })
  },
  onTechNewColTypeChange(e) {
    this.setData({ 'techNewColumnData.type': ['number', 'text'][e.detail.value] })
  },
  confirmAddTechColumn() {
    const col = this.data.techNewColumnData
    if (!col.key || !col.label) {
      wx.showToast({ title: '请填写列标识和名称', icon: 'none' })
      return
    }
    const cols = [...this.data.techEditingColumns, Object.assign({}, col)]
    this.setData({ techEditingColumns: cols, showTechAddColumnModal: false })
  },
  onTechEditColInput(e) {
    const { idx, field } = e.currentTarget.dataset
    this.setData({ [`techEditingColumns[${idx}].${field}`]: e.detail.value })
  },
  moveTechEditCol(e) {
    const { idx, dir } = e.currentTarget.dataset
    const cols = [...this.data.techEditingColumns]
    const i = parseInt(idx)
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= cols.length) return
    ;[cols[i], cols[j]] = [cols[j], cols[i]]
    this.setData({ techEditingColumns: cols })
  },
  onTechEditColRoleChange(e) {
    const idx = e.currentTarget.dataset.idx
    const role = ['input', 'output'][e.detail.value]
    this.setData({ [`techEditingColumns[${idx}].role`]: role })
  },
  deleteTechColumn(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ techEditingColumns: this.data.techEditingColumns.filter(c => c.key !== key) })
  },
  onTechColFormulaInput(e) {
    const key = e.currentTarget.dataset.key
    const cols = this.data.techEditingColumns
    const idx = cols.findIndex(c => c.key === key)
    if (idx === -1) return
    this.setData({ [`techEditingColumns[${idx}].formula`]: e.detail.value })
  },

  // --- 零件模版预存 ---
  openPartPresetManager() {
    this.setData({ showPartPresetManager: true })
    var _r = this.data.userRole
    if (_r === 'TECH' || _r === 'PROCESS' || _r === 'ADMIN') {
      this.loadPartPresets()
    }
  },
  closePartPresetManager() {
    this.setData({ showPartPresetManager: false, editingPartPreset: null, presetManagerTab: 'ALL' })
  },
  switchPresetManagerTab(e) {
    this.setData({ presetManagerTab: e.currentTarget.dataset.tab })
  },
  loadPartPresets() {
    api.getPartPresets().then(list => {
      this.setData({ partPresets: list || [] })
      this._updateFilteredPresets()
    }).catch(() => {})
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
  onPresetFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`partPresetForm.${field}`]: e.detail.value })
  },
  onPresetProcessFeeToggle(e) {
    this.setData({ 'partPresetForm.hasProcessFee': e.detail.value })
  },
  // 加工费下拉：名称输入时模糊搜索
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
  // 加工费下拉：选择预存项填入
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
  // 预存弹窗：打开
  openProcessFeePresetModal() {
    this.setData({
      showProcessFeeModal: true,
      pfModalForm: { label: '', defaultRate: '' },
      editingProcessFeePreset: null
    })
    api.searchProcessFeePresets('').then(list => {
      this.setData({ processFeePresets: list || [] })
    }).catch(() => {
      this.setData({ processFeePresets: [] })
    })
  },
  closeProcessFeePresetModal() {
    this.setData({ showProcessFeeModal: false })
  },
  // 预存弹窗：表单输入
  onPfModalInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`pfModalForm.${field}`]: e.detail.value })
  },
  // 预存弹窗：保存（新增或更新）
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
  // 预存弹窗：编辑某项
  editPfPresetItem(e) {
    const idx = e.currentTarget.dataset.idx
    const item = this.data.processFeePresets[idx]
    if (!item) return
    this.setData({
      pfModalForm: { label: item.label, defaultRate: item.defaultRate || '' },
      editingProcessFeePreset: item
    })
  },
  // 预存弹窗：删除某项
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
  // 预存弹窗：取消编辑
  cancelPfEdit() {
    this.setData({
      pfModalForm: { label: '', defaultRate: '' },
      editingProcessFeePreset: null
    })
  },
  _loadPfModalList() {
    api.searchProcessFeePresets('').then(list => {
      this.setData({ processFeePresets: list || [] })
    })
  },

  // ========== 材料预算系数弹窗 ==========
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
  // 内联材料预算系数：类型选择
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
  cancelEditPreset() {
    this.setData({ editingPartPreset: null })
  },

  // --- 添加零件搜索弹窗 ---
  openAddPartSearch(e) {
    const cKey = e.currentTarget.dataset.ckey || 'A'
    const presets = this.data.partPresets || []
    const filtered = presets.filter(p => p.category === cKey)
    const results = this._parsePresetsForSearch(filtered)
    this.setData({
      showAddPartSearchModal: true,
      addPartSearchCategory: cKey,
      addPartSearchKey: '',
      addPartSearchResults: results,
      addPartExpandedId: null,
      addPartEditValues: {},
      showCategoryAddMenu: ''
    })
  },
  closeAddPartSearch() {
    this.setData({ showAddPartSearchModal: false, addPartSearchKey: '', addPartSearchResults: [], addPartExpandedId: null, addPartEditValues: {}, addPartSubtotal: '0', addPartQuickQty: {}, addPartBatchCount: 0 })
  },
  onAddPartSearchInput(e) {
    const value = e.detail.value || ''
    this.data.addPartSearchKey = value
    const key = value.trim().toLowerCase()
    const cKey = this.data.addPartSearchCategory
    const presets = this.data.partPresets || []
    let filtered = presets.filter(p => p.category === cKey)
    if (key) {
      filtered = filtered.filter(p => {
        const name = (p.name || '').toLowerCase()
        const partNo = (p.partNo || '').toLowerCase()
        return name.includes(key) || partNo.includes(key)
      })
    }
    const results = this._parsePresetsForSearch(filtered)
    this.setData({ addPartSearchResults: results })
  },
  clearAddPartSearch() {
    this.setData({ addPartSearchKey: '' })
    this.onAddPartSearchInput({ detail: { value: '' } })
  },
  _parsePresetsForSearch(presets) {
    return presets.map(p => {
      let cols = []
      try { cols = JSON.parse(p.columnsJson || '[]') } catch (e) {}
      let dv = {}
      try { dv = JSON.parse(p.defaultValuesJson || '{}') } catch (e) {}
      return {
        ...p,
        _parsedColumns: cols,
        _parsedDefaults: dv,
        _parsedProcessFee: p.hasProcessFee === 1
      }
    })
  },
  toggleAddPartExpand(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    if (this.data.addPartExpandedId === id) {
      this.setData({ addPartExpandedId: null, addPartEditValues: {} })
      return
    }
    const preset = this.data.addPartSearchResults.find(p => p.id === id)
    if (!preset) return
    const editValues = { ...preset._parsedDefaults }
    this.setData({ addPartExpandedId: id, addPartEditValues: editValues })
    this._recalcAddPartOutputs(preset, editValues)
  },
  onAddPartValueInput(e) {
    const field = e.currentTarget.dataset.field
    const val = e.detail.value
    this.setData({ [`addPartEditValues.${field}`]: val })
    const preset = this.data.addPartSearchResults.find(p => p.id === this.data.addPartExpandedId)
    if (preset) this._recalcAddPartOutputs(preset, { ...this.data.addPartEditValues, [field]: val })
  },
  _recalcAddPartOutputs(preset, editValues) {
    const cols = preset._parsedColumns || []
    const computed = {}
    cols.forEach(c => { computed[c.key] = parseFloat(editValues[c.key]) || 0 })
    // 注入系统变量
    computed.processFee = parseFloat(preset.processFeeDefault) || 0
    computed.alPrice = parseFloat(this.data.alPrice) || 0
    let mc = null
    try { mc = JSON.parse(preset.materialCostJson || 'null') } catch (e) {}
    computed.mcFactor = mc ? (parseFloat(mc.factor) || 0) : 0
    computed.mcWeight = mc ? (parseFloat(mc.weight) || 0) : 0
    computed.mcThickness = mc ? (parseFloat(mc.thickness) || 0) : 0
    const updates = {}
    let lastOutputKey = ''
    cols.forEach(col => {
      if (col.role === 'output' && col.formula) {
        const vars = Object.assign({}, computed)
        const val = formula.evaluate(col.formula, vars)
        computed[col.key] = val // 链式计算保留完整精度
        const decimals = this._getColumnDecimals(col.key)
        const result = this._roundTo(val || 0, decimals)
        updates[`addPartEditValues.${col.key}`] = result
        lastOutputKey = col.key
      }
    })
    // 小计取金额列（匹配 amount/金额），否则取最后一个输出列
    const amountCol = cols.find(c => c.role === 'output' && (/amount|金额/i.test(c.key) || /amount|金额/i.test(c.label)))
    const subtotalKey = amountCol ? amountCol.key : lastOutputKey
    const rawSubtotal = subtotalKey ? (computed[subtotalKey] || 0) : 0
    updates.addPartSubtotal = this._roundTo(rawSubtotal, 2)
    this.setData(updates)
  },
  confirmAddPartFromSearch(e) {
    const presetId = parseInt(e.currentTarget.dataset.id)
    const preset = (this.data.partPresets || []).find(p => p.id === presetId)
    if (!preset) return
    const cKey = this.data.addPartSearchCategory
    const cats = this.data.techMaterialData.categories
    const cIdx = cats.findIndex(c => c.key === cKey)
    if (cIdx === -1) return
    let columns
    try { columns = JSON.parse(preset.columnsJson) } catch (e) { return }
    const newRow = {
      id: this._nextTechRowId(),
      _partNo: preset.partNo || '',
      _partName: preset.name,
      _material: preset.material || '',
      _presetId: preset.id,
      _columns: JSON.parse(JSON.stringify(columns)),
      _hasProcessFee: preset.hasProcessFee === 1,
      _processFeeLabel: preset.processFeeLabel || '',
      _processFeeValue: preset.processFeeDefault || '',
      _materialCost: null
    }
    try {
      const mc = JSON.parse(preset.materialCostJson || 'null')
      if (mc) newRow._materialCost = mc
    } catch (e) {}
    this._buildRowMeta(newRow)
    columns.forEach(col => { newRow[col.key] = '' })
    // 用弹窗中编辑过的值覆盖默认值
    const editValues = this.data.addPartEditValues || {}
    Object.keys(editValues).forEach(k => {
      if (editValues[k] !== '' && editValues[k] != null) newRow[k] = editValues[k]
    })
    // 未编辑的字段用模版默认值填充
    try {
      const dv = JSON.parse(preset.defaultValuesJson || '{}')
      Object.keys(dv).forEach(k => {
        if (newRow[k] === '' || newRow[k] == null) newRow[k] = dv[k]
      })
    } catch (e) {}
    this._remapNewRowColumns(cIdx, newRow)
    this.setData({
      [`techMaterialData.categories[${cIdx}].rows`]: [...cats[cIdx].rows, newRow],
      showAddPartSearchModal: false,
      addPartSearchKey: '',
      addPartSearchResults: [],
      addPartExpandedId: null,
      addPartEditValues: {},
      addPartSubtotal: '0',
      addPartQuickQty: {},
      addPartBatchCount: 0
    })
    this._rebuildMergedColumns(cIdx)
    const newRIdx = this.data.techMaterialData.categories[cIdx].rows.length - 1
    this._recalcTechRow(cIdx, newRIdx)
  },
  onAddPartQtyPlus(e) {
    const id = e.currentTarget.dataset.id
    const cur = parseInt(this.data.addPartQuickQty[id]) || 0
    this.setData({ [`addPartQuickQty.${id}`]: cur + 1 })
    this._updateBatchCount()
  },
  onAddPartQtyMinus(e) {
    const id = e.currentTarget.dataset.id
    const cur = parseInt(this.data.addPartQuickQty[id]) || 0
    if (cur <= 0) return
    this.setData({ [`addPartQuickQty.${id}`]: cur - 1 })
    this._updateBatchCount()
  },
  onAddPartQtyInput(e) {
    const id = e.currentTarget.dataset.id
    const val = parseInt(e.detail.value) || 0
    this.setData({ [`addPartQuickQty.${id}`]: val < 0 ? 0 : val })
    this._updateBatchCount()
  },
  _updateBatchCount() {
    const qMap = this.data.addPartQuickQty || {}
    var count = 0
    Object.keys(qMap).forEach(function (k) { if (parseInt(qMap[k]) > 0) count++ })
    this.setData({ addPartBatchCount: count })
  },
  quickAddPartFromSearch(e) {
    const presetId = parseInt(e.currentTarget.dataset.id)
    const qty = (this.data.addPartQuickQty[presetId] || '').trim()
    if (!qty) {
      wx.showToast({ title: '请输入数量', icon: 'none' })
      return
    }
    const preset = (this.data.partPresets || []).find(p => p.id === presetId)
    if (!preset) return
    const cKey = this.data.addPartSearchCategory
    const cats = this.data.techMaterialData.categories
    const cIdx = cats.findIndex(c => c.key === cKey)
    if (cIdx === -1) return
    let columns
    try { columns = JSON.parse(preset.columnsJson) } catch (e) { return }
    const newRow = {
      id: this._nextTechRowId(),
      _partNo: preset.partNo || '',
      _partName: preset.name,
      _material: preset.material || '',
      _presetId: preset.id,
      _columns: JSON.parse(JSON.stringify(columns)),
      _hasProcessFee: preset.hasProcessFee === 1,
      _processFeeLabel: preset.processFeeLabel || '',
      _processFeeValue: preset.processFeeDefault || '',
      _materialCost: null
    }
    try {
      const mc = JSON.parse(preset.materialCostJson || 'null')
      if (mc) newRow._materialCost = mc
    } catch (e) {}
    this._buildRowMeta(newRow)
    columns.forEach(col => { newRow[col.key] = '' })
    try {
      const dv = JSON.parse(preset.defaultValuesJson || '{}')
      Object.keys(dv).forEach(k => { newRow[k] = dv[k] })
    } catch (e) {}
    const inputs = columns.filter(c => c.role === 'input')
    const qtyCol = inputs.find(c => c.key === 'qty' || c.label === '数量')
      || inputs.find(c => /^(qty|quantity|num)$/i.test(c.key) || /^数量$/.test(c.label))
      || inputs.find(c => /qty|数量|quantity/i.test(c.key) || /qty|数量|quantity/i.test(c.label))
    const qtyKey = qtyCol ? qtyCol.key : 'qty'
    newRow[qtyKey] = qty
    this._remapNewRowColumns(cIdx, newRow)
    this.setData({
      [`techMaterialData.categories[${cIdx}].rows`]: [...cats[cIdx].rows, newRow],
      showAddPartSearchModal: false,
      addPartSearchKey: '',
      addPartSearchResults: [],
      addPartExpandedId: null,
      addPartEditValues: {},
      addPartSubtotal: '0',
      addPartQuickQty: {},
      addPartBatchCount: 0
    })
    this._rebuildMergedColumns(cIdx)
    const newRIdx = this.data.techMaterialData.categories[cIdx].rows.length - 1
    this._recalcTechRow(cIdx, newRIdx)
  },
  batchAddParts() {
    const qMap = this.data.addPartQuickQty || {}
    const presets = this.data.partPresets || []
    const cKey = this.data.addPartSearchCategory
    const cats = this.data.techMaterialData.categories
    const cIdx = cats.findIndex(c => c.key === cKey)
    if (cIdx === -1) return
    const newRows = []
    const self = this
    Object.keys(qMap).forEach(function (idStr) {
      const qty = parseInt(qMap[idStr])
      if (!qty || qty <= 0) return
      const preset = presets.find(p => p.id === parseInt(idStr))
      if (!preset) return
      let columns
      try { columns = JSON.parse(preset.columnsJson) } catch (e) { return }
      const newRow = {
        id: self._nextTechRowId(),
        _partNo: preset.partNo || '',
        _partName: preset.name,
        _material: preset.material || '',
        _presetId: preset.id,
        _columns: JSON.parse(JSON.stringify(columns)),
        _hasProcessFee: preset.hasProcessFee === 1,
        _processFeeLabel: preset.processFeeLabel || '',
        _processFeeValue: preset.processFeeDefault || '',
        _materialCost: null
      }
      try {
        const mc = JSON.parse(preset.materialCostJson || 'null')
        if (mc) newRow._materialCost = mc
      } catch (e) {}
      self._buildRowMeta(newRow)
      columns.forEach(function (col) { newRow[col.key] = '' })
      try {
        const dv = JSON.parse(preset.defaultValuesJson || '{}')
        Object.keys(dv).forEach(function (k) { newRow[k] = dv[k] })
      } catch (e) {}
      // 填入数量
      const inputs = columns.filter(c => c.role === 'input')
      const qtyCol = inputs.find(c => c.key === 'qty' || c.label === '数量')
        || inputs.find(c => /^(qty|quantity|num)$/i.test(c.key) || /^数量$/.test(c.label))
        || inputs.find(c => /qty|数量|quantity/i.test(c.key) || /qty|数量|quantity/i.test(c.label))
      newRow[qtyCol ? qtyCol.key : 'qty'] = String(qty)
      self._remapNewRowColumns(cIdx, newRow)
      newRows.push(newRow)
    })
    if (!newRows.length) {
      wx.showToast({ title: '请先设置数量', icon: 'none' })
      return
    }
    this.setData({
      [`techMaterialData.categories[${cIdx}].rows`]: [...cats[cIdx].rows, ...newRows],
      showAddPartSearchModal: false,
      addPartSearchKey: '',
      addPartSearchResults: [],
      addPartExpandedId: null,
      addPartEditValues: {},
      addPartSubtotal: '0',
      addPartQuickQty: {},
      addPartBatchCount: 0
    })
    this._rebuildMergedColumns(cIdx)
    // 逐行计算（用 this.data 取 setData 后的最新数据）
    const updatedRows = this.data.techMaterialData.categories[cIdx].rows
    const startIdx = updatedRows.length - newRows.length
    for (var i = 0; i < newRows.length; i++) {
      this._recalcTechRow(cIdx, startIdx + i)
    }
    wx.showToast({ title: '已添加' + newRows.length + '个零件', icon: 'success' })
  },
  addSimplePartFromSearch() {
    const cKey = this.data.addPartSearchCategory
    const cats = this.data.techMaterialData.categories
    const cIdx = cats.findIndex(c => c.key === cKey)
    if (cIdx === -1) return
    const simpleCols = [
      { key: 'qty', label: '数量', type: 'number', role: 'input' },
      { key: 'weight', label: '重量(KG)', type: 'number', role: 'input' },
      { key: 'unitPrice', label: '单价', type: 'number', role: 'input' },
      { key: 'amount', label: '金额(元)', type: 'number', role: 'output', formula: 'qty*unitPrice' }
    ]
    const newRow = {
      id: this._nextTechRowId(),
      _partNo: '',
      _partName: '',
      _material: '',
      _columns: simpleCols
    }
    this._buildRowMeta(newRow)
    simpleCols.forEach(col => { newRow[col.key] = '' })
    this.setData({
      [`techMaterialData.categories[${cIdx}].rows`]: [...cats[cIdx].rows, newRow],
      showAddPartSearchModal: false,
      addPartSearchKey: '',
      addPartSearchResults: [],
      addPartExpandedId: null,
      addPartEditValues: {},
      addPartSubtotal: '0',
      addPartQuickQty: {},
      addPartBatchCount: 0
    })
    this._rebuildMergedColumns(cIdx)
  },

  // 从模版添加零件（保留兼容）
  addPartFromPreset(e) {
    const presetId = e.currentTarget.dataset.id
    const preset = this.data.partPresets.find(p => p.id === parseInt(presetId))
    if (!preset) return
    const cKey = e.currentTarget.dataset.ckey || preset.category || 'A'
    const cats = this.data.techMaterialData.categories
    const cIdx = cats.findIndex(c => c.key === cKey)
    if (cIdx === -1) return
    let columns
    try { columns = JSON.parse(preset.columnsJson) } catch (e) { return }
    const newRow = {
      id: this._nextTechRowId(),
      _partNo: preset.partNo || '',
      _partName: preset.name,
      _material: preset.material || '',
      _presetId: preset.id,
      _columns: JSON.parse(JSON.stringify(columns)),
      _hasProcessFee: preset.hasProcessFee === 1,
      _processFeeLabel: preset.processFeeLabel || '',
      _processFeeValue: preset.processFeeDefault || '',
      _materialCost: null
    }
    // 解析材料预算系数
    try {
      const mc = JSON.parse(preset.materialCostJson || 'null')
      if (mc) newRow._materialCost = mc
    } catch (e) {}
    this._buildRowMeta(newRow)
    columns.forEach(col => { newRow[col.key] = '' })
    // 填入默认值
    try {
      const dv = JSON.parse(preset.defaultValuesJson || '{}')
      Object.keys(dv).forEach(k => { newRow[k] = dv[k] })
    } catch (e) {}
    this._remapNewRowColumns(cIdx, newRow)
    this.setData({
      [`techMaterialData.categories[${cIdx}].rows`]: [...cats[cIdx].rows, newRow],
      showCategoryAddMenu: ''
    })
    this._rebuildMergedColumns(cIdx)
  },

  // 添加空白简单行
  addSimplePart(e) {
    const cKey = e.currentTarget.dataset.ckey || 'C'
    const cats = this.data.techMaterialData.categories
    const cIdx = cats.findIndex(c => c.key === cKey)
    if (cIdx === -1) return
    const simpleCols = [
      { key: 'qty', label: '数量', type: 'number', role: 'input' },
      { key: 'weight', label: '重量(KG)', type: 'number', role: 'input' },
      { key: 'unitPrice', label: '单价', type: 'number', role: 'input' },
      { key: 'amount', label: '金额(元)', type: 'number', role: 'output', formula: 'qty*unitPrice' }
    ]
    const newRow = {
      id: this._nextTechRowId(),
      _partNo: '',
      _partName: '',
      _material: '',
      _columns: simpleCols
    }
    this._buildRowMeta(newRow)
    simpleCols.forEach(col => { newRow[col.key] = '' })
    this.setData({
      [`techMaterialData.categories[${cIdx}].rows`]: [...cats[cIdx].rows, newRow],
      showCategoryAddMenu: ''
    })
    this._rebuildMergedColumns(cIdx)
  },

  // ==================== 生产工序Tab ====================
  toggleProdEditing() {
    if (this.data.prodReadonly) return
    this.setData({ prodEditing: !this.data.prodEditing, showProdAddMenu: false, showProdTplMenu: false })
  },
  toggleProdAddMenu() {
    this.setData({ showProdAddMenu: !this.data.showProdAddMenu, showProdTplMenu: false })
  },
  toggleProdTplMenu() {
    this.setData({ showProdTplMenu: !this.data.showProdTplMenu, showProdAddMenu: false })
  },
  closeProdMenus() {
    this.setData({ showProdAddMenu: false, showProdTplMenu: false })
  },
  _getSectionsKey(dtype) {
    return dtype === 'energy' ? 'energySections' : dtype === 'moldFee' ? 'moldFeeSections' : 'sections'
  },
  _getDtype(e) {
    return (e && e.currentTarget && e.currentTarget.dataset.dtype) || 'process'
  },
  _getAllSections() {
    const data = this.data.customProcessData
    if (!data) return []
    return [].concat(data.sections || [], data.energySections || [], data.moldFeeSections || [])
  },
  onCellFocus(e) {
    const { skey, id, field } = e.currentTarget.dataset
    const dtype = this._getDtype(e)
    const arrKey = this._getSectionsKey(dtype)
    const sec = (this.data.customProcessData[arrKey] || []).find(s => s.key === skey)
    if (!sec) return
    const rowIndex = sec.rows.findIndex(r => r.id === parseInt(id))
    if (rowIndex === -1) return
    this.setData({ focusedCellAddress: formula.getCellAddress(skey, field, rowIndex) })
  },
  onCellBlur() {
    this.setData({ focusedCellAddress: '' })
  },
  _replaceKeyInFormulas(data, oldKey, newKey) {
    const re = new RegExp('\\b' + oldKey + '\\.', 'g')
    const replacement = newKey + '.'
    const allSecs = [].concat(data.sections || [], data.energySections || [])
    allSecs.forEach(sec => {
      sec.columns.forEach(col => {
        if (col.formula) col.formula = col.formula.replace(re, replacement)
      })
    })
    ;(data.summary || []).forEach(item => {
      if (item.formula) item.formula = item.formula.replace(re, replacement)
    })
  },

  // 新报价单继承上一个报价单的工艺结构
  loadLastUsedStructure() {
    api.getLastUsedProcessStructure().then(json => {
      // 防止覆盖已由 loadSavedProcesses 填充的数据
      if (this.data.customProcessData && this.data.customProcessData.sections && this.data.customProcessData.sections.length) return
      if (json) {
        try {
          let structure = typeof json === 'string' ? JSON.parse(json) : json
          if (structure && structure.mode === 'custom' && structure.sections) {
            structure.sections.forEach(s => {
              s.rows = []
              if (s.columns) s.columns.forEach(col => { if (!col.label) col.label = col.key })
            })
            if (!structure.energySections) structure.energySections = []
            if (!structure.moldFeeSections) structure.moldFeeSections = []
            // 兼容旧数据：合并 energySummary 到 summary
            if (structure.energySummary && structure.energySummary.length) {
              structure.summary = [].concat(structure.summary || [], structure.energySummary)
            }
            delete structure.energySummary
            this.setData({ customProcessData: structure })
          } else {
            this.setData({ customProcessData: { mode: 'custom', sections: [], summary: [], energySections: [], moldFeeSections: [] } })
          }
        } catch (e) {
          this.setData({ customProcessData: { mode: 'custom', sections: [], summary: [], energySections: [], moldFeeSections: [] } })
        }
      } else {
        this.setData({ customProcessData: { mode: 'custom', sections: [], summary: [], energySections: [], moldFeeSections: [] } })
      }
    }).catch(() => {
      this.setData({ customProcessData: { mode: 'custom', sections: [], summary: [], energySections: [], moldFeeSections: [] } })
    })
  },

  // ==================== 模版管理 ====================
  openTemplateManager() {
    this.loadTemplates()
    this.setData({ showTemplateManager: true, newTemplateName: '', previewTemplateData: null, previewTemplateName: '', showProdAddMenu: false, showProdTplMenu: false })
  },
  closeTemplateManager() {
    this.setData({ showTemplateManager: false, previewTemplateData: null, previewTemplateName: '' })
  },
  loadTemplates() {
    api.getProcessTemplates().then(list => {
      this.setData({ processTemplates: list || [] })
    }).catch(() => {})
  },
  onNewTemplateNameInput(e) {
    this.setData({ newTemplateName: e.detail.value })
  },
  _normalizeProcessTemplateData(data, fallbackData) {
    const normalized = data || {}
    const fallback = fallbackData || {}
    normalized.mode = 'custom'
    normalized.sections = normalized.sections || []
    normalized.energySections = normalized.energySections || []
    normalized.moldFeeSections = normalized.moldFeeSections || []
    normalized.summary = normalized.summary || []
    if (normalized.energySummary && normalized.energySummary.length) {
      normalized.summary = [].concat(normalized.summary, normalized.energySummary)
    }
    delete normalized.energySummary
    ;[].concat(normalized.sections, normalized.energySections, normalized.moldFeeSections).forEach(sec => {
      sec.columns = sec.columns || []
      sec.rows = sec.rows || []
      sec.columns.forEach(col => { if (!col.label) col.label = col.key })
      sec.rows.forEach(row => {
        row.params = row.params || []
        row.subGroups = row.subGroups || []
        row.subGroups.forEach(sg => { sg.variables = sg.variables || [] })
      })
    })
    ;(normalized.energySections || []).forEach(sec => {
      if (!sec.subtype) {
        sec.subtype = (sec.columns && sec.columns.length) ? 'device' : 'material'
      }
      if (sec.subtype === 'material') {
        sec.rows.forEach(row => {
          if (row.amount === undefined) row.amount = 0
        })
      }
    })
    if ((!normalized.energySections || !normalized.energySections.length) && fallback.energySections && fallback.energySections.length) {
      normalized.energySections = fallback.energySections
    }
    if ((!normalized.moldFeeSections || !normalized.moldFeeSections.length) && fallback.moldFeeSections && fallback.moldFeeSections.length) {
      normalized.moldFeeSections = fallback.moldFeeSections
    }
    return normalized
  },
  openTemplatePreview(e) {
    const id = e.currentTarget.dataset.id
    const tpl = this.data.processTemplates.find(t => t.id === id)
    if (!tpl) return
    try {
      const data = this._normalizeProcessTemplateData(JSON.parse(tpl.templateJson))
      this.setData({ previewTemplateData: data, previewTemplateName: tpl.name })
    } catch (err) {
      wx.showToast({ title: '模版数据异常', icon: 'none' })
    }
  },
  closeTemplatePreview() {
    this.setData({ previewTemplateData: null, previewTemplateName: '' })
  },
  saveCurrentAsTemplate() {
    const name = this.data.newTemplateName.trim()
    if (!name) {
      wx.showToast({ title: '请输入模版名称', icon: 'none' })
      return
    }
    const cpd = this.data.customProcessData
    if (!cpd) {
      wx.showToast({ title: '当前无工艺结构', icon: 'none' })
      return
    }
    const structure = JSON.parse(JSON.stringify(cpd))
    structure.mode = 'custom'
    structure.sections = structure.sections || []
    structure.energySections = structure.energySections || []
    structure.moldFeeSections = structure.moldFeeSections || []
    structure.summary = structure.summary || []
    ;[].concat(structure.sections, structure.energySections, structure.moldFeeSections).forEach(function (s) {
      delete s._numCols; delete s.subtotalValue; delete s.subtotalLabel
      ;(s.rows || []).forEach(function (r) { delete r._collapsed })
    })
    api.createProcessTemplate({ name, templateJson: JSON.stringify(structure) }).then(() => {
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.setData({ newTemplateName: '' })
      this.loadTemplates()
    }).catch(() => {})
  },
  renameTemplate(e) {
    const { id, name } = e.currentTarget.dataset
    const that = this
    wx.showModal({
      title: '重命名模版',
      editable: true,
      placeholderText: name,
      success(res) {
        if (res.confirm && res.content && res.content.trim()) {
          api.updateProcessTemplate(id, { name: res.content.trim() }).then(() => {
            wx.showToast({ title: '已重命名', icon: 'success' })
            that.loadTemplates()
          }).catch(() => {})
        }
      }
    })
  },
  deleteTemplate(e) {
    const { id, name } = e.currentTarget.dataset
    const that = this
    wx.showModal({
      title: '删除模版',
      content: '确认删除模版"' + name + '"？',
      success(res) {
        if (res.confirm) {
          api.deleteProcessTemplate(id).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' })
            that.loadTemplates()
          }).catch(() => {})
        }
      }
    })
  },
  updateTemplateContent(e) {
    const { id, name } = e.currentTarget.dataset
    const cpd = this.data.customProcessData
    if (!cpd) {
      wx.showToast({ title: '当前无工艺结构', icon: 'none' })
      return
    }
    const that = this
    wx.showModal({
      title: '更新模版',
      content: '将当前工艺结构覆盖到模版"' + name + '"，确认？',
      success(res) {
        if (res.confirm) {
          const structure = JSON.parse(JSON.stringify(cpd))
          structure.mode = 'custom'
          structure.sections = structure.sections || []
          structure.energySections = structure.energySections || []
          structure.moldFeeSections = structure.moldFeeSections || []
          structure.summary = structure.summary || []
          ;[].concat(structure.sections, structure.energySections, structure.moldFeeSections).forEach(function (s) {
            delete s._numCols; delete s.subtotalValue; delete s.subtotalLabel
            ;(s.rows || []).forEach(function (r) { delete r._collapsed })
          })
          api.updateProcessTemplate(id, { name, templateJson: JSON.stringify(structure) }).then(() => {
            wx.showToast({ title: '已更新', icon: 'success' })
            that.loadTemplates()
          }).catch(() => {})
        }
      }
    })
  },
  openApplyTemplate() {
    this.loadTemplates()
    this.setData({ showApplyTemplate: true, showProdAddMenu: false, showProdTplMenu: false })
  },
  closeApplyTemplate() {
    this.setData({ showApplyTemplate: false })
  },
  applyTemplate(e) {
    const id = e.currentTarget.dataset.id
    const tpl = this.data.processTemplates.find(t => t.id === id)
    if (!tpl) return
    const that = this
    wx.showModal({
      title: '运用模版',
      content: '运用模版将覆盖当前区域、列、行数据和汇总结构，确认？',
      success(res) {
        if (res.confirm) {
          try {
            const structure = that._normalizeProcessTemplateData(JSON.parse(tpl.templateJson), that.data.customProcessData)
            that.setData({ customProcessData: structure, showApplyTemplate: false })
            that.recalcAllSections()
            that.recalcSummary()
            wx.showToast({ title: '已运用', icon: 'success' })
          } catch (err) {
            wx.showToast({ title: '模版数据异常', icon: 'none' })
          }
        }
      }
    })
  },

  // 区域操作
  openAddSectionModal(e) {
    const dtype = this._getDtype(e)
    const subtype = e.currentTarget.dataset.subtype || ''
    this.setData({ showAddSectionModal: true, isRenamingSection: false, renameSectionOriginalKey: '', newSectionName: '', newSectionKey: '', editingDtype: dtype, editingSubtype: subtype, showProdAddMenu: false, showProdTplMenu: false })
  },
  closeAddSectionModal() {
    this.setData({ showAddSectionModal: false })
  },
  onNewSectionNameInput(e) {
    this.setData({ newSectionName: e.detail.value })
  },
  onNewSectionKeyInput(e) {
    this.setData({ newSectionKey: e.detail.value })
  },
  confirmAddSection() {
    const name = this.data.newSectionName.trim()
    if (!name) { wx.showToast({ title: '请输入区域名称', icon: 'none' }); return }
    const key = (this.data.newSectionKey || '').trim()
    if (!key) { wx.showToast({ title: '请输入区域变量名', icon: 'none' }); return }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) { wx.showToast({ title: '变量名仅限英文字母/数字/下划线', icon: 'none' }); return }
    const data = this.data.customProcessData
    const dtype = this.data.editingDtype
    const arrKey = this._getSectionsKey(dtype)
    if (!data[arrKey]) data[arrKey] = []

    if (this.data.isRenamingSection) {
      const oldKey = this.data.renameSectionOriginalKey
      const sec = data[arrKey].find(s => s.key === oldKey)
      if (!sec) return
      if (key !== oldKey && data[arrKey].some(s => s.key === key)) {
        wx.showToast({ title: '区域变量名已存在', icon: 'none' }); return
      }
      sec.label = name
      if (key !== oldKey) {
        sec.key = key
        this._replaceKeyInFormulas(data, oldKey, key)
      }
      this.setData({ customProcessData: data, showAddSectionModal: false })
      this.recalcAllSections()
      this.recalcSummary()
      return
    }

    if (data[arrKey].some(s => s.key === key)) { wx.showToast({ title: '区域变量名已存在', icon: 'none' }); return }
    const moldFeeCols = [
      { key: 'name', label: '工模名称', type: 'text', role: 'input' },
      { key: 'qty', label: '数量', type: 'number', role: 'input' },
      { key: 'price', label: '单价', unit: '元', type: 'number', role: 'input' }
    ]
    const subtype = this.data.editingSubtype || ''
    var defaultCols
    if (dtype === 'moldFee') {
      defaultCols = moldFeeCols
    } else if (dtype === 'energy' && subtype === 'device') {
      defaultCols = [{ key: 'name', label: '名称', type: 'text', role: 'input' }]
    } else if (dtype === 'energy') {
      defaultCols = []
    } else {
      defaultCols = [{ key: 'name', label: '工序名称', type: 'text', role: 'input' }]
    }
    var newSec = {
      key, label: name, collapsed: false,
      columns: defaultCols,
      rows: [],
      includedInSummary: true
    }
    if (dtype === 'energy') newSec.subtype = subtype || 'material'
    data[arrKey].push(newSec)
    this.setData({ customProcessData: data, showAddSectionModal: false })
  },

  renameSection(e) {
    const sKey = e.currentTarget.dataset.skey
    const dtype = this._getDtype(e)
    const arrKey = this._getSectionsKey(dtype)
    const data = this.data.customProcessData
    const sec = (data[arrKey] || []).find(s => s.key === sKey)
    if (!sec) return
    this.setData({
      showAddSectionModal: true, isRenamingSection: true,
      renameSectionOriginalKey: sKey, newSectionName: sec.label, newSectionKey: sec.key,
      editingDtype: dtype
    })
  },

  deleteSection(e) {
    const sKey = e.currentTarget.dataset.skey
    const dtype = this._getDtype(e)
    const arrKey = this._getSectionsKey(dtype)
    const that = this
    wx.showModal({
      title: '删除区域',
      content: '确认删除该区域及其所有数据？',
      success(res) {
        if (res.confirm) {
          const data = that.data.customProcessData
          data[arrKey] = (data[arrKey] || []).filter(s => s.key !== sKey)
          that.setData({ customProcessData: data })
          that.recalcAllSections()
          that.recalcSummary()
        }
      }
    })
  },

  toggleSectionCollapse(e) {
    const sKey = e.currentTarget.dataset.skey
    const dtype = this._getDtype(e)
    const arrKey = this._getSectionsKey(dtype)
    const data = this.data.customProcessData
    const sec = (data[arrKey] || []).find(s => s.key === sKey)
    if (sec) { sec.collapsed = !sec.collapsed; this.setData({ customProcessData: data }) }
  },

  // 列编辑
  openColumnEditor(e) {
    const sKey = e.currentTarget.dataset.skey
    const dtype = this._getDtype(e)
    const arrKey = this._getSectionsKey(dtype)
    const data = this.data.customProcessData
    const sec = (data[arrKey] || []).find(s => s.key === sKey)
    if (!sec) return
    this.setData({
      showColumnEditor: true,
      editingColumnSectionKey: sKey,
      editingColumns: JSON.parse(JSON.stringify(sec.columns)),
      editingDtype: dtype
    })
  },
  closeColumnEditor() {
    this.setData({ showColumnEditor: false })
  },
  saveColumnEditor() {
    const { editingColumnSectionKey, editingColumns, customProcessData, editingDtype } = this.data
    const arrKey = this._getSectionsKey(editingDtype)
    const sec = (customProcessData[arrKey] || []).find(s => s.key === editingColumnSectionKey)
    if (!sec) return
    const oldKeys = sec.columns.map(c => c.key)
    const newKeys = editingColumns.map(c => c.key)
    const removed = oldKeys.filter(k => !newKeys.includes(k))
    sec.columns = editingColumns
    if (removed.length) {
      sec.rows.forEach(row => { removed.forEach(k => { delete row[k] }) })
    }
    this.setData({ customProcessData, showColumnEditor: false })
    this.recalcSection(editingColumnSectionKey, editingDtype)
    this.recalcSummary(editingDtype)
  },
  openAddColumnModal() {
    this.setData({
      showAddColumnModal: true,
      newColumnData: { key: '', label: '', type: 'number', unit: '', role: 'input', formula: '' }
    })
  },
  closeAddColumnModal() {
    this.setData({ showAddColumnModal: false })
  },
  onNewColumnInput(e) {
    const field = e.currentTarget.dataset.field
    const val = e.detail.value
    const d = { ...this.data.newColumnData, [field]: val }
    this.setData({ newColumnData: d })
  },
  onNewColumnRoleChange(e) {
    const d = { ...this.data.newColumnData, role: e.detail.value == 0 ? 'input' : 'output' }
    this.setData({ newColumnData: d })
  },
  onNewColumnTypeChange(e) {
    const types = ['text', 'number']
    const d = { ...this.data.newColumnData, type: types[e.detail.value] || 'number' }
    this.setData({ newColumnData: d })
  },
  confirmAddColumn() {
    const { newColumnData, editingColumns } = this.data
    if (!newColumnData.label.trim()) { wx.showToast({ title: '请输入列名', icon: 'none' }); return }
    const key = (newColumnData.key || '').trim()
    if (!key) { wx.showToast({ title: '请输入变量名', icon: 'none' }); return }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) { wx.showToast({ title: '变量名仅限英文字母/数字/下划线', icon: 'none' }); return }
    if (editingColumns.some(c => c.key === key)) { wx.showToast({ title: '变量名已存在', icon: 'none' }); return }
    editingColumns.push({ ...newColumnData, key, label: newColumnData.label.trim() })
    this.setData({ editingColumns, showAddColumnModal: false })
  },
  deleteEditingColumn(e) {
    const idx = e.currentTarget.dataset.idx
    const cols = this.data.editingColumns
    if (cols[idx].key === 'name' && this.data.editingDtype !== 'energy') { wx.showToast({ title: '工序名称列不可删除', icon: 'none' }); return }
    cols.splice(idx, 1)
    this.setData({ editingColumns: cols })
  },
  moveEditingColumn(e) {
    const { idx, dir } = e.currentTarget.dataset
    const i = parseInt(idx)
    const cols = this.data.editingColumns
    const target = dir === 'up' ? i - 1 : i + 1
    if (target < 0 || target >= cols.length) return
    const tmp = cols[i]; cols[i] = cols[target]; cols[target] = tmp
    this.setData({ editingColumns: cols })
  },

  onEditingColumnInput(e) {
    const { idx, field } = e.currentTarget.dataset
    const cols = this.data.editingColumns
    cols[idx][field] = e.detail.value
    this.setData({ editingColumns: cols })
  },
  onEditingColumnRoleChange(e) {
    const idx = e.currentTarget.dataset.idx
    const cols = this.data.editingColumns
    cols[idx].role = e.detail.value == 0 ? 'input' : 'output'
    if (cols[idx].role === 'input') cols[idx].formula = ''
    this.setData({ editingColumns: cols })
  },

  // 工序操作
  openCustomProcessModal(e) {
    this.setData({ showProdAddMenu: false, showProdTplMenu: false })
    const sKey = e.currentTarget.dataset.skey || ''
    const dtype = this._getDtype(e)
    const arrKey = this._getSectionsKey(dtype)
    const data = this.data.customProcessData
    const sec = sKey ? (data[arrKey] || []).find(s => s.key === sKey) : null
    const subtype = (e.currentTarget.dataset.subtype) || (sec && sec.subtype) || ''
    let presets = []
    if (dtype === 'process') presets = this.loadProcessPresets()
    if (subtype === 'material') this.loadEnergyMaterialPresets()
    const formData = {}
    if (sec && sec.columns) {
      sec.columns.forEach(col => { formData[col.key] = '' })
    }
    const hasPresets = dtype === 'process' && presets.length > 0
    const isMaterial = dtype === 'energy' && subtype === 'material'
    // 辅料卡片模式不需要 sec.columns，跳过列检查
    if (!isMaterial && sec && !(sec.columns || []).length && !hasPresets) {
      wx.showToast({ title: '请先通过"编辑列"定义列结构', icon: 'none' }); return
    }
    if (!sec && !hasPresets) {
      wx.showToast({ title: '请先添加区域或配置预设工序', icon: 'none' }); return
    }
    this.setData({
      showCustomProcessModal: true, customProcessSectionKey: sKey,
      customProcessFormData: formData, customProcessSelectedPreset: null,
      presetIsNewSection: false, presetSearchKeyword: '', filteredPresets: [], showPresetDropdown: false,
      editingDtype: dtype, editingSubtype: subtype, batchSelectedPresets: [],
      energyPresetSearch: '', filteredEnergyPresets: [], showEnergyPresetDropdown: false,
      customProcessFormFormulas: {},
      energyCardParams: null,
      energyCardValues: {},
      energyCardName: '',
      energyManualAmount: '',
      energyManualParams: []
    })
  },
  closeCustomProcessModal() {
    this.setData({ showCustomProcessModal: false, showPresetDropdown: false, showEnergyPresetDropdown: false })
  },
  onCustomProcessFormInput(e) {
    const field = e.currentTarget.dataset.field
    const d = { ...this.data.customProcessFormData, [field]: e.detail.value }
    const sKey = this.data.customProcessSectionKey
    const dtype = this.data.editingDtype
    const arrKey = this._getSectionsKey(dtype)
    const sec = (this.data.customProcessData[arrKey] || []).find(s => s.key === sKey)
    // 优先用预设列定义（含公式），兜底用区域列
    const presetCols = this.data.customProcessSelectedPreset ? this.data.customProcessSelectedPreset.columns : null
    const columns = presetCols || (sec ? sec.columns : null)
    if (columns) {
      const rowFormulas = this.data.customProcessFormFormulas || {}
      columns.forEach(col => {
        if (col.role === 'output') {
          const f = rowFormulas[col.key] || col.formula
          if (f) d[col.key] = formula.evaluateGlobal(f, d, this._getAllSections()).toFixed(4)
        }
      })
    }
    this.setData({ customProcessFormData: d })
  },
  onCustomProcessFormFormulaInput(e) {
    const field = e.currentTarget.dataset.field
    const f = e.detail.value
    const formulas = { ...this.data.customProcessFormFormulas, [field]: f }
    const d = { ...this.data.customProcessFormData }
    const sKey = this.data.customProcessSectionKey
    const dtype = this.data.editingDtype
    const arrKey = this._getSectionsKey(dtype)
    const sec = (this.data.customProcessData[arrKey] || []).find(s => s.key === sKey)
    const columns = (this.data.customProcessSelectedPreset ? this.data.customProcessSelectedPreset.columns : null) || (sec ? sec.columns : null)
    if (columns && f) {
      try { d[field] = formula.evaluateGlobal(f, d, this._getAllSections()).toFixed(4) } catch (err) { /* 公式语法错误忽略 */ }
    }
    this.setData({ customProcessFormFormulas: formulas, customProcessFormData: d })
  },

  confirmAddCustomProcess() {
    const { customProcessSectionKey, customProcessFormData, customProcessData, customProcessSelectedPreset, editingDtype, batchSelectedPresets } = this.data
    const arrKey = this._getSectionsKey(editingDtype)
    if (!customProcessData[arrKey]) customProcessData[arrKey] = []
    // 批量模式：多个预设一次性添加
    if (batchSelectedPresets && batchSelectedPresets.length > 1) {
      this._batchAddPresets(customProcessData, arrKey, batchSelectedPresets, editingDtype)
      this.setData({ customProcessData, showCustomProcessModal: false, batchSelectedPresets: [] })
      this.recalcAllSections(editingDtype)
      this.recalcSummary(editingDtype)
      wx.showToast({ title: '已添加' + batchSelectedPresets.length + '道工序', icon: 'success' })
      return
    }
    // 确定目标区域：预设指定的区域 > 当前区域
    let targetKey = customProcessSectionKey
    if (customProcessSelectedPreset && customProcessSelectedPreset.sectionKey) {
      targetKey = customProcessSelectedPreset.sectionKey
    }
    let sec = customProcessData[arrKey].find(s => s.key === targetKey)
    // label 兜底匹配
    if (!sec && customProcessSelectedPreset && customProcessSelectedPreset.sectionLabel) {
      sec = customProcessData[arrKey].find(s => s.label === customProcessSelectedPreset.sectionLabel)
      if (sec) targetKey = sec.key
    }
    // 如果目标区域不存在，自动新建
    if (!sec && customProcessSelectedPreset) {
      const p = customProcessSelectedPreset
      const defaultCols = [{ key: 'name', label: '名称', type: 'text', role: 'input' }]
      sec = {
        key: p.sectionKey,
        label: p.sectionLabel || p.sectionKey,
        collapsed: false,
        columns: defaultCols,
        rows: []
      }
      if (p.columns && p.columns.length) {
        sec.columns = p.columns.map(c => ({ ...c }))
      }
      customProcessData[arrKey].push(sec)
    }
    // 目标区域存在但列为空 → 用预设列填充
    if (sec && !sec.columns.length && customProcessSelectedPreset && customProcessSelectedPreset.columns && customProcessSelectedPreset.columns.length) {
      sec.columns = customProcessSelectedPreset.columns.map(c => ({ ...c }))
    }
    // 同步预设的 formula/role 到区域列（区域列可能缺失公式定义）
    if (sec && sec.columns.length && customProcessSelectedPreset && customProcessSelectedPreset.columns) {
      customProcessSelectedPreset.columns.forEach(pc => {
        var secCol = sec.columns.find(c => c.key === pc.key)
        if (secCol) {
          if (pc.formula) secCol.formula = pc.formula
          if (pc.role) secCol.role = pc.role
        }
      })
    }
    if (!sec) return
    if (editingDtype !== 'energy' && (!customProcessFormData.name || !customProcessFormData.name.trim())) {
      wx.showToast({ title: '请填写名称', icon: 'none' }); return
    }
    const newId = sec.rows.length > 0 ? Math.max(...sec.rows.map(r => r.id)) + 1 : 1
    const row = { id: newId }
    sec.columns.forEach(col => {
      let v = customProcessFormData[col.key]
      if (v === undefined || v === '') v = ''
      if (col.type === 'number' && v !== '') v = parseFloat(v) || 0
      row[col.key] = v
    })
    const rowFormulas = this.data.customProcessFormFormulas || {}
    const hasCustomFormulas = Object.keys(rowFormulas).some(k => rowFormulas[k] && rowFormulas[k].trim())
    if (hasCustomFormulas) {
      row._formulas = {}
      Object.keys(rowFormulas).forEach(k => { if (rowFormulas[k] && rowFormulas[k].trim()) row._formulas[k] = rowFormulas[k].trim() })
    }
    sec.rows.push(row)
    this.setData({ customProcessData, showCustomProcessModal: false })
    this.recalcAllSections(editingDtype)
    this.recalcSummary(editingDtype)
  },

  _batchAddPresets(cpd, arrKey, presets, dtype) {
    const allSections = this._getAllSections()
    presets.forEach(preset => {
      let sec = (cpd[arrKey] || []).find(s => s.key === preset.sectionKey)
      if (!sec && preset.sectionLabel) {
        sec = (cpd[arrKey] || []).find(s => s.label === preset.sectionLabel)
      }
      if (!sec) {
        const moldFeeCols = [
      { key: 'name', label: '工模名称', type: 'text', role: 'input' },
      { key: 'qty', label: '数量', type: 'number', role: 'input' },
      { key: 'price', label: '单价', unit: '元', type: 'number', role: 'input' }
    ]
    const defaultCols = dtype === 'moldFee' ? moldFeeCols : dtype === 'energy' ? [] : [{ key: 'name', label: '工序名称', type: 'text', role: 'input' }]
        sec = { key: preset.sectionKey, label: preset.sectionLabel || preset.sectionKey, collapsed: false, columns: defaultCols, rows: [] }
        if (preset.columns && preset.columns.length) sec.columns = preset.columns.map(c => ({ ...c }))
        cpd[arrKey].push(sec)
      }
      if (!sec.columns.length && preset.columns && preset.columns.length) {
        sec.columns = preset.columns.map(c => ({ ...c }))
      }
      const rowData = {}
      sec.columns.forEach(col => {
        rowData[col.key] = (preset.columnValues && preset.columnValues[col.key] !== undefined) ? preset.columnValues[col.key] : ''
      })
      rowData.name = preset.name
      sec.columns.forEach(col => {
        if (col.role === 'output' && col.formula) {
          rowData[col.key] = parseFloat(formula.evaluateGlobal(col.formula, rowData, allSections).toFixed(4))
        }
      })
      const newId = sec.rows.length > 0 ? Math.max(...sec.rows.map(r => r.id)) + 1 : 1
      const row = { id: newId }
      sec.columns.forEach(col => {
        let v = rowData[col.key]
        if (v === undefined || v === '') v = ''
        if (col.type === 'number' && v !== '') v = parseFloat(v) || 0
        row[col.key] = v
      })
      sec.rows.push(row)
    })
  },

  // ==================== 预设工序 ====================
  loadProcessPresets() {
    // 从后端 processList 转换为预设格式（统一数据源）
    const presets = (this.data.processList || []).map(p => {
      let columns = [{ key: 'name', label: '工序名称', type: 'text', role: 'input' }]
      let columnValues = { name: p.name }
      try {
        if (p.columnsJson) {
          const parsed = JSON.parse(p.columnsJson)
          if (parsed.length) columns = parsed
          columns.forEach(c => { if (c.defaultValue !== undefined) columnValues[c.key] = c.defaultValue })
        }
      } catch (e) {}
      return {
        id: p.id, name: p.name,
        sectionKey: p.sectionKey || '', sectionLabel: p.sectionLabel || '',
        columns, columnValues
      }
    })
    this.setData({ processPresets: presets })
    return presets
  },
  saveProcessPresetsToStorage() {},

  // ==================== 能耗预设物料 ====================
  _getMaterialDefaultParam() {
    return { key: 'amount', label: '金额', type: 'number', unit: '元', role: 'input', formula: '', defaultValue: '' }
  },
  _getMaterialPresetStorageKey() {
    return 'energy_material_presets'
  },
  _getMaterialPresetMigrationKey() {
    const userInfo = auth.getUserInfo() || {}
    const userTag = userInfo.id || userInfo.userId || userInfo.username || 'default'
    return 'energy_material_presets_migrated_' + userTag
  },
  _normalizeMaterialPresetParams(params) {
    const list = Array.isArray(params) ? params.map(p => ({
      key: p.key,
      label: p.label,
      type: p.type || 'number',
      unit: p.unit || '',
      role: p.role || 'input',
      formula: p.formula || '',
      defaultValue: p.defaultValue !== undefined && p.defaultValue !== null ? p.defaultValue : ''
    })) : []
    if (!list.find(p => p.key === 'amount')) {
      list.unshift(this._getMaterialDefaultParam())
    }
    return list
  },
  _parseMaterialTemplate(template) {
    let parsed = {}
    try { parsed = JSON.parse(template.templateJson || '{}') } catch (err) {}
    return {
      id: template.id,
      name: template.name,
      category: template.category,
      params: this._normalizeMaterialPresetParams(parsed.params)
    }
  },
  async _migrateLocalMaterialPresets(serverTemplates) {
    const migrationKey = this._getMaterialPresetMigrationKey()
    if (wx.getStorageSync(migrationKey)) return serverTemplates || []
    const storageKey = this._getMaterialPresetStorageKey()
    const localPresets = wx.getStorageSync(storageKey) || []
    if (!localPresets.length) return serverTemplates || []
    const existingNames = new Set((serverTemplates || []).map(item => item.name))
    let migratedCount = 0
    for (const preset of localPresets) {
      const name = (preset.name || '').trim()
      if (!name || existingNames.has(name)) continue
      const params = this._normalizeMaterialPresetParams(preset.params)
      await api.createEnergyDeviceTemplate({
        name,
        category: 'material',
        templateJson: JSON.stringify({ params })
      })
      existingNames.add(name)
      migratedCount += 1
    }
    if (migratedCount > 0 || localPresets.length > 0) {
      wx.setStorageSync(migrationKey, true)
    }
    const latest = await api.getEnergyDeviceTemplates('material')
    return (latest || []).map(item => this._parseMaterialTemplate(item))
  },
  async loadEnergyMaterialPresets() {
    try {
      const list = await api.getEnergyDeviceTemplates('material')
      let presets = (list || []).map(item => this._parseMaterialTemplate(item))
      if (!presets.length) {
        try {
          presets = await this._migrateLocalMaterialPresets(presets)
        } catch (err) {}
      }
      this.setData({ energyMaterialPresets: presets })
      return presets
    } catch (e) {
      try {
        const presets = (wx.getStorageSync(this._getMaterialPresetStorageKey()) || []).map((item, index) => ({
          id: item.id || ('local-' + index),
          name: item.name,
          params: this._normalizeMaterialPresetParams(item.params)
        }))
        this.setData({ energyMaterialPresets: presets })
        return presets
      } catch (err) {
        return []
      }
    }
  },
  // (deleteEnergyMaterialPreset moved to deleteMaterialPreset in preset manager)
  clearEnergySelection() {
    this.setData({
      energyCardName: '',
      energyCardParams: null,
      energyCardValues: {},
      filteredEnergyPresets: [],
      showEnergyPresetDropdown: false
    })
  },
  // 手动模式
  onEnergyManualAmountInput(e) {
    this.setData({ energyManualAmount: e.detail.value })
  },
  addEnergyManualParam() {
    const params = [...(this.data.energyManualParams || []), { label: '', value: '' }]
    this.setData({ energyManualParams: params })
  },
  deleteEnergyManualParam(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    const params = this.data.energyManualParams.filter((_, i) => i !== idx)
    this.setData({ energyManualParams: params })
  },
  onEnergyManualParamInput(e) {
    const { idx, field } = e.currentTarget.dataset
    this.setData({ [`energyManualParams[${idx}].${field}`]: e.detail.value })
  },
  hideEnergyPresetDropdown() {
    setTimeout(() => { this.setData({ showEnergyPresetDropdown: false }) }, 200)
  },
  // 能耗卡片 params 编辑
  onEnergyCardNameInput(e) {
    const val = e.detail.value
    this.data.energyCardName = val
    const kw = val.trim().toLowerCase()
    if (!kw) {
      this.setData({ filteredEnergyPresets: [], showEnergyPresetDropdown: false })
      return
    }
    const cachedPresets = this.data.energyMaterialPresets || []
    const filterAndSet = (presets) => {
      const filtered = (presets || []).filter(p => p.name && p.name.toLowerCase().includes(kw))
      this.setData({ filteredEnergyPresets: filtered, showEnergyPresetDropdown: filtered.length > 0 })
    }
    if (!cachedPresets.length) {
      this.loadEnergyMaterialPresets().then(filterAndSet)
      return
    }
    filterAndSet(cachedPresets)
  },
  selectEnergyCardPreset(e) {
    const id = e.currentTarget.dataset.id
    const preset = this.data.energyMaterialPresets.find(p => String(p.id) === String(id))
    if (!preset) return
    const params = this._normalizeMaterialPresetParams(preset.params).map((p, index) => ({ ...p, _uid: p.key || ('material-param-' + index) }))
    const values = {}
    params.forEach(p => { values[p.key] = p.defaultValue !== undefined && p.defaultValue !== '' ? p.defaultValue : '' })
    const allSections = this._getAllSections()
    const outputs = params.filter(p => p.role === 'output' && p.formula)
    for (let round = 0; round < 10; round++) {
      let changed = false
      outputs.forEach(p => {
        try {
          const newVal = formula.evaluateGlobal(p.formula, values, allSections).toFixed(4)
          if (values[p.key] !== newVal) { values[p.key] = newVal; changed = true }
        } catch (err) {}
      })
      if (!changed) break
    }
    this.setData({ energyCardName: preset.name, energyCardParams: params, energyCardValues: values, showEnergyPresetDropdown: false })
  },
  toggleEnergyCardCollapse(e) {
    const skey = e.currentTarget.dataset.skey
    const id = parseInt(e.currentTarget.dataset.id)
    const dtype = e.currentTarget.dataset.dtype || 'energy'
    const arrKey = this._getSectionsKey(dtype)
    const sections = this.data.customProcessData[arrKey] || []
    const sec = sections.find(s => s.key === skey)
    if (!sec) return
    const row = sec.rows.find(r => r.id === id)
    if (!row) return
    row._collapsed = !row._collapsed
    this.setData({ customProcessData: this.data.customProcessData })
  },
  // ==================== 预设辅料管理弹窗 ====================
  openMaterialPresetManager() {
    this.loadEnergyMaterialPresets().then(() => {
      this.setData({
        showMaterialPresetManager: true,
        editingMaterialPresetId: null,
        materialPresetForm: {
          name: '',
          params: [this._getMaterialDefaultParam()]
        }
      })
    }).catch(() => {
      this.setData({
        showMaterialPresetManager: true,
        editingMaterialPresetId: null,
        materialPresetForm: {
          name: '',
          params: [this._getMaterialDefaultParam()]
        }
      })
    })
  },
  closeMaterialPresetManager() {
    this.setData({ showMaterialPresetManager: false })
  },
  cancelEditMaterialPreset() {
    this.setData({
      editingMaterialPresetId: null,
      materialPresetForm: {
        name: '',
        params: [this._getMaterialDefaultParam()]
      }
    })
  },
  editMaterialPreset(e) {
    const id = e.currentTarget.dataset.id
    const preset = this.data.energyMaterialPresets.find(p => String(p.id) === String(id))
    if (!preset) return
    this.setData({
      editingMaterialPresetId: preset.id,
      materialPresetForm: { name: preset.name, params: this._normalizeMaterialPresetParams(preset.params) }
    })
  },
  deleteMaterialPreset(e) {
    const id = e.currentTarget.dataset.id
    const preset = this.data.energyMaterialPresets.find(p => String(p.id) === String(id))
    if (!preset) return
    const that = this
    wx.showModal({
      title: '删除预设',
      content: '确认删除预设"' + preset.name + '"？',
      success(res) {
        if (res.confirm) {
          api.deleteEnergyDeviceTemplate(preset.id).then(() => {
            const presets = that.data.energyMaterialPresets.filter(item => String(item.id) !== String(preset.id))
            that.setData({ energyMaterialPresets: presets })
            if (String(that.data.editingMaterialPresetId) === String(preset.id)) {
              that.cancelEditMaterialPreset()
            }
            wx.showToast({ title: '已删除', icon: 'success' })
          }).catch(() => {})
        }
      }
    })
  },
  onMaterialPresetFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`materialPresetForm.${field}`]: e.detail.value })
  },
  addMaterialPresetParam() {
    const params = [...(this.data.materialPresetForm.params || []), { key: '', label: '', type: 'number', unit: '', role: 'input', formula: '', defaultValue: '' }]
    this.setData({ 'materialPresetForm.params': params })
  },
  deleteMaterialPresetParam(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    const params = this.data.materialPresetForm.params.filter((_, i) => i !== idx)
    this.setData({ 'materialPresetForm.params': params })
  },
  onMaterialPresetParamInput(e) {
    const { idx, field } = e.currentTarget.dataset
    this.setData({ [`materialPresetForm.params[${idx}].${field}`]: e.detail.value })
  },
  onMaterialPresetParamRoleChange(e) {
    const idx = e.currentTarget.dataset.idx
    this.setData({ [`materialPresetForm.params[${idx}].role`]: ['input', 'output'][e.detail.value] })
  },
  confirmMaterialPreset() {
    const form = this.data.materialPresetForm
    const name = (form.name || '').trim()
    if (!name) { wx.showToast({ title: '请填写预设名称', icon: 'none' }); return }
    const params = this._normalizeMaterialPresetParams(form.params)
    if (!params.length) { wx.showToast({ title: '请至少添加一个变量', icon: 'none' }); return }
    const templateJson = JSON.stringify({
      params: params.map(p => ({
        key: p.key,
        label: p.label,
        type: p.type || 'number',
        unit: p.unit || '',
        role: p.role || 'input',
        formula: p.formula || '',
        defaultValue: p.defaultValue !== undefined && p.defaultValue !== null ? p.defaultValue : ''
      }))
    })
    const data = { name, category: 'material', templateJson }
    const that = this
    const editId = this.data.editingMaterialPresetId
    const apiCall = editId ? api.updateEnergyDeviceTemplate(editId, data) : api.createEnergyDeviceTemplate(data)
    apiCall.then(() => {
      that.loadEnergyMaterialPresets().then(() => {
        that.cancelEditMaterialPreset()
        wx.showToast({ title: editId ? '已更新预设' : '已保存预设', icon: 'success' })
      }).catch(() => {
        that.cancelEditMaterialPreset()
        wx.showToast({ title: editId ? '已更新预设' : '已保存预设', icon: 'success' })
      })
    }).catch(() => {})
  },
  onEnergyCardValueInput(e) {
    const field = e.currentTarget.dataset.field
    const values = { ...this.data.energyCardValues, [field]: e.detail.value }
    const params = this.data.energyCardParams || []
    // 多轮迭代处理输出间依赖
    const allSections = this._getAllSections()
    const outputs = params.filter(p => p.role === 'output' && p.formula)
    for (let round = 0; round < 10; round++) {
      let changed = false
      outputs.forEach(p => {
        try {
          const newVal = formula.evaluateGlobal(p.formula, values, allSections).toFixed(4)
          if (values[p.key] !== newVal) { values[p.key] = newVal; changed = true }
        } catch (err) {}
      })
      if (!changed) break
    }
    this.setData({ energyCardValues: values })
  },
  confirmAddEnergyCard() {
    const { energyCardName, energyCardParams, energyCardValues, energyManualAmount, energyManualParams, customProcessSectionKey, customProcessData, editingDtype } = this.data
    const name = (energyCardName || '').trim()
    if (!name) { wx.showToast({ title: '请填写名称', icon: 'none' }); return }
    const arrKey = this._getSectionsKey(editingDtype)
    const sec = (customProcessData[arrKey] || []).find(s => s.key === customProcessSectionKey)
    if (!sec) return
    const newId = sec.rows.length > 0 ? Math.max(...sec.rows.map(r => r.id)) + 1 : 1
    const row = { id: newId, name }
    if (energyCardParams) {
      // 预设模式
      row.params = energyCardParams.map(p => ({ key: p.key, label: p.label, type: p.type, unit: p.unit, role: p.role, formula: p.formula || '' }))
      row.params.forEach(p => {
        let v = energyCardValues[p.key]
        if (v === undefined || v === '') v = p.type === 'number' ? 0 : ''
        else if (p.type === 'number') v = parseFloat(v) || 0
        row[p.key] = v
      })
      if (row.amount === undefined) row.amount = 0
    } else {
      // 手动模式：amount 放末尾
      const amount = parseFloat(energyManualAmount) || 0
      row.amount = amount
      row.params = []
      ;(energyManualParams || []).forEach(mp => {
        const label = (mp.label || '').trim()
        if (label) {
          const key = 'custom_' + label
          row.params.push({ key, label, type: 'text', unit: '', role: 'input', formula: '' })
          row[key] = mp.value || ''
        }
      })
      row.params.push({ key: 'amount', label: '金额', type: 'number', unit: '元', role: 'input', formula: '' })
    }
    sec.rows.push(row)
    this.setData({ customProcessData, showCustomProcessModal: false })
    this.recalcAllSections(editingDtype)
    this.recalcSummary()
    wx.showToast({ title: '已添加', icon: 'success' })
  },

  // ==================== 设备能耗模版选择弹窗 ====================
  openDeviceTemplateSelector(e) {
    const sKey = e.currentTarget.dataset.skey || ''
    const dtype = e.currentTarget.dataset.dtype || 'energy'
    const category = e.currentTarget.dataset.category || 'device'
    this.setData({
      showDeviceTemplateSelector: true,
      customProcessSectionKey: sKey,
      editingDtype: dtype,
      templateCategory: category,
      deviceTemplateSearchKeyword: '',
      deviceTemplateResults: [],
      showDeviceTemplateDropdown: false,
      selectedDeviceTemplate: null,
      deviceCardValues: {}
    })
    this._searchDeviceTemplates('')
  },
  closeDeviceTemplateSelector() {
    this.setData({ showDeviceTemplateSelector: false })
  },
  hideDeviceTemplateDropdown() {
    setTimeout(() => { this.setData({ showDeviceTemplateDropdown: false }) }, 200)
  },
  _deviceSearchTimer: null,
  onDeviceTemplateSearch(e) {
    const keyword = e.detail.value
    this.setData({ deviceTemplateSearchKeyword: keyword, selectedDeviceTemplate: null, deviceCardValues: {}, showDeviceTemplateDropdown: true })
    if (this._deviceSearchTimer) clearTimeout(this._deviceSearchTimer)
    this._deviceSearchTimer = setTimeout(() => {
      this._searchDeviceTemplates(keyword)
    }, 300)
  },
  _searchDeviceTemplates(keyword) {
    const that = this
    const category = this.data.templateCategory || 'device'
    api.searchEnergyDeviceTemplates(keyword, category).then(list => {
      that.setData({ deviceTemplateResults: list || [], showDeviceTemplateDropdown: true })
    }).catch(() => {
      that.setData({ deviceTemplateResults: [], showDeviceTemplateDropdown: false })
    })
  },
  selectDeviceTemplate(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    const item = this.data.deviceTemplateResults.find(t => t.id === id)
    if (!item) return
    let parsed = { variables: [], subGroups: [] }
    try { parsed = JSON.parse(item.templateJson) } catch (err) {}
    // 收集 key→label 映射，生成可读公式
    const keyLabelMap = {}
    ;(parsed.variables || []).forEach(v => { keyLabelMap[v.key] = v.label || v.key })
    ;(parsed.subGroups || []).forEach(sg => {
      (sg.variables || []).forEach(v => { keyLabelMap[v.key] = v.label || v.key })
    })
    const makeDisplayFormula = (f) => {
      if (!f) return ''
      // 按 key 长度降序替换，避免短 key 先匹配到长 key 的子串
      const keys = Object.keys(keyLabelMap).sort((a, b) => b.length - a.length)
      let result = f
      keys.forEach(k => { result = result.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), keyLabelMap[k]) })
      return result
    }
    ;(parsed.variables || []).forEach(v => { if (v.role === 'output' && v.formula) v._displayFormula = makeDisplayFormula(v.formula) })
    ;(parsed.subGroups || []).forEach(sg => {
      (sg.variables || []).forEach(v => { if (v.role === 'output' && v.formula) v._displayFormula = makeDisplayFormula(v.formula) })
    })
    const tpl = { ...item, _parsed: parsed }
    const values = {}
    ;(parsed.variables || []).forEach(v => { if (v.defaultValue) values[v.key] = v.defaultValue })
    ;(parsed.subGroups || []).forEach(sg => {
      (sg.variables || []).forEach(v => { if (v.defaultValue) values[v.key] = v.defaultValue })
    })
    // 立即计算输出字段（多轮迭代处理输出间依赖）
    this._evalDeviceOutputs(parsed, values)
    this.setData({ selectedDeviceTemplate: tpl, deviceCardValues: values, deviceTemplateSearchKeyword: item.name, showDeviceTemplateDropdown: false })
  },
  // 多轮迭代计算设备模版输出字段，处理输出变量之间的依赖
  _evalDeviceOutputs(parsed, values) {
    const allVars = [...(parsed.variables || [])]
    ;(parsed.subGroups || []).forEach(sg => { allVars.push(...(sg.variables || [])) })
    const outputs = allVars.filter(v => v.role === 'output' && v.formula)
    const allSections = this._getAllSections()
    for (let round = 0; round < 10; round++) {
      let changed = false
      outputs.forEach(v => {
        try {
          const newVal = formula.evaluateGlobal(v.formula, values, allSections).toFixed(4)
          if (values[v.key] !== newVal) { values[v.key] = newVal; changed = true }
        } catch (err) {}
      })
      if (!changed) break
    }
  },
  onDeviceCardValueInput(e) {
    const field = e.currentTarget.dataset.field
    const values = { ...this.data.deviceCardValues, [field]: e.detail.value }
    const tpl = this.data.selectedDeviceTemplate
    if (tpl && tpl._parsed) {
      this._evalDeviceOutputs(tpl._parsed, values)
    }
    this.setData({ deviceCardValues: values })
  },
  confirmAddDeviceCard() {
    const { selectedDeviceTemplate, deviceCardValues, customProcessSectionKey, customProcessData, editingDtype } = this.data
    if (!selectedDeviceTemplate) return
    const name = selectedDeviceTemplate.name
    const parsed = selectedDeviceTemplate._parsed || {}
    const dtype = editingDtype || 'energy'
    const arrKey = this._getSectionsKey(dtype)
    const sec = (customProcessData[arrKey] || []).find(s => s.key === customProcessSectionKey)
    if (!sec) return
    const newId = sec.rows.length > 0 ? Math.max(...sec.rows.map(r => r.id)) + 1 : 1

    if (dtype === 'moldFee') {
      // 模具费：表格行模式 — 用模版变量设置列定义，添加行
      const allVars = [...(parsed.variables || [])]
      ;(parsed.subGroups || []).forEach(sg => { allVars.push(...(sg.variables || [])) })
      // 如果区域还没有列定义，从模版创建
      if (!sec.columns || !sec.columns.length) {
        sec.columns = allVars.map(v => ({
          key: v.key, label: v.label, type: v.type || 'number', unit: v.unit || '', role: v.role || 'input', formula: v.formula || ''
        }))
      }
      const row = { id: newId, name, _formulas: {} }
      sec.columns.forEach(col => {
        // 先按 key 精确匹配，再按 label 回退匹配
        let val = deviceCardValues[col.key]
        if (val === undefined || val === '') {
          const matchVar = allVars.find(v => v.label === col.label)
          if (matchVar) val = deviceCardValues[matchVar.key]
        }
        if (val === undefined || val === '') val = col.type === 'number' ? 0 : ''
        else if (col.type === 'number') val = parseFloat(val) || 0
        row[col.key] = val
        if (col.formula) row._formulas[col.key] = col.formula
      })
      // 模版名自动填充 name 列（工模名称）
      row['name'] = name
      sec.rows.push(row)
    } else {
      // 设备能耗：卡片模式
      const row = { id: newId, name }
      row.params = (parsed.variables || []).map(v => ({
        key: v.key, label: v.label, type: v.type || 'number', unit: v.unit || '', role: v.role || 'input', formula: v.formula || ''
      }))
      row.params.forEach(p => {
        let val = deviceCardValues[p.key]
        if (val === undefined || val === '') val = p.type === 'number' ? 0 : ''
        else if (p.type === 'number') val = parseFloat(val) || 0
        row[p.key] = val
      })
      row.subGroups = (parsed.subGroups || []).map(sg => ({
        label: sg.label,
        variables: (sg.variables || []).map(v => {
          const p = { key: v.key, label: v.label, type: v.type || 'number', unit: v.unit || '', role: v.role || 'input', formula: v.formula || '' }
          let val = deviceCardValues[v.key]
          if (val === undefined || val === '') val = p.type === 'number' ? 0 : ''
          else if (p.type === 'number') val = parseFloat(val) || 0
          row[v.key] = val
          return p
        })
      }))
      sec.rows.push(row)
    }

    this.setData({ customProcessData, showDeviceTemplateSelector: false })
    this.recalcAllSections(dtype)
    this.recalcSummary()
    wx.showToast({ title: '已添加', icon: 'success' })
  },

  // ==================== 设备能耗预设管理弹窗 ====================
  openDevicePresetManager() {
    const that = this
    const category = this.data.templateCategory || 'device'
    api.getEnergyDeviceTemplates(category).then(list => {
      that.setData({ devicePresets: list || [] })
    }).catch(() => {})
    this.setData({
      showDevicePresetManager: true,
      editingDevicePresetId: null,
      devicePresetForm: { name: '', variables: [], subGroups: [] }
    })
  },
  closeDevicePresetManager() {
    this.setData({ showDevicePresetManager: false })
  },
  cancelEditDevicePreset() {
    this.setData({
      editingDevicePresetId: null,
      devicePresetForm: { name: '', variables: [], subGroups: [] }
    })
  },
  editDevicePreset(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    const preset = this.data.devicePresets.find(p => p.id === id)
    if (!preset) return
    let parsed = { variables: [], subGroups: [] }
    try { parsed = JSON.parse(preset.templateJson) } catch (err) {}
    this.setData({
      editingDevicePresetId: id,
      devicePresetForm: {
        name: preset.name,
        variables: (parsed.variables || []).map(v => ({ ...v })),
        subGroups: (parsed.subGroups || []).map(sg => ({
          label: sg.label,
          variables: (sg.variables || []).map(v => ({ ...v }))
        }))
      }
    })
  },
  deleteDevicePreset(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    const preset = this.data.devicePresets.find(p => p.id === id)
    if (!preset) return
    const that = this
    wx.showModal({
      title: '删除预设', content: '确认删除预设"' + preset.name + '"？',
      success(res) {
        if (res.confirm) {
          api.deleteEnergyDeviceTemplate(id).then(() => {
            that.setData({ devicePresets: that.data.devicePresets.filter(p => p.id !== id) })
            if (that.data.editingDevicePresetId === id) that.cancelEditDevicePreset()
            wx.showToast({ title: '已删除', icon: 'success' })
          }).catch(() => {})
        }
      }
    })
  },
  onDevicePresetFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`devicePresetForm.${field}`]: e.detail.value })
  },
  addDevicePresetVariable() {
    const vars = [...(this.data.devicePresetForm.variables || []), { key: '', label: '', type: 'number', unit: '', role: 'input', formula: '', defaultValue: '' }]
    this.setData({ 'devicePresetForm.variables': vars })
  },
  deleteDevicePresetVariable(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    const vars = this.data.devicePresetForm.variables.filter((_, i) => i !== idx)
    this.setData({ 'devicePresetForm.variables': vars })
  },
  onDevicePresetVarInput(e) {
    const { idx, field } = e.currentTarget.dataset
    this.setData({ [`devicePresetForm.variables[${idx}].${field}`]: e.detail.value })
  },
  onDevicePresetVarRoleChange(e) {
    const idx = e.currentTarget.dataset.idx
    this.setData({ [`devicePresetForm.variables[${idx}].role`]: ['input', 'output'][e.detail.value] })
  },
  addDevicePresetSubGroup() {
    const sgs = [...(this.data.devicePresetForm.subGroups || []), { label: '', variables: [] }]
    this.setData({ 'devicePresetForm.subGroups': sgs })
  },
  deleteDevicePresetSubGroup(e) {
    const sgIdx = parseInt(e.currentTarget.dataset.sgidx)
    const sgs = this.data.devicePresetForm.subGroups.filter((_, i) => i !== sgIdx)
    this.setData({ 'devicePresetForm.subGroups': sgs })
  },
  onDevicePresetSubGroupInput(e) {
    const { sgidx, field } = e.currentTarget.dataset
    this.setData({ [`devicePresetForm.subGroups[${sgidx}].${field}`]: e.detail.value })
  },
  addDevicePresetSubGroupVar(e) {
    const sgIdx = parseInt(e.currentTarget.dataset.sgidx)
    const sgs = this.data.devicePresetForm.subGroups
    sgs[sgIdx].variables.push({ key: '', label: '', type: 'number', unit: '', role: 'input', formula: '', defaultValue: '' })
    this.setData({ 'devicePresetForm.subGroups': sgs })
  },
  deleteDevicePresetSubGroupVar(e) {
    const sgIdx = parseInt(e.currentTarget.dataset.sgidx)
    const vIdx = parseInt(e.currentTarget.dataset.vidx)
    const sgs = this.data.devicePresetForm.subGroups
    sgs[sgIdx].variables = sgs[sgIdx].variables.filter((_, i) => i !== vIdx)
    this.setData({ 'devicePresetForm.subGroups': sgs })
  },
  onDevicePresetSubGroupVarInput(e) {
    const { sgidx, vidx, field } = e.currentTarget.dataset
    this.setData({ [`devicePresetForm.subGroups[${sgidx}].variables[${vidx}].${field}`]: e.detail.value })
  },
  onDevicePresetSubGroupVarRoleChange(e) {
    const { sgidx, vidx } = e.currentTarget.dataset
    this.setData({ [`devicePresetForm.subGroups[${sgidx}].variables[${vidx}].role`]: ['input', 'output'][e.detail.value] })
  },
  confirmDevicePreset() {
    const form = this.data.devicePresetForm
    const name = (form.name || '').trim()
    if (!name) { wx.showToast({ title: '请填写预设名称', icon: 'none' }); return }
    const templateJson = JSON.stringify({
      variables: (form.variables || []).map(v => ({ key: v.key, label: v.label, type: v.type || 'number', unit: v.unit, role: v.role, formula: v.formula || '', defaultValue: v.defaultValue || '' })),
      subGroups: (form.subGroups || []).map(sg => ({
        label: sg.label,
        variables: (sg.variables || []).map(v => ({ key: v.key, label: v.label, type: v.type || 'number', unit: v.unit, role: v.role, formula: v.formula || '', defaultValue: v.defaultValue || '' }))
      }))
    })
    const category = this.data.templateCategory || 'device'
    const data = { name, templateJson, category }
    const that = this
    const editId = this.data.editingDevicePresetId
    const apiCall = editId ? api.updateEnergyDeviceTemplate(editId, data) : api.createEnergyDeviceTemplate(data)
    apiCall.then(() => {
      api.getEnergyDeviceTemplates(category).then(list => {
        that.setData({ devicePresets: list || [] })
      }).catch(() => {})
      that.cancelEditDevicePreset()
      wx.showToast({ title: editId ? '已更新预设' : '已保存预设', icon: 'success' })
    }).catch(() => {})
  },

  onPresetSearchInput(e) {
    const keyword = e.detail.value
    const kw = keyword.trim().toLowerCase()
    const formData = { ...this.data.customProcessFormData, name: keyword }
    if (!kw) {
      this.setData({ presetSearchKeyword: keyword, filteredPresets: [], showPresetDropdown: false, customProcessFormData: formData, customProcessSelectedPreset: null, presetIsNewSection: false })
      return
    }
    let presets = this.data.processPresets
    if (!presets || !presets.length) presets = this.loadProcessPresets()
    console.log('[preset-search] kw:', kw, 'presets count:', presets.length, 'names:', presets.map(p => p.name))
    const filtered = presets.filter(p => p.name && p.name.toLowerCase().includes(kw))
    console.log('[preset-search] filtered count:', filtered.length)
    this.setData({ presetSearchKeyword: keyword, filteredPresets: filtered, showPresetDropdown: filtered.length > 0, customProcessFormData: formData, customProcessSelectedPreset: null, presetIsNewSection: false })
  },
  selectPresetForProcess(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.filteredPresets.find(p => String(p.id) === String(id))
    if (!item) return
    const preset = this.data.processPresets.find(p => p.id === item.id)
    if (!preset) return
    // 批量选择：toggle
    let batch = this.data.batchSelectedPresets.slice()
    const existIdx = batch.findIndex(b => b.id === preset.id)
    if (existIdx !== -1) {
      batch.splice(existIdx, 1)
    } else {
      batch.push(preset)
    }
    // 用最后选中的预设预览表单
    const last = batch.length ? batch[batch.length - 1] : null
    const data = this.data.customProcessData
    const arrKey = this._getSectionsKey('process')
    let formData = {}
    let targetSec = null
    let presetIsNewSection = false
    if (last) {
      targetSec = (data[arrKey] || []).find(s => s.key === last.sectionKey)
      if (!targetSec && last.sectionLabel) {
        targetSec = (data[arrKey] || []).find(s => s.label === last.sectionLabel)
      }
      const columns = last.columns || (targetSec ? targetSec.columns : [])
      columns.forEach(col => {
        formData[col.key] = (last.columnValues && last.columnValues[col.key] !== undefined)
          ? last.columnValues[col.key] : ''
      })
      formData.name = last.name
      if (columns.length) {
        columns.forEach(col => {
          if (col.role === 'output' && col.formula) {
            formData[col.key] = formula.evaluateGlobal(col.formula, formData, this._getAllSections()).toFixed(4)
          }
        })
      }
      presetIsNewSection = !targetSec
    }
    this.setData({
      batchSelectedPresets: batch,
      customProcessFormData: formData,
      customProcessSelectedPreset: last,
      customProcessSectionKey: targetSec ? targetSec.key : (last ? last.sectionKey : ''),
      presetIsNewSection,
      presetSearchKeyword: last ? last.name : '',
      showPresetDropdown: false
    })
  },
  removeBatchPreset(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    const batch = this.data.batchSelectedPresets.filter(p => p.id !== id)
    this.setData({ batchSelectedPresets: batch })
  },
  hidePresetDropdown() {
    setTimeout(() => { this.setData({ showPresetDropdown: false }) }, 200)
  },
  // 预设管理弹窗
  openPresetManager() {
    this.loadProcessPresets()
    this.setData({
      showPresetManager: true, editingPresetId: null,
      presetForm: { name: '', sectionLabel: '', sectionKey: '', columns: [{ key: 'name', label: '工序名称', type: 'text', role: 'input', unit: '', formula: '', defaultValue: '' }] },
      presetSectionSearch: '', presetFilteredSections: [], showPresetSectionDropdown: false, presetSectionMatched: false
    })
  },
  closePresetManager() {
    this.loadProcessPresets()
    this.setData({ showPresetManager: false })
  },
  onPresetFormNameInput(e) {
    this.setData({ 'presetForm.name': e.detail.value })
  },
  // 区域模糊搜索
  onPresetSectionSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ presetSectionSearch: keyword, 'presetForm.sectionLabel': keyword, 'presetForm.sectionKey': '', presetSectionMatched: false })
    const sections = (this.data.customProcessData && this.data.customProcessData.sections) || []
    if (!keyword.trim()) {
      this.setData({ presetFilteredSections: [], showPresetSectionDropdown: false })
      return
    }
    const kw = keyword.trim().toLowerCase()
    const filtered = sections.filter(s => s.label.toLowerCase().includes(kw))
    this.setData({ presetFilteredSections: filtered, showPresetSectionDropdown: filtered.length > 0 })
  },
  selectPresetSection(e) {
    const key = e.currentTarget.dataset.key
    const sections = (this.data.customProcessData && this.data.customProcessData.sections) || []
    const sec = sections.find(s => s.key === key)
    if (!sec) return
    const columns = sec.columns.map(c => ({ ...c, defaultValue: '' }))
    this.setData({
      presetSectionSearch: sec.label,
      'presetForm.sectionLabel': sec.label,
      'presetForm.sectionKey': sec.key,
      'presetForm.columns': columns,
      presetFilteredSections: [], showPresetSectionDropdown: false,
      presetSectionMatched: true
    })
  },
  hidePresetSectionDropdown() {
    setTimeout(() => { this.setData({ showPresetSectionDropdown: false }) }, 200)
  },
  onPresetSectionKeyInput(e) {
    this.setData({ 'presetForm.sectionKey': e.detail.value.trim() })
  },
  // 预设列编辑
  onPresetColumnInput(e) {
    const { idx, field } = e.currentTarget.dataset
    this.setData({ ['presetForm.columns[' + idx + '].' + field]: e.detail.value })
  },
  onPresetColumnRoleChange(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    const role = parseInt(e.detail.value) === 0 ? 'input' : 'output'
    this.setData({ ['presetForm.columns[' + idx + '].role']: role })
  },
  addPresetColumn() {
    const cols = this.data.presetForm.columns
    cols.push({ key: '', label: '', type: 'number', role: 'input', unit: '', formula: '', defaultValue: '' })
    this.setData({ 'presetForm.columns': cols })
  },
  deletePresetColumn(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    const cols = this.data.presetForm.columns
    if (cols[idx].key === 'name') { wx.showToast({ title: '工序名称列不可删除', icon: 'none' }); return }
    cols.splice(idx, 1)
    this.setData({ 'presetForm.columns': cols })
  },
  confirmPreset() {
    const form = this.data.presetForm
    if (!form.name.trim()) { wx.showToast({ title: '请输入工序名称', icon: 'none' }); return }
    if (!form.sectionLabel.trim()) { wx.showToast({ title: '请输入所属区域', icon: 'none' }); return }
    for (const col of form.columns) {
      if (!col.key || !col.label) { wx.showToast({ title: '列的名称和变量名不能为空', icon: 'none' }); return }
    }
    let sectionKey = form.sectionKey
    if (!sectionKey) {
      wx.showToast({ title: '请输入区域变量名', icon: 'none' }); return
    }
    const columnsForSave = form.columns.map(c => {
      const col = { key: c.key, label: c.label, type: c.type, role: c.role }
      if (c.unit) col.unit = c.unit
      if (c.formula) col.formula = c.formula
      if (c.defaultValue !== undefined && c.defaultValue !== '') col.defaultValue = c.defaultValue
      return col
    })
    const isEdit = !!this.data.editingPresetId
    const url = isEdit ? '/process/' + this.data.editingPresetId : '/process'
    const method = isEdit ? 'PUT' : 'POST'
    const data = {
      processName: form.name.trim(), sectionKey,
      sectionLabel: form.sectionLabel.trim(),
      columnsJson: JSON.stringify(columnsForSave), isActive: 1
    }
    wx.showLoading({ title: '保存中...' })
    const savePromise = isEdit
      ? api.updateProcess(this.data.editingPresetId, data)
      : api.createProcess(data)
    savePromise.then(() => {
      wx.hideLoading()
      wx.showToast({ title: '预设已保存', icon: 'success' })
      this.setData({ editingPresetId: null,
        presetForm: { name: '', sectionLabel: '', sectionKey: '', columns: [{ key: 'name', label: '工序名称', type: 'text', role: 'input', unit: '', formula: '', defaultValue: '' }] },
        presetSectionSearch: ''
      })
      this.loadProcessList().then(() => this.loadProcessPresets())
    }).catch(() => { wx.hideLoading(); wx.showToast({ title: '保存失败', icon: 'none' }) })
  },
  editPreset(e) {
    const id = e.currentTarget.dataset.id
    const preset = this.data.processPresets.find(p => p.id === id)
    if (!preset) return
    const columns = (preset.columns || []).map(c => ({
      key: c.key, label: c.label, type: c.type || 'number', role: c.role || 'input',
      unit: c.unit || '', formula: c.formula || '',
      defaultValue: (preset.columnValues && preset.columnValues[c.key] !== undefined) ? String(preset.columnValues[c.key]) : ''
    }))
    const sections = (this.data.customProcessData && this.data.customProcessData.sections) || []
    const matched = !!sections.find(s => s.key === preset.sectionKey)
    this.setData({
      editingPresetId: id,
      presetForm: { name: preset.name, sectionLabel: preset.sectionLabel || '', sectionKey: preset.sectionKey || '', columns },
      presetSectionSearch: preset.sectionLabel || '',
      presetSectionMatched: matched
    })
  },
  copyPreset(e) {
    const id = e.currentTarget.dataset.id
    const preset = this.data.processPresets.find(p => p.id === id)
    if (!preset) return
    const columns = (preset.columns || []).map(c => ({
      key: c.key, label: c.label, type: c.type || 'number', role: c.role || 'input',
      unit: c.unit || '', formula: c.formula || '',
      defaultValue: (preset.columnValues && preset.columnValues[c.key] !== undefined) ? String(preset.columnValues[c.key]) : ''
    }))
    const sections = (this.data.customProcessData && this.data.customProcessData.sections) || []
    const matched = !!sections.find(s => s.key === preset.sectionKey)
    this.setData({
      editingPresetId: null,
      presetForm: { name: preset.name, sectionLabel: preset.sectionLabel || '', sectionKey: preset.sectionKey || '', columns },
      presetSectionSearch: preset.sectionLabel || '',
      presetSectionMatched: matched
    })
  },
  cancelEditPreset() {
    this.setData({
      editingPresetId: null,
      presetForm: { name: '', sectionLabel: '', sectionKey: '', columns: [{ key: 'name', label: '工序名称', type: 'text', role: 'input', unit: '', formula: '', defaultValue: '' }] },
      presetSectionSearch: '', presetSectionMatched: false
    })
  },
  deletePreset(e) {
    const id = e.currentTarget.dataset.id
    const that = this
    wx.showModal({
      title: '删除预设',
      content: '确认删除该预设工序？',
      success(res) {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          api.deleteProcess(id).then(() => {
            wx.hideLoading()
            wx.showToast({ title: '已删除', icon: 'success' })
            that.loadProcessList().then(() => that.loadProcessPresets())
          }).catch(() => {
            wx.hideLoading()
            wx.showToast({ title: '删除失败', icon: 'none' })
          })
        }
      }
    })
  },

  // 行级公式编辑（表格内点击输出值）
  openRowFormulaEditor(e) {
    const { skey, id, field, dtype } = e.currentTarget.dataset
    const arrKey = this._getSectionsKey(dtype || 'process')
    const sec = (this.data.customProcessData[arrKey] || []).find(s => s.key === skey)
    if (!sec) return
    const row = sec.rows.find(r => r.id === parseInt(id))
    if (!row) return
    const col = sec.columns.find(c => c.key === field)
    if (!col) return
    const currentFormula = (row._formulas && row._formulas[field]) || col.formula || ''
    this.setData({ editingRowFormula: { skey, id: parseInt(id), field, dtype: dtype || 'process', formula: currentFormula } })
  },
  closeRowFormulaEditor() {
    this.setData({ editingRowFormula: null })
  },
  onRowFormulaInput(e) {
    this.setData({ 'editingRowFormula.formula': e.detail.value })
  },
  confirmRowFormula() {
    const info = this.data.editingRowFormula
    if (!info) return
    const arrKey = this._getSectionsKey(info.dtype)
    const data = this.data.customProcessData
    const sec = (data[arrKey] || []).find(s => s.key === info.skey)
    if (!sec) return
    const row = sec.rows.find(r => r.id === info.id)
    if (!row) return
    if (!row._formulas) row._formulas = {}
    row._formulas[info.field] = info.formula.trim()
    const allSections = this._getAllSections()
    const cols = row.params || sec.columns
    cols.forEach(c => {
      if (c.role === 'output') {
        const f = (row._formulas && row._formulas[c.key]) || c.formula
        if (f) row[c.key] = parseFloat(formula.evaluateGlobal(f, row, allSections).toFixed(4))
      }
    })
    this.setData({ customProcessData: data, editingRowFormula: null })
    this.recalcSummary()
  },

  addEmptyRow(e) {
    const skey = e.currentTarget.dataset.skey
    const dtype = this._getDtype(e)
    const arrKey = this._getSectionsKey(dtype)
    const data = this.data.customProcessData
    const sec = (data[arrKey] || []).find(s => s.key === skey)
    if (!sec || !sec.columns.length) return
    const row = { id: Date.now() }
    sec.columns.forEach(col => {
      row[col.key] = col.type === 'number' ? 0 : ''
    })
    sec.rows.push(row)
    this.setData({ customProcessData: data })
  },

  copyRow(e) {
    const { skey, id } = e.currentTarget.dataset
    const dtype = this._getDtype(e)
    const arrKey = this._getSectionsKey(dtype)
    const data = this.data.customProcessData
    const sec = (data[arrKey] || []).find(s => s.key === skey)
    if (!sec) return
    const idx = sec.rows.findIndex(r => r.id === parseInt(id))
    if (idx === -1) return
    const src = sec.rows[idx]
    const newRow = { ...src, id: Date.now() }
    if (src.params) newRow.params = src.params.map(p => ({ ...p }))
    if (src._formulas) newRow._formulas = { ...src._formulas }
    if (src.subGroups) newRow.subGroups = src.subGroups.map(sg => ({ label: sg.label, variables: (sg.variables || []).map(v => ({ ...v })) }))
    sec.rows.splice(idx + 1, 0, newRow)
    this.setData({ customProcessData: data })
  },

  moveRow(e) {
    const { skey, id, dir } = e.currentTarget.dataset
    const dtype = this._getDtype(e)
    const arrKey = this._getSectionsKey(dtype)
    const data = this.data.customProcessData
    const sec = (data[arrKey] || []).find(s => s.key === skey)
    if (!sec) return
    const idx = sec.rows.findIndex(r => r.id === parseInt(id))
    const target = dir === 'up' ? idx - 1 : idx + 1
    if (idx === -1 || target < 0 || target >= sec.rows.length) return
    const tmp = sec.rows[idx]
    sec.rows[idx] = sec.rows[target]
    sec.rows[target] = tmp
    this.setData({ customProcessData: data })
  },

  deleteCustomProcess(e) {
    const { skey, id } = e.currentTarget.dataset
    const dtype = this._getDtype(e)
    const arrKey = this._getSectionsKey(dtype)
    const data = this.data.customProcessData
    const sec = (data[arrKey] || []).find(s => s.key === skey)
    if (!sec) return
    sec.rows = sec.rows.filter(r => r.id !== parseInt(id))
    this.setData({ customProcessData: data })
    this.recalcAllSections()
    this.recalcSummary()
  },

  onCustomProcessInput(e) {
    const { skey, id, field } = e.currentTarget.dataset
    const dtype = this._getDtype(e)
    const arrKey = this._getSectionsKey(dtype)
    const value = e.detail.value
    const data = this.data.customProcessData
    const sec = (data[arrKey] || []).find(s => s.key === skey)
    if (!sec) return
    const row = sec.rows.find(r => r.id === parseInt(id))
    if (!row) return
    // find column definition from params, subGroups, or sec.columns
    let col = (row.params || sec.columns || []).find(c => c.key === field)
    if (!col && row.subGroups) {
      for (const sg of row.subGroups) {
        col = (sg.variables || []).find(c => c.key === field)
        if (col) break
      }
    }
    row[field] = col && col.type === 'number' ? (parseFloat(value) || 0) : value
    const allSections = this._getAllSections()
    const cols = row.params || sec.columns
    // recalc output formulas from params + subGroups
    const allCols = [...(cols || [])]
    ;(row.subGroups || []).forEach(sg => { allCols.push(...(sg.variables || [])) })
    allCols.forEach(c => {
      if (c.role === 'output') {
        const f = (row._formulas && row._formulas[c.key]) || c.formula
        if (f) row[c.key] = parseFloat(formula.evaluateGlobal(f, row, allSections).toFixed(4))
      }
    })
    this.setData({ customProcessData: data })
    this.recalcAllSections()
    this.recalcSummary()
  },

  // 公式计算
  recalcSection(sectionKey, dtype) {
    dtype = dtype || 'process'
    const arrKey = this._getSectionsKey(dtype)
    const data = this.data.customProcessData
    const sec = (data[arrKey] || []).find(s => s.key === sectionKey)
    if (!sec) return
    const allSections = this._getAllSections()
    sec.rows.forEach(row => {
      const cols = [...(row.params || sec.columns || [])]
      ;(row.subGroups || []).forEach(sg => { cols.push(...(sg.variables || [])) })
      cols.forEach(col => {
        if (col.role === 'output') {
          const f = (row._formulas && row._formulas[col.key]) || col.formula
          if (f) row[col.key] = parseFloat(formula.evaluateGlobal(f, row, allSections).toFixed(4))
        }
      })
    })
    this.setData({ customProcessData: data })
  },

  recalcAllSections(dtype) {
    const data = this.data.customProcessData
    if (!data) return
    const allSections = this._getAllSections()
    const types = dtype ? [dtype] : ['process', 'energy', 'moldFee']
    types.forEach(t => {
      const arrKey = this._getSectionsKey(t)
      const sections = data[arrKey]
      if (!sections) return
      sections.forEach(sec => {
        sec.rows.forEach(row => {
          const cols = [...(row.params || sec.columns || [])]
          ;(row.subGroups || []).forEach(sg => { cols.push(...(sg.variables || [])) })
          cols.forEach(col => {
            if (col.role === 'output') {
              const f = (row._formulas && row._formulas[col.key]) || col.formula
              if (f) row[col.key] = parseFloat(formula.evaluateGlobal(f, row, allSections).toFixed(4))
            }
          })
        })
      })
    })
    this.setData({ customProcessData: data })
  },

  recalcSummary() {
    const data = this.data.customProcessData
    if (!data) return
    const allSections = this._getAllSections()
    // 手动高级汇总（保留兼容）
    const summary = data.summary || []
    summary.forEach(item => {
      if (item.formula) {
        item.value = parseFloat(formula.evaluateGlobal(item.formula, {}, allSections).toFixed(4))
      }
    })
    const laborItem = summary.find(s => s.key === 'totalLabor')
    const mfgItem = summary.find(s => s.key === 'totalMfg')
    const energyItem = summary.find(s => s.key === 'totalEnergy')
    // 自动小计 + 合计
    this._recalcAutoSubtotals(data)
    this.setData({
      customProcessData: data,
      prodTotalLabor: laborItem ? laborItem.value : 0,
      prodTotalMfg: mfgItem ? mfgItem.value : 0,
      prodTotalEnergy: energyItem ? energyItem.value : 0
    })
  },

  // 自动小计与合计
  _recalcAutoSubtotals(data) {
    var areaTotals = { sections: 0, energySections: 0, moldFeeSections: 0 }
    var types = ['sections', 'energySections', 'moldFeeSections']
    types.forEach(function (arrKey) {
      var sections = data[arrKey]
      if (!sections) return
      sections.forEach(function (sec) {
        var isMaterial = arrKey === 'energySections' && sec.subtype === 'material'
        var isDevice = arrKey === 'energySections' && sec.subtype === 'device'
        var numCols
        if (isMaterial || isDevice) {
          // 卡片模式：从 row.params + row.subGroups 聚合，按 label 去重
          var labelMap = {}
          ;(sec.rows || []).forEach(function (row) {
            ;(row.params || []).forEach(function (p) {
              if (p.type === 'number' || p.role === 'output') {
                if (!labelMap[p.label]) {
                  labelMap[p.label] = { key: p.label, label: p.label, keys: [p.key], type: p.type, role: p.role }
                } else if (labelMap[p.label].keys.indexOf(p.key) === -1) {
                  labelMap[p.label].keys.push(p.key)
                }
              }
            })
            ;(row.subGroups || []).forEach(function (sg) {
              ;(sg.variables || []).forEach(function (p) {
                if (p.type === 'number' || p.role === 'output') {
                  if (!labelMap[p.label]) {
                    labelMap[p.label] = { key: p.label, label: p.label, keys: [p.key], type: p.type, role: p.role }
                  } else if (labelMap[p.label].keys.indexOf(p.key) === -1) {
                    labelMap[p.label].keys.push(p.key)
                  }
                }
              })
            })
          })
          numCols = Object.values(labelMap)
        } else {
          // 表格模式：按 label 去重
          var labelMap2 = {}
          ;(sec.columns || []).forEach(function (c) {
            if (c.type === 'number' || c.role === 'output') {
              if (!labelMap2[c.label]) {
                labelMap2[c.label] = { key: c.label, label: c.label, keys: [c.key], type: c.type, role: c.role }
              } else if (labelMap2[c.label].keys.indexOf(c.key) === -1) {
                labelMap2[c.label].keys.push(c.key)
              }
            }
          })
          numCols = Object.values(labelMap2)
        }
        sec._numCols = numCols
        // 辅料固定汇总 amount，设备用 picker
        var stKey = isMaterial ? 'amount' : sec.subtotalKey
        if (stKey) {
          var sum = 0
          // 按 label 或 key 找到匹配项，获取所有关联的 keys
          var stItem = numCols.find(function (c) { return c.key === stKey || (c.keys && c.keys.indexOf(stKey) !== -1) })
          var stKeys = stItem && stItem.keys ? stItem.keys : [stKey]
          sec.rows.forEach(function (row) {
            stKeys.forEach(function (k) { sum += parseFloat(row[k]) || 0 })
          })
          sec.subtotalValue = parseFloat(sum.toFixed(4))
          if (isMaterial) {
            sec.subtotalKey = 'amount'
            sec.subtotalLabel = '金额'
          } else {
            var col = numCols.find(function (c) { return c.key === stKey || (c.keys && c.keys.indexOf(stKey) !== -1) })
            sec.subtotalLabel = col ? col.label : stKey
          }
          if (sec.includedInSummary !== false) areaTotals[arrKey] += sec.subtotalValue
        } else {
          sec.subtotalValue = 0
          sec.subtotalLabel = ''
        }
      })
    })
    var grandTotal = areaTotals.sections + areaTotals.energySections + areaTotals.moldFeeSections
    this.setData({
      customProcessData: data,
      prodGrandTotal: parseFloat(grandTotal.toFixed(4)),
      processAreaTotal: parseFloat(areaTotals.sections.toFixed(4)),
      energyAreaTotal: parseFloat(areaTotals.energySections.toFixed(4)),
      moldFeeAreaTotal: parseFloat(areaTotals.moldFeeSections.toFixed(4))
    })
  },

  onSubtotalKeyChange(e) {
    var skey = e.currentTarget.dataset.skey
    var dtype = (e.currentTarget.dataset.dtype) || 'process'
    var arrKey = this._getSectionsKey(dtype)
    var data = this.data.customProcessData
    var sec = (data[arrKey] || []).find(function (s) { return s.key === skey })
    if (!sec) return
    var idx = parseInt(e.detail.value)
    var numCols = sec._numCols || (sec.columns || []).filter(function (c) { return c.type === 'number' || c.role === 'output' })
    var selected = numCols[idx]
    if (!selected) return
    sec.subtotalKey = selected.key
    this.setData({ customProcessData: data })
    this.recalcSummary()
  },

  // 区域汇总弹窗
  openAreaSummary(e) {
    const dtype = e.currentTarget.dataset.dtype
    this.setData({ showAreaSummaryModal: true, areaSummaryDtype: dtype })
  },
  closeAreaSummary() {
    this.setData({ showAreaSummaryModal: false, areaSummaryDtype: '' })
  },
  toggleSectionInSummary(e) {
    const { skey, dtype } = e.currentTarget.dataset
    const arrKey = this._getSectionsKey(dtype)
    const data = this.data.customProcessData
    const sec = (data[arrKey] || []).find(s => s.key === skey)
    if (!sec) return
    sec.includedInSummary = sec.includedInSummary === false
    this.setData({ customProcessData: data })
    this._recalcAutoSubtotals(data)
  },

  // 汇总编辑
  openSummaryEditor() {
    const data = this.data.customProcessData
    this.setData({
      showSummaryEditor: true,
      editingSummary: JSON.parse(JSON.stringify(data.summary || []))
    })
  },
  closeSummaryEditor() {
    this.setData({ showSummaryEditor: false })
  },
  addSummaryItem() {
    const items = this.data.editingSummary
    items.push({ key: 'sum_' + Date.now(), label: '', formula: '' })
    this.setData({ editingSummary: items })
  },
  onSummaryItemInput(e) {
    const { idx, field } = e.currentTarget.dataset
    const items = this.data.editingSummary
    items[idx][field] = e.detail.value
    this.setData({ editingSummary: items })
  },
  deleteSummaryItem(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    const items = this.data.editingSummary
    items.splice(idx, 1)
    this.setData({ editingSummary: items })
  },
  saveSummaryEditor() {
    const data = this.data.customProcessData
    data.summary = this.data.editingSummary
    this.setData({ customProcessData: data, showSummaryEditor: false })
    this.recalcSummary()
  },

  // ==================== 审批Tab ====================
  calcApproveData() {
    var materialCost = parseFloat(this.data.techMaterialTotal) || 0
    var manufactureCost = parseFloat(this.data.prodGrandTotal) || 0
    var freight = parseFloat(this.data.perPartFreight) || parseFloat(this.data.freight) || 0
    var cashCost = materialCost + manufactureCost + freight
    this.setData({
      'approveData.materialCost': parseFloat(materialCost.toFixed(2)),
      'approveData.manufactureCost': parseFloat(manufactureCost.toFixed(2)),
      'approveData.freight': parseFloat(freight.toFixed(2)),
      'approveData.cashCost': parseFloat(cashCost.toFixed(2))
    })
    this.recalcApprove()
  },

  recalcApprove() {
    var ad = this.data.approveData
    var base = (ad.materialCost || 0) + (ad.manufactureCost || 0)
    var rateFields = [
      { rate: 'mgmtRate', value: 'mgmtValue' },
      { rate: 'warehouseRate', value: 'warehouseValue' },
      { rate: 'financeRate', value: 'financeValue' },
      { rate: 'qualityRate', value: 'qualityValue' },
      { rate: 'profitRate', value: 'profitValue' }
    ]
    var updates = {}
    var feeTotal = 0
    rateFields.forEach(function (f) {
      var rate = parseFloat(ad[f.rate]) || 0
      var val = parseFloat((base * rate).toFixed(2))
      updates['approveData.' + f.value] = val
      feeTotal += val
    })
    var moldShare = parseFloat(ad.moldShare) || 0
    var preTax = parseFloat(((ad.cashCost || 0) + feeTotal + moldShare).toFixed(2))
    var taxRate = parseFloat(ad.taxRate) || 0
    var postTax = parseFloat((preTax * taxRate).toFixed(2))
    updates['approveData.preTax'] = preTax
    updates['approveData.postTax'] = taxRate ? postTax : ''
    this.setData(updates)
  },

  onApproveInput(e) {
    var field = e.currentTarget.dataset.field
    if (!field) return
    this.setData({ ['approveData.' + field]: e.detail.value })
    this.recalcApprove()
  },

  approveQuote() {
    const { currentQuoteId } = this.data
    if (!currentQuoteId) return
    wx.showModal({
      title: '确认审批',
      content: '确定审批通过该报价吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '审批中...' })
          const dto = this.buildQuoteDTO()
          api.updateQuoteOrder(currentQuoteId, dto)
            .then(() => api.approveOrder(currentQuoteId))
            .then(() => {
              wx.hideLoading()
              wx.showToast({ title: '审批通过', icon: 'success' })
              setTimeout(() => this.loadQuoteDetail(currentQuoteId), 1000)
            })
            .catch(err => {
              wx.hideLoading()
              wx.showToast({ title: err.message || '审批失败', icon: 'none' })
            })
        }
      }
    })
  },

  // ==================== 导出 ====================
  exportQuote() {
    const {
      alPrice, cartCollectors, cartFins, cartTubes, collectorSpecs, finSpecs, tubeSpecs,
      mfgCost, freight, processList, processQtys, selectedDestination, logisticsResult
    } = this.data

    // 从购物车数据组装导出数据
    const collectors = cartCollectors.map(item => {
      const spec = collectorSpecs.find(s => s.id === item.specId) || {}
      return {
        specId: item.specId, name: item.name, area: spec.area, length: spec.length, fee: spec.fee,
        count: item.qty, unitPrice: item.unitPrice, subtotal: item.subtotal
      }
    })

    const fins = cartFins.map(item => {
      const spec = finSpecs.find(s => s.id === item.specId) || {}
      return {
        specId: item.specId, name: item.name, width: spec.width, waveLen: spec.waveLen,
        waveCount: spec.waveCount, thickness: spec.thickness, fee: spec.fee, partFee: spec.partFee,
        count: item.qty, unitPrice: item.unitPrice, subtotal: item.subtotal
      }
    })

    const tubes = cartTubes.map(item => {
      const spec = tubeSpecs.find(s => s.id === item.specId) || {}
      return {
        specId: item.specId, name: item.name, meterWeight: spec.meterWeight, length: spec.length,
        fee: item.isZinc ? spec.zincFee : spec.fee, isZinc: item.isZinc,
        count: item.qty, unitPrice: item.unitPrice, subtotal: item.subtotal
      }
    })

    const processes = []
    processList.forEach(p => {
      const qty = processQtys[p.id] || 0
      if (qty > 0) {
        processes.push({
          processId: p.id, processName: p.name, unitType: p.unitType,
          unitPrice: p.unitPrice, count: qty, subtotal: p.unitPrice * qty
        })
      }
    })

    if (parseFloat(mfgCost) > 0) {
      processes.push({ processName: '制造费用', unitPrice: parseFloat(mfgCost), count: 1, subtotal: parseFloat(mfgCost) })
    }

    const previewData = {
      customerName: '',
      productType: '冷凝器',
      quantity: 1,
      alPrice: parseFloat(alPrice) || 0,
      collectors: collectors,
      fins: fins,
      tubes: tubes,
      processes: processes,
      freight: parseFloat(freight) || 0,
      destination: selectedDestination,
      logisticsResult: logisticsResult
    }

    wx.setStorageSync('previewQuoteData', previewData)
    wx.navigateTo({ url: '/pages/preview/preview' })
  }
})
