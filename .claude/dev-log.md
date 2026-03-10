# 开发日志

## 2026-02-09
### 工艺 Tab 自定义区域/参数/公式功能
- 新建 `condenser-miniprogram/utils/formula.js` — Shunting-Yard 公式引擎（支持 +−*/()、变量、SUM 聚合）
- 修改 `condenser.js`：新增 prodMode/customProcessData 数据层、模式切换、区域/列/工序/汇总 CRUD、公式自动计算、双格式保存/加载
- 修改 `condenser.wxml`：模式切换 UI、自定义区域渲染、列编辑/工序添加/汇总编辑弹窗
- 修改 `condenser.wxss`：自定义模式全套样式
- 兼容性：旧数据（数组）走标准模式，新数据（`{mode:"custom"}`）走自定义模式，零破坏
- 不涉及后端改动，数据全部存 processDataJson 字段

## 2026-02-08
### 项目记忆优化配置
- 完成三层记忆体系搭建（全局/项目/Auto Memory）
- 全局 CLAUDE.md 从 495 行精简至 ~65 行
- 创建 rules/ 条件加载文件（persona/workflow/collaboration/dev-log）
- 充实项目级 CLAUDE.md（项目结构/技术栈/常用命令/业务模块）
- 初始化 context.md / dev-log.md / problem-log.md
