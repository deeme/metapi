# Vercel 部署故障排查指南

本文档帮助你解决 Vercel 部署过程中遇到的常见问题。

## 🔍 数据库连接问题

### 错误：`getaddrinfo ENOTFOUND base`

**完整错误信息**：
```
Error: getaddrinfo ENOTFOUND base
  errno: -3008,
  code: 'ENOTFOUND',
  syscall: 'getaddrinfo',
  hostname: 'base'
```

**原因**：
数据库连接字符串配置错误。`hostname: 'base'` 表明 `DB_URL` 的值不是有效的数据库连接字符串。

**常见原因**：
1. 设置了 `DB_URL=${POSTGRES_URL}`，但 Vercel 不会解析 `${...}` 语法
2. 手动输入的连接字符串格式错误
3. 复制连接字符串时包含了多余的空格或字符

**解决方案**：

#### 步骤 1：删除错误的 DB_URL

1. 进入 Vercel 项目
2. 点击 **Settings** → **Environment Variables**
3. 找到 `DB_URL` 变量
4. 点击右侧的三个点 → **Remove**
5. 确认删除

#### 步骤 2：确认必需的环境变量

确保设置了以下变量：

```bash
DB_TYPE=postgres
DB_SSL=true
AUTH_TOKEN=your-secure-admin-token
PROXY_TOKEN=your-secure-proxy-token
ACCOUNT_CREDENTIAL_SECRET=your-secure-credential-secret
```

**重要**：不要设置 `DB_URL`！

#### 步骤 3：验证 Neon 数据库

1. 点击 **Storage** 标签
2. 确认看到 Neon Postgres 数据库
3. 点击数据库名称，查看详情
4. 确认可以看到以下环境变量：
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

如果没有看到这些变量，说明 Neon 数据库没有正确创建。

#### 步骤 4：重新部署

1. 进入 **Deployments** 标签
2. 点击最新部署右侧的三个点
3. 选择 **Redeploy**
4. 等待部署完成

#### 步骤 5：检查部署日志

1. 点击部署记录
2. 查看 **Building** 和 **Runtime Logs**
3. 如果仍然有错误，查看具体的错误信息

### 错误：`ENOENT: no such file or directory, mkdir '/var/task/data'`

**原因**：
代码尝试使用 SQLite 数据库，但 Vercel 文件系统是只读的。

**解决方案**：

1. 确保设置了 `DB_TYPE=postgres`
2. 确保已添加 Neon Postgres 数据库
3. 重新部署

### 错误：`DB_URL is required when DB_TYPE=postgres`

**原因**：
- 设置了 `DB_TYPE=postgres`
- 但没有 `DB_URL` 环境变量
- 也没有 `POSTGRES_URL` 环境变量（Neon 数据库未创建）

**解决方案**：

1. 进入 **Storage** 标签
2. 如果没有数据库，点击 **Create Database**
3. 选择 **Neon Postgres**
4. 点击 **Continue**
5. 等待数据库创建完成
6. 重新部署

## 🔍 构建问题

### 错误：`Cannot find module 'scripts/desktop/generate-icons.mjs'`

**原因**：
使用了旧版本的代码。

**解决方案**：

1. 拉取最新代码：
   ```bash
   git pull origin main
   ```

2. 确认 `package.json` 中有以下脚本：
   ```json
   {
     "scripts": {
       "build:web:vercel": "vite build",
       "vercel-build": "npm run build:web:vercel && npm run build:server:vercel"
     }
   }
   ```

3. 推送到 GitHub 或重新部署

### 错误：`Cannot find module 'scripts/dev/copy-runtime-db-generated.ts'`

**原因**：
使用了旧版本的代码。

**解决方案**：

1. 拉取最新代码：
   ```bash
   git pull origin main
   ```

2. 确认项目根目录有 `copy-db-generated.mjs` 文件

3. 确认 `package.json` 中有以下脚本：
   ```json
   {
     "scripts": {
       "build:server:vercel": "tsc -p tsconfig.server.json && node copy-db-generated.mjs"
     }
   }
   ```

4. 推送到 GitHub 或重新部署

## 🔍 定时任务问题

### 错误：`Hobby accounts are limited to daily cron jobs`

**原因**：
Vercel 免费计划不支持每小时或更频繁的定时任务。

**解决方案**：

使用外部 Cron 服务，详见 [定时任务配置指南](VERCEL_CRON_GUIDE.md)。

推荐方案：
1. **GitHub Actions**（推荐）- 完全免费，可靠稳定
2. **cron-job.org** - 简单易用
3. **升级到 Vercel Pro** - $20/月

## 🔍 运行时问题

### 错误：`Function execution timed out`

**原因**：
- 免费计划函数执行时间限制为 10 秒
- 数据库查询太慢
- Neon 数据库冷启动

**解决方案**：

1. **优化数据库查询**
   - 添加索引
   - 减少查询次数
   - 使用连接池

2. **处理 Neon 冷启动**
   - Neon 免费计划会在 5 分钟不活动后暂停
   - 首次访问会有 1-2 秒的冷启动时间
   - 考虑使用定时任务保持数据库活跃

3. **升级到 Pro 计划**
   - 函数执行时间增加到 60 秒
   - 更适合复杂的操作

### 错误：登录失败或 401 Unauthorized

**原因**：
- `AUTH_TOKEN` 配置错误
- 环境变量未生效

**解决方案**：

1. 检查环境变量
   - 进入 **Settings** → **Environment Variables**
   - 确认 `AUTH_TOKEN` 已设置
   - 确认值正确（没有多余的空格）

2. 重新部署
   - 环境变量修改后需要重新部署才能生效

3. 清除浏览器缓存
   - 有时浏览器会缓存旧的认证信息

## 📋 检查清单

在寻求帮助之前，请确认：

- [ ] 已添加 Neon Postgres 数据库
- [ ] 已设置所有必需的环境变量（5 个）
- [ ] **没有**设置 `DB_URL` 环境变量
- [ ] 已重新部署项目
- [ ] 使用的是最新版本的代码
- [ ] 查看了 Vercel 部署日志中的具体错误信息

## 🆘 获取帮助

如果以上方法都无法解决问题：

1. **查看完整文档**
   - [快速开始指南](VERCEL_QUICKSTART.md)
   - [完整部署文档](VERCEL_DEPLOYMENT.md)
   - [部署验证清单](VERCEL_CHECKLIST.md)

2. **收集信息**
   - Vercel 部署日志的完整错误信息
   - 环境变量配置截图（隐藏敏感信息）
   - 使用的代码版本（git commit hash）

3. **提交 Issue**
   - 访问 [GitHub Issues](https://github.com/cita-777/metapi/issues)
   - 提供上述收集的信息
   - 描述你已经尝试过的解决方法

## 💡 常见误区

### ❌ 错误做法

1. 设置 `DB_URL=${POSTGRES_URL}`
   - Vercel 不会解析这种语法
   - 会导致连接失败

2. 手动复制 `POSTGRES_URL` 的值到 `DB_URL`
   - 不必要，代码会自动检测
   - 容易出错

3. 使用 SQLite 数据库
   - Vercel 文件系统是只读的
   - 必须使用外部数据库

### ✅ 正确做法

1. 只设置 `DB_TYPE=postgres` 和 `DB_SSL=true`
   - 让代码自动使用 `POSTGRES_URL`
   - 简单且不容易出错

2. 使用 Neon Postgres 免费计划
   - 与 Vercel 完美集成
   - 自动创建环境变量

3. 使用 GitHub Actions 处理定时任务
   - 完全免费
   - 可靠稳定

## 🔗 相关链接

- [Vercel 文档](https://vercel.com/docs)
- [Neon 文档](https://neon.tech/docs)
- [Vercel 环境变量文档](https://vercel.com/docs/projects/environment-variables)
- [Vercel Cron Jobs 文档](https://vercel.com/docs/cron-jobs)
