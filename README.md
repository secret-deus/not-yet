# 再等等（Not Yet）

一个“小而美”的购物冷静器：先记下想买的东西和此刻的理由，等冷静期结束后再复盘；如果最终购买，还能在使用一段时间后对照预期和实际。

- 在线体验：[not-yet-coldcart.democlaw123.chatgpt.site](https://not-yet-coldcart.democlaw123.chatgpt.site)
- GitHub 源码：[github.com/secret-deus/not-yet](https://github.com/secret-deus/not-yet)
- 产品需求：[docs/PRD.md](docs/PRD.md)

## 它能做什么

- 完整 CRUD：新增、列表查看、详情查看、编辑和删除。
- 刷新不丢数据：主数据和上一份备份都保存在浏览器 LocalStorage。
- 冷静期：支持 24 小时、3 天、7 天和 1～30 天自定义时长。
- 到期复盘：选择继续等待、先不买或已经买了。
- 可撤销操作：删除和最终决定都有 8 秒撤销窗口，刷新后仍按剩余时间继续。
- 购买后验证：购买约 7 天后记录真实使用次数、需要是否满足、满意度和额外成本。
- “换个角度想想”：可选的 AI 反思助手，只提供缺失证据、替代方案和小实验，不替用户给出买或不买的结论。
- 本地降级：AI 未启用、超时或失败时，可以使用固定的本地检查清单；界面会明确说明它不是 AI。

## 数据和隐私

业务数据默认只存在当前浏览器：

```text
notyet:data:v1
notyet:data:backup:v1
```

每次保存会先校验新状态，再把上一份有效数据写入备份，最后写入主数据。主数据损坏时会尝试从备份恢复；未知的新 Schema 版本会被安全拒绝，不会被旧应用静默覆盖。

AI 请求不是自动触发的。每次发送前都会展示字段预览并要求单独确认。远程请求只允许以下字段：

- 商品名、价格、购买理由
- 打算用途、每周预计使用次数
- 已有替代方案、想要程度

商品链接、其他记录、LocalStorage、时间线和设备信息不会发送。API 密钥只在服务端环境变量中读取，绝不进入客户端包或 LocalStorage。

## 本地启动

要求 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

默认打开终端提示的本地地址。

常用命令：

```bash
npm run typecheck  # TypeScript 静态检查
npm run test:unit  # 领域规则与存储测试
npm run build      # 生产构建
npm test           # 单元测试 + 构建 + 产物级测试
npm run lint       # ESLint
```

## 可选：启用远程 AI

复制示例环境变量：

```bash
cp .env.example .env.local
```

然后填写：

```dotenv
AI_ENABLED=true
OPENAI_API_KEY=你的服务端密钥
OPENAI_MODEL=gpt-5.6-luna
```

未同时配置 `AI_ENABLED=true` 和 `OPENAI_API_KEY` 时，`POST /api/reflect` 会明确返回“未启用”，应用仍可完成全部 CRUD、冷静期、复盘和本地清单流程。

AI 接口使用服务端白名单校验、严格 JSON Schema 结构化输出、15 秒超时、固定免责声明和购买结论拦截。默认模型可通过 `OPENAI_MODEL` 替换。

## 技术架构

- React 19 + TypeScript
- vinext / Vite 8
- Next App Router 兼容路由
- Cloudflare Workers 运行时
- shadcn/ui + Radix UI 交互组件
- Tailwind CSS 4 设计 Token 与响应式样式
- Zod 运行时 Schema 校验
- LocalStorage 主副本 Repository
- Node Test Runner + tsx
- Lucide 线性图标

代码按职责拆分：

```text
app/                 页面路由与 Serverless API
src/domain/          数据类型、状态动作、时间、金额和校验
src/storage/         LocalStorage Repository
src/context/         应用状态、持久化提交和业务动作绑定
src/advisor/         AI 输入白名单与输出契约
src/components/      表单、列表、详情、复盘和 AI 交互组件
src/components/ui/   shadcn/ui 基础控件（按项目视觉定制）
tests/               领域、存储与构建产物测试
docs/PRD.md          已确认的产品需求
```

## “聪明”功能如何工作

“换个角度想想”不是聊天机器人，也不做购买裁判。它固定输出五类内容：

1. 可能的底层需要；
2. 还缺的 1～3 条证据；
3. 2～3 个不急着购买的替代方案；
4. 一个冷静期内可执行的小实验；
5. 2～3 个复盘问题。

每条结果都可以采纳、编辑、稍后处理或忽略。AI 失败不会修改记录状态，也不会覆盖已有结果。

## Vibe Coding 说明

本项目使用 OpenAI Codex 进行 AI 辅助开发。我的职责是产品经理和架构决策者：先完成选题讨论与 PRD 冻结，再让 AI 按模块生成和修改代码，并通过类型检查、自动化测试、浏览器交互与移动端视觉验收逐步收敛。

AI 主要参与：

- PRD 边界和状态机审计；
- React/TypeScript 模块实现；
- LocalStorage 备份恢复和测试用例；
- AI 结构化输出、安全降级与隐私约束；
- 响应式 UI、无障碍和文档完善。

最终产品选择、功能取舍、架构、验收标准和发布范围均由人确认。

## 当前限制

- P0 只承诺单浏览器、单标签页编辑；检测到其他标签修改时只提示，不做自动合并。
- 数据不会跨设备同步；清除浏览器站点数据会删除本地记录。
- 远程 AI 的匿名限流为轻量级 Serverless 防护；正式商业化前应接入持久化限流和硬预算。
- 不提供价格比较、商品搜索、优惠券、自动下单或“是否值得买”评分。

## License

MIT
