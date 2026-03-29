# 月抛模拟器

一个部署在 Cloudflare Pages + Workers 上的匿名网页小游戏。

核心不是拼手速，而是识人、试探、控风险：

- 先看人
- 再套话 / 追问 / 压边界
- 最后决定碰不碰

这套版本已经把玩法判定收进 Worker，前端只负责展示；AI 只做语言润色，不参与事实和输赢裁决。

## 当前状态

- 单仓库部署
- `Pages` 提供静态页面
- `Worker` 提供 `/api/*`
- 支持 `男生视角` / `女生视角`
- 支持 Workers AI `@cf/zai-org/glm-4.7-flash`
- 所有玩家可见文案和 AI prompt 已经抽到一个 JSON 文件里，方便单独改词

## 仓库结构

```text
.
├── index.html
├── assets/
│   ├── game.css
│   ├── game.js
│   └── game-data.js
├── content/
│   └── game-copy.json
├── worker/
│   ├── src/
│   │   ├── game-engine.mjs
│   │   └── index.js
│   └── wrangler.jsonc
├── tests/
│   └── game-engine.test.mjs
├── _headers
└── _redirects
```

## 各文件职责

### 前端

- [index.html](./index.html)
  页面骨架。只保留结构和占位节点，不再硬编码玩家文案。

- [assets/game.js](./assets/game.js)
  前端状态渲染层。负责：
  - 拉取 `content/game-copy.json`
  - 拉取 Worker 的 `/api/bootstrap`
  - 渲染首页、帮助、案件簿、主界面、反馈层
  - 发送 `start / chat / action` 请求

- [assets/game.css](./assets/game.css)
  纯样式层。
  当前布局原则是：
  - 手机端优先保证“对象 + 线索 + 主操作”首屏可见
  - 桌面端改为左右双栏

- [assets/game-data.js](./assets/game-data.js)
  只保留极少量前端常量：
  - 本地存储 key
  - 文案 JSON 路径
  - 案件簿 section id 列表

### 文案

- [content/game-copy.json](./content/game-copy.json)
  当前唯一文案源。

  你后面要改词，优先只改这个文件。

  它包含：
  - `shell`
    首页、帮助、反馈层、案件簿、战斗 UI 文案
  - `ui`
    按钮和短标签
  - `content`
    场景、教程、线索、事件、结局、模板短句
  - `ai`
    Worker AI 的 prompt

### Worker

- [worker/src/index.js](./worker/src/index.js)
  Worker 入口，只负责把请求转给引擎。

- [worker/src/game-engine.mjs](./worker/src/game-engine.mjs)
  核心规则引擎。负责：
  - 开局
  - 对象生成
  - 三类试探
  - 四类行为
  - 试纸
  - 医院
  - 感染判定
  - 结局和复盘
  - 会话签名

- [worker/wrangler.jsonc](./worker/wrangler.jsonc)
  Worker 配置。
  已经包含 AI binding：
  - `AI`

### 其他

- [tests/game-engine.test.mjs](./tests/game-engine.test.mjs)
  规则层测试，覆盖：
  - seed 确定性
  - 双视角起局
  - session token 防篡改
  - 教学对象
  - 试纸仍为强线索而非全揭示
  - 聊天次数上限
  - 行为锁定
  - bootstrap 能力位

- [ _headers ](./_headers)
  Cloudflare Pages 响应头。

- [ _redirects ](./_redirects)
  旧路径重定向，当前所有历史页面都统一跳回首页。

## 玩法说明

一局的基本流程：

1. 选视角开局
2. 看当前对象的场景、开场白和显性线索
3. 用三类试探拿更多信息
4. 决定：
   - 检测
   - 去医院
   - 做
   - 换一个
5. 在压抑清零前结束整轮，且别把自己玩进医院

### 三类试探

- `套话`
  偏近况、生活和环境细节

- `追问`
  偏检测、时间线、说辞一致性

- `压边界`
  偏底线、安全态度和推进欲望

### 数值

- `压抑`
  太高会直接烧穿，游戏结束

- `压力`
  太高会崩掉，游戏结束

### 工具

- `试纸`
  强线索，不是最终答案

- `医院`
  硬答案，但会吃回合和压抑

## 当前架构

### 1. 规则权威在 Worker

前端不再自己算结果。

所有真正影响输赢的东西都在 Worker：

- 对象状态
- 风险等级
- 疾病池
- 感染判定
- 教程对象
- 回合推进
- 结局

### 2. 前端只展示

前端只做：

- 拉状态
- 渲染
- 记录本地案件簿
- 提交操作

### 3. AI 只做润色

AI 不负责：

- 判断真假
- 改变风险
- 决定是否感染
- 决定输赢

AI 只负责两件事：

- 把聊天回话改得更像人
- 把整轮结束复盘压成一句短刺刀

如果 AI 挂了，游戏仍可玩，会回退到模板短句。

## 文案怎么改

### 最常见的改法

直接改 [game-copy.json](./content/game-copy.json)。

### 推荐改动入口

- 首页和帮助：
  - `shell.intro`
  - `shell.help`

- 按钮和短标签：
  - `shell.battle`
  - `ui.chat`
  - `ui.actions`

- 场景、教程、事件、结局：
  - `content`

- AI 风格：
  - `ai.chat.system`
  - `ai.ending.system`

### 改文案时的原则

- 尽量短
- 少解释
- 少“设计稿语气”
- 少“教程腔”
- 让系统层、人物层、复盘层口气分开

### 不建议改成什么

- 不要把 prompt 写成长段作文
- 不要让 AI 生成新事实
- 不要把玩法说明塞回战斗区

## API

### `GET /api/health`

健康检查。

### `GET /api/bootstrap`

前端启动配置。

当前返回：

- 运行时能力位
- 支持模式
- AI 是否可用
- copy 版本号

### `POST /api/game/start`

请求体：

```json
{
  "tutorialStage": 0,
  "mode": "male"
}
```

返回：

- `sessionToken`
- `uiState`
- `introEvent`
- `nextTutorialStage`
- `casebookUnlocks`

### `POST /api/game/chat`

请求体：

```json
{
  "sessionToken": "...",
  "questionType": "smalltalk"
}
```

### `POST /api/game/action`

请求体：

```json
{
  "sessionToken": "...",
  "actionType": "sex_condom"
}
```

## 会话机制

Worker 当前不做玩家登录鉴权。

但不是裸传状态。

它使用带签名的 `sessionToken`：

- 前端保存 token
- 每次请求带回旧 token
- Worker 验签后推进状态
- 再返回新 token

这层的作用是：

- 防止前端直接篡改状态
- 保持单局确定性

它不是用户身份系统。

## Cloudflare 部署

### Pages

Pages 发布仓库根目录。

建议配置：

- Production branch: `main`
- Build command: 留空
- Output directory: 仓库根目录

### Worker

Worker 单独接同一个 GitHub 仓库。

建议配置：

- Worker name: `fun-edge-api`
- Production branch: `main`
- Root directory: `worker`
- Deploy command: `npx wrangler deploy`

### 路由

前端按同域 `/api/*` 请求，所以你必须把 Worker 挂到站点域名的 `/api/*`。

例如：

- Pages 域名：`fun.114235.xyz`
- Worker route：`fun.114235.xyz/api/*`

### 必要配置

- Pages 自定义域名已经接好
- Worker route 已绑定到 `/api/*`
- Worker 的 `Root directory` 必须是 `worker`

如果 `Root directory` 配成 `/`，通常会导致 Worker 虽然存在，但 `/api/bootstrap` 仍然是 `404`。

### AI 绑定

[wrangler.jsonc](./worker/wrangler.jsonc) 已经写了：

```jsonc
"ai": {
  "binding": "AI"
}
```

当前使用模型：

- `@cf/zai-org/glm-4.7-flash`

### 建议的 Secret

生产环境至少配一个：

- `SESSION_SECRET`

作用：

- 给 `sessionToken` 签名

## 缓存策略

[ _headers ](./_headers) 当前策略：

- `/assets/*`
  长缓存，`immutable`

- `/content/*`
  `must-revalidate`

- `/`
  `must-revalidate`

- `/*.html`
  `must-revalidate`

这样做的目的：

- JS/CSS 走长期缓存
- 文案 JSON 和 HTML 不走死缓存，方便你改词后尽快生效

## 本地检查

当前项目没有 `package.json`，也没有统一构建步骤。

最基本检查命令：

```bash
node --check assets/game-data.js
node --check assets/game.js
node --check worker/src/game-engine.mjs
node --input-type=module -e "import('./worker/src/index.js')"
node --test tests/game-engine.test.mjs
```

## 我这次实际跑过的验证

这版改动我已经做过这些检查：

- `node --check assets/game-data.js`
- `node --check assets/game.js`
- `node --check worker/src/game-engine.mjs`
- `node --input-type=module -e "import('./worker/src/index.js')"`
- `node --test tests/game-engine.test.mjs`

另外还做过真实 Chrome headless 烟测：

- `390x844`
- `1366x768`

验证项包括：

- 首页启动
- `bootstrap` 握手
- 点击开局
- 进入主界面
- 主操作按钮在视口内

## 后续维护建议

### 如果你只想改词

优先只改：

- [game-copy.json](./content/game-copy.json)

### 如果你只想改布局

优先只改：

- [index.html](./index.html)
- [game.css](./assets/game.css)

### 如果你只想改规则

优先只改：

- [game-engine.mjs](./worker/src/game-engine.mjs)

改规则时尽量不要顺手把文案写回逻辑文件里。

### 如果你想继续降“AI 味”

先做这两件事，而不是继续调模型：

- 砍文案长度
- 保持人物回话只有一句

### 如果你想继续降布局拥挤感

优先砍这些：

- 常驻说明
- 次级按钮
- 重复模块标题
- 按钮副文案

不要先砍：

- 当前对象
- 当前线索
- 主操作按钮

## 许可证

仓库当前未单独声明 License。

如果你后面准备公开分发，建议补一个明确的许可证文件。
