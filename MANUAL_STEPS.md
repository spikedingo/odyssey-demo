# Odyssey 项目 — 手动步骤指南

> 本文档说明 Agent 无法代你完成的事项，以及如何在本地端到端运行与验证项目。  
> 最后审计时间：2026-05-29（已对照代码库、`pnpm lint/typecheck/test` 及业务规则 curl 实测）。

---

## 项目当前状态

**一句话**：核心 monorepo（Wave 0–5）已实现并可本地运行；自动化检查（lint / typecheck / test）与后端业务规则均已通过，但 Git 提交、生产部署、视觉 QA 及部分 polish 项仍需你手动完成。

**已完成 Wave 列表**：

| Wave | 规格 | 状态 |
|------|------|------|
| 0 | 00 Foundation & Monorepo | ✅ 完成 |
| 1 | 01 Design System & UI Library | ✅ 核心完成（部分 polish 待做） |
| 1 | 02 Backend Data Model & API | ✅ 完成 |
| 2 | 04 Contract Pipeline | ✅ 完成 |
| 3 | 03 Frontend Pages | ✅ 五页可用（结构与 spec 命名不完全一致） |
| 4 | 05 Testing & DX | ✅ 核心测试通过（覆盖率未达 spec 全量） |
| 5 | 06 Deployment & Delivery | ⚠️ 脚本与 README 已有，**生产部署未验证** |

---

## 仍需你手动完成的事项

### Must-do（首次本地运行必做）

| 事项 | 说明 |
|------|------|
| 安装前置依赖 | Node.js **20+**、pnpm **9+**、Docker Desktop（若用本地 Postgres） |
| 复制环境变量 | 首次克隆后执行（`.env` 已被 gitignore，不会随仓库下发）：<br>`cp services/backend/.env.example services/backend/.env`<br>`cp apps/dashboard/.env.example apps/dashboard/.env` |
| 选择数据库方案 | **Docker（默认）**：`pnpm db:up`<br>**Neon（云 Postgres）**：在 [neon.tech](https://neon.tech) 创建项目，将连接串写入 `services/backend/.env` 的 `DATABASE_URL`（加 `?sslmode=require`），**跳过** `pnpm db:up`。详见 `services/backend/README.md` |
| 初始化数据库 | `pnpm db:migrate` → `pnpm seed`（seed 幂等，可重复执行） |
| 生成 API Client | **`pnpm gen:contract` 必须手动运行** — `packages/api-client/src/generated/` 与根目录 `openapi.json` 均在 gitignore 中，克隆后不存在，不运行则 dashboard 无法编译 |
| 双终端启动 | 终端 1：`pnpm dev:backend`（:8787）<br>终端 2：`pnpm dev:dashboard`（Expo Web，通常 :8081） |
| 浏览器验证 | 打开 http://localhost:8081，逐页点击 Home / Orders / CRM / Menu / Settings，确认数据加载正常 |

> **以下自动化项无需操作**（本次审计已通过）：`pnpm lint`、`pnpm typecheck`、`pnpm test`、后端 migrate/seed、业务规则 curl（见下文）。

### Must-do（作业提交）

| 事项 | 说明 |
|------|------|
| **Git 初始化与推送** | 当前仓库文件均为 **untracked**，且无 remote。你需要：<br>1. `git add` + `git commit`<br>2. 创建 GitHub 仓库并 `git push`<br>3. 确保 `.env`、`openapi.json`、`packages/api-client/src/generated/` **未被提交** |
| 提交说明文档 | 作业要求：本地运行说明（README 已有）、seed 说明、架构决策简述、已知权衡。README 已覆盖大部分；你可补充链接到 `specs/06-deployment-delivery/spec.md` 中的 6 条 ADR |
| 端到端演示 | 建议录制 Loom 或准备 live demo：创建订单 → 接受 → 查看 Home KPI 变化 |

### Optional（Polish / 规格差距，不影响本地核心流程）

| 事项 | 当前状态 |
|------|----------|
| Settings 营业时间 UI | ❌ 未实现 — 页面显示「Opening hours configured in backend seed (JSON)」，仅 seed 中有数据，无法在 UI 编辑 |
| CRM「添加客户」 | ❌ 列表页无创建入口（后端 API 已有） |
| Dashboard 顶栏主题/密度切换 | ❌ 仅在 `/ui-library` 可切换；主应用 Sidebar 无 toggle |
| 404 页面 | ❌ 无 `+not-found.tsx` |
| 独立 `screens/` / `hooks/` 目录 | ❌ 逻辑内联在 route 文件中（功能已有，结构与 `tasks.md` 命名不一致） |
| UI Library 完整 showcase | ⚠️ 部分 section 已实现，未覆盖 spec 全部组件状态 |
| Dark theme 全页 polish | ⚠️ 主题系统可用，constitution 标注为可 defer 的 polish 项 |
| KPI 趋势箭头 | ✅ 已实现（Home 页 today vs yesterday） |
| 生产部署 | ⚠️ 脚本存在但未实测（见「部署」章节） |
| `tasks.md` 复选框同步 | ⚠️ 大量已实现项仍为 `[ ]`（见文末审计表） |
| README 补全 | ⚠️ 缺「Running Tests」专节、ADR 直链、Evaluation Criteria 映射表 |
| 测试覆盖率扩展 | ⚠️ spec 05 中许多边界用例测试未写，但现有 15 个测试已通过 |

### Assignment submission checklist

- [ ] GitHub 仓库 URL
- [ ] README + 本文件（`MANUAL_STEPS.md`）作为运行指南
- [ ] 架构决策：引用 `specs/06-deployment-delivery/spec.md` ADR-001 ~ ADR-006
- [ ] 已知权衡：README「Known Tradeoffs」+ 上文 Optional 列表
- [ ] （可选）Loom 演示视频

---

## 本地运行（逐步命令，可复制）

### Prerequisites

```bash
node -v    # 需要 v20+
pnpm -v    # 需要 v9+
docker -v  # 若使用 Docker Postgres
```

### First-time setup

```bash
cd /Users/spikedingo/odyssey-demo

# 1. 安装依赖
pnpm install

# 2. 环境变量（若 .env 不存在）
cp services/backend/.env.example services/backend/.env
cp apps/dashboard/.env.example apps/dashboard/.env

# 3. 启动 Postgres（Docker 方案；Neon 用户跳过）
pnpm db:up

# 4. 建表 + 种子数据
pnpm db:migrate
pnpm seed

# 5. 生成 API Client（fresh clone 必做）
pnpm gen:contract
```

**环境变量说明**：

| 文件 | 变量 | 默认值 |
|------|------|--------|
| `services/backend/.env` | `DATABASE_URL` | `postgresql://odyssey:odyssey@localhost:5432/odyssey` |
| `apps/dashboard/.env` | `EXPO_PUBLIC_API_BASE_URL` | `http://localhost:8787` |

> API 路径前缀为 `/api/v1`（由 Orval 生成 hook 自动拼接），`EXPO_PUBLIC_API_BASE_URL` **不要**包含 `/api/v1`。

### Daily dev（两个终端）

```bash
# 终端 1 — 后端 API
pnpm dev:backend
# → http://localhost:8787/health 应返回 200

# 终端 2 — 前端 Dashboard
pnpm dev:dashboard
# → 浏览器打开 http://localhost:8081
# → Sidebar：Home / Orders / CRM / Menu / Settings / UI Library
```

### Regenerate contracts when API changes

后端路由或 Zod schema 变更后：

```bash
pnpm gen:contract
# 等价于：build:openapi → orval generate → api-client typecheck
```

然后重启 `pnpm dev:dashboard`（如 hook 签名变化）。

---

## 测试与验证

### 自动化命令

```bash
# 全量
pnpm lint
pnpm typecheck
pnpm test

# 分项
pnpm test:backend    # Vitest，9 tests
pnpm test:frontend   # Jest，6 tests

# 测试库准备（首次或 Docker 重建后）
pnpm db:up
pnpm db:setup-test   # 创建 odyssey_test 数据库
pnpm test:backend
```

测试库连接：`postgresql://odyssey:odyssey@localhost:5432/odyssey_test`（Vitest setup 自动使用，可通过 `TEST_DATABASE_URL` 覆盖）。

### 后端业务规则 — 手动 curl 示例

> 前提：`pnpm dev:backend` 已运行且已 `pnpm seed`。  
> 所有 API 路径前缀：**`/api/v1`**（不是根路径）。

Seed 参考 ID（运行 seed 后一般稳定）：

- 不可用菜品：`menu_item_id=4`（Seaweed Salad）
- 可用菜品：`menu_item_id=7`（Beef Ramen，1650 cents）
- 待处理订单：`order_id=15`（status=pending）

```bash
BASE=http://localhost:8787/api/v1

# 1. 健康检查
curl -s $BASE/../health
# 或 curl -s http://localhost:8787/health

# 2. Home 汇总
curl -s $BASE/home/summary | python3 -m json.tool

# 3. 不可用菜品 → 422 ITEM_UNAVAILABLE
curl -s -X POST $BASE/orders \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"menu_item_id":4,"quantity":1}],"total_cents":750}'

# 4. 金额不匹配 → 422 TOTAL_MISMATCH
curl -s -X POST $BASE/orders \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"menu_item_id":7,"quantity":1}],"total_cents":999}'

# 5. 合法状态转换 pending → accepted → 200
curl -s -X PATCH $BASE/orders/15/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"accepted"}'

# 6. 非法转换 pending → completed → 422 INVALID_TRANSITION
#    （若 order 15 已被接受，先 seed 重置：pnpm seed）
curl -s -X PATCH $BASE/orders/15/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"completed"}'

# 7. 按状态筛选
curl -s "$BASE/orders?status=pending&limit=5"
```

### 前端手动冒烟测试

1. **Home**：KPI 卡片有数据；Recent Orders 表格可点击跳转
2. **Orders**：状态筛选写入 URL（如 `?status=pending`）；刷新后筛选保留；New Order → 提交 → toast + 跳转详情
3. **Orders 详情**：pending 订单可 Accept；badge 更新
4. **CRM**：搜索过滤；点击行进入详情
5. **Menu**：创建/编辑/删除菜品；不可用项显示 dimmed
6. **Settings**：修改餐厅名 → Save → toast
7. **UI Library**（`/ui-library`）：主题与密度切换

---

## 部署（脚本已有，**生产环境未完全验证**）

### Backend — Cloudflare Workers

```bash
# 1. 复制部署凭证模板（勿提交真实值）
cp .env.deploy.example .env.deploy

# 2. 登录 Cloudflare（或 export CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID）
# 3. 设置生产数据库 Secret（Neon 推荐）
cd services/backend
wrangler secret put DATABASE_URL
# 粘贴 Neon 生产连接串

# 4. 部署
pnpm deploy:backend
# 或 cd services/backend && wrangler deploy

# 5. 对生产库 migrate + seed（从本地执行，指向生产 DATABASE_URL）
DATABASE_URL='postgresql://...neon...' pnpm db:migrate
DATABASE_URL='postgresql://...neon...' pnpm seed
```

**注意**：当前 `services/backend/package.json` 的 deploy 脚本是 `wrangler deploy`（非 `--env production`）；`wrangler.toml` 中 `[env.production]` 段已存在但未在脚本中使用。

### Frontend — 静态导出

```bash
# 构建前设置生产 API 地址
# apps/dashboard/.env:
# EXPO_PUBLIC_API_BASE_URL=https://<your-worker>.workers.dev

pnpm deploy:frontend
# 实际执行 expo export → apps/dashboard/dist/
```

**手动步骤（当前脚本未包含）**：将 `dist/` 部署到 Cloudflare Pages 或其他静态托管：

```bash
wrangler pages deploy apps/dashboard/dist --project-name odyssey-dashboard
```

### 部署环境变量清单

| 变量 | 用途 | 设置方式 |
|------|------|----------|
| `DATABASE_URL` | Workers 连接 Postgres | `wrangler secret put DATABASE_URL` |
| `CLOUDFLARE_ACCOUNT_ID` | Wrangler 认证 | `.env.deploy` 或 CI secret |
| `CLOUDFLARE_API_TOKEN` | Wrangler 认证 | `.env.deploy` 或 CI secret |
| `EXPO_PUBLIC_API_BASE_URL` | 前端构建时 API 地址 | `apps/dashboard/.env`（build 前） |

---

## 常见问题

### Port 5432 冲突

```bash
# 查看占用
lsof -i :5432

# 若已有其他 Postgres，可：
# A) 停掉冲突容器/服务
# B) 改用 Neon 云数据库（改 DATABASE_URL，跳过 db:up）
# C) 修改 docker-compose.yml 端口映射（如 5433:5432），同步更新 .env
```

### 后端 8787 端口被占用

```bash
lsof -i :8787
kill <PID>
# 或 wrangler dev 换端口：cd services/backend && wrangler dev --port 8788
# 同时更新 apps/dashboard/.env 中的 EXPO_PUBLIC_API_BASE_URL
```

### `pnpm gen:contract` 失败

1. 确认 `services/backend` 可 typecheck：`pnpm --filter=backend typecheck`
2. 确认后端依赖已安装
3. 检查根目录是否生成 `openapi.json`（gitignored，生成后应存在）

### Dashboard 空白 / API 报错

1. 确认 `pnpm dev:backend` 运行中：`curl http://localhost:8787/health`
2. 确认 `apps/dashboard/.env` 中 `EXPO_PUBLIC_API_BASE_URL=http://localhost:8787`
3. 确认已 `pnpm seed`（否则页面可能 empty）
4. 确认已 `pnpm gen:contract`

### `pnpm test:backend` 失败

```bash
pnpm db:up
pnpm db:setup-test
pnpm test:backend
```

### curl 返回 404

API 业务路由在 **`/api/v1/*`**，不是 `/orders` 或 `/home/summary`。  
OpenAPI 文档：`http://localhost:8787/api/openapi.json`

### Docker Postgres 不健康

```bash
docker compose logs postgres
pnpm db:down && pnpm db:up
# 等待 healthcheck 通过后再 migrate
```

---

## tasks.md 同步说明

> **原则**：`tasks.md` 复选框反映 spec 文件级 checklist，**不等于**运行时验证。大量功能已实现但 checkbox 未更新（Agent 未同步勾选）。下表为 2026-05-29 审计结果。

| Spec | 文件 | 已勾选 | 未勾选 | 未勾选主要原因 |
|------|------|--------|--------|----------------|
| 00 | `specs/00-foundation-monorepo/tasks.md` | 38 | 0 | 全部完成 ✅ |
| 01 | `specs/01-design-system-ui-library/tasks.md` | 39 | 36 | 代码结构与 spec 路径不同（如 `layout.ts` 合并 radii/borders/shadows；组件在 `Navigation.tsx`）；UI Library 部分 section 未做 |
| 02 | `specs/02-backend-data-api/tasks.md` | 82 | 1 | 仅 `src/openapi.ts` 未单独创建（逻辑在 `index.ts`） |
| 03 | `specs/03-frontend-pages/tasks.md` | 23 | 45 | 功能内联在 route 文件，未拆 `screens/`/`hooks/`；缺 opening hours UI、CRM 创建、404、header toggles |
| 04 | `specs/04-contract-pipeline/tasks.md` | 37 | 1 | 未跑 `swagger-cli validate` |
| 05 | `specs/05-testing-dx/tasks.md` | 24 | 43 | 核心测试已通过，但 spec 列出的边界用例/UI 组件测试大多未写 |
| 06 | `specs/06-deployment-delivery/tasks.md` | 35 | 11 | README 缺 ADR 链接/Eval 映射；生产 deploy 未 dry-run；backend deploy 脚本未用 `--env production` |

**本次未修改任何 `tasks.md` 复选框** — 若需同步，建议按上表「已实现且有代码证据」逐项勾选，而非批量全选。

---

## 快速参考：根目录脚本

| 命令 | 用途 |
|------|------|
| `pnpm dev:dashboard` | Expo Web 前端 |
| `pnpm dev:backend` | Hono/Wrangler 后端 (:8787) |
| `pnpm gen:contract` | OpenAPI 导出 + Orval 生成 hooks |
| `pnpm db:up` / `db:down` | Docker Postgres |
| `pnpm db:migrate` | Drizzle 迁移 |
| `pnpm db:setup-test` | 创建测试库 |
| `pnpm seed` | 种子数据（幂等） |
| `pnpm lint` / `typecheck` / `test` | 质量门禁 |
| `pnpm deploy:backend` | Wrangler 部署后端 |
| `pnpm deploy:frontend` | Expo 静态导出 |
