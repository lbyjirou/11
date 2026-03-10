# 易德报价系统

## 项目概览
- 描述：企业级冷凝器报价管理系统，支持多角色协作的完整报价工作流
- 技术栈：Spring Boot 3.2.2 + 微信小程序原生开发
- 项目路径：`C:\Users\86152\Desktop\易德`

## 项目结构
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

## 技术栈详情
### 后端
- Spring Boot 3.2.2 / JDK 17 / MyBatis-Plus 3.5.5
- MySQL 8.0+ / Spring Security + JWT / Knife4j 4.4.0
- EasyExcel 3.3.3 / Maven 构建
- 端口：8080，上下文路径：/api

### 小程序前端
- 微信小程序原生开发（JavaScript ES6+）
- threejs-miniprogram（3D装箱可视化）

## 常用命令
```bash
# 后端开发
cd "C:\Users\86152\Desktop\易德\backend"
mvn spring-boot:run                          # 启动开发
mvn clean package -DskipTests                # 打包
java -jar target/pricing-2.0.0.jar           # 运行JAR

# API 文档
# http://localhost:8080/api/doc.html (Knife4j)

# 小程序
# 微信开发者工具打开 condenser-miniprogram 目录
# 工具 → 构建 npm
```

## 核心业务模块
- **多角色工作流**：销售 → 技术 → 工艺 → 物流 → 经理审批（6种角色）
- **树形BOM管理**：三级树形结构、递归重量计算
- **智能3D装箱**：2D底部装载+堆叠算法、多车型方案对比
- **Excel智能导入**：自动识别表结构、关键词模糊匹配
- **报价单状态机**：8种状态流转、级联重置、驳回机制
- **物流双向计算**：送货/返货分离、包装摊销

## 工程约束
### 权限/角色系统修改
修改权限或角色系统时，必须验证：后端权限检查 → 前端角色验证 → 数据持久化 → 多角色测试

### 表单/字段修改
必须同时更新：前端表单 schema → 后端 DTO/模型 → 数据库约束 → API 验证逻辑

## 当前开发重点
- [ ] 散热器模块（仅框架）
- [ ] 蒸发器模块（仅框架）
- [ ] 液冷板模块（仅框架）
