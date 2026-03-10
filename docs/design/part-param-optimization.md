# 零件参数填写优化 — 设计方案 v3

## 一、现状与目标

### 现状
- `part_preset` 表存储零件模板，`techDataJson` 以 JSON 存储动态材料表
- `formula.js` Shunting-Yard 公式引擎已支持变量引用和 SUM() 聚合
- `calc.js` 硬编码集流管/翅片/扁管计算，不可自定义

### 目标
- 零件模板定义：名称、归属材料类、自定义列结构、可选加工费、可编辑公式
- 同一材料类内不同零件可有不同列结构（由各自模板决定）
- 同一零件可添加多行（不同规格、不同数量）
- 规格参数支持从预设库选择或自定义输入

---

## 二、核心设计

### 2.1 零件模板模型 (part_preset)

```
零件模板：
├── name             — 零件名称（集流管、扁管、翅片、围板箱...）
├── category         — 归属材料类（A/B/C/D/... 自定义）
├── columnsJson      — 该零件的列定义（每个零件独立的列结构）
├── specTableJson    — 规格预设库（可选）
├── defaultValuesJson— 默认值
├── hasProcessFee    — 是否有加工费
├── processFeeLabel  — 加工费名称
├── processFeeDefault— 加工费默认值
└── formulasJson     — 计算公式集（可编辑）
```

**关键：列结构跟随零件模板，不跟随材料类。**
同一个 A 类下，集流管可能有 `材质、规格1、规格2、规格3` 四列，
而堵帽可能只有空列（仅需数量/单价/金额）。

### 2.2 列定义 columnsJson 示例

集流管模板：
```json
[
  { "key": "material",  "label": "材质",   "role": "input" },
  { "key": "spec1",     "label": "宽",     "role": "input" },
  { "key": "spec2",     "label": "厚",     "role": "input" },
  { "key": "spec3",     "label": "长",     "role": "input" },
  { "key": "qty",       "label": "数量",   "role": "input" },
  { "key": "weight",    "label": "重量(KG)","role": "output", "formula": "spec1*spec2*spec3*2.75/1000000" },
  { "key": "unitPrice", "label": "单价(元/个)", "role": "output", "formula": "weight*(alPrice+processFee)" },
  { "key": "amount",    "label": "金额(元)",    "role": "output", "formula": "qty*unitPrice" }
]
```

围板箱模板（D类）：
```json
[
  { "key": "material",  "label": "材质",     "role": "input" },
  { "key": "length",    "label": "长",       "role": "input" },
  { "key": "width",     "label": "宽",       "role": "input" },
  { "key": "height",    "label": "高",       "role": "input" },
  { "key": "fitQty",    "label": "适用数量",  "role": "input" },
  { "key": "useRate",   "label": "使用率",    "role": "input" },
  { "key": "qty",       "label": "数量",     "role": "input" },
  { "key": "volume",    "label": "立方数",    "role": "output", "formula": "length*width*height/1000000000" },
  { "key": "unitPrice", "label": "单价(元)",  "role": "input" },
  { "key": "amount",    "label": "金额(元)",  "role": "output", "formula": "volume*unitPrice" }
]
```

堵帽模板（无规格参数）：
```json
[
  { "key": "qty",       "label": "数量",       "role": "input" },
  { "key": "weight",    "label": "重量(KG)",   "role": "input" },
  { "key": "unitPrice", "label": "单价(元/个)", "role": "input" },
  { "key": "amount",    "label": "金额(元)",    "role": "output", "formula": "qty*unitPrice" }
]
```

### 2.3 加工费机制

模板级别可选设置：
- `hasProcessFee`: 是否启用
- `processFeeLabel`: 名称（如"材料加工费"）
- `processFeeDefault`: 默认费率

启用后，报价时该零件行显示加工费输入框，值作为 `processFee` 变量参与公式计算。
未启用的零件行不显示加工费，公式中也不引用该变量。

### 2.4 规格库 + 自定义输入

模板可预设规格组合（specTableJson）：
```json
[
  { "label": "Φ19×1.2", "spec1": 20, "spec2": 1.15, "spec3": 431.5 },
  { "label": "Φ22×1.5", "spec1": 22, "spec2": 1.5,  "spec3": 500 }
]
```

报价时：
- **选择预设** → 自动填入 spec1/spec2/spec3 值，公式自动算
- **自定义** → 手动填写各规格值，公式照常算

无规格库的零件 → 直接手动填写所有 input 列。

### 2.5 同一零件多行添加

在某个材料类分区点"+ 添加零件"→ 选择"集流管"模板 → 新增一行。
再次点击 → 再选"集流管" → 又新增一行（可选不同规格）。

每行独立：独立的规格参数、数量、独立计算重量/单价/金额。

---

## 三、前端交互

### 3.1 材料类分区 + 表格展示

```
┌─ A类 ──────────────────────────────────────────────────────────────┐
│ 零件名称  │ 材质              │ 材料规格        │ 数量│重量  │单价  │金额  │
│───────────┼───────────────────┼─────────────────┼─────┼──────┼──────┼──────│
│ 集流管1   │ 3003/4045外侧覆合  │ 20│1.15│431.5  │  1  │0.055 │38.50 │ 2.13 │
│ 集流管2   │ 3003/4045外侧覆合  │ 20│1.15│431.5  │  1  │0.055 │38.50 │ 2.13 │
│ 扁管      │ 喷锌3003          │ 16│1.4 │690    │ 58  │1.139 │36.00 │41.02 │
│ 翅片      │ 4343/3003/4343    │ 16│0.07│670    │ 59  │0.712 │32.00 │22.78 │
│ 边板      │                   │ 16│1.5 │670    │  2  │0.043 │28.40 │ 2.47 │
│ 堵帽      │                   │   │    │       │  4  │      │ 0.25 │ 1.00 │
│ 隔片      │                   │   │    │       │  3  │      │ 0.14 │ 0.42 │
│                                                    A类小计: ¥71.95 │
│                                              [+ 添加零件]          │
├─ B类 ──────────────────────────────────────────────────────────────┤
│ 零件名称  │ 材质 │ 材料规格 │ 数量│重量  │单价  │金额  │
│───────────┼──────┼─────────┼─────┼──────┼──────┼──────│
│ 进口压板  │      │         │  1  │0.04  │ 2.65 │ 2.65 │
│ ...       │      │         │     │      │      │      │
│                                                    B类小计: ¥21.25 │
│                                              [+ 添加零件]          │
├─ D类 ──────────────────────────────────────────────────────────────┤
│ 材料名  │材质│ 长    │ 宽    │ 高    │适用数量│使用率│数量│立方数│单价    │金额 │
│─────────┼────┼───────┼───────┼───────┼────────┼──────┼────┼──────┼────────┼─────│
│ 围板箱  │塑板│790.00 │480.00 │510.00 │        │      │ 1  │0.373 │1200.00 │0.45 │
│                                                    D类小计: ¥9.45  │
│                                              [+ 添加零件]          │
└────────────────────────────────────────────────────────────────────┘
                                                    合计: ¥93.00
```

**关键交互：**
- 每个分区的表头列由该分区内零件模板的列定义合并生成
- 某零件没有的列显示为空（如堵帽没有材质和规格列）
- 每个分区有小计，底部有合计
- output 列（有公式的）自动计算，显示为只读
- input 列可编辑

### 3.2 添加零件

```
点击 [+ 添加零件]
  → 弹出面板，显示所有模板（按材料类筛选 + 全部）
  → 选择模板后：
     ├── 有规格库 → 选规格（或"自定义"）→ 新增一行，自动填入参数
     └── 无规格库 → 直接新增空行
  → 也可"自定义新零件"（临时定义列结构）
```

### 3.3 编辑公式

每行右侧有 [...] 菜单 → "编辑公式"：
- 显示当前零件的所有 output 列及其公式
- 可修改公式表达式
- 修改后实时重算

---

## 四、数据库变更

### 4.1 part_preset 表升级

```sql
ALTER TABLE part_preset
  ADD COLUMN has_process_fee TINYINT(1) DEFAULT 0
      COMMENT '是否有加工费',
  ADD COLUMN process_fee_label VARCHAR(50)
      COMMENT '加工费名称',
  ADD COLUMN process_fee_default DECIMAL(10,4)
      COMMENT '加工费默认值',
  ADD COLUMN formulas_json TEXT
      COMMENT '计算公式集JSON';
```

### 4.2 techDataJson 结构

```json
{
  "globalVars": { "alPrice": 14.5 },
  "sections": [
    {
      "key": "A",
      "label": "A类",
      "rows": [
        {
          "presetId": 1,
          "partName": "集流管1",
          "columns": [ ... ],
          "hasProcessFee": true,
          "processFeeValue": 2.5,
          "formulas": { "weight": "...", "unitPrice": "...", "amount": "..." },
          "values": {
            "material": "3003/4045外侧覆合",
            "spec1": 20, "spec2": 1.15, "spec3": 431.5,
            "qty": 1, "weight": 0.055,
            "unitPrice": 38.50, "amount": 2.13
          }
        }
      ]
    }
  ]
}
```

每行携带自己的 columns 定义 + formulas + values，实现同一分区内不同零件不同列结构。

---

## 五、后端接口

现有 PartPreset CRUD 接口不变，Entity 增加新字段：

```
POST   /api/part-preset       — 创建
PUT    /api/part-preset/{id}   — 更新
GET    /api/part-preset/list   — 当前用户列表
GET    /api/part-preset/all    — 全部列表
DELETE /api/part-preset/{id}   — 删除
```

techDataJson 通过现有 `PUT /api/quote/{id}` 保存，无需新接口。

---

## 六、实施步骤

| 步骤 | 内容 |
|------|------|
| 1 | 数据库 ALTER TABLE part_preset |
| 2 | 后端 PartPreset Entity 增加字段 |
| 3 | 前端技术Tab改造：按材料类分区 + 异构列表格渲染 |
| 4 | 前端添加零件交互：模板选择 + 规格选择/自定义 |
| 5 | 前端加工费绑定 + 公式编辑 |
| 6 | 前端公式计算集成（复用 formula.js） |
| 7 | 旧数据兼容 |

---

## 七、兼容性

- 旧 techDataJson 中无 columns/formulas 的行按原逻辑处理
- part_preset 新增字段均有默认值，不影响已有模板
- formula.js 引擎无需修改
