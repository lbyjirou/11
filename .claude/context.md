# 会话上下文快照

## 当前状态
- 报价单编辑页初始 Tab 选择逻辑已按可编辑权限优先级调整
- 全局 CLAUDE.md 已精简至 ~65 行
- rules/ 条件加载文件已创建
- 项目级 CLAUDE.md 已充实
- 仓库根目录 README.md 已补齐新手使用说明、示例账号（admin123）、AppID 与 FAQ

## 关键决策
- 全局配置精简到 ≤150 行，详细规则拆分到 rules/
- 人格/工作流/协作机制分别独立为 rules 文件
- 开发日志规则使用 paths 条件加载（仅处理代码文件时加载）

## 重要文件
- `~/.claude/CLAUDE.md` - 全局规则（~65行）
- `~/.claude/rules/persona.md` - 人格设定详细模板
- `~/.claude/rules/workflow.md` - 工作流模板
- `~/.claude/rules/collaboration.md` - 协作机制
- `~/.claude/rules/collaboration-flow.md` - 协作流程
- `~/.claude/rules/dev-log.md` - 开发日志规则（条件加载）

## 待办事项
- 无
