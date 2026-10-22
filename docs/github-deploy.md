# GitHub Pages 网站部署

发布仓库是公开的 [kada798/mystere-atlas](https://github.com/kada798/mystere-atlas)，Pages 构建来源为 GitHub Actions。网址由 GitHub 返回为 `https://kada798.github.io/mystere-atlas/`；首页根据浏览器语言进入中文、英文或法文。

## 发布步骤

1. 将通过 CI 的 PR 合并到 main。
2. 打开 Actions → **Deploy GitHub Pages** → **Run workflow**，选择 main。
3. 工作流安装锁定依赖并检查主应用，生成静态前台，检查和构建后上传 Pages artifact，最后通过原生 Pages 部署。
4. 查看部署作业返回的地址，确认匿名访问、三语、筛选、详情和地图正常。

工作流在 `.github/workflows/pages.yml`，只接受 main 手动发布。权限使用当前作业的 GitHub 令牌与 OIDC，不需要第三方托管账号或长期发布令牌。构建输出不提交 Git。

## 本机检查静态版本

```powershell
node scripts/prepare-pages-demo.mjs --base-path=/mystere-atlas
Set-Location tmp/pages-demo
npm ci
npm run check
npm run build
```

生成的 `tmp/pages-demo/out/` 是纯静态站。路径前缀 `/mystere-atlas` 对应仓库名称；更改仓库名称时同步更改工作流参数。主项目仍使用 Next.js 服务端模式开发，不影响 VS Code 调试。

## 数据与功能边界

`deployment/public-snapshot.json` 是带来源与日期的公开参考资料，包含 Open Library、Wikidata 和巴黎开放数据。来源归属及授权见同目录的 `DATA-SOURCES.md`。本机 `.data/` 不提交，IMDb 下载记录不进入公开快照。

静态站不运行服务端或定时采集。更新资料时，从采集结果中审查可公开的记录，更新公开快照，经 PR 检查并合并后重新运行发布。当前快照不是实时活动列表，场次与报名以原主办方为准。

搜索、筛选和地图在浏览器运行，所有收录作品详情提前生成。账号、发帖和站内报名尚未开放。

Release 负责原应用版本包，与 Pages 网站部署是两个独立流程。原 chatgpt.site 部署在新站验收前保留，后续不再作为简历主链接。

## 参考

- [GitHub Actions 发布 Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Next.js 静态导出](https://nextjs.org/docs/app/guides/static-exports)
