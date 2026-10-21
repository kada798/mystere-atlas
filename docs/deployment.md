# 公开演示站

- 地址：https://mystere-atlas.yellowelm32.chatgpt.site
- 发布日期：2026-10-21（Europe/Paris）
- 访问范围：公开，无需登录；原 GitHub 仓库保持私有。
- 已发布版本：1。
- Sites 项目 ID：`appgprj_6ad918eb0750819181fa7cc64422e63c`。
- 版本 ID：`appgprj_6ad918eb0750819181fa7cc64422e63c~appgver_76c11893113081919d83ced85b401d1f`。
- 源码提交：`b5db5bc166b4cdd4530c9010a91f4f9f00adec4c`（独立托管源码库）。
- 部署 ID：`appgdep_6ad91bf582848191b5e899534849aef0`，返回状态 `succeeded`。

## 运行范围

公开 MVP 提供三语界面、作品检索、真实作品详情、巴黎活动地图和外部主办方链接。账号、个人清单、社区和站内报名尚未实现。上线没有改变这些功能的状态。

本次发布包含 2026-10-20 获取的公开数据快照（78 部作品、43 项活动）；活动页默认隐藏已结束的记录。页面标明快照日期，场次以主办方为准。线上没有开启独立采集服务，不能把本机 `data:watch` 当作线上自动更新。

## 开发与发布分离

原项目继续使用 Next.js、npm、VS Code 和私有 GitHub 仓库。Sites 在 Cloudflare Workers 上运行，独立发布副本位于忽略目录 `tmp/sites/mystere-atlas-demo`，保留模板的托管插件和 Worker 构建配置。

`scripts/prepare-sites-demo.mjs` 仅复制应用代码、翻译和公开目录快照；不复制原 Git 历史、环境变量、凭据、日志或私人用户内容。它将本地文件读取替换为托管包内快照，并为兼容环境使用普通页面链接，保留语言前缀和查询参数。原 Next.js 项目的导航方式不变。

## 后续更新

1. 修改并验证原项目；按需运行 `npm.cmd run data:sync` 更新资料。
2. 复用上述项目 ID。若独立副本缺失，按 Sites 技能重新准备空目录和模板，将同一 ID 写入其 `.openai/hosting.json`；不要创建第二个站点。
3. 在原项目运行 `node scripts/prepare-sites-demo.mjs`；依赖输入有变时更新发布副本的 npm 锁文件并安装依赖。
4. 在发布副本构建并验证三语路由、作品检索／详情、地图、手机布局和 404。
5. 按 Sites 技能获取短期源码凭据，经 stdin 交给源码工作流，提交并打包同一份源码，再保存版本和发布。不得把凭据写入文件、命令行或 Git。
6. 保存新版本与成功部署结果，继续复用当前公开地址。

Windows 上模板包装器的 npm 启动路径曾报错；同一模板的 `npm.cmd run install:ci` 与 `npm.cmd run build` 可正常运行。预览会占用 `dist`，重新构建前需先停止所拥有的预览进程。
