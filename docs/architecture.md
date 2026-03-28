# Cloudflare 架构说明

## 当前落地方式

- Cloudflare Pages：负责托管整个静态站点，直接发布这个仓库的 HTML、CSS、JS 资源。
- Cloudflare Worker：只负责 `/api/*`，现在提供 `GET /api/health` 和 `GET /api/bootstrap`。
- 前端页面：不再把运行时配置写死在页面里，而是优先从 Worker 读取启动配置；以后接 AI 时继续走同一个 `/api/*` 边界。

## 现在的目录职责

- `world/` 和 `world2/`：页面壳，只保留 DOM 结构和第三方脚本引用。
- `shared/world-app.css`：共享 UI 样式。
- `shared/world-app.js`：共享运行时，包含地形生成、输入、节能渲染和自适应降级逻辑。
- `worker/src/index.js`：Worker API 入口。
- `worker/wrangler.jsonc`：Worker 发布配置。
- `_headers`：Pages 静态资源响应头。

## 性能策略

- 前端改成共享运行时，避免每个页面维护一份独立的大体积内联脚本。
- 默认限制活跃帧率，菜单态进一步降帧，隐藏标签页直接暂停渲染。
- 根据设备内存、CPU 核数、粗指针和 `prefers-reduced-motion` 自动降级。
- 低端设备会降低像素比、地形分辨率、物体数量、云层数量，并关闭高成本阴影。
- UI 更新改成节流，避免每帧频繁触发 DOM 写入。

## Pages 部署

1. Pages 项目连接这个仓库。
2. 构建命令可以留空，或者填一个空操作命令。
3. 输出目录直接指向仓库根目录。

## Worker 部署

1. 进入 `worker/` 目录。
2. 用 `wrangler deploy` 发布 Worker。
3. 在 `worker/wrangler.jsonc` 里补上你自己的域名路由，让 Worker 接管 `example.com/api/*`。

## 后续 AI 接入

- 前端继续只请求 `/api/*`，不要直接暴露任何模型密钥。
- AI 相关的密钥、配额控制、日志和风控都放进 Worker。
- 如果后面要接 OpenAI、向量检索或 KV/R2/D1，也都保持在 Worker 这一层扩展，不需要再回头改 Pages 页面结构。
