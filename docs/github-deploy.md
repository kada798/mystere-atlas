# GitHub 驱动的网站部署

## 目标与当前状态

`Deploy website` 是真正执行网站部署的独立 GitHub Actions 工作流：从私有仓库构建原 Next.js 应用，再发布到 Vercel。与只生成版本包的 `Release` 不同。

现有 `chatgpt.site` 演示站在迁移期间继续可用。新的 Vercel 项目和正式网址必须在账号授权后实际创建、部署与验证；在获得成功结果前，不把预想的域名写作已上线地址。

## 首次连接

1. 使用自己的 GitHub 账号登录 [Vercel](https://vercel.com/login)，创建或关联名为 `mystere-atlas` 的 Next.js 项目，Node.js 选 24。
2. 在 Vercel 的账号令牌页创建适用于该项目的发布令牌。也可在本机使用固定版本 CLI：`npx vercel@65.0.0 login`，授权后再 `npx vercel@65.0.0 link`。
3. 在私有仓库的 [Actions secrets](https://github.com/kada798/mystere-atlas/settings/secrets/actions) 保存 `VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID`。后两个 ID 来自 CLI 生成的 `.vercel/project.json`。不要将令牌粘贴到聊天、源码或工作流文件。
4. 在 [Deploy website](https://github.com/kada798/mystere-atlas/actions/workflows/deploy.yml) 点击 **Run workflow**，选择 `main`。
5. 工作流成功后，在运行摘要查看实际返回的部署地址，并验证它在未登录的浏览器中可访问。简历优先使用 Vercel 项目的稳定生产域名，或之后绑定的自有域名。

`vercel.json` 禁用了平台 Git 集成的自动部署。提交、PR 和创建 Release 都不会绕过手动部署流程。仓库可继续私有；网页本身公开。

## 每次部署做什么

- 拒绝从非 `main` 分支部署；缺少授权配置时明确失败，不显示上线成功。
- 锁定依赖安装，运行 lint、类型检查、格式检查和业务测试。
- 从公开来源获取作品与巴黎活动，检查是否为空及是否有来源失败。失败时不会继续替换线上版本。
- 通过 `vercel pull` 获取生产项目设置，`vercel build --prod` 构建一次。
- 检查公开快照被 Next.js 文件追踪纳入服务端函数，并对生产构建做三语、筛选、健康接口和 404 验证。
- 使用 `vercel deploy --prebuilt --prod` 发布已经验证的构建，然后检查线上地址。
- 在 GitHub 运行摘要留下真实 URL 和源码提交。

构建阶段产生的 `.data/` 是公开资料快照，不提交 Git。仅部署模式设置 `DEPLOY_DATA_SNAPSHOT=1` 时才将指定快照纳入服务端函数；原 Release 包仍排除本地数据。Vercel serverless 不运行本机循环采集进程，重新获取资料发生在这次手动部署中。

平台访问保护可能要求登录。最终给招聘方的生产域名必须允许匿名访问；若线上检查返回登录页面，需要在 Vercel 的 Deployment Protection 设置中检查生产访问范围，不能将登录重定向当作验收通过。

## 产品展示

访客页面使用 Mystère Atlas 自有名称、图标和三语产品文案，介绍项目来自推理读书分享会的真实灵感。未开放的社区和文化专题仍标为筹备中；没有伪造评价、用户数、账号或报名成功。

旧 Sites 发布副本是迁移前方案，不会由新工作流调用。待新网址实际部署成功后，再更新 README 和简历链接。

## 官方说明

- [GitHub Actions 与 Vercel 的部署方式](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel)
- [Vercel Git 部署开关](https://vercel.com/docs/project-configuration/git-configuration)
- [Vercel CLI 登录](https://vercel.com/docs/cli/login)
- [GitHub Pages 仅托管静态站点及套餐条件](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
