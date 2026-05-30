# Vercel 部署指南

本指南将帮助你将 Metapi 项目部署到 Vercel 平台。

> 💡 **好消息**：使用 Vercel Hobby（免费）+ Neon Postgres（免费）可以实现完全免费的部署方案！

## 前置要求

1. 一个 [Vercel](https://vercel.com) 账号（免费）
2. Node.js >= 24.x（Vercel 会自动使用）
3. 一个外部数据库（推荐使用 Neon Postgres 免费计划）
   - Vercel 不支持持久化的 SQLite 数据库
   - 推荐使用：
     - **[Neon](https://neon.tech/)** (PostgreSQL) - ⭐ 推荐，免费计划 0.5GB 存储
     - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) - 基于 Neon
     - [PlanetScale](https://planetscale.com/) (MySQL) - 免费计划 5GB 存储
     - [Supabase](https://supabase.com/) (PostgreSQL) - 免费计划 500MB 存储

## 部署步骤

### 1. 准备数据库

Vercel 提供了与 Neon Postgres 的免费集成，这是最推荐的方式。

#### 方法 1: 使用 Neon Postgres（推荐，免费）

**步骤详解**：

1. **部署项目到 Vercel**
   - 点击 [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cita-777/metapi)
   - 登录或注册 Vercel 账号
   - 为项目命名，点击 **Deploy**

2. **添加 Neon 数据库**
   - 部署完成后，进入项目仪表板
   - 点击顶部导航栏的 **Storage** 标签
   - 点击 **Create Database** 按钮
   - 选择 **Neon Postgres**
   - 点击 **Continue**
   - Vercel 会自动创建数据库并添加以下环境变量：
     - `POSTGRES_URL`
     - `POSTGRES_PRISMA_URL`
     - `POSTGRES_URL_NON_POOLING`
     - `POSTGRES_USER`
     - `POSTGRES_HOST`
     - `POSTGRES_PASSWORD`
     - `POSTGRES_DATABASE`

3. **配置 Metapi 环境变量**
   - 在项目设置中，进入 **Settings** → **Environment Variables**
   - 添加以下变量：
     ```bash
     DB_TYPE=postgres
     DB_URL=${POSTGRES_URL}
     DB_SSL=true
     AUTH_TOKEN=your-secure-admin-token
     PROXY_TOKEN=your-secure-proxy-token
     ACCOUNT_CREDENTIAL_SECRET=your-secure-credential-secret
     ```
   - 💡 提示：`DB_URL` 使用 `${POSTGRES_URL}` 引用 Vercel 自动创建的变量

4. **重新部署**
   - 进入 **Deployments** 标签
   - 点击最新部署右侧的三个点
   - 选择 **Redeploy**
   - 等待部署完成

5. **访问应用**
   - 部署完成后，点击 **Visit** 按钮
   - 使用你设置的 `AUTH_TOKEN` 登录管理后台

**Neon 免费计划限制**：
- ✅ 0.5 GB 存储空间
- ✅ 无限计算时间
- ✅ 自动暂停（5 分钟不活动后，首次访问会有冷启动）
- ✅ 适合个人项目和小型应用

#### 方法 2: 使用其他数据库服务

如果你想使用其他数据库服务，可以选择：

- **Vercel Postgres**: Vercel 官方 Postgres 服务（付费）
- **PlanetScale**: MySQL 兼容的 Serverless 数据库
- **Supabase**: 开源的 Firebase 替代品，提供 Postgres 数据库
- **Railway**: 提供 Postgres、MySQL 等多种数据库

获取数据库连接字符串后，格式如下：

```bash
# PostgreSQL
postgresql://username:password@host:port/database

# MySQL
mysql://username:password@host:port/database
```

### 2. 配置环境变量

在 Vercel 项目设置中，添加以下环境变量：

#### 必需的环境变量

```bash
# 数据库配置
DB_TYPE=postgres
# 如果使用 Neon，Vercel 会自动提供 POSTGRES_URL
DB_URL=${POSTGRES_URL}
DB_SSL=true

# 认证令牌（请使用强随机字符串，至少 32 字节）
# 可以使用以下命令生成：
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_TOKEN=your-secure-admin-token-min-32-bytes
PROXY_TOKEN=your-secure-proxy-token-min-32-bytes
ACCOUNT_CREDENTIAL_SECRET=your-secure-credential-secret-min-32-bytes

# Node 环境
NODE_ENV=production
```

**💡 提示**：如果你使用 Neon Postgres，`DB_URL` 可以直接引用 Vercel 自动创建的 `POSTGRES_URL` 环境变量。

#### 可选的环境变量

```bash
# OAuth 配置
CLAUDE_CLIENT_ID=your-claude-client-id
CLAUDE_CLIENT_SECRET=your-claude-client-secret
CODEX_CLIENT_ID=your-codex-client-id
GEMINI_CLI_CLIENT_ID=your-gemini-client-id
GEMINI_CLI_CLIENT_SECRET=your-gemini-client-secret

# 通知配置
WEBHOOK_URL=your-webhook-url
BARK_URL=your-bark-url
SERVERCHAN_KEY=your-serverchan-key
TELEGRAM_ENABLED=false
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id

# 邮件配置
SMTP_ENABLED=false
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@example.com
SMTP_TO=admin@example.com

# 代理配置
SYSTEM_PROXY_URL=http://your-proxy:port

# 其他配置
PORT=4000
TZ=Asia/Shanghai
NOTIFY_COOLDOWN_SEC=300
```

### 3. 部署到 Vercel

#### 🚀 快速开始（推荐）

最简单的部署方式是使用一键部署：

1. 点击 [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cita-777/metapi)
2. 登录或注册 Vercel 账号
3. 为项目命名
4. 点击 **Deploy** 开始部署
5. 部署完成后，进入项目设置：
   - 进入 **Storage** 标签
   - 点击 **Create Database**
   - 选择 **Neon Postgres**
   - 点击 **Continue**
6. 添加必需的环境变量：
   ```bash
   DB_TYPE=postgres
   DB_URL=${POSTGRES_URL}
   DB_SSL=true
   AUTH_TOKEN=your-secure-admin-token
   PROXY_TOKEN=your-secure-proxy-token
   ACCOUNT_CREDENTIAL_SECRET=your-secure-credential-secret
   ```
7. 重新部署项目以应用环境变量

#### 方法 1: 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel

# 部署到生产环境
vercel --prod
```

#### 方法 2: 通过 GitHub 集成

1. 将项目推送到 GitHub
2. 在 Vercel 控制台中导入 GitHub 仓库
3. Vercel 会自动检测配置并开始部署
4. 在项目设置中添加环境变量

### 4. 配置定时任务

#### 免费计划（Hobby）

Vercel 免费计划**不支持 Cron Jobs**，你需要使用外部服务来定期调用定时任务端点。

**推荐的免费 Cron 服务**：

1. **[cron-job.org](https://cron-job.org)** - 免费，支持每分钟执行
2. **[EasyCron](https://www.easycron.com)** - 免费计划支持每小时执行
3. **[GitHub Actions](https://github.com/features/actions)** - 使用 workflow 定时触发（推荐）
4. **[Uptime Robot](https://uptimerobot.com)** - 监控服务，可用于定时请求

**方案 1: 使用 cron-job.org**

1. 注册 [cron-job.org](https://cron-job.org) 账号
2. 创建新的 Cron Job
3. 配置以下任务：

**签到任务**（每天 8:00）：
```
URL: https://your-domain.vercel.app/api/cron/checkin
Method: POST
Headers: Authorization: Bearer YOUR_AUTH_TOKEN
Schedule: 0 8 * * *
```

**余额刷新**（每小时）：
```
URL: https://your-domain.vercel.app/api/cron/balance-refresh
Method: POST
Headers: Authorization: Bearer YOUR_AUTH_TOKEN
Schedule: 0 * * * *
```

**日志清理**（每天 6:00）：
```
URL: https://your-domain.vercel.app/api/cron/log-cleanup
Method: POST
Headers: Authorization: Bearer YOUR_AUTH_TOKEN
Schedule: 0 6 * * *
```

**方案 2: 使用 GitHub Actions（推荐）**

如果你的项目托管在 GitHub 上，可以使用 GitHub Actions 免费执行定时任务。

1. 在仓库中创建 `.github/workflows/vercel-cron.yml`
2. 复制 `.github/workflows/vercel-cron.yml.example` 的内容
3. 在仓库的 **Settings** → **Secrets and variables** → **Actions** 中添加：
   - `VERCEL_DOMAIN`: 你的 Vercel 域名（例如：`your-app.vercel.app`）
   - `AUTH_TOKEN`: 你的 AUTH_TOKEN
4. 提交并推送，GitHub Actions 会自动执行定时任务

**优势**：
- ✅ 完全免费
- ✅ 可靠稳定
- ✅ 支持手动触发
- ✅ 有执行日志

**使用 curl 手动测试**：

```bash
# 签到任务
curl -X POST https://your-domain.vercel.app/api/cron/checkin \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# 余额刷新
curl -X POST https://your-domain.vercel.app/api/cron/balance-refresh \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# 日志清理
curl -X POST https://your-domain.vercel.app/api/cron/log-cleanup \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### Pro 计划

如果你有 Vercel Pro 计划，可以使用内置的 Cron Jobs 功能：

1. 将 `vercel.pro.json` 重命名为 `vercel.json`
2. 重新部署项目
3. Vercel 会自动执行配置的定时任务：
   - **签到任务**: 每天 8:00 执行
   - **余额刷新**: 每小时执行
   - **日志清理**: 每天 6:00 执行

### 5. 数据库迁移

首次部署后，需要运行数据库迁移：

```bash
# 本地运行迁移（确保已配置正确的数据库连接）
npm run db:migrate
```

或者，你可以在 Vercel 部署后通过 Vercel CLI 运行：

```bash
vercel env pull .env.local
npm run db:migrate
```

## 功能限制

由于 Vercel Serverless 环境的限制，以下功能在 Vercel 上不可用或受限：

### 1. WebSocket 支持

Vercel 的 Serverless 函数不支持长连接 WebSocket。如果你的应用依赖 WebSocket 功能，建议：

- 使用传统的 HTTP 轮询替代
- 或者部署到支持 WebSocket 的平台（如 Railway、Render、Fly.io）

### 2. 后台服务

以下后台服务在 Serverless 环境中不会自动运行：

- OAuth 本地回调服务器
- 站点公告轮询
- 模型可用性探测
- 频道恢复探测
- 更新中心轮询
- 使用量聚合服务

这些服务需要通过定时任务或外部触发器来模拟。

### 3. 文件存储

Vercel Serverless 函数的文件系统是只读的（除了 `/tmp` 目录）。如果需要持久化文件存储，建议使用：

- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- AWS S3
- Cloudflare R2
- 其他对象存储服务

### 4. 执行时间限制

- 免费计划：10 秒
- Pro 计划：60 秒
- Enterprise 计划：900 秒

确保你的 API 请求能在限制时间内完成。

## 性能优化

### 1. 数据库连接池

在 Serverless 环境中，建议使用连接池来管理数据库连接：

```bash
# 对于 PostgreSQL，使用 PgBouncer
# 对于 MySQL，使用 ProxySQL
```

### 2. 冷启动优化

- 使用 Vercel 的 Edge Functions（如果适用）
- 减少依赖包大小
- 使用 Vercel 的预热功能（Pro 计划）

### 3. 缓存策略

项目已配置静态资源缓存：

- 静态资源（`/assets/*`）：1 年缓存
- HTML 文件：不缓存

## 监控和日志

### 查看日志

```bash
# 实时查看日志
vercel logs

# 查看特定部署的日志
vercel logs [deployment-url]
```

### 监控指标

在 Vercel 控制台中可以查看：

- 请求数量
- 响应时间
- 错误率
- 带宽使用

## 故障排查

### 1. 数据库连接失败

检查：
- 数据库 URL 是否正确
- 数据库是否允许来自 Vercel 的连接
- SSL 配置是否正确

### 2. 环境变量未生效

- 确保在 Vercel 项目设置中正确配置了环境变量
- 重新部署项目以应用新的环境变量

### 3. 构建失败

检查：
- Node.js 版本是否兼容（需要 >= 24.x）
- 依赖是否正确安装
- 构建日志中的错误信息

**常见构建错误**：

**错误 1**: `Cannot find module 'scripts/desktop/generate-icons.mjs'`
- **原因**: 旧版本的构建脚本包含了桌面应用的图标生成
- **解决**: 确保使用最新版本的代码，`vercel-build` 脚本已修复此问题

**错误 2**: TypeScript 编译错误
- **原因**: 依赖版本不匹配或类型定义缺失
- **解决**: 运行 `npm install` 确保所有依赖正确安装

### 4. 函数超时

- 优化数据库查询
- 减少外部 API 调用
- 考虑升级到更高的 Vercel 计划

## 成本估算

### Vercel 定价

- **Hobby（免费）**:
  - 100 GB 带宽/月
  - 100 小时函数执行时间/月
  - 10 秒函数超时
  - 不支持 Cron Jobs

- **Pro（$20/月）**:
  - 1 TB 带宽/月
  - 1000 小时函数执行时间/月
  - 60 秒函数超时
  - 支持 Cron Jobs

### 数据库成本

- **Neon（推荐）**:
  - **免费计划**: 
    - 0.5 GB 存储
    - 无限计算时间
    - 自动暂停（5 分钟不活动后）
    - 非常适合个人项目和小型应用
  - **付费计划**: 从 $19/月起，提供更多存储和计算资源

- **Vercel Postgres**: 
  - 基于 Neon 构建
  - $0.10/GB 存储 + $0.10/GB 传输

- **PlanetScale（MySQL）**: 
  - 免费计划：5 GB 存储，1 亿行读取/月
  - 付费从 $29/月起

- **Supabase**: 
  - 免费计划：500 MB 数据库，1 GB 文件存储
  - 付费从 $25/月起

**💡 推荐配置**：Vercel Hobby（免费）+ Neon 免费计划 = 完全免费的部署方案！

## 安全建议

1. **使用强随机令牌**: 为 `AUTH_TOKEN`、`PROXY_TOKEN` 和 `ACCOUNT_CREDENTIAL_SECRET` 生成强随机字符串
2. **启用 SSL**: 确保数据库连接使用 SSL
3. **限制 IP 访问**: 在数据库层面限制只允许 Vercel 的 IP 访问
4. **定期更新依赖**: 保持依赖包的最新版本以修复安全漏洞
5. **监控异常访问**: 使用 Vercel 的日志和监控功能检测异常访问

## 备份策略

1. **数据库备份**: 使用数据库提供商的自动备份功能
2. **配置备份**: 定期导出 Vercel 项目的环境变量配置
3. **代码备份**: 使用 Git 进行版本控制

## 迁移到其他平台

如果 Vercel 的限制不满足你的需求，可以考虑迁移到：

- **Railway**: 支持 WebSocket，更灵活的运行时
- **Render**: 支持后台服务和 WebSocket
- **Fly.io**: 全球边缘部署，支持 WebSocket
- **自托管**: 使用 Docker 部署到 VPS

## 支持

如果遇到问题，可以：

1. 查看 [Vercel 文档](https://vercel.com/docs)
2. 查看项目的 [GitHub Issues](https://github.com/cita-777/metapi/issues)
3. 加入社区讨论

## 更新日志

- **2026-05-30**: 初始版本，支持基本的 Vercel 部署
