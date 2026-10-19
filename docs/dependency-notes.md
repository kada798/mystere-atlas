# 依赖检查记录

初始化日期：2026-10-19。

- Next.js 16.4.2、React 19.3.1、next-intl 4.14.9；实际安装版本由 `package-lock.json` 固定。
- `npm audit --omit=dev`：生产依赖 0 项告警。
- 完整 `npm audit`：开发依赖链中的 `braces` 导致 5 项高等级传递告警，路径为 `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`。
- 上游公告 [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) 当前没有补丁版本。其触发条件是处理恶意深度嵌套的 glob 模式；当前网站没有让用户提交 glob 模式的接口，该包仅由开发检查工具链引入。
- 保留与 Next.js 插件兼容的 ESLint 9；安装器提示其已停止支持。升级 ESLint 10 需要同时确认 React 等 lint 插件的 peerDependencies 支持，不能只强制升级主包。
- 不执行 `npm audit fix --force`，其建议会把配置降到不匹配的旧主版本。

后续依赖维护应在上游发布兼容修复后更新锁文件，再运行静态检查、构建及路由冒烟检查。不要忽略真实运行时告警，也不要把开发链传递告警当作网站已经被攻击的证据。
