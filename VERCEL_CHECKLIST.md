# Vercel 部署验证清单

在部署完成后，使用此清单验证你的 Metapi 实例是否正常运行。

## ✅ 部署前检查

- [ ] 已注册 Vercel 账号
- [ ] 已准备好强随机令牌（至少 32 字节）
- [ ] 了解 Vercel Serverless 的功能限制

## ✅ 部署步骤检查

- [ ] 已点击 "Deploy with Vercel" 按钮
- [ ] 项目已成功部署到 Vercel
- [ ] 已添加 Neon Postgres 数据库
- [ ] 已配置所有必需的环境变量：
  - [ ] `DB_TYPE=postgres`
  - [ ] `DB_URL=${POSTGRES_URL}`
  - [ ] `DB_SSL=true`
  - [ ] `AUTH_TOKEN`
  - [ ] `PROXY_TOKEN`
  - [ ] `ACCOUNT_CREDENTIAL_SECRET`
- [ ] 已重新部署项目以应用环境变量

## ✅ 功能验证

### 1. 基础访问
- [ ] 可以访问部署的 URL
- [ ] 前端页面正常加载
- [ ] 可以使用 `AUTH_TOKEN` 登录管理后台

### 2. 数据库连接
- [ ] 登录后可以看到仪表板
- [ ] 可以添加站点
- [ ] 可以添加账号
- [ ] 数据持久化正常（刷新页面后数据仍存在）

### 3. API 功能
测试代理 API 是否正常工作：

```bash
# 替换为你的域名和 PROXY_TOKEN
curl https://your-domain.vercel.app/v1/models \
  -H "Authorization: Bearer YOUR_PROXY_TOKEN"
```

预期结果：返回模型列表 JSON

### 4. 定时任务（可选）

如果你有 Vercel Pro 计划：
- [ ] 在 Vercel 项目设置中启用了 Cron Jobs
- [ ] 定时任务按预期执行

如果使用免费计划：
- [ ] 已设置外部 Cron 服务（如 cron-job.org）
- [ ] 手动测试定时任务端点：

```bash
# 测试签到任务
curl -X POST https://your-domain.vercel.app/api/cron/checkin \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# 测试余额刷新
curl -X POST https://your-domain.vercel.app/api/cron/balance-refresh \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# 测试日志清理
curl -X POST https://your-domain.vercel.app/api/cron/log-cleanup \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

## ✅ 性能检查

- [ ] 首次访问响应时间 < 3 秒（冷启动）
- [ ] 后续访问响应时间 < 1 秒
- [ ] API 请求响应时间正常
- [ ] 没有频繁的超时错误

## ✅ 安全检查

- [ ] `AUTH_TOKEN` 是强随机字符串（至少 32 字节）
- [ ] `PROXY_TOKEN` 是强随机字符串（至少 32 字节）
- [ ] `ACCOUNT_CREDENTIAL_SECRET` 是强随机字符串（至少 32 字节）
- [ ] 数据库连接使用 SSL (`DB_SSL=true`)
- [ ] 没有在公开的代码仓库中暴露敏感信息

## ✅ 监控设置

- [ ] 已在 Vercel 控制台中查看部署日志
- [ ] 已设置通知渠道（Webhook/Bark/Telegram/邮件）
- [ ] 已测试通知功能是否正常

## 🐛 常见问题排查

### 问题：构建失败 - Cannot find module 'scripts/desktop/generate-icons.mjs'

**原因**: 使用了旧版本的代码，构建脚本包含了桌面应用的图标生成步骤。

**解决方案**：
1. 拉取最新代码：`git pull origin main`
2. 确保 `package.json` 中有 `build:web:vercel` 脚本
3. 在 Vercel 中重新部署

### 问题：无法访问部署的 URL
**解决方案**：
1. 检查 Vercel 部署状态是否为 "Ready"
2. 检查域名配置是否正确
3. 清除浏览器缓存后重试

### 问题：登录失败
**解决方案**：
1. 确认使用的是正确的 `AUTH_TOKEN`
2. 检查环境变量是否已保存并重新部署
3. 查看 Vercel 日志中的错误信息

### 问题：数据库连接失败
**解决方案**：
1. 确认 `DB_URL` 正确引用了 `${POSTGRES_URL}`
2. 确认 `DB_SSL=true`
3. 检查 Neon 数据库是否已创建
4. 查看 Vercel 日志中的详细错误

### 问题：API 请求超时
**解决方案**：
1. 检查是否是 Neon 数据库冷启动（首次访问会慢）
2. 优化数据库查询
3. 考虑升级到 Vercel Pro 计划（60 秒超时）

### 问题：定时任务不执行
**解决方案**：
1. 确认是否有 Vercel Pro 计划
2. 如果是免费计划，使用外部 Cron 服务
3. 手动测试定时任务端点是否正常

## 📊 性能优化建议

- [ ] 启用 Vercel Analytics 监控性能
- [ ] 定期清理旧的代理日志
- [ ] 监控数据库存储使用情况
- [ ] 考虑使用 CDN 加速静态资源

## 🎉 部署成功！

如果所有检查项都通过，恭喜你成功部署了 Metapi 到 Vercel！

现在你可以：
1. 添加你的 AI 中转站账号
2. 配置代理路由规则
3. 开始使用统一的 API 网关

## 📚 下一步

- 阅读 [Metapi 使用文档](https://metapi.cita777.me)
- 加入社区讨论
- 为项目贡献代码或反馈问题

---

**需要帮助？**
- 查看 [完整部署文档](VERCEL_DEPLOYMENT.md)
- 查看 [快速部署指南](VERCEL_QUICKSTART.md)
- 提交 [GitHub Issue](https://github.com/cita-777/metapi/issues)
