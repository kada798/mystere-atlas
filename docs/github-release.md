# GitHub 独立发布流程

主仓库现已公开。日常 CI 只检查代码；`Release` 工作流仅由用户在 Actions 手动触发，不响应 push、PR 或定时任务。

## 操作

1. 打开 [Release 工作流](https://github.com/kada798/mystere-atlas/actions/workflows/release.yml)。
2. 点击 **Run workflow**，分支选 `main`。
3. 填写未使用的版本号，例如 `0.1.0` 或 `0.2.0-beta.1`，不带 `v`。
4. 默认保留 `draft=true`，先生成 GitHub Release 草稿。取消该选项会将版本和附件正式发布到公开仓库。
5. 在运行摘要或 [Releases](https://github.com/kada798/mystere-atlas/releases) 查看结果，核对提交和包内说明后再使用。

只有 `main` 可生成版本包；重复版本不覆盖。并发发布排队执行。构建失败或包内检测到环境文件、本地数据、日志、越界符号链接时，不创建发布版本。

## 实际执行

- npm 锁文件安装依赖。
- ESLint、类型、格式、业务测试。
- `RELEASE_STANDALONE=1` 构建 Next.js standalone。
- 将必要运行文件和静态资源组装为 Linux x64 / Node.js 24 运行包。
- 对组装后的运行包执行三语路由、筛选、健康接口和 404 冒烟测试。
- 生成 `.tar.gz`、`release-manifest.json` 和 `SHA256SUMS`。
- 只在最后的发布任务赋予当前仓库 `contents: write` 权限，使用 GitHub 自带的短期 `GITHUB_TOKEN` 创建版本，不需要额外保存个人访问令牌或 Sites 临时令牌。

Actions 中间产物保留 14 天；Release 附件独立保存在对应版本。草稿保持草稿状态，正式发布的版本和附件可公开访问。

## 与线上演示站的关系

公开演示站使用 [GitHub Pages 发布流程](github-deploy.md)。GitHub Release 是可追踪的源码版本与运行包，**不等于更新演示站**。

本流程打包原 Next.js 应用，不是静态站点。GitHub Pages 演示站使用独立的 [Pages 发布流程](github-deploy.md)，无需 Vercel。迁移前的 Sites 地址仍按 [旧部署说明](deployment.md) 管理。

包不含 `.data/`、环境密钥或本机日志。部署到 Node 主机时按包内 `README-RUN.md` 说明提供运行环境及独立持久数据；没有资料快照时页面呈现真实空状态。采集任务仍需单独运行。

GitHub Pages 只提供静态托管。`prepare-pages-demo.mjs` 将筛选转到浏览器并提前生成详情；原应用保留服务端开发能力。

## 参考

- [手动触发工作流](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch)
- [GitHub Release 与附件接口](https://docs.github.com/en/rest/releases)
- [GitHub Pages 的静态托管范围](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Next.js standalone 输出](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
