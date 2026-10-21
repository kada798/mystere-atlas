# GitHub Pages 网站部署

用户选择使用 github.io，不再采用 Vercel 方案。主应用继续是 Next.js；演示站使用独立静态导出，搜索和筛选在浏览器运行，所有收录作品详情提前生成。账号、发帖和站内报名尚未开放。

GitHub 已对当前私有仓库返回：Your current plan does not support GitHub Pages for this repository. 不会未经用户选择就改变主仓库可见性。可选路径是单独公开演示代码仓库、公开主仓库，或升级支持私有 Pages 的套餐。

## 生成静态演示源码

在主项目运行：

```powershell
node scripts/prepare-pages-demo.mjs --base-path=/mystere-atlas-demo
```

`tmp/pages-demo` 是独立的演示源码副本，不包括原 Git 历史、凭据、环境文件、采集任务或未来后台。复制内容限定为前台组件、纯查询规则、三语文案及带来源日期的公开资料。

在该目录运行 `npm ci`、`npm run check`、`npm run build`，生成忽略的 `out/`。输出目录不提交 Git。

## 在 GitHub 发布

发布仓库使用 `deployment/pages.yml` 所示的 **Deploy GitHub Pages** 工作流。它只手动触发：安装锁定依赖 → 检查类型 → 静态构建 → 上传 Pages artifact → 原生 Pages 部署。无须 Vercel 令牌或第三方托管账号。

发布前，确认仓库已启用 Pages，构建来源为 GitHub Actions。选择 main 运行工作流；成功后使用 GitHub 实际返回的 page_url，并验证未登录访问、三语、作品筛选、详情与巴黎地图。不能把预想地址当作已经部署成功。

静态站不运行服务器或定时采集。更新资料或界面后，从主项目重新生成演示源码，再提交演示源码并手动部署。来源日期保留，活动以主办方场次为准。

Release 仍负责原应用版本包，与 Pages 网站部署是两个独立流程。原 chatgpt.site 链接在新站验收前保留。

## 参考

- [GitHub Pages 套餐与托管范围](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Actions 发布 Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Next.js 静态导出](https://nextjs.org/docs/app/guides/static-exports)
