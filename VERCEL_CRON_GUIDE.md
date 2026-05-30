# Vercel 定时任务配置指南

由于 Vercel 免费计划（Hobby）不支持 Cron Jobs，本文档提供了多种免费的替代方案。

## 🚫 问题说明

Vercel 免费计划的限制：
- ❌ 不支持 Cron Jobs
- ❌ 每天只能执行一次定时任务
- ✅ Pro 计划（$20/月）支持完整的 Cron Jobs 功能

错误信息：
```
Hobby accounts are limited to daily cron jobs. This cron expression (0 * * * *) 
would run more than once per day. Upgrade to the Pro plan to unlock all Cron Jobs 
features on Vercel.
```

## ✅ 解决方案

### 方案 1: GitHub Actions（推荐）

**优势**：
- ✅ 完全免费
- ✅ 可靠稳定
- ✅ 支持手动触发
- ✅ 有详细的执行日志
- ✅ 与代码仓库集成

**配置步骤**：

1. 在你的 GitHub 仓库中创建文件 `.github/workflows/vercel-cron.yml`

2. 复制以下内容（或使用 `.github/workflows/vercel-cron.yml.example`）：

```yaml
name: Metapi Cron Jobs

on:
  schedule:
    - cron: '0 8 * * *'  # 签到任务
    - cron: '0 * * * *'  # 余额刷新
    - cron: '0 6 * * *'  # 日志清理
  workflow_dispatch:

jobs:
  checkin:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 8 * * *'
    steps:
      - name: 执行签到任务
        run: |
          curl -X POST https://${{ secrets.VERCEL_DOMAIN }}/api/cron/checkin \
            -H "Authorization: Bearer ${{ secrets.AUTH_TOKEN }}" \
            -f || exit 1

  balance-refresh:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 * * * *'
    steps:
      - name: 执行余额刷新任务
        run: |
          curl -X POST https://${{ secrets.VERCEL_DOMAIN }}/api/cron/balance-refresh \
            -H "Authorization: Bearer ${{ secrets.AUTH_TOKEN }}" \
            -f || exit 1

  log-cleanup:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 6 * * *'
    steps:
      - name: 执行日志清理任务
        run: |
          curl -X POST https://${{ secrets.VERCEL_DOMAIN }}/api/cron/log-cleanup \
            -H "Authorization: Bearer ${{ secrets.AUTH_TOKEN }}" \
            -f || exit 1
```

3. 在 GitHub 仓库的 **Settings** → **Secrets and variables** → **Actions** 中添加：
   - `VERCEL_DOMAIN`: 你的 Vercel 域名（例如：`your-app.vercel.app`）
   - `AUTH_TOKEN`: 你的 AUTH_TOKEN

4. 提交并推送到 GitHub

5. 在 **Actions** 标签中可以查看执行日志

### 方案 2: cron-job.org

**优势**：
- ✅ 完全免费
- ✅ 支持每分钟执行
- ✅ 简单易用
- ✅ 有邮件通知

**配置步骤**：

1. 访问 [cron-job.org](https://cron-job.org) 并注册账号

2. 创建 3 个 Cron Job：

**签到任务**：
- Title: `Metapi Checkin`
- URL: `https://your-domain.vercel.app/api/cron/checkin`
- Schedule: `0 8 * * *` (每天 8:00)
- Request Method: `POST`
- Headers: 
  - Name: `Authorization`
  - Value: `Bearer YOUR_AUTH_TOKEN`

**余额刷新**：
- Title: `Metapi Balance Refresh`
- URL: `https://your-domain.vercel.app/api/cron/balance-refresh`
- Schedule: `0 * * * *` (每小时)
- Request Method: `POST`
- Headers: 
  - Name: `Authorization`
  - Value: `Bearer YOUR_AUTH_TOKEN`

**日志清理**：
- Title: `Metapi Log Cleanup`
- URL: `https://your-domain.vercel.app/api/cron/log-cleanup`
- Schedule: `0 6 * * *` (每天 6:00)
- Request Method: `POST`
- Headers: 
  - Name: `Authorization`
  - Value: `Bearer YOUR_AUTH_TOKEN`

### 方案 3: EasyCron

**优势**：
- ✅ 免费计划可用
- ✅ 简单易用

**限制**：
- ⚠️ 免费计划每小时最多执行一次

**配置步骤**：

1. 访问 [EasyCron](https://www.easycron.com) 并注册账号
2. 创建 Cron Job，配置与 cron-job.org 类似
3. 注意免费计划的执行频率限制

### 方案 4: Uptime Robot

**优势**：
- ✅ 免费计划可用
- ✅ 同时提供监控功能

**限制**：
- ⚠️ 最短间隔 5 分钟
- ⚠️ 只能用于 GET 请求（需要修改 API 端点）

**配置步骤**：

1. 访问 [Uptime Robot](https://uptimerobot.com) 并注册账号
2. 创建 HTTP(s) 监控
3. 设置检查间隔

## 🎯 推荐方案

| 方案 | 推荐度 | 适用场景 |
|------|--------|---------|
| GitHub Actions | ⭐⭐⭐⭐⭐ | 项目托管在 GitHub 上 |
| cron-job.org | ⭐⭐⭐⭐ | 不使用 GitHub 或需要更灵活的配置 |
| EasyCron | ⭐⭐⭐ | 简单场景，执行频率要求不高 |
| Uptime Robot | ⭐⭐ | 需要同时监控服务可用性 |

## 🧪 测试定时任务

在配置完成后，可以手动测试定时任务是否正常工作：

```bash
# 测试签到任务
curl -X POST https://your-domain.vercel.app/api/cron/checkin \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -v

# 测试余额刷新
curl -X POST https://your-domain.vercel.app/api/cron/balance-refresh \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -v

# 测试日志清理
curl -X POST https://your-domain.vercel.app/api/cron/log-cleanup \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -v
```

预期响应：
```json
{
  "success": true,
  "message": "Task executed"
}
```

## 💰 升级到 Pro 计划

如果你需要更可靠的定时任务执行，可以考虑升级到 Vercel Pro 计划（$20/月）：

**优势**：
- ✅ 内置 Cron Jobs 支持
- ✅ 更长的函数执行时间（60 秒 vs 10 秒）
- ✅ 更多的带宽和执行时间
- ✅ 无需依赖外部服务

**配置步骤**：

1. 升级到 Vercel Pro 计划
2. 将 `vercel.pro.json` 重命名为 `vercel.json`
3. 重新部署项目
4. Vercel 会自动执行配置的定时任务

## 📊 定时任务说明

| 任务 | 频率 | 说明 |
|------|------|------|
| 签到任务 | 每天 8:00 | 自动为所有启用的账号执行签到 |
| 余额刷新 | 每小时 | 更新所有账号的余额信息 |
| 日志清理 | 每天 6:00 | 清理过期的代理日志 |

## ❓ 常见问题

### Q: GitHub Actions 会消耗我的 GitHub 配额吗？

A: GitHub 免费账号每月有 2000 分钟的 Actions 执行时间。这些定时任务每次执行只需要几秒钟，完全够用。

### Q: 如果定时任务失败了怎么办？

A: 
- GitHub Actions: 在 Actions 标签中查看日志
- cron-job.org: 会发送邮件通知
- 手动执行: 使用 curl 命令测试

### Q: 可以修改定时任务的执行时间吗？

A: 可以，修改 cron 表达式即可。例如：
- `0 8 * * *` - 每天 8:00
- `0 */2 * * *` - 每 2 小时
- `*/30 * * * *` - 每 30 分钟

### Q: 定时任务需要认证吗？

A: 是的，所有定时任务端点都需要 `Authorization: Bearer YOUR_AUTH_TOKEN` 头部。

## 🔗 相关链接

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [cron-job.org](https://cron-job.org)
- [Cron 表达式生成器](https://crontab.guru/)
- [Vercel Cron Jobs 文档](https://vercel.com/docs/cron-jobs)
