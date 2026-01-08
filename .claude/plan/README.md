# 📚 项目计划文档总览

> **项目**: 基于 claude-agent-sdk-typescript 的数据库智能体应用
> **技术栈**: Next.js 16 + React 19 + PostgreSQL 17 + Claude SDK
> **预计开发周期**: 7 天

---

## 📖 文档结构

### 🎯 完整计划 (参考)
- **[nextjs-agent-app-v3.md](nextjs-agent-app-v3.md)** - 完整技术计划和代码示例

### 📋 分阶段计划 (实施用)

#### 阶段 1: 项目初始化 (Day 1)
**文件**: [phase1-project-init.md](phase1-project-init.md)

**内容**:
- ✅ 安装核心依赖 (claude-sdk, Drizzle ORM, UI 库)
- ✅ 配置环境变量和 TypeScript
- ✅ Next.js 实验特性配置
- ✅ 路径别名设置

**关键任务**:
```bash
npm install @anthropic-ai/claude-sdk zod dotenv
npm install drizzle-orm postgres
npm install -D drizzle-kit vitest
```

---

#### 阶段 2: 数据库设计 (Day 1-2)
**文件**: [phase2-database-design.md](phase2-database-design.md)

**内容**:
- ✅ Drizzle ORM Schema 定义
- ✅ PostgreSQL 表结构 (users, products, sales, query_history)
- ✅ 数据库连接池配置
- ✅ 迁移文件和种子数据

**核心文件**:
- `db/schema.ts` - 表结构定义
- `lib/database/client.ts` - 数据库客户端
- `db/seed/seed.ts` - 测试数据生成器

---

#### 阶段 3: AI 智能体核心 (Day 2-3)
**文件**: [phase3-agent-core.md](phase3-agent-core.md)

**内容**:
- ✅ Claude SDK 客户端配置
- ✅ 三个核心工具函数
  - execute_sql - SQL 执行 (带安全验证)
  - get_database_schema - 表结构查询
  - analyze_data - 数据分析
- ✅ DatabaseAgent 类 (ReAct 模式)
- ✅ 步骤追踪和消息历史

**核心文件**:
- `lib/agent/claude-client.ts` - SDK 配置
- `lib/agent/tools.ts` - 工具定义
- `lib/agent/database-agent.ts` - 智能体核心

---

#### 阶段 4: Server Actions (Day 3-4)
**文件**: [phase4-server-actions.md](phase4-server-actions.md)

**内容**:
- ✅ 认证工具 (简化版)
- ✅ executeQueryAction - 查询执行和历史保存
- ✅ getQueryHistoryAction - 历史记录查询
- ✅ API 路由 (/api/query)
- ✅ 错误处理和响应格式

**核心文件**:
- `lib/auth.ts` - 认证工具
- `src/lib/actions/query-action.ts` - Server Actions
- `src/app/api/query/route.ts` - API 端点

---

#### 阶段 5: 前端界面 (Day 4-5)
**文件**: [phase5-frontend-ui.md](phase5-frontend-ui.md)

**内容**:
- ✅ ChatInterface - 主聊天界面
- ✅ ReActFlow - 推理过程可视化
- ✅ QueryResult - 结果展示 (表格/JSON)
- ✅ UI 组件 (Button, Textarea)
- ✅ 主页面和布局整合

**核心文件**:
- `src/components/ChatInterface.tsx` - 聊天界面
- `src/components/ReActFlow.tsx` - 可视化组件
- `src/components/QueryResult.tsx` - 结果展示
- `src/app/page.tsx` - 主页面

---

#### 阶段 6: 状态管理与优化 (Day 5-6)
**文件**: [phase6-state-management.md](phase6-state-management.md)

**内容**:
- ✅ useAgent - 智能体状态管理 Hook
- ✅ useDatabase - 数据库操作 Hook
- ✅ useRealtime - 实时状态 Hook (可选)
- ✅ ErrorBoundary - 错误边界组件
- ✅ 错误处理工具和全局错误监听

**核心文件**:
- `src/hooks/useAgent.ts` - 智能体 Hook
- `src/hooks/useDatabase.ts` - 数据库 Hook
- `src/components/ErrorBoundary.tsx` - 错误边界
- `src/lib/utils/error-handler.ts` - 错误处理工具

---

#### 阶段 7: 测试与部署 (Day 6-7)
**文件**: [phase7-testing-deployment.md](phase7-testing-deployment.md)

**内容**:
- ✅ 单元测试 (智能体、工具、组件)
- ✅ 测试配置 (Vitest, React Testing Library)
- ✅ Docker 配置 (Dockerfile, docker-compose)
- ✅ 生产环境配置
- ✅ CI/CD (GitHub Actions)
- ✅ Vercel 部署配置

**核心文件**:
- `*.test.ts` / `*.test.tsx` - 测试文件
- `vitest.config.ts` - 测试配置
- `Dockerfile` - Docker 配置
- `docker-compose.prod.yml` - 生产环境编排
- `.github/workflows/deploy.yml` - CI/CD

---

## 🎯 快速开始

### 1️⃣ 查看完整计划
```bash
cat .claude/plan/nextjs-agent-app-v3.md
```

### 2️⃣ 从阶段 1 开始
```bash
# 阅读阶段 1 计划
cat .claude/plan/phase1-project-init.md

# 按照文档执行任务
# 任务 1.1: 安装依赖
npm install @anthropic-ai/claude-sdk@^0.27.0 zod@^3.24.0 dotenv@^16.4.5 \
            drizzle-orm@^0.38.0 postgres@^3.4.5 \
            next-themes@^0.4.0 lucide-react@^0.468.0 \
            class-variance-authority@^0.7.0 clsx@^2.1.1 tailwind-merge@^2.5.5 \
            -D drizzle-kit@^0.28.0 vitest@^2.1.8 @testing-library/react@^16.1.0
```

### 3️⃣ 逐步推进
每个阶段完成后，继续下一个阶段：
- ✅ 阶段 1 → 阶段 2 → 阶段 3 → 阶段 4 → 阶段 5 → 阶段 6 → 阶段 7

---

## 📊 任务总览

| 阶段 | 任务数 | 预计时间 | 核心技术 | 状态 |
|------|--------|----------|----------|------|
| 1. 项目初始化 | 2 | 0.5天 | npm, TypeScript | ⏳ |
| 2. 数据库设计 | 3 | 1天 | Drizzle ORM, PostgreSQL | ⏳ |
| 3. AI 智能体核心 | 3 | 1.5天 | Claude SDK, ReAct | ⏳ |
| 4. Server Actions | 2 | 1天 | Server Actions, API | ⏳ |
| 5. 前端界面 | 4 | 1.5天 | React 19, Tailwind | ⏳ |
| 6. 状态管理 | 2 | 0.5天 | Hooks, Error Boundaries | ⏳ |
| 7. 测试部署 | 2 | 1天 | Vitest, Docker | ⏳ |

**总计**: 18 个原子任务，7 天开发周期

---

## 🔑 核心概念

### ReAct 模式
```
用户查询 → Thought → Action (工具调用) → Observation → Final Answer
```

### 工具函数
1. **execute_sql**: 执行 SELECT 查询 (安全验证)
2. **get_database_schema**: 获取表结构
3. **analyze_data**: 数据统计分析

### 数据流
```
用户输入 → Server Action → DatabaseAgent → 工具调用 → 数据库
         ↓
   历史记录保存 → Drizzle ORM → PostgreSQL
         ↓
   返回结果 → UI 展示 (ReAct 可视化)
```

---

## 🛠️ 开发工作流

### 每个阶段的通用流程

1. **阅读计划文档**
   ```bash
   cat .claude/plan/phaseX-*.md
   ```

2. **执行任务**
   - 按照文档中的步骤创建文件
   - 复制代码片段
   - 运行命令

3. **验证**
   ```bash
   # 检查 TypeScript
   npx tsc --noEmit

   # 运行开发服务器
   npm run dev

   # 运行测试 (如果适用)
   npm run test:run
   ```

4. **记录进度**
   - 更新任务状态
   - 记录实现细节

---

## 📝 文档使用指南

### 如果你是初学者
1. 从 **[nextjs-agent-app-v3.md](nextjs-agent-app-v3.md)** 开始，了解整体架构
2. 按顺序执行 1-7 阶段
3. 遇到问题查看对应阶段的常见问题部分

### 如果你有经验
1. 直接查看 **[QUICKSTART.md](../QUICKSTART.md)** 快速开始
2. 按需跳转到特定阶段
3. 使用 `.spec-workflow/specs/nextjs-db-agent/tasks.md` 跟踪进度

### 如果你想深入了解
1. 阅读 **[claude-agent-sdk-learning.md](claude-agent-sdk-learning.md)** 学习 SDK
2. 查看每个阶段的详细代码示例
3. 研究测试文件了解最佳实践

---

## 🎓 学习资源

### 必须掌握
- ✅ claude-agent-sdk-typescript 基础
- ✅ ReAct 模式原理
- ✅ Next.js Server Actions
- ✅ Drizzle ORM 使用

### 推荐学习
- React 19 新特性 (useOptimistic, useTransition)
- PostgreSQL 17 新特性
- Docker 容器化部署
- Vitest 测试框架

---

## 📞 获取帮助

### 文档内帮助
每个阶段文档都包含：
- ✅ 详细实施步骤
- ✅ 常见问题解答
- ✅ 验收标准
- ✅ 完成检查清单

### 额外资源
- **完整计划**: `nextjs-agent-app-v3.md` - 包含所有代码示例
- **SDK 学习**: `claude-agent-sdk-learning.md` - SDK 详细指南
- **任务列表**: `.spec-workflow/specs/nextjs-db-agent/tasks.md` - 原子任务

---

## 🚀 开始开发

### 推荐路径

**新手**:
```
完整计划 → 阶段1 → 阶段2 → 阶段3 → 阶段4 → 阶段5 → 阶段6 → 阶段7
```

**有经验**:
```
快速开始 → 按需选择阶段 → 完成任务
```

**只想了解**:
```
完整计划 → SDK 学习 → 选择感兴趣的部分
```

---

## 📅 时间规划

| 天数 | 阶段 | 重点任务 |
|------|------|----------|
| Day 1 | 1-2 | 环境搭建 + 数据库设计 |
| Day 2-3 | 3 | AI 智能体核心实现 |
| Day 3-4 | 4 | Server Actions 和 API |
| Day 4-5 | 5 | 前端界面开发 |
| Day 5-6 | 6 | 状态管理和优化 |
| Day 6-7 | 7 | 测试和部署 |

---

## ✅ 完成标准

### 功能完整
- [ ] 自然语言查询正常工作
- [ ] ReAct 过程正确显示
- [ ] 数据库操作安全
- [ ] 历史记录完整
- [ ] UI 交互流畅

### 代码质量
- [ ] TypeScript 严格模式
- [ ] 测试覆盖率 > 80%
- [ ] 无安全漏洞
- [ ] 文档完整

### 生产就绪
- [ ] Docker 部署成功
- [ ] CI/CD 通过
- [ ] 健康检查正常
- [ ] 错误处理完善

---

**文档版本**: v1.0
**创建时间**: 2026-01-08
**状态**: ✅ 所有阶段规划完成

---

## 🎉 下一步

选择你的起点：
1. **开始实施**: 从 [phase1-project-init.md](phase1-project-init.md) 开始
2. **查看完整计划**: [nextjs-agent-app-v3.md](nextjs-agent-app-v3.md)
3. **快速开始**: [../QUICKSTART.md](../QUICKSTART.md)
4. **任务跟踪**: [.spec-workflow/specs/nextjs-db-agent/tasks.md](../.spec-workflow/specs/nextjs-db-agent/tasks.md)

**准备好开始了吗？** 🚀
