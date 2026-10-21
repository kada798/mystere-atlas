# GitHub 独立发布流程

开发仓库继续私有，演示站继续公开。日常 CI 只检查代码；`Release` 工作流仅由用户在 Actions 手动触发，不响应 push、PR 或定时任务。

## 操作

1. 打开 [Release 工作流](https://github.com/kada798/mystere-atlas/actions/workflows/release.yml)。
2. 点击 **Run workflow**，分支选 `main`。
3. 填写未使用的版本号，例如 `0.1.0` 或 `0.2.0-beta.1`，不带 `v`。
4. 默认保留 `draft=true`，先生成 GitHub Release 草稿。取消该选项会正式发布该版本到当前私有仓库；这不会公开仓库。
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

Actions 中间产物保留 14 天；Release 附件独立保存在对应版本。私有仓库的版本和附件仍受仓库访问权限控制。

## 与线上演示站的关系

当前公开演示站是 [Mystère Atlas](https://mystere-atlas.yellowelm32.chatgpt.site)，由 Sites 托管。GitHub Release 是可追踪的源码版本与运行包，**不等于更新演示站**。

本流程打包原 Next.js 应用，不是 Sites Worker 包。保留现有地址的更新仍按 [部署说明](deployment.md) 通过 Sites 支持的接口完成；不能把短期源码凭据当作 GitHub 长期部署密钥，也不能将 Next.js 包直接冒充 Sites 部署包。

包不含 `.data/`、环境密钥或本机日志。部署到 Node 主机时按包内 `README-RUN.md` 说明提供运行环境及独立持久数据；没有资料快照时页面呈现真实空状态。采集任务仍需单独运行。

公开源码是后续单独决定。GitHub Pages 只提供静态托管，当前使用服务端筛选和动态详情的应用不能通过更改仓库可见性直接变成 Pages 站点。

## 参考

- [手动触发工作流](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch)
- [GitHub Release 与附件接口](https://docs.github.com/en/rest/releases)
- [GitHub Pages 的静态托管范围](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Next.js standalone 输出](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
