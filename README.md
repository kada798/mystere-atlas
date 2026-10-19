# Mystère Atlas · 谜图

连接悬疑推理作品、文化、同好与线下活动的中英法三语平台。

**当前是开发环境与项目骨架**：三语路由、模块入口、本地调试和 CI 已配置。账号、数据库、作品记录、活动报名、论坛和自动采集尚未实现。

## 快速启动

需要 Node.js 22–26 与 npm 10 及以上。建议统一使用 Node.js 24；初始化时本机使用 Node.js 26.1.0。

在 VS Code 中打开 `mystere-atlas.code-workspace`，在项目终端执行：

```powershell
npm.cmd ci
npm.cmd run dev
```

已安装依赖时直接运行第二条。在 Windows PowerShell 中使用 `npm.cmd` 可以避免 `npm.ps1` 的执行策略问题；macOS、Linux 中使用 `npm`。

打开 <http://127.0.0.1:3000/zh>。英文和法文入口分别为 `/en`、`/fr`。保存源码后页面自动刷新。

项目无需数据库、Docker 或外部 API 密钥即可启动。之后接入服务时，将 `.env.example` 复制为 `.env.local` 并填写对应值。不要提交真实密钥。

## VS Code 断点调试

1. 若已经运行 `npm run dev`，先在对应终端按 `Ctrl+C` 停止，释放 3000 端口。
2. 打开“运行和调试”（`Ctrl+Shift+D`）。
3. 选择 **Mystère Atlas: full stack (F5)**，按 `F5`；服务启动后自动打开 Edge 调试浏览器。
4. 前端：在 `src/components/debug-panel.tsx` 的 `increment` 函数中设断点，点击首页下方的计数按钮。
5. 服务端：在 `src/app/api/health/route.ts` 的 `GET` 函数中设断点，点击“检查服务端”。
6. `F10` 单步执行、`F11` 进入函数、`Shift+F5` 停止调试。停止浏览器调试后如仍有服务端会话，请停止全部调试会话。

也提供仅服务端、仅浏览器配置。仅浏览器配置需要先启动开发服务器。调试面板仅在开发模式显示，生产构建不显示。

工作区推荐 ESLint 与 Prettier 扩展。编辑器提示安装推荐扩展时可按需安装；VS Code 内置 JavaScript 调试器即可进行上述调试。

## 常用命令

| 命令                              | 用途                                                   |
| --------------------------------- | ------------------------------------------------------ |
| `npm run dev`                     | 启动开发服务器                                         |
| `npm run check`                   | ESLint、TypeScript 和格式检查                          |
| `npm run format`                  | 统一格式                                               |
| `npm run build`                   | 生产构建                                               |
| `npm run start`                   | 运行生产构建                                           |
| `npm run smoke -- --start-server` | 构建后启动临时生产服务器并检查三语路由、健康接口和 404 |
| `npm run smoke`                   | 检查已运行的服务器，默认使用 3000 端口                 |

`Ctrl+Shift+B` 运行构建；“终端 → 运行任务”中也提供开发和检查任务。

## 目录

```text
src/app/[locale]/     三语页面与布局
src/app/api/          服务端接口
src/components/       共享界面与调试示例
src/features/         业务模块扩展位置
src/i18n/             语言路由与文案加载
src/lib/              未来的数据库、认证和外部服务连接
messages/             中文、英文、法文文案
jobs/                 未来独立运行的数据采集入口
database/             未来的数据迁移与访问权限
docs/                 产品范围、架构和开发路线
scripts/              开发验证脚本
.vscode/              启动、调试与任务配置
```

## Git 工作流

`main` 保存可运行版本。后续功能分支使用 `codex/功能名称`，通过 PR 检查后合并。仓库中的 CI 执行依赖安装、检查、构建和路由冒烟检查，不自动部署网站。

```powershell
git switch -c codex/catalog
git add src messages docs
git commit -m "Add catalog foundation"
git push -u origin codex/catalog
```

`tmp/`、`node_modules/`、`.next/`、环境文件和日志均被忽略。提交前运行 `git diff --cached` 检查提交内容。

## 开发约定

- 界面文案放入三份 `messages/*.json`，避免在页面内写死中文。
- `zh`、`en`、`fr` 共用作品身份，后续按语言保存译名和简介。
- 核心业务规则放入 `features`；页面负责展示与交互。
- 私人笔记与公开评价分开；报名、后台操作均须做服务端权限检查。
- 用户打开页面时读取已有资料，采集任务独立运行。
- 未接入的模块明确显示开发状态，避免模拟已可用的注册或报名。

详见 [MVP 与开发计划](docs/mvp.md)、[架构说明](docs/architecture.md)。

依赖告警及兼容性记录见 [依赖检查记录](docs/dependency-notes.md)。

## 常见问题

- **3000 端口被占用**：先停止已有开发或调试会话；临时也可用 `npm.cmd run dev -- --port 3001`，并同步修改浏览器调试地址。
- **类型或依赖报错**：在项目根目录重新运行 `npm.cmd ci`；VS Code 选择“TypeScript: Select TypeScript Version → Use Workspace Version”。
- **修改文案后没生效**：确认地址中的语言前缀与所修改的 JSON 文件一致。
- **登录或报名入口在哪里**：这些业务功能在后续里程碑实现；当前仅完成基础环境。
