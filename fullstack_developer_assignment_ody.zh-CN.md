# 全栈开发工程师作业 — Odyssey

## 目标

使用与 Odyssey 相同的栈和架构方式，构建一个小型全栈餐厅运营产品。

你不需要在我们现有的代码库中工作。你应该从零创建自己的项目，但需遵循相同的核心栈、结构和工程标准。

我们将评估前端质量、后端设计、类型安全、架构、用户体验以及执行速度。

## AI 优先的期望

本作业预期将大量借助 AI 工具完成。

你可以自由使用 AI 进行规划、实现、调试、测试和打磨。我们不仅评估最终结果，还会评估你使用 AI 的能力：设定良好的约束、清晰引导、批判性审查输出，并保持实现整洁、连贯。

最终质量仍会体现你对代码、架构和产品思维的实际理解程度。泛泛而谈或集成不佳的 AI 生成代码将是负面信号。

## 时间限制

目标：1–2 天。

我们同样看重范围判断能力，而非仅看完成度。

## 必需技术栈

使用以下技术栈：

- pnpm workspace + Turborepo
- `apps/dashboard`：Expo + React Native + Web
- `services/backend`：Cloudflare Workers 上的 Hono
- PostgreSQL + Drizzle ORM
- drizzle-zod
- OpenAPI 生成
- Orval 生成的 client/hooks
- React Query
- 用于 UI/工具/类型的共享 packages

仓库结构大致如下：

```text
apps/dashboard
services/backend
packages/shared
packages/types
packages/api-client
```

不要用 Next.js、NestJS、Prisma、tRPC、Supabase、Firebase 或手写的前端 API 类型等替代方案替换上述栈。

## 第一部分 — 设计系统与 Dashboard

构建一个精致、可复用的设计系统，并在此基础上搭建餐厅 Dashboard。

设计系统至少应包含：

- 颜色 token
- typography（字体排版）
- 间距 scale
- 圆角、边框、阴影和 elevation
- 布局/网格规则
- 语义化状态
- loading、empty、success、warning 和 error 模式

还需包含一个专门的 UI 库页面/路由，展示：

- token
- typography
- spacing
- surfaces（表面/容器样式）
- 可复用组件
- 组件状态

至少构建以下可复用基础组件：

- 按钮
- 输入框和表单控件
- 选择器/下拉菜单
- 模态框/对话框
- 卡片/表面
- 表格/列表
- 徽章/状态指示器
- 导航元素
- 骨架屏/加载状态
- 反馈/Toast 模式

构建以下 5 个 Dashboard 页面：

- Home（首页）
- Settings（设置）
- CRM
- Orders（订单）
- Menu（菜单）

前端期望：

- 强烈的视觉一致性
- 清晰的层级和间距
- 可交互的流程，而非静态页面
- 通过模态框或抽屉实现编辑/创建流程
- hover、focus、active、disabled 状态
- 精心设计的 empty/error/loading 状态
- 真实的产品感

Dashboard 必须在 Web 上运行。原生端就绪是加分项，非必需。

## 第二部分 — 后端点餐系统

构建真实的、由后端驱动的点餐功能切片，为 Dashboard 提供数据支持。

至少支持：

- 菜单分类和菜单项
- 客户记录
- 订单和订单项
- 与点餐相关的业务设置

产品应支持以下流程：

- 从 Dashboard 管理菜单项
- 创建订单
- 列出和筛选订单
- 查看订单详情
- 通过合法操作更新订单状态
- 在 CRM 中查看客户及其订单历史/消费
- 更新与点餐相关的设置
- 在 Home 展示汇总数据

推荐的页面行为：

- Home：KPI，如总订单数、营收、待处理订单、热门菜品
- Orders：列表、筛选、详情视图、状态操作
- CRM：客户列表、订单数、消费、最近订单
- Menu：分类、菜品、价格、可用性
- Settings：备餐时间、自动接单、服务可用性、营业时间等

后端期望：

- 校验必填字段
- 拒绝无效的订单 payload
- 拒绝不可用的菜单项
- 在服务端计算或校验总价
- 强制执行合法的订单状态流转
- 返回清晰的、带类型的 request/response 结构

不要将状态更新做成松散的、由客户端随意控制的字段变更。应展示有意设计的后端行为。

提供 seed 数据或 bootstrap 流程，便于本地评审。

## 架构规则

这一点非常重要。我们评估的是你如何构建，而不仅仅是能否跑通。

实现应遵循以下流程：

```text
Drizzle schema -> drizzle-zod -> Hono/OpenAPI -> Orval -> generated frontend types/hooks
```

要求：

- 持久化数据的真相源始于 Drizzle schema
- API 契约由生成得到，而非手动重复维护
- 前端 API 类型仅来自生成/共享类型
- 前端数据获取使用生成的 hooks
- 展示型组件专注于 UI
- 业务逻辑放在 hooks/services/backend，而非大型 page 组件中
- 可复用的 UI 模式沉淀为共享组件
- 设计 token 集中管理，而非散落各处

避免：

- 为后端数据手写前端 DTO
- 在前端和后端重复定义 enums/状态类型
- 以 direct raw fetch 作为主要应用模式
- 手改生成的 API 产物
- 将大部分逻辑直接写在 screen/page 组件内

## 测试与开发体验（DX）

我们不需要 exhaustive（穷尽式）的测试覆盖，但期望有工程纪律。

包含：

- 针对关键订单流程的后端测试
- 至少一些针对重要逻辑或 UI 状态的前端测试
- 清晰的本地开发脚本

仓库应暴露如下脚本：

```bash
pnpm dev:dashboard
pnpm dev:backend
pnpm gen:contract
pnpm lint
pnpm typecheck
pnpm test
```

## 交付物

提交：

- GitHub 仓库
- 本地运行说明
- 数据 seed 说明
- 架构决策的简短说明
- 关于权衡或未完成功能的简短说明

可选：

- 简短的 Loom 演示视频

## 评估标准

我们将评估：

- 对必需技术栈的遵循程度
- 设计系统的质量与可扩展性
- 组件可复用性与前端结构
- 视觉打磨与 UX 质量
- 后端建模与 API 设计
- 类型安全与契约纪律
- 端到端集成质量
- 测试与工程严谨性
- 速度、专注度与范围管理
