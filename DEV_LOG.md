# 易德报价系统 - 开发日志

> 此文件用于记录项目开发进度，方便 AI 助手快速了解项目状态

**最后更新**: 2026-02-17

---

## 一、项目概述

- **项目名称**: 冷凝器报价管理系统 v2.0
- **所属公司**: 广西易德科技有限责任公司
- **项目目标**: 从纯前端计算工具升级为企业级报价管理系统

---

## 二、技术栈

| 模块 | 技术 | 状态 |
|------|------|------|
| 后端 | Spring Boot 3 + MyBatis-Plus + MySQL | ✅ 主体完成 |
| 前端 | 微信小程序原生 | ✅ 主体完成 |
| 认证 | Spring Security + JWT | ✅ 已完成 |
| API文档 | Knife4j | ✅ 已配置 |
| 3D渲染 | threejs-miniprogram | ✅ 已集成 |
| Excel处理 | EasyExcel 3.3.3 | ✅ 已完成 |

---

## 三、模块完成情况

### 3.1 后端 (backend/)

#### 已完成的 Entity
| 实体 | 文件 | 说明 |
|------|------|------|
| SysUser | ✅ | 用户表 |
| SysConfig | ✅ | 系统配置表 |
| ProcessDict | ✅ | 工序字典表 |
| LogisticsPrice | ✅ | 物流价格表 |
| BaseSpec | ✅ | 规格库表 |
| QuoteOrder | ✅ | 报价单表 |
| QuoteBom | ✅ | BOM物料清单表（含树形结构） |
| BasePackaging | ✅ | 包装规格表 |
| BaseMachine | ✅ | 设备规格表 |
| QuoteLogistics | ✅ | 报价物流明细 |
| QuoteItemProcess | ✅ | 报价工序明细 |
| BaseMachineDict | ✅ | 设备字典表（工艺计算） |
| BaseLaborRate | ✅ | 人工费率配置表 |
| BaseVehicleDict | ✅ | 车型字典表（物流测算） |
| BasePackDict | ✅ | 包装类型字典表 |
| PartPreset | ✅ | 零件模板表（含加工费/公式） |

#### 已完成的 Mapper
| Mapper | 说明 |
|--------|------|
| SysUserMapper | ✅ |
| SysConfigMapper | ✅ |
| ProcessDictMapper | ✅ |
| LogisticsPriceMapper | ✅ |
| BaseSpecMapper | ✅ |
| QuoteOrderMapper | ✅ |
| QuoteBomMapper | ✅ |
| BasePackagingMapper | ✅ |
| BaseMachineMapper | ✅ |
| QuoteLogisticsMapper | ✅ |
| QuoteItemProcessMapper | ✅ |
| BaseMachineDictMapper | ✅ |
| BaseLaborRateMapper | ✅ |
| BaseVehicleDictMapper | ✅ |
| BasePackDictMapper | ✅ |
| PartPresetMapper | ✅ |

#### 已完成的 Controller
| 控制器 | 功能 | 状态 |
|--------|------|------|
| AuthController | 登录/认证 | ✅ |
| AdminController | 管理员功能 | ✅ |
| ProcessController | 工序管理 | ✅ |
| SpecController | 规格管理 | ✅ |
| QuoteController | 报价计算 | ✅ |
| LogisticsController | 物流管理 | ✅ |
| BomController | BOM管理（树形CRUD） | ✅ |
| ProcessCalcController | 工艺计算（工序CRUD） | ✅ |
| LogisticsCalcController | 物流测算（包装/运费） | ✅ |
| ManagerController | 经理驾驶舱（审批/驳回） | ✅ |
| ExcelExportController | Excel导出 | ✅ |
| BinPackingController | 3D智能装箱计算 | ✅ |

#### 已完成的 Service
| 服务 | 功能 | 状态 |
|------|------|------|
| AuthService | JWT认证 | ✅ |
| ProcessService | 工序CRUD | ✅ |
| SpecService | 规格CRUD | ✅ |
| QuoteService | 报价计算 | ✅ |
| LogisticsService | 物流计算/导入 | ✅ |
| ConfigService | 系统配置 | ✅ |
| ExportService | Excel导出 | ✅ |
| ExcelAnalyzeService | Excel智能解析 | ✅ |
| LogisticsImportService | 物流价格导入 | ✅ |
| BomService | BOM树形CRUD/重量计算 | ✅ |
| ProcessCalcService | 工艺计算引擎（工序费用） | ✅ |
| LogisticsCalcService | 物流测算引擎（包装/运费） | ✅ |
| ManagerService | 经理审批（汇总/利润调整） | ✅ |
| QuoteStateMachineService | 报价单状态机 | ✅ |
| ExcelFillService | Excel模板填充导出 | ✅ |
| BinPackingService | 3D装箱算法（2D底部装载+堆叠） | ✅ |

#### 已完成的 DTO
| DTO | 说明 |
|-----|------|
| LoginDTO | 登录请求 |
| UserCreateDTO | 用户创建 |
| QuoteCalculateDTO | 报价计算请求 |
| QuoteCreateDTO | 销售创建报价单 |
| BomNodeDTO | BOM节点编辑 |
| LogisticsExcelDTO | 物流Excel数据 |
| LogisticsRawRowDTO | 物流原始行数据 |
| ColumnMappingDTO | 列映射 |
| RegionMappingDTO | 区域映射 |
| ExcelAnalyzeResultDTO | Excel解析结果 |
| LogisticsImportRequestDTO | 物流导入请求 |
| LogisticsImportResultDTO | 物流导入结果 |
| ProcessAddDTO | 工序添加请求 |
| LogisticsSaveDTO | 物流保存请求 |
| ProfitAdjustDTO | 利润调整请求 |
| RejectDTO | 驳回请求 |
| QuoteOverviewFillDTO | Excel填充-报价概览 |
| BomFillDTO | Excel填充-BOM列表 |
| ProcessFillDTO | Excel填充-工序列表 |
| LogisticsFillDTO | Excel填充-物流数据 |
| BinPackingRequestDTO | 装箱计算请求（货物列表、路线、动态价格） |
| CargoItemDTO | 货物项（包装类型、尺寸、数量、重量、限叠层数） |

#### 已完成的 VO
| VO | 说明 |
|----|------|
| LoginVO | 登录响应 |
| UserVO | 用户信息 |
| QuoteResultVO | 报价结果 |
| QuoteListVO | 报价单列表 |
| BomTreeNodeVO | BOM树形节点 |
| LogisticsQuoteVO | 物流报价 |
| QuoteSummaryVO | 报价汇总（经理驾驶舱） |
| BinPackingSolutionVO | 装箱方案（多方案对比、费用明细） |
| TruckLoadVO | 单车装载详情（车型、利用率、货物位置） |
| CargoPositionVO | 货物3D位置（x/y/z坐标、旋转状态） |

#### 安全模块
| 组件 | 状态 |
|------|------|
| SecurityConfig | ✅ |
| JwtConfig | ✅ |
| JwtTokenProvider | ✅ |
| JwtAuthenticationFilter | ✅ |
| UserDetailsServiceImpl | ✅ |

#### 配置模块
| 组件 | 说明 | 状态 |
|------|------|------|
| SecurityConfig | Spring Security配置 | ✅ |
| JwtConfig | JWT配置 | ✅ |
| MybatisPlusConfig | MyBatis Plus配置 | ✅ |
| CorsConfig | 跨域配置 | ✅ |
| Knife4jConfig | API文档配置 | ✅ |
| DataInitializer | 数据初始化 | ✅ |

#### 其他模块
| 模块 | 文件 | 说明 |
|------|------|------|
| common | Result.java | 统一响应结果 |
| common | GlobalExceptionHandler.java | 全局异常处理 |
| enums | RoleEnum.java | 角色枚举 |
| enums | SpecTypeEnum.java | 规格类型枚举 |
| utils | CalcUtils.java | 计算工具类 |
| task | LogisticsExpireTask.java | 物流过期定时任务 |

### 3.2 小程序前端 (condenser-miniprogram/)

#### 页面完成情况
| 页面 | 路径 | 状态 | 说明 |
|------|------|------|------|
| 登录页 | pages/login | ✅ | JWT登录 |
| 启动页 | pages/splash | ✅ | 公司信息展示 |
| 首页 | pages/home | ✅ | 产品选择入口 |
| 冷凝器报价 | pages/condenser | ✅ | 核心报价功能 |
| 报价预览 | pages/preview | ✅ | 报价单预览编辑 |
| 历史记录 | pages/history | ✅ | 报价历史查询 |
| 个人中心 | pages/profile | ✅ | 用户信息/退出 |
| 用户管理 | pages/user-manage | ✅ | ADMIN专用 |
| 系统配置 | pages/config | ✅ | 铝价等配置 |
| 工序管理 | pages/process-manage | ✅ | 工序CRUD |
| 规格管理 | pages/spec-manage | ✅ | 规格CRUD |
| 物流查看 | pages/logistics-view | ✅ | 物流价格查看+Excel导入 |
| 报价单列表 | pages/quote-list | ✅ | 新版报价单列表 |
| 创建报价单 | pages/quote-create | ✅ | 销售创建报价单 |
| 报价单详情 | pages/quote-detail | ✅ | 查看报价单信息 |
| BOM管理 | pages/bom-manage | ✅ | 技术端-树形BOM设计器 |
| 工艺核算 | pages/process-calc | ✅ | 工艺端-工序费用核算 |
| 物流测算 | pages/logistics-calc | ✅ | 物流专员-包装/运费测算 |
| 经理审批 | pages/manager-approve | ✅ | 经理驾驶舱-审批/利润调整 |
| 散热器 | pages/radiator | ⏳ | 仅框架 |
| 蒸发器 | pages/evaporator | ⏳ | 仅框架 |
| 液冷板 | pages/liquid-cooling | ⏳ | 仅框架 |

#### 工具模块
| 文件 | 功能 | 状态 |
|------|------|------|
| utils/api.js | API封装 | ✅ |
| utils/auth.js | 认证工具 | ✅ |
| utils/calc.js | 计算逻辑 | ✅ |
| utils/request.js | 请求封装 | ✅ |
| utils/formula.js | 公式引擎（Shunting-Yard） | ✅ |

#### 组件模块
| 组件 | 路径 | 说明 | 状态 |
|------|------|------|------|
| 3D装箱渲染 | components/bin-packing-3d | Three.js 3D装车可视化（手势旋转、包装着色、多车型导航） | ✅ |

#### NPM 依赖
| 包名 | 版本 | 用途 |
|------|------|------|
| threejs-miniprogram | ^0.0.8 | 小程序端 Three.js 3D渲染 |

### 3.3 数据库 (docs/database/)

| 文件 | 说明 | 状态 |
|------|------|------|
| init.sql | 初始化脚本 | ✅ |
| upgrade_logistics.sql | 物流表升级 | ✅ |
| upgrade_v2.1.sql | v2.1版本升级 | ✅ |
| upgrade_process_dict.sql | 工序字典升级 | ✅ |
| insert_process.sql | 工序数据插入 | ✅ |
| add_delivery_fee.sql | 配送费字段添加 | ✅ |
| add_dongguan_surcharge.sql | 东莞特殊送货费字段 | ✅ |
| phase3_process_ddl.sql | Phase3工艺计算DDL | ✅ |
| phase4_logistics_ddl.sql | Phase4物流测算DDL | ✅ |
| phase2_bom_ddl.sql | Phase2 BOM表DDL | ✅ |
| saic_upgrade.sql | 上汽报价单字段升级 | ✅ |
| create_part_preset.sql | 零件模板表创建 | ✅ |
| alter_part_preset_v2.sql | 零件模板表升级（加工费/公式） | ✅ |

### 3.4 Python后端 (condenser-api/) - 已弃用

v1.0 遗留，已被 Spring Boot 后端替代，保留仅供参考。

---

## 四、待完成任务

### 高优先级 (P0)
- [ ] 散热器报价模块
- [ ] 蒸发器报价模块
- [ ] 液冷板报价模块

### 中优先级 (P1)
- [ ] 报价单PDF导出
- [ ] 数据统计分析
- [ ] 批量报价功能

### 低优先级 (P2)
- [ ] 多语言支持
- [ ] 离线模式
- [ ] 消息通知

---

## 五、已知问题

| 问题 | 位置 | 状态 |
|------|------|------|
| 暂无 | - | - |

---

## 六、开发记录

### 2026-02-17
- **技术Tab零件参数优化 - 行级列定义架构**
  - 核心改动：列结构从分类级改为行级，每行携带自己的 `_columns` 定义
  - 数据库：
    - `alter_part_preset_v2.sql`：part_preset 表新增 has_process_fee、process_fee_label、process_fee_default、formulas_json 字段
  - 后端：
    - `PartPreset.java`：新增 hasProcessFee、processFeeLabel、processFeeDefault、formulasJson 字段
  - 小程序 `condenser.js`：
    - 数据结构：categories 新增 mergedColumns/subtotal/hasProcessFeeRows/_filteredPresets
    - `_recalcTechRow()`：读取 row._columns 替代 cat.columns，注入 globalVars 和 processFee 变量
    - `_calcTechMaterialTotal()`：计算每个分区小计
    - 新增 `_rebuildMergedColumns()`：合并分区内所有行的列定义为表头
    - 新增 `_rebuildAllMergedColumns()`：重建所有分区的合并列
    - 新增 `_migrateTechData()`：旧数据迁移（分类级 columns → 行级 _columns）
    - 新增 `_updateFilteredPresets()`：按分类筛选模板列表
    - 新增 `_buildRowMeta()`：构建 _colKeys/_outputKeys 辅助索引
    - 新增 `onProcessFeeInput()`：加工费输入处理
    - 新增 `toggleCategoryAddMenu()`：分区级添加菜单
    - `addPartFromPreset()`：从模板创建行，携带 _columns/_hasProcessFee/_processFeeLabel/_processFeeValue
    - `addSimplePart()`：创建简单4列行（数量/重量/单价/金额）
    - `addTechEmptyRow()`：复用最后一行列定义或默认简单列
    - `copyTechRow()`：改用 JSON.parse(JSON.stringify) 深拷贝
    - `deleteTechRow()`：删除后重建 mergedColumns
    - `savePartPreset()`：发送新字段到 API
    - `buildQuoteDTO()`：序列化前清理运行时字段
  - 小程序 `condenser.wxml`：
    - 分区表头使用 mergedColumns，固定"零件名称"列
    - 单元格渲染检查 _colKeys（是否有该列）和 _outputKeys（是否为公式输出）
    - 每个分区显示小计，底部有"添加零件"按钮（模板下拉+空白行）
    - 加工费编辑栏
    - 模板编辑器新增加工费开关和设置
  - 小程序 `condenser.wxss`：
    - 新增 cp-cell-name/cp-empty-cell/cp-section-subtotal/cp-section-add 等样式
    - 新增加工费编辑栏样式
  - 设计文档：`docs/design/part-param-optimization.md`

### 2026-02-05
- **冷凝器报价页面集成报价单工作流**
  - 新增功能：
    - 页面模式切换：列表模式 / 编辑模式
    - 报价单列表：按角色筛选、状态标签着色
    - 新建报价单：销售角色可创建
    - 加载/保存报价单：根据角色保存对应数据
    - 提交报价单：各角色提交到下一环节
  - 小程序修改文件：
    - `condenser.js`：
      - 新增 `pageMode` 状态（list/edit）
      - 新增 `quoteList`, `currentQuote`, `currentQuoteId` 数据
      - 新增 `loadQuoteList()` 加载报价单列表
      - 新增 `selectQuote()` 选择报价单进入编辑
      - 新增 `createNewQuote()` 创建新报价单
      - 新增 `loadQuoteDetail()` 加载报价单详情
      - 新增 `exitEditMode()` 退出编辑模式
      - 新增 `saveQuoteDraft()` 保存草稿
      - 新增 `submitQuote()` 提交报价单
      - 新增 `fillFormFromQuote()` 从报价单填充表单
      - 新增 `buildQuoteDTO()` 构建报价单DTO
    - `condenser.wxml`：
      - 新增列表模式视图（报价单列表卡片、新建按钮）
      - 新增编辑模式容器（Tab栏+退出按钮同行）
      - 新增底部操作栏（保存草稿/提交按钮）
    - `condenser.wxss`：
      - 新增 `.quote-list-container` 列表容器样式
      - 新增 `.quote-item` 报价单卡片样式
      - 新增 `.quote-status.status-*` 状态标签样式（7种状态）
      - 新增 `.main-tabs-wrapper` Tab栏包装器
      - 新增 `.exit-btn` 退出按钮样式
      - 新增 `.bottom-action-bar` 底部操作栏样式
      - 新增 `.action-btn.save-btn/.submit-btn` 操作按钮样式
  - Tab可见性矩阵：
    - SALES：销售Tab
    - TECH：销售Tab（只读）+ 技术Tab
    - PROCESS：销售Tab（只读）+ 技术Tab（只读）+ 工序Tab
    - LOGISTICS：物流Tab + 产品规格（待用户后续补充联动）
    - MANAGER：所有Tab（只读）+ 审批区
  - 复用现有API：
    - `createQuoteOrder()` 创建报价单
    - `getQuoteOrderList()` 获取列表
    - `getQuoteOrderDetail()` 获取详情
    - `updateQuoteOrder()` 更新报价单
    - `submitQuoteOrder()` 提交到下一环节
    - `submitBom()` / `submitProcessCalc()` / `submitLogisticsCalc()` / `approveOrder()` 各角色提交

### 2026-02-02
- **智能3D装箱物流功能**
  - 后端新增文件：
    - `BinPackingController.java`：装箱计算接口 `/bin-packing/calculate`
    - `BinPackingService.java`：装箱算法核心服务（2D底部装载+堆叠）
    - `BinPackingRequestDTO.java`：装箱请求DTO（含货物列表、路线、动态价格）
    - `CargoItemDTO.java`：货物项DTO（包装类型、尺寸、数量、重量、限叠层数）
    - `BinPackingSolutionVO.java`：装箱方案VO（多方案对比）
    - `TruckLoadVO.java`：单车装载详情VO
    - `CargoPositionVO.java`：货物3D位置VO（x/y/z坐标）
  - 小程序新增文件：
    - `components/bin-packing-3d/`：3D渲染组件（threejs-miniprogram）
      - 支持厢式/高栏/平板三种车型样式渲染
      - 按包装类型着色（围板箱蓝、纸箱黄、木箱红、托盘绿）
      - 支持手势旋转查看
  - 小程序修改文件：
    - `condenser.js`：新增货物管理、装箱计算、3D预览方法
    - `condenser.wxml`：新增货物输入表单、方案列表、3D预览弹窗
    - `condenser.wxss`：新增装箱相关样式
    - `request.js`：新增 `calcBinPacking()` API
  - 核心功能：
    - 货物清单管理（添加/删除/编辑）
    - 多策略方案生成（9.6米厢式/高栏、17.5米平板、13.5米高栏、智能混合）
    - 堆叠限制计算（层数 = min(车高/货物高, 限叠层数)）
    - 3D装车可视化预览
    - 包装费自动汇总
    - 总立方数自动计算
  - 车型规格：
    - 4.2米：4.1×2.3×2.1m，载重4吨
    - 6.8米：6.7×2.4×2.5m，载重10吨
    - 9.6米：9.5×2.4×2.6m，载重18吨
    - 13.5米：13.0×2.4×2.6m，载重32吨
    - 17.5米：17.3×3.0×3.0m，载重30吨

- **动态车型价格功能**
  - 装箱计算时自动从已查询的物流价格中提取各车型最低价
  - 后端修改：
    - `BinPackingRequestDTO.java`：新增 `truckPrices` 字段
    - `BinPackingService.java`：新增 `applyDynamicPrices()` 方法
  - 前端修改：
    - `condenser.js`：新增 `extractTruckPrices()` 方法
  - 使用流程：选择路线查询运费 → 计算装车方案 → 自动使用该路线最低价

### 2026-02-01
- **全局样式系统重构 (app.wxss)**
  - 新增CSS变量系统：
    - 主色调（--color-primary系列）、辅助色（success/warning/danger）
    - 中性色系统（text-primary/secondary/tertiary、border、bg）
    - 阴影系统（shadow-sm/md/lg/card）
    - 圆角系统（radius-sm/md/lg/xl）
    - 间距系统（spacing-xs/sm/md/lg/xl）
  - 新增骨架屏加载组件（.skeleton系列）
  - 新增空状态组件样式（.empty-state系列）
  - 新增加载状态样式（.loading-wrapper/spinner）
  - 新增页面过渡动画（.fade-in、.slide-up）

- **BOM管理页面重构 (bom-manage)**
  - 从树形BOM结构改为扁平物料清单展示
  - 新增批量管理模式：
    - 批量选择/取消选择
    - 全选/取消全选
    - 批量删除（Promise.all并行删除）
  - 新增技术参数配置区：
    - 图纸号输入（带聚焦高亮效果）
    - 含进口子零件单选（是/否）
  - 卡片展开/折叠功能（显示材料名称、供应商、邓白氏号）
  - 采购类型输入验证（只允许P/M，自动转大写）
  - UI风格统一为专业蓝配色
  - 物料编辑弹窗新增字段：原材料名称、供应商名称、供应商邓白氏号

- **后端BomService增强**
  - 新增 `batchUpdateToolingCost()` 方法：批量更新BOM工装分摊费用

- **报价单列表页优化 (quote-list)**
  - 新增各角色标签配置 TAB_CONFIG：
    - SALES：全部/草稿/待处理/已完成
    - TECH：全部/待处理/待办/已完成
    - PROCESS：全部/待处理/待办/已完成
    - LOGISTICS：全部/待处理/待办/已完成
    - MANAGER：全部/待处理/待办/已完成
    - ADMIN：全部/草稿/待处理/待办/已完成
  - 支持多状态筛选（statuses数组）
  - 新增导出Excel功能
  - 新增隐藏报价单功能

- **报价单创建页优化 (quote-create)**
  - 新增输入框聚焦状态交互（focusedField）
  - 表单字段结构优化

- **多页面样式统一**
  - condenser、logistics-calc、manager-approve、process-calc、profile、quote-detail、quote-list等页面样式更新
  - 统一使用CSS变量，保持设计一致性

### 2026-01-31
- **经理审批页面重构 - 成本汇总区优化**
  - 问题修复：
    - 修复管理费用、利润等输入框无法输入的问题（`<text>`标签内嵌套`<input>`无效）
    - 修复总制造成本未正确计算显示的问题
    - 修复物流成本未正确带入的问题（后端`calculateLogisticsCost`会覆盖前端传入值）
    - 修复销售价格计算错误的问题（前端传入旧值导致后端不重新计算）
  - 后端修改：
    - `QuoteSummaryVO.java`：新增物流明细字段（warehouseFee、freightFee、returnFreightFee、totalLogisticsCost）
    - `ManagerService.java`：
      - `getSummary()`补充返回totalProductionCost、laborCost、物流明细
      - `adjustProfit()`支持用户覆盖自动计算值，简化计算逻辑
    - `ProfitAdjustDTO.java`：新增totalProductionCost、unitPriceExclTax字段
    - `LogisticsCalcService.java`：修复`calculateLogisticsCost()`保留前端传入的totalLogisticsCost
  - 前端修改：
    - `manager-approve.wxml`：重写成本汇总区为卡片式垂直布局
      - 标题可编辑（默认"仅在中国境内使用/制造的零件"）
      - 所有成本字段可编辑（总制造成本、管理费用、报废率、报废成本、利润、出厂价、销售价格）
      - 物流成本可展开显示明细（三方仓、运费、围板箱与海绵运回运费）
    - `manager-approve.wxss`：新增成本表单、物流区域、最终报价区样式
    - `manager-approve.js`：
      - 更新formData字段结构
      - 修改数据加载逻辑，从summary获取物流明细
      - 修复计算接口调用，不传unitPriceExclTax让后端自动计算
  - 计算公式确认：
    - 总制造成本 = 材料成本 + 人工成本 + 制造费用
    - 出厂价 = 总制造成本 + 管理费用 + 报废成本 + 利润
    - 销售价格(不含税) = 出厂价 + 物流成本

- **报价单隐藏功能优化**
  - 修改`QuoteService.hideOrder()`：移除创建者权限校验
  - 允许所有用户隐藏任意报价单（仅影响个人视图，不影响其他用户）

- **编译错误修复**
  - 修复`QuoteStatusEnum.PENDING_APPROVE`枚举值不存在的问题
  - 正确值为`PENDING_APPROVAL`

- **开发日志同步更新**
  - 补充小程序页面记录：
    - `pages/process-calc`：工艺核算页面
    - `pages/logistics-calc`：物流测算页面
    - `pages/manager-approve`：经理审批页面
  - 补充数据库脚本记录：
    - `phase2_bom_ddl.sql`：BOM表DDL
    - `saic_upgrade.sql`：上汽报价单字段升级脚本

### 2026-01-30
- **Phase 5: 经理驾驶舱 - 审批与利润调整**
  - 后端新增文件：
    - `ManagerController.java`：经理审批接口（汇总/调整/审批/驳回）
    - `ManagerService.java`：审批服务（成本汇总、利润计算、状态流转）
    - `QuoteStateMachineService.java`：报价单状态机（状态流转、级联重置）
    - `QuoteSummaryVO.java`：报价汇总VO（含工序汇总列表）
    - `ProfitAdjustDTO.java`：利润调整请求DTO
    - `RejectDTO.java`：驳回请求DTO
  - 核心功能：
    - 报价汇总：材料成本 + 制造费用 + 物流费用 + 包装费用
    - 利润调整：管理费率、利润率、税率实时计算
    - 审批通过：状态流转到 APPROVED
    - 驳回：支持驳回到技术/工艺/物流任意阶段，级联清除后续数据
  - 计算公式：
    - 直接成本 = 材料 + 制造 + 物流 + 包装
    - 管理费 = 直接成本 × 管理费率
    - 利润 = (直接成本 + 管理费) × 利润率
    - 含税单价 = 不含税单价 × (1 + 税率)

- **Excel 模板填充导出**
  - 后端新增文件：
    - `ExcelExportController.java`：导出接口
    - `ExcelFillService.java`：EasyExcel模板填充服务
    - `QuoteOverviewFillDTO.java`：报价概览填充数据
    - `BomFillDTO.java`：BOM列表填充数据
    - `ProcessFillDTO.java`：工序列表填充数据
    - `LogisticsFillDTO.java`：物流数据填充数据
  - 功能：基于上汽报价单模板，自动填充报价数据导出Excel

### 2026-01-28
- **Phase 4: 物流专员端 - 物流测算模块**
  - 后端新增文件：
    - `LogisticsCalcController.java`：物流测算接口（车型/包装/保存/提交）
    - `LogisticsCalcService.java`：物流计算引擎
    - `BaseVehicleDict.java`：车型字典实体
    - `BasePackDict.java`：包装类型字典实体
    - `QuoteLogistics.java`：物流明细实体
    - `LogisticsSaveDTO.java`：物流保存请求DTO
    - `BaseVehicleDictMapper.java`、`BasePackDictMapper.java`、`QuoteLogisticsMapper.java`
  - 数据库：`phase4_logistics_ddl.sql`
    - `base_vehicle_dict`：车型字典表（6种车型）
    - `base_pack_dict`：包装字典表（8种包装）
    - `quote_logistics`：物流明细表
  - 核心计算公式：
    - 包装摊销费 = 箱单价 / 包装寿命 / 每箱装件数
    - 单件运费 = (年运费总额 / 年产量) × 返空系数
    - 返空系数：可回收包装 = 1.5，一次性包装 = 1.0
  - 接口：
    - `GET /logistics/vehicles`：获取车型列表
    - `GET /logistics/packs`：获取包装类型列表
    - `POST /logistics/save`：保存物流信息（自动计算）
    - `GET /logistics/{orderId}`：获取物流信息
    - `POST /logistics/submit/{orderId}`：提交物流测算

### 2026-01-27
- **Phase 3-2: 工艺端 - 工艺工时填报页面**
  - 新建小程序页面 `pages/process-calc/process-calc`（工艺核算专用）
  - 后端新增/修改文件：
    - `ProcessCalcController.java`：工艺计算接口
    - `ProcessCalcService.java`：工艺计算引擎
    - `ProcessAddDTO.java`：工序添加DTO（支持processDictId）
    - `BaseMachineDict.java`：设备字典实体
    - `BaseLaborRate.java`：人工费率实体
    - `QuoteItemProcess.java`：工序明细实体
    - `BaseMachineDictMapper.java`、`BaseLaborRateMapper.java`、`QuoteItemProcessMapper.java`
  - 数据库：`phase3_process_ddl.sql`
    - `base_machine_dict`：设备字典表（10种设备）
    - `base_labor_rate`：人工费率表（普工/技工/高级技工）
    - `quote_item_process`：工序明细表
  - 核心计算公式：
    - 单件加工费 = (设备费率 / 3600) × 节拍 / 穴数
    - 单件人工费 = (人工费率 / 3600) × 节拍 × 人数 / 穴数
  - 前端新增文件：
    - `process-calc.wxml`：上下分层布局（BOM树选择 + 工序列表）
    - `process-calc.js`：完整的工序 CRUD 逻辑
    - `process-calc.wxss`：样式（BOM节点高亮、工序卡片、底部弹窗）
    - `process-calc.json`：页面配置
  - `request.js` 新增 API：
    - `getMachineDict()`：获取设备字典
    - `getProcessDictList()`：获取工序字典
    - `getProcessByBomId(bomId)`：获取零件工序列表
    - `addItemProcess(data)`：添加工序
    - `deleteItemProcess(id)`：删除工序
    - `calculateOrderProcessCost(orderId)`：计算总制造费用
    - `submitProcessCalc(orderId)`：提交工艺核算
  - 接口：
    - `GET /process/machines`：获取设备列表
    - `POST /process/add`：添加工序
    - `PUT /process/update`：更新工序
    - `DELETE /process/{processId}`：删除工序
    - `GET /process/list/{orderId}`：获取报价单工序列表
    - `GET /process/bom/{bomId}`：获取BOM零件工序
    - `POST /process/calculate/{orderId}`：计算总制造费用
    - `POST /process/submit/{orderId}`：提交工艺核算

### 2026-01-26
- **Phase 2: 技术端 - BOM在线设计器**
  - 实现树形BOM结构的完整CRUD功能（替代原Excel导入方式）
  - 后端新增/修改文件：
    - `QuoteBom.java`：新增技术字段（materialGrade、specDesc、scrapRate、techNote）
    - `BomNodeDTO.java`：节点编辑DTO
    - `BomTreeNodeVO.java`：树形响应VO（含children递归）
    - `BomController.java`：新增 /node (POST/PUT/DELETE) 和 /tree/{orderId} 接口
    - `BomService.java`：新增 addNode/updateNode/deleteNode/getBomTree 方法
    - `QuoteBomMapper.java`：新增 selectMaxSortOrder 方法
  - 前端新增/修改文件：
    - `bom-manage.js`：完整树形BOM编辑器逻辑
    - `bom-manage.wxml`：三级树形可视化UI + 节点编辑弹窗
    - `bom-manage.wxss`：树形节点样式（level-1/2/3 缩进、连接线）
    - `request.js`：新增 getBomTree/addBomNode/updateBomNode/deleteBomNode API
  - 核心功能：
    - 添加总成（根节点）/ 添加子件（子节点）
    - 编辑节点（零件名、材质牌号、规格描述、净重、毛重、废料率、技术备注等）
    - 删除节点（级联删除子节点）
    - 计算重量（递归汇总：父节点重量 = Σ子节点重量×数量）
    - 校验规则：毛重 ≥ 净重
  - 数据库：更新 quote_bom 表结构
    ```sql
    ALTER TABLE quote_bom MODIFY level_code VARCHAR(50) NULL;
    ALTER TABLE quote_bom MODIFY part_code VARCHAR(50) NULL;
    ALTER TABLE quote_bom ADD COLUMN IF NOT EXISTS scrap_rate DECIMAL(5,2) DEFAULT NULL;
    ALTER TABLE quote_bom ADD COLUMN IF NOT EXISTS tech_note VARCHAR(500) DEFAULT NULL;
    ```

- **Phase 1: 地基搭建与销售端功能**
  - 基于上汽报价单 Part 3/4 重构报价单模块
  - 新增/修改文件：
    - `QuoteStatusEnum.java`：报价单状态枚举（8种状态）
    - `RoleEnum.java`：扩展为6个角色（SALES/TECH/PROCESS/LOGISTICS/MANAGER/ADMIN）
    - `QuoteOrder.java`：重构报价单实体，区分销售填写字段和计算字段
    - `QuoteCreateDTO.java`：销售创建报价单DTO
    - `QuoteListVO.java`：报价单列表VO
    - `QuoteController.java`：新增 create/list/submit 接口
    - `QuoteService.java`：新增 createQuote/listQuotes/submitToTech 方法
  - 数据库：`docs/database/phase1_ddl.sql`
  - 接口：
    - `POST /api/quote/create`：销售员创建报价单
    - `GET /api/quote/list`：查询报价单列表（按角色过滤）
    - `POST /api/quote/{id}/submit`：提交报价单到技术工程师

- **修复物流东莞特殊送货费Bug**
  - 问题：前端硬编码了桂鑫送东莞的附加费为300，导致Excel修改备注后计算不更新
  - 方案：后端导入时从备注中解析东莞特殊费用，存入新字段
  - 修改文件：
    - `LogisticsPrice.java`：新增 `dongguanSurcharge` 字段
    - `LogisticsImportService.java`：新增正则解析逻辑，从备注中提取"东莞台达送货费400/趟"中的数值
    - `condenser.js`：删除硬编码，改为读取 `dongguanSurcharge` 字段
  - 数据库：`docs/database/add_dongguan_surcharge.sql`

### 2026-01-25
- **开发日志完善**
  - 补充后端 Mapper 层记录（10个）
  - 补充后端 DTO 层记录（10个）
  - 补充后端 VO 层记录（4个）
  - 补充后端配置模块记录（6个）
  - 补充后端其他模块记录（common、enums、utils、task）
  - 补充数据库升级脚本记录（4个）
  - 补充小程序 request.js 工具

### 2026-01-23
- **完善物流查询功能**
  - 小程序物流价格导入功能已完善
- **待完善**：冷凝器汇总页面的物流运费查询功能

### 2026-01-22
- 创建开发日志文件
- 梳理项目完成情况
- **新增物流价格Excel智能导入功能**
  - 后端：ExcelAnalyzeService（自动识别Excel结构）
  - 后端：LogisticsImportService（导入逻辑）
  - 后端：LogisticsController 新增 /analyze 和 /import 接口
  - 前端：logistics-view 页面添加导入按钮和预览弹窗
  - 支持自动识别送货/返货区域
  - 支持关键词模糊匹配列映射
  - 导入前预览确认，用户可检查映射关系

### 2026-01-21
- 完成数据库初始化脚本
- 物流表结构升级（支持双向物流）

### 2026-01-20
- 完成 v2.0 需求文档 (README_v2.md)
- Spring Boot 后端基础架构搭建
- JWT 认证模块完成
- 小程序登录页面完成

---

## 七、快速启动

### 后端启动
```bash
cd backend
mvn spring-boot:run
```

### 数据库初始化
```bash
mysql -u root -p < docs/database/init.sql
```

### 小程序
使用微信开发者工具打开 `condenser-miniprogram` 目录

---

*此文件由 Claude Code 维护，每次开发后请更新*
