# Vercel 快速部署指南

## 🚀 5 分钟快速部署

### 第一步：一键部署
点击按钮开始部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cita-777/metapi)

### 第二步：添加数据库
1. 部署完成后，进入项目仪表板
2. 点击 **Storage** → **Create Database**
3. 选择 **Neon Postgres** → **Continue**

### 第三步：配置环境变量
在 **Settings** → **Environment Variables** 中添加：

```bash
DB_TYPE=postgres
DB_URL=${POSTGRES_URL}
DB_SSL=true
AUTH_TOKEN=your-secure-admin-token
PROXY_TOKEN=your-secure-proxy-token
ACCOUNT_CREDENTIAL_SECRET=your-secure-credential-secret
```

💡 生成安全令牌：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 第四步：重新部署
1. 进入 **Deployments** 标签
2. 点击最新部署的三个点 → **Redeploy**

### 第五步：配置定时任务（可选）

#### 免费计划用户

使用 [cron-job.org](https://cron-job.org) 等免费服务：

1. 注册账号
2. 创建 3 个 Cron Job：
   - 签到：`0 8 * * *` → `POST https://your-domain.vercel.app/api/cron/checkin`
   - 余额刷新：`0 * * * *` → `POST https://your-domain.vercel.app/api/cron/balance-refresh`
   - 日志清理：`0 6 * * *` → `POST https://your-domain.vercel.app/api/cron/log-cleanup`
3. 添加 Header: `Authorization: Bearer YOUR_AUTH_TOKEN`

#### Pro 计划用户

1. 将 `vercel.pro.json` 重命名为 `vercel.json`
2. 重新部署，Vercel 会自动执行定时任务

### 第六步：访问应用
部署完成后，点击 **Visit** 按钮访问你的 Metapi 实例！

---

## 💰 完全免费方案

- ✅ Vercel Hobby 计划（免费）
- ✅ Neon Postgres 免费计划（0.5GB 存储）
- ✅ 适合个人项目和小型应用

## ⚠️ 功能限制

由于 Vercel Serverless 环境限制：

- ❌ WebSocket 不支持
- ❌ 免费计划不支持内置 Cron Jobs（需使用外部服务）
- ⚠️ 函数执行时间限制（免费 10 秒，Pro 60 秒）

**定时任务解决方案**：
- 免费计划：使用 [cron-job.org](https://cron-job.org) 等外部服务
- Pro 计划：使用 `vercel.pro.json` 配置内置 Cron Jobs

## 📚 详细文档

查看完整的部署指南：[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

---

## 🆘 常见问题

### Q: 如何生成安全的令牌？
```bash
# 在终端运行
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Q: 数据库连接失败怎么办？
检查：
1. `DB_URL` 是否正确引用了 `${POSTGRES_URL}`
2. `DB_SSL` 是否设置为 `true`
3. 是否已重新部署项目

### Q: 如何运行定时任务？
- **Pro 计划**：Vercel 会自动运行 `vercel.json` 中配置的 Cron Jobs
- **免费计划**：使用 [cron-job.org](https://cron-job.org) 等外部服务定期调用：
  ```bash
  curl -X POST https://your-domain.vercel.app/api/cron/checkin \
    -H "Authorization: Bearer YOUR_AUTH_TOKEN"
  ```

### Q: Neon 数据库会自动暂停吗？
是的，Neon 免费计划会在 5 分钟不活动后自动暂停。首次访问时会有短暂的冷启动（通常 1-2 秒）。

### Q: 如何查看日志？
```bash
# 安装 Vercel CLI
npm install -g vercel

# 查看实时日志
vercel logs
```

---

## 🔗 相关链接

- [Vercel 文档](https://vercel.com/docs)
- [Neon 文档](https://neon.tech/docs)
- [Metapi GitHub](https://github.com/cita-777/metapi)
- [Metapi 在线文档](https://metapi.cita777.me)
