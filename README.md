# 易德报价系统

企业级冷凝器报价管理系统，支持多角色协作的完整报价工作流。

## 项目功能概览
- 多角色报价工作流：销售 → 技术 → 工艺 → 物流 → 经理审批
- 树形 BOM 管理：三级结构、递归重量计算
- Excel 智能导入：识别表结构、关键词匹配导入

## 角色与使用流程（小程序）
- 销售员：创建/提交报价单
- 技术工程师：BOM 导入、净重填写
- 工艺工程师：工序成本核算
- 物流专员：物流与包装测算
- 报价经理：审批与利润调整
- 管理员：全量权限与配置维护

## 技术栈
- 后端：Spring Boot 3.2.2 / JDK 17 / MyBatis-Plus 3.5.5 / MySQL 8.0+ / Spring Security + JWT / Knife4j 4.4.0
- 前端：微信小程序原生开发（JavaScript ES6+）/ threejs-miniprogram

## 目录结构
```
易德/
├── backend/                    # Java Spring Boot 后端（主力）
│   ├── src/main/java/          # Java 源码
│   ├── src/main/resources/     # 配置文件（application.yml）
│   └── pom.xml                 # Maven 依赖
├── condenser-miniprogram/      # 微信小程序前端
│   ├── pages/                  # 18个页面（冷凝器报价为核心）
│   ├── components/             # 组件（含3D装箱可视化）
│   ├── utils/                  # 工具模块（api/auth/calc/request）
│   └── app.json                # 小程序配置
├── condenser-api/              # Python FastAPI（v1.0遗留，已弃用）
├── docs/database/              # 数据库脚本集合
├── openspec/                   # OpenSpec 规范管理
└── DEV_LOG.md                  # 开发日志（了解项目最佳入口）
```

## 环境要求
- JDK 17
- Maven 3.8+
- MySQL 8.0+
- 微信开发者工具

## 快速开始（新手）
1. 初始化数据库：执行 `docs/database/` 脚本（见下文执行顺序）。
2. 配置后端：复制 `backend/src/main/resources/application.yml.example` 为 `application.yml` 并修改配置。
3. 启动后端：`mvn spring-boot:run`。
4. 启动小程序：微信开发者工具打开 `condenser-miniprogram` 并构建 npm。

## 最小可运行清单
- 数据库脚本：`docs/database/`（见「数据库初始化」）
- 配置模板：`backend/src/main/resources/application.yml.example`
- 运行步骤：先「后端运行」，再「小程序运行」
- 默认账号：见「示例账号」

## 数据库初始化
脚本位于 `docs/database/`。

建议执行顺序（按文件命名阶段）：
1. `init.sql`
2. `phase1_ddl.sql` → `phase2_bom_ddl.sql` → `phase2_modification_ddl.sql` → `phase3_process_ddl.sql` → `phase3_rbac_ddl.sql` → `phase3_rbac_data.sql` → `phase4_logistics_ddl.sql`
3. 其余 `alter_*` / `upgrade_*` / `add_*` / `insert_process.sql` 根据实际版本与需求选择执行

> 如团队有固定执行顺序，请以团队规范为准并补充此处说明。

## 后端运行（Spring Boot）
1. 创建数据库并修改配置：`backend/src/main/resources/application.yml`

示例配置片段（按需修改库名、账号与密码）：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/yide_pricing?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: root
```

2. 启动服务：
```bash
cd "C:/Users/86152/Desktop/易德/backend"
mvn spring-boot:run
```

3. 访问 API 文档：`http://localhost:8080/api/doc.html`

## 小程序运行
1. 打开微信开发者工具
2. 选择项目目录：`condenser-miniprogram`
3. AppID：`wxb7392e29c6e5192e`
4. 工具 → 构建 npm
5. 本地调试：开发者工具中勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」

## 示例账号
| 角色 | 用户名 | 密码 | 说明 |
| --- | --- | --- | --- |
| 管理员 | admin | admin123 | 全部权限 |
| 销售员 | sales01 | admin123 | 创建/提交报价单 |
| 技术工程师 | tech01 | admin123 | BOM 导入/净重填写 |
| 工艺工程师 | process01 | admin123 | 工序成本核算 |
| 物流专员 | logistics01 | admin123 | 物流/包装测算 |
| 报价经理 | manager01 | admin123 | 审批/利润调整 |

> 账号数据来自初始化 SQL（`init.sql` / `phase1_ddl.sql`）。如密码不一致，请以你当前脚本为准。

## 使用与注意事项
- 默认端口：`8080`
- 上下文路径：`/api`
- 登录入口：小程序端登录

## 常见问题（FAQ）
1. **后端启动报数据库连接失败**
   - 检查 `application.yml` 中数据库地址、账号、密码是否正确
   - 确认 MySQL 服务已启动，且库已创建并完成初始化脚本
2. **API 文档无法访问**
   - 确认后端已启动且端口为 `8080`
   - 访问 `http://localhost:8080/api/doc.html`
3. **小程序接口请求失败**
   - 确认后端服务可访问
   - 本地调试可在开发者工具勾选“不校验合法域名”
4. **登录失败/无权限**
   - 使用 README 提供的示例账号登录
   - 确认是否已执行 `init.sql` 与 `phase1_ddl.sql`
   - 不同角色仅能操作对应流程节点
