# 数据库管理 Dashboard 重构规划 (v2)

## 📋 项目概述

### 基于现有项目的重构策略
本项目将在现有 Next.js + Drizzle + PostgreSQL 架构基础上，扩展构建数据库管理 Dashboard，充分利用已有基础设施。

### 现有技术栈分析
- ✅ **Next.js 16.1.1** (App Router)
- ✅ **TypeScript** + **Tailwind CSS**
- ✅ **Drizzle ORM** + **PostgreSQL** (postgres-js)
- ✅ **NextAuth v5** (认证系统)
- ✅ **AI Agent** (ReAct 模式 + Claude SDK)
- ✅ **Zustand** (状态管理)

### 新增功能目标
1. **数据库连接配置管理** (多连接支持)
2. **表结构浏览和数据查看** (可视化)
3. **自定义 SQL 查询编辑器** (手动输入)
4. **查询结果可视化展示** (表格/导出)

---

## 🏗️ 架构设计

### 数据模型扩展

#### 新增表：数据库连接配置
```typescript
// db/schema.ts 新增
export const dbConnections = pgTable('db_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),          // 连接名称
  host: varchar('host', { length: 255 }).notNull(),          // 主机地址
  port: integer('port').default(5432),                       // 端口
  database: varchar('database', { length: 100 }).notNull(),  // 数据库名
  username: varchar('username', { length: 100 }).notNull(),  // 用户名
  password: varchar('password', { length: 255 }).notNull(),  // 加密密码
  ssl: boolean('ssl').default(false),                        // SSL 配置
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 连接历史记录表
export const connectionHistory = pgTable('connection_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  connectionId: uuid('connection_id').references(() => dbConnections.id),
  action: varchar('action', { length: 50 }),  // connect, query, error
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### 现有表扩展
```typescript
// 扩展现有的 query_history 表
export const queryHistory = pgTable('query_history', {
  // ... 现有字段
  connectionId: uuid('connection_id').references(() => dbConnections.id), // 新增
  queryType: varchar('query_type', { length: 20 }).$type<'ai' | 'manual'>(), // 新增
  manualSql: text('manual_sql'), // 新增：存储手动 SQL
});
```

### 后端架构

#### 1. 数据库连接管理器
```typescript
// lib/database/connection-manager.ts
export class ConnectionManager {
  // 连接池缓存
  private static pools: Map<string, postgres.Sql> = new Map();

  // 获取连接池
  static getPool(connectionConfig: DbConnection): postgres.Sql;

  // 测试连接
  static testConnection(config: DbConnection): Promise<boolean>;

  // 执行查询
  static executeQuery(connectionId: string, sql: string): Promise<any[]>;

  // 获取表结构
  static getSchema(connectionId: string, tableName?: string): Promise<any>;

  // 关闭连接
  static closeConnection(connectionId: string): void;
}
```

#### 2. API 路由设计

**连接管理 API:**
```
POST   /api/db/connections          - 创建连接配置
GET    /api/db/connections          - 获取用户所有连接
GET    /api/db/connections/:id      - 获取特定连接
PUT    /api/db/connections/:id      - 更新连接配置
DELETE /api/db/connections/:id      - 删除连接
POST   /api/db/connections/:id/test - 测试连接
```

**数据库操作 API:**
```
GET    /api/db/:connectionId/tables           - 获取所有表列表
GET    /api/db/:connectionId/tables/:name     - 获取表结构
GET    /api/db/:connectionId/data/:name       - 获取表数据 (分页)
POST   /api/db/:connectionId/query            - 执行自定义 SQL
GET    /api/db/:connectionId/schema           - 获取完整数据库结构
```

**查询历史 API:**
```
GET    /api/query/history                     - 获取查询历史 (支持 ai/manual 过滤)
DELETE /api/query/history/:id                 - 删除查询记录
```

#### 3. 安全中间件
```typescript
// middleware/db-security.ts
export function validateSQL(sql: string): { safe: boolean; error?: string };

// 防护措施：
// - 只允许 SELECT 查询
// - 阻止危险关键词 (DROP, DELETE, INSERT, UPDATE, ALTER, TRUNCATE)
// - 限制查询时间 (30秒)
// - 限制返回行数 (1000行)
// - SQL 注入检测
```

### 前端架构

#### 页面路由结构
```
/app/dashboard/
├── page.tsx                    - Dashboard 首页 (连接列表)
├── connections/                - 连接管理
│   ├── page.tsx               - 连接列表
│   ├── [id]/page.tsx          - 连接详情/编辑
│   └── create/page.tsx        - 创建连接
├── browse/                     - 数据库浏览
│   ├── [connectionId]/page.tsx - 表列表
│   └── [connectionId]/[table]/page.tsx - 表数据查看
├── query/                      - SQL 查询
│   └── [connectionId]/page.tsx - SQL 编辑器
└── history/                    - 查询历史
    └── page.tsx               - 历史记录
```

#### 组件结构
```
components/
├── db/
│   ├── ConnectionList.tsx     - 连接列表组件
│   ├── ConnectionForm.tsx     - 连接表单
│   ├── TableBrowser.tsx       - 表浏览组件
│   ├── DataTable.tsx          - 数据表格展示
│   ├── SQLEditor.tsx          - SQL 编辑器
│   ├── QueryResults.tsx       - 查询结果展示
│   └── ConnectionStatus.tsx   - 连接状态指示器
├── ui/
│   ├── data-table.tsx         - 通用表格组件
│   ├── code-editor.tsx        - 代码编辑器
│   ├── pagination.tsx         - 分页组件
│   └── loading-skeleton.tsx   - 加载骨架
```

#### 状态管理 (Zustand)
```typescript
// lib/store/db-dashboard.ts
interface DbDashboardState {
  // 连接管理
  connections: DbConnection[];
  activeConnection: DbConnection | null;

  // 浏览状态
  tables: string[];
  selectedTable: string | null;
  tableData: any[];
  tableSchema: any;

  // 查询状态
  sqlQuery: string;
  queryResult: any;
  queryError: string | null;

  // UI 状态
  isLoading: boolean;
  activeTab: 'browse' | 'query' | 'history';

  // Actions
  fetchConnections: () => Promise<void>;
  createConnection: (config: any) => Promise<void>;
  testConnection: (config: any) => Promise<boolean>;
  fetchTables: (connectionId: string) => Promise<void>;
  fetchTableData: (connectionId: string, table: string, page?: number) => Promise<void>;
  executeQuery: (connectionId: string, sql: string) => Promise<void>;
}
```

---

## 📝 详细实施计划

### 阶段 1: 数据库迁移 (Day 1)

#### 任务 1.1: 创建迁移文件
```sql
-- db/migrations/0002_add_db_connections.sql
CREATE TABLE IF NOT EXISTS "db_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "host" varchar(255) NOT NULL,
  "port" integer DEFAULT 5432,
  "database" varchar(100) NOT NULL,
  "username" varchar(100) NOT NULL,
  "password" varchar(255) NOT NULL,
  "ssl" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "connection_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "connection_id" uuid REFERENCES "db_connections"("id") ON DELETE SET NULL,
  "action" varchar(50),
  "details" jsonb,
  "created_at" timestamp DEFAULT now()
);

-- 扩展现有 query_history 表
ALTER TABLE "query_history"
ADD COLUMN IF NOT EXISTS "connection_id" uuid REFERENCES "db_connections"("id"),
ADD COLUMN IF NOT EXISTS "query_type" varchar(20),
ADD COLUMN IF NOT EXISTS "manual_sql" text;
```

#### 任务 1.2: 更新 Schema 定义
- [ ] 在 `db/schema.ts` 中添加新表定义
- [ ] 更新类型导出
- [ ] 生成新的 Drizzle 迁移

---

### 阶段 2: 后端 API 开发 (Day 1-2)

#### 任务 2.1: 数据库连接管理器
- [ ] 创建 `lib/database/connection-manager.ts`
- [ ] 实现连接池缓存机制
- [ ] 实现连接测试功能
- [ ] 实现查询执行封装

#### 任务 2.2: API 路由实现
- [ ] `app/api/db/connections/route.ts` - 连接 CRUD
- [ ] `app/api/db/connections/[id]/route.ts` - 单个连接操作
- [ ] `app/api/db/connections/[id]/test/route.ts` - 连接测试
- [ ] `app/api/db/[connectionId]/tables/route.ts` - 表列表
- [ ] `app/api/db/[connectionId]/tables/[table]/route.ts` - 表结构/数据
- [ ] `app/api/db/[connectionId]/query/route.ts` - SQL 执行

#### 任务 2.3: 安全中间件和验证
- [ ] SQL 安全验证函数
- [ ] 连接配置加密/解密
- [ ] 查询超时控制
- [ ] 错误处理和日志记录

---

### 阶段 3: UI/UX 设计 (Day 2-3)

**使用 UI-UX-Designer Agent 进行设计**

#### 设计要点：
1. **Dashboard 首页**: 连接卡片展示，状态指示
2. **连接管理**: 表单验证，测试按钮，编辑/删除
3. **表浏览**: 树形导航 + 详情面板
4. **SQL 编辑器**: 语法高亮，格式化，历史记录
5. **结果展示**: 表格分页，导出功能，性能指标

#### 响应式设计：
- 桌面端：侧边栏导航 + 主内容区
- 平板端：可折叠导航
- 移动端：简化视图，优先核心功能

---

### 阶段 4: 前端组件开发 (Day 3-4)

#### 任务 4.1: 页面开发
- [ ] `app/dashboard/page.tsx` - Dashboard 首页
- [ ] `app/dashboard/connections/page.tsx` - 连接列表
- [ ] `app/dashboard/connections/[id]/page.tsx` - 连接详情
- [ ] `app/dashboard/browse/[connectionId]/page.tsx` - 表浏览
- [ ] `app/dashboard/query/[connectionId]/page.tsx` - SQL 编辑器
- [ ] `app/dashboard/history/page.tsx` - 查询历史

#### 任务 4.2: UI 组件库
- [ ] `components/db/ConnectionCard.tsx` - 连接卡片
- [ ] `components/db/ConnectionForm.tsx` - 连接表单
- [ ] `components/db/TableTree.tsx` - 表树形导航
- [ ] `components/db/SQLCodeEditor.tsx` - SQL 编辑器
- [ ] `components/db/ResultTable.tsx` - 结果表格
- [ ] `components/db/QueryPerformance.tsx` - 性能指标

#### 任务 4.3: Hooks 和 API 客户端
- [ ] `lib/hooks/useDbConnections.ts`
- [ ] `lib/hooks/useTableBrowser.ts`
- [ ] `lib/hooks/useSqlQuery.ts`
- [ ] `lib/api/db-api.ts`

---

### 阶段 5: 集成和测试 (Day 4-5)

#### 任务 5.1: 功能集成
- [ ] 连接管理完整流程测试
- [ ] 表浏览和数据查看测试
- [ ] SQL 查询执行测试
- [ ] 查询历史记录测试
- [ ] 错误处理和边界情况

#### 任务 5.2: 安全测试
- [ ] SQL 注入攻击测试
- [ ] 连接泄漏测试
- [ ] 权限隔离测试
- [ ] 敏感信息脱敏测试

#### 任务 5.3: 性能优化
- [ ] 连接池优化
- [ ] 数据分页优化
- [ ] 前端渲染优化
- [ ] 缓存策略实现

---

### 阶段 6: 部署和文档 (Day 5-6)

#### 任务 6.1: 配置管理
- [ ] 环境变量配置
- [ ] 生产构建优化
- [ ] Docker 配置 (可选)
- [ ] 部署脚本

#### 任务 6.2: 文档编写
- [ ] 用户使用手册
- [ ] API 文档
- [ ] 安全指南
- [ ] 故障排查

---

## 🔒 安全设计

### 连接安全
1. **密码加密**: 使用 AES-256 加密存储数据库密码
2. **连接隔离**: 每个用户只能访问自己的连接配置
3. **连接池限制**: 单个连接最大 10 个并发
4. **超时控制**: 连接超时 10 秒，查询超时 30 秒

### 查询安全
1. **只读模式**: 强制 SELECT 查询
2. **危险语句拦截**: DROP, DELETE, INSERT, UPDATE, ALTER 等
3. **SQL 注入检测**: 注释、UNION、特殊字符检查
4. **结果限制**: 最多 1000 行，防止内存溢出

### 数据安全
1. **敏感字段脱敏**: 密码、token 等字段自动隐藏
2. **操作审计**: 所有连接和查询操作记录日志
3. **会话验证**: 每次操作验证用户会话
4. **错误信息**: 生产环境不暴露详细错误

---

## 🎯 验收标准

### 功能验收
- [ ] 支持多 PostgreSQL 连接配置 (CRUD)
- [ ] 连接测试功能正常工作
- [ ] 可浏览任意连接的数据库表
- [ ] 可查看表结构和数据 (分页)
- [ ] 可执行自定义 SQL 查询
- [ ] 查询结果正确展示
- [ ] 查询历史记录完整
- [ ] 错误处理友好

### 质量验收
- [ ] TypeScript 类型安全
- [ ] 响应式设计完善
- [ ] 加载状态清晰
- [ ] 无安全漏洞
- [ ] 性能响应 < 2 秒
- [ ] 代码符合规范

### 文档验收
- [ ] 安装部署指南
- [ ] 用户操作手册
- [ ] API 接口文档
- [ ] 安全使用说明

---

## 📦 依赖管理

### 新增依赖
```json
{
  "dependencies": {
    "aes-js": "^3.1.2",        // 密码加密
    "react-syntax-highlighter": "^15.5.0", // SQL 语法高亮
    "sql-formatter": "^12.2.0" // SQL 格式化
  },
  "devDependencies": {
    "@types/aes-js": "^3.1.0",
    "@types/react-syntax-highlighter": "^15.5.0"
  }
}
```

### 现有依赖复用
- ✅ Drizzle ORM - 数据库操作
- ✅ postgres-js - PostgreSQL 客户端
- ✅ Zustand - 状态管理
- ✅ NextAuth - 认证授权
- ✅ Tailwind CSS - 样式框架

---

## 🔄 与现有系统的集成

### 利用现有功能
1. **认证系统**: 复用 NextAuth v5 的用户会话
2. **数据库**: 复用现有的 Drizzle 配置和连接池
3. **AI Agent**: 保留现有的智能查询功能
4. **UI 框架**: 复用现有的组件库和样式

### 扩展策略
1. **并行开发**: 新旧功能互不影响
2. **路由隔离**: `/agent` 保持现有，新增 `/dashboard`
3. **数据隔离**: 新表与现有表通过外键关联
4. **渐进式**: 可分阶段上线，不影响现有服务

---

## 📊 预期成果

### 产品价值
- ✅ 用户可自主管理多个数据库连接
- ✅ 可视化浏览数据库结构和数据
- ✅ 灵活的 SQL 查询执行能力
- ✅ 完整的查询历史和审计

### 技术价值
- ✅ 建立可复用的数据库连接管理架构
- ✅ 实现安全的 SQL 执行机制
- ✅ 构建响应式数据管理界面
- ✅ 完善的错误处理和日志系统

---

**规划完成**: 2026-01-09
**预计周期**: 6 天
**优先级**: 高
**状态**: 待实施
**版本**: v2 (基于现有项目重构)