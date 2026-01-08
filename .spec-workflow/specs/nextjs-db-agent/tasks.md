# Next.js 数据库智能体应用 - 任务分解

## 项目概述
基于 claude-agent-sdk-typescript 的 Next.js 数据库智能体应用，支持 ReAct 模式推理和 PostgreSQL 数据库操作。

---

## 阶段 1: 项目初始化与依赖安装

### 任务 1.1: 安装核心依赖
- **文件**: `package.json`
- **目的**: 安装所有必需的依赖包
- **_Leverage**: 现有的 Next.js 16 + React 19 项目结构
- **_Requirements**: 1.1, 3.1
- **_Prompt**:
  Role: DevOps Engineer specializing in Node.js package management
  Task: Install all required dependencies for the database agent project following the v3.0 plan, including claude-agent-sdk-typescript, database libraries, and UI components
  Restrictions: Must use exact versions specified in plan, avoid installing unnecessary packages, ensure peer dependency compatibility
  Success: All packages install without errors, package.json reflects correct versions, no security vulnerabilities in dependencies
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

### 任务 1.2: 配置环境变量和 TypeScript
- **Files**: `.env.local`, `tsconfig.json`, `next.config.ts`
- **目的**: 设置开发环境和类型系统
- **_Leverage**: 现有的 Next.js 配置
- **_Requirements**: 1.2
- **_Prompt**:
  Role: Full-stack Developer with expertise in TypeScript and Next.js configuration
  Task: Configure environment variables, TypeScript strict mode, and Next.js experimental features following plan section 1.2
  Restrictions: Must enable strict TypeScript checks, configure server actions body size limit, enable PPR (Partial Prerendering)
  Success: TypeScript compiles without errors, environment variables are properly typed, Next.js config matches plan specifications
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

---

## 阶段 2: 数据库设计与实现

### 任务 2.1: 创建 Drizzle ORM Schema
- **Files**: `db/schema.ts`, `db/relations.ts`
- **目的**: 定义数据库表结构和关系
- **_Leverage**: PostgreSQL 17, Drizzle ORM
- **_Requirements**: 2.1
- **_Prompt**:
  Role: Database Architect with expertise in PostgreSQL and Drizzle ORM
  Task: Create comprehensive Drizzle ORM schema for users, products, sales, and query_history tables with proper relationships and constraints
  Restrictions: Must use UUID primary keys, proper foreign key relationships, JSONB for complex data, timestamps with defaults
  Success: All tables defined correctly, relationships are properly typed, schema matches plan specifications exactly
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

### 任务 2.2: 实现数据库客户端和连接池
- **Files**: `lib/database/client.ts`
- **目的**: 配置 PostgreSQL 连接和 Drizzle 实例
- **_Leverage**: Drizzle ORM, postgres-js
- **_Requirements**: 2.2
- **_Prompt**:
  Role: Backend Infrastructure Engineer
  Task: Implement database client with connection pooling and Drizzle ORM integration following plan specifications
  Restrictions: Must configure connection limits, idle timeout, and max lifetime properly, ensure proper error handling
  Success: Database connection works correctly, connection pooling is configured, Drizzle instance is properly exported
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

### 任务 2.3: 创建数据库迁移和种子数据
- **Files**: `db/migrations/`, `db/seed/`
- **目的**: 设置数据库迁移和测试数据
- **_Leverage**: Drizzle Kit
- **_Requirements**: 2.3
- **_Prompt**:
  Role: Database Migration Specialist
  Task: Generate Drizzle migrations and create seed data generator for testing
  Restrictions: Must generate proper SQL migrations, seed data should be realistic and comprehensive
  Success: Migrations apply successfully, seed data populates all tables correctly
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

---

## 阶段 3: claude-agent-sdk-typescript 核心实现

### 任务 3.1: 配置 Claude SDK 客户端
- **Files**: `lib/agent/claude-client.ts`
- **目的**: 初始化 Anthropic SDK 和模型配置
- **_Leverage**: @anthropic-ai/claude-sdk
- **_Requirements**: 3.1
- **_Prompt**:
  Role: AI Integration Engineer
  Task: Configure Claude SDK client with proper API key handling and model selection (claude-3-5-sonnet-20241022)
  Restrictions: Must validate API key exists, configure proper timeout and retry settings
  Success: SDK client is properly initialized, model is correctly configured, ready for agent implementation
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

### 任务 3.2: 实现数据库工具函数
- **Files**: `lib/agent/tools.ts`
- **目的**: 定义 execute_sql, get_database_schema, analyze_data 三个工具
- **_Leverage**: Zod validation, Drizzle ORM
- **_Requirements**: 3.2
- **_Prompt**:
  Role: AI Tools Developer with expertise in function calling and validation
  Task: Implement three database tools with proper input schemas, security validation, and error handling
  Restrictions: SQL tool must only allow SELECT queries, block dangerous keywords, validate all inputs with Zod
  Success: All three tools work correctly, security validation prevents SQL injection, proper error messages returned
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

### 任务 3.3: 创建 DatabaseAgent 智能体类
- **Files**: `lib/agent/database-agent.ts`
- **目的**: 实现 ReAct 模式的智能体核心逻辑
- **_Leverage**: claude-agent-sdk-typescript, tools.ts
- **_Requirements**: 3.3
- **_Prompt**:
  Role: AI Agent Architect with expertise in ReAct patterns and LLM orchestration
  Task: Implement DatabaseAgent class with ReAct loop, tool calling, message history management, and step tracking
  Restrictions: Must implement 10-step ReAct loop, handle tool results properly, track all steps for visualization
  Success: Agent executes queries correctly, maintains conversation history, returns complete ReAct trace with steps
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

---

## 阶段 4: Server Actions 与 API

### 任务 4.1: 实现查询执行 Server Action
- **Files**: `src/lib/actions/query-action.ts`
- **目的**: 创建 executeQueryAction 和 getQueryHistoryAction
- **_Leverage**: DatabaseAgent, Drizzle ORM, authentication
- **_Requirements**: 4.1
- **_Prompt**:
  Role: Next.js Server Actions Developer
  Task: Implement server actions for query execution and history retrieval with proper authentication and error handling
  Restrictions: Must use 'use server' directive, validate user session, save execution results to database
  Success: Server actions work correctly, authentication is enforced, query history is properly persisted
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

### 任务 4.2: 创建 API 路由端点
- **Files**: `src/app/api/query/route.ts`
- **目的**: 提供 REST API 接口
- **_Leverage**: Next.js App Router, DatabaseAgent
- **_Requirements**: 4.2
- **_Prompt**:
  Role: API Developer with expertise in Next.js App Router
  Task: Create POST /api/query endpoint with proper request validation, authentication, and error responses
  Restrictions: Must validate request body, handle authentication errors, return proper HTTP status codes
  Success: API endpoint works correctly, proper error handling, matches plan specifications
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

---

## 阶段 5: React 19 前端界面

### 任务 5.1: 创建聊天界面组件
- **Files**: `src/components/ChatInterface.tsx`
- **目的**: 实现主聊天界面，支持乐观更新和实时交互
- **_Leverage**: React 19 hooks (useOptimistic, useTransition), Server Actions
- **_Requirements**: 5.1
- **_Prompt**:
  Role: React 19 Frontend Developer
  Task: Create ChatInterface component with optimistic updates, useTransition for async operations, and real-time message display
  Restrictions: Must use React 19 new hooks, handle loading states properly, display ReAct trace and SQL
  Success: Component renders correctly, optimistic updates work, loading states are smooth, all data displays properly
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

### 任务 5.2: 实现 ReAct 过程可视化组件
- **Files**: `src/components/ReActFlow.tsx`
- **目的**: 可视化展示思考-行动-观察的推理链条
- **_Leverage**: Lucide icons, collapsible sections
- **_Requirements**: 5.2
- **_Prompt**:
  Role: UI/UX Developer with expertise in data visualization
  Task: Create ReActFlow component with expandable steps, icons for thought/action/observation, and clear visual hierarchy
  Restrictions: Must support collapsible sections, display all three ReAct components (Thought, Action, Observation), use proper styling
  Success: Component visualizes ReAct process clearly, steps are expandable/collapsible, all data is readable
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

### 任务 5.3: 创建查询结果展示组件
- **Files**: `src/components/QueryResult.tsx`
- **目的**: 以表格和 JSON 格式展示查询结果，支持导出
- **_Leverage**: React state management, CSV export
- **_Requirements**: 5.3
- **_Prompt**:
  Role: Frontend Data Visualization Developer
  Task: Create QueryResult component with table/JSON view toggle, CSV export functionality, and responsive design
  Restrictions: Must handle empty data states, support both view modes, implement proper CSV export
  Success: Component displays data correctly, view switching works, CSV export generates valid files
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

### 任务 5.4: 创建主页面和布局
- **Files**: `src/app/page.tsx`, `src/app/layout.tsx`
- **目的**: 整合所有组件到主页面
- **_Leverage**: ChatInterface, ErrorBoundary, themes
- **_Requirements**: 5.4
- **_Prompt**:
  Role: Next.js Full-stack Developer
  Task: Update main page and layout to integrate ChatInterface with proper error boundaries and styling
  Restrictions: Must use proper layout structure, integrate error boundaries, ensure responsive design
  Success: Main page renders correctly, all components are properly integrated, styling matches design
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

---

## 阶段 6: 状态管理与优化

### 任务 6.1: 实现自定义 Hooks
- **Files**: `src/hooks/useAgent.ts`, `src/hooks/useDatabase.ts`
- **目的**: 封装智能体和数据库操作逻辑
- **_Leverage**: React 19 hooks, Server Actions
- **_Requirements**: 6.1
- **_Prompt**:
  Role: React Hooks Developer
  Task: Create custom hooks for agent state management and database operations with proper TypeScript types
  Restrictions: Must use proper hook patterns, handle loading and error states, maintain type safety
  Success: Hooks are reusable and type-safe, state management works correctly
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

### 任务 6.2: 实现错误边界和异常处理
- **Files**: `src/components/ErrorBoundary.tsx`, `src/lib/utils/error-handler.ts`
- **目的**: 捕获和处理运行时错误
- **_Leverage**: React Error Boundaries, TypeScript
- **_Requirements**: 6.2
- **_Prompt**:
  Role: Error Handling Specialist
  Task: Implement ErrorBoundary component and comprehensive error handling utilities for both frontend and backend
  Restrictions: Must catch React errors, provide fallback UI, log errors appropriately
  Success: Errors are caught gracefully, users see helpful messages, errors are logged for debugging
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

---

## 阶段 7: 测试与部署

### 任务 7.1: 编写单元测试
- **Files**: `src/lib/agent/database-agent.test.ts`, `src/lib/agent/tools.test.ts`
- **目的**: 测试智能体和工具函数
- **_Leverage**: Vitest, React Testing Library
- **_Requirements**: 7.1
- **_Prompt**:
  Role: QA Engineer with expertise in unit testing
  Task: Write comprehensive unit tests for DatabaseAgent and all tools with proper mocking
  Restrictions: Must mock external dependencies, test error scenarios, achieve good coverage
  Success: All tests pass, coverage is adequate, edge cases are handled
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

### 任务 7.2: 配置部署环境
- **Files**: `docker-compose.yml`, `vercel.json` (if needed)
- **目的**: 设置生产环境配置
- **_Leverage**: Docker, Vercel
- **_Requirements**: 7.2
- **_Prompt**:
  Role: DevOps Engineer
  Task: Configure deployment environment with Docker Compose for PostgreSQL and production-ready Next.js settings
  Restrictions: Must include health checks, proper environment variables, production optimizations
  Success: Docker containers run correctly, deployment configuration is production-ready
  Instructions: After completion, edit this tasks.md file to mark as [-] then [x], then use log-implementation tool with artifacts

---

## 总计: 18 个原子任务

**预计开发时间**: 7 天
**核心技术**: Next.js 16 + React 19 + claude-agent-sdk-typescript + PostgreSQL 17
**项目状态**: 📋 规划完成，准备开始实施
