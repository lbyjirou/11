# 冷凝器报价管理系统 - 部署指南

## 一、环境要求

| 组件 | 最低版本 | 推荐版本 |
|------|---------|---------|
| JDK | 17 | 17 或 21 LTS |
| MySQL | 8.0 | 8.0+ |
| Maven | 3.8 | 3.9+ |
| 内存 | 1GB | 2GB+ |

## 二、数据库准备

### 2.1 创建数据库
```sql
CREATE DATABASE condenser_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2.2 创建用户（可选）
```sql
CREATE USER 'condenser_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON condenser_db.* TO 'condenser_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2.3 初始化表结构
```bash
mysql -u condenser_user -p condenser_db < docs/database/init.sql
```

## 三、构建应用

### 3.1 编译打包
```bash
cd backend
mvn clean package -DskipTests
```

### 3.2 构建产物
- JAR 文件：`target/pricing-2.0.0.jar`

## 四、部署方式

### 方式一：直接运行 JAR

```bash
# 开发环境
java -jar pricing-2.0.0.jar --spring.profiles.active=dev

# 生产环境（推荐使用环境变量）
export DB_USERNAME=condenser_user
export DB_PASSWORD=your_secure_password
export JWT_SECRET=your-very-long-secure-jwt-secret-key-minimum-64-characters

java -jar pricing-2.0.0.jar --spring.profiles.active=prod
```

### 方式二：系统服务（Linux）

创建 systemd 服务文件 `/etc/systemd/system/condenser-pricing.service`：

```ini
[Unit]
Description=Condenser Pricing System
After=network.target mysql.service

[Service]
Type=simple
User=condenser
Group=condenser
WorkingDirectory=/opt/condenser
Environment="DB_USERNAME=condenser_user"
Environment="DB_PASSWORD=your_secure_password"
Environment="JWT_SECRET=your-very-long-secure-jwt-secret-key"
ExecStart=/usr/bin/java -Xms512m -Xmx1024m -jar /opt/condenser/pricing-2.0.0.jar --spring.profiles.active=prod
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable condenser-pricing
sudo systemctl start condenser-pricing
```

### 方式三：Docker 部署

创建 `Dockerfile`：
```dockerfile
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/pricing-2.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xms512m", "-Xmx1024m", "-jar", "app.jar", "--spring.profiles.active=prod"]
```

构建并运行：
```bash
docker build -t condenser-pricing:2.0.0 .
docker run -d \
  --name condenser-pricing \
  -p 8080:8080 \
  -e DB_USERNAME=condenser_user \
  -e DB_PASSWORD=your_secure_password \
  -e JWT_SECRET=your-very-long-secure-jwt-secret-key \
  condenser-pricing:2.0.0
```

## 五、Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name api.example.com;

    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 六、健康检查

### 6.1 应用健康检查
```bash
curl http://localhost:8080/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 6.2 API 文档访问
- Swagger UI: `http://localhost:8080/api/doc.html`

## 七、日志管理

### 7.1 日志位置
- 生产环境：`logs/condenser-pricing.log`

### 7.2 日志轮转
- 最大文件大小：50MB
- 保留历史：30天

## 八、安全建议

1. **修改默认密码**：首次部署后立即修改 admin 用户密码
2. **使用 HTTPS**：生产环境务必配置 SSL 证书
3. **防火墙配置**：仅开放必要端口
4. **定期备份**：配置数据库自动备份策略
5. **JWT 密钥**：使用足够长度的随机字符串（≥64字符）

## 九、常见问题

### Q1: 启动报数据库连接错误
检查：
- MySQL 服务是否运行
- 数据库用户名密码是否正确
- 网络连接是否正常

### Q2: 中文乱码
确保：
- 数据库字符集为 `utf8mb4`
- JDBC URL 包含 `useUnicode=true&characterEncoding=UTF-8`

### Q3: Token 无效
检查：
- JWT 密钥是否一致
- Token 是否过期
- 时区配置是否正确

---

*文档更新时间：2026-01-22*
