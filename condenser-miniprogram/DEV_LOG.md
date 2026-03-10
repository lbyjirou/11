# 冷凝器报价小程序 - 开发日志

> 最后更新：2026-01-24

## 项目概述

微信小程序，用于冷凝器产品报价计算，包含规格配置、价格计算、物流运费查询等功能。

## 技术栈

- 微信小程序原生开发（WXML/WXSS/JS）
- 后端 API：`http://localhost:8080/api`（开发环境）

## 核心页面结构

### 主页面：`pages/condenser/condenser`

**四个一级 Tab：**
1. **设置** - 铝价参数配置（铝锭价、损耗比、利润率）
2. **自定义** - 自定义规格计算（集流管/翅片/扁管）
3. **汇总** - 报价汇总展示
4. **物流** - 物流运费查询与选择

## 已完成功能

### 1. 物流运费模块（物流 Tab）

**位置：** `pages/condenser/condenser.js` + `.wxml` + `.wxss`

#### 1.1 基础查询
- 出发地/目的地选择（下拉 picker + 输入筛选）
- 物流方向切换（出货/进货）
- 总立方数输入（在查询按钮旁边）
- 查询运费按钮（带 toast 验证：出发地、目的地、总立方数）

#### 1.2 物流选择弹窗
- 散货选项列表（按价格排序，首个显示"推荐"标签）
- 整车选项列表（按车型分组：4.2米/6.8米/9.6米/13.5米/17.5米/16米厢车）
- 勾选后显示数量选择器（+/-按钮）和小计
- **勾选后隐藏"推荐"标签**，避免与数量选择器重叠
- 底部合计运费 + 确认选择按钮

#### 1.3 智能推荐
- 查询成功后**自动展开推荐面板**（但不自动勾选）
- 推荐方案类型：纯散货、纯整车、整车+散货组合
- 按价格排序，显示前5个最优方案
- 点击推荐方案自动应用（勾选对应选项并填入数量）
- 附加费逻辑：总立方<10方且非组合方案时加附加费

#### 1.4 关键方法
```javascript
queryLogistics()        // 查询物流价格
buildLogisticsOptions() // 构建选项数据（返回数据，不直接setData）
smartRecommend(autoApply) // 智能推荐（autoApply=true时自动勾选最优）
selectRecommendPlan(e)  // 应用推荐方案（支持直接传入索引）
calcLogisticsTotal()    // 计算运费合计
confirmLogistics()      // 确认选择
```

#### 1.5 数据结构
```javascript
data: {
  // 物流相关
  selectedOrigin: '',           // 出发地
  selectedDestination: '',      // 目的地
  logisticsDirection: 'outbound', // 方向：outbound出货/inbound进货
  totalVolume: '',              // 总立方数
  showLogisticsModal: false,    // 弹窗显示
  scatterOptions: [],           // 散货选项 [{company, price, checked, volume, subtotal, minCharge, surcharge}]
  truckGroups: [],              // 整车分组 [{type, options: [{company, price, checked, qty, subtotal}]}]
  logisticsTotalFreight: 0,     // 运费合计
  showRecommend: false,         // 推荐面板显示
  recommendPlans: [],           // 推荐方案列表
  lastQueryRoute: null,         // 缓存上次查询路线
}
```

### 2. 规格管理页面

**位置：** `pages/spec-manage/spec-manage`

- 四种规格类型：集流管/翅片/扁管/其他部件
- CRUD 操作（新增/编辑/删除）
- 权限控制：仅 ADMIN 和 TECH 可访问

### 3. 用户管理页面

**位置：** `pages/user-manage/user-manage`

- 用户列表展示
- 新增/编辑用户
- 重置密码（默认123456）
- 启用/禁用状态切换
- 权限控制：仅 ADMIN 可访问

## API 接口

### 物流相关
- `GET /logistics/prices/outbound?destination={city}` - 出货价格
- `GET /logistics/prices/inbound?origin={city}` - 进货价格

### 规格相关
- `GET /spec/collector` - 集流管规格列表
- `GET /spec/fin` - 翅片规格列表
- `GET /spec/tube` - 扁管规格列表
- `GET /spec/component` - 其他部件列表
- `POST /spec` - 新增规格
- `PUT /spec/{id}` - 更新规格
- `DELETE /spec/{id}` - 删除规格

### 用户相关
- `GET /admin/user/list` - 用户列表
- `POST /admin/user` - 新增用户
- `PUT /admin/user/{id}` - 更新用户
- `PUT /admin/user/{id}/reset-pwd` - 重置密码

## 样式约定

- 主色调：`#10b981`（绿色）
- 推荐标签：绿色背景 `#ecfdf5`，绿色文字 `#059669`
- 弹窗：底部弹出式，圆角顶部
- 按钮：圆角 `8rpx`，渐变或纯色

## 注意事项

1. **setData 异步问题**：多个 setData 后需要计算时，把计算放到回调中
2. **buildLogisticsOptions**：返回数据而非直接 setData，便于统一管理
3. **推荐标签显示**：勾选后隐藏，条件为 `index === 0 && !item.checked`
4. **城市输入**：支持下拉选择 + 输入筛选两种方式

## 待优化/TODO

- [ ] 实际运费可手动修改后同步到汇总
- [ ] 导出报价单功能完善
- [ ] 更多城市数据支持

---

## 更新记录

### 2026-01-24
- 物流 Tab 独立（从汇总页分离）
- 总立方数输入移到查询按钮旁边
- 查询成功后自动展开智能推荐面板（不自动勾选）
- 勾选选项后隐藏"推荐"标签
- 修复多处 setData 异步导致的计算问题
