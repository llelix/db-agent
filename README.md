# 🤖 数据库查询智能体 (DB Agent)

一个基于 **Next.js 16.1.1** + **Claude Agent SDK** + **PostgreSQL** 的智能数据库查询应用，使用 **ReAct 模式** 将自然语言转换为 SQL 查询。

## ✨ 功能特性

- 🤖 **AI 智能体**: 使用 Claude 模型和 ReAct 模式理解自然语言查询
- 🗄️ **PostgreSQL**: 使用 Drizzle ORM 进行数据库操作
- 📝 **自然语言查询**: 用中文描述查询需求，自动生成并执行 SQL
- 📊 **数据可视化**: 表格、JSON、SQL 多种视图展示结果
- 📚 **查询历史**: 自动保存所有查询记录和执行结果
- 🎨 **现代 UI**: 使用 Tailwind CSS 和 React 19 新特性
- 🔒 **安全**: SQL 注入防护，只允许 SELECT 查询

## 🏗️ 项目结构

```
db-agent/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── query/         # 查询执行端点
│   │   │   ├── schema/        # 获取表结构
│   │   │   └── health/        # 健康检查
│   │   ├── page.tsx           # 主页面
│   │   ├── layout.tsx         # 根布局
│   │   └── globals.css        # 全局样式
│   ├── components/            # React 组件
│   │   ├── ui/                # UI 组件
│   │   │   └── button.tsx
│   │   ├── ChatInterface.tsx  # 主聊天界面
│   │   ├── QueryResult.tsx    # 结果展示
│   │   ├── ReActFlow.tsx      # ReAct 流程可视化
│   │   └── QueryHistory.tsx   # 历史记录
│   └── lib/
│       ├── actions/           # Server Actions
│       │   ├── query-action.ts
│       │   └── types.ts
│       ├── agent/             # AI 智能体
│       │   ├── claude-client.ts
│       │   ├── database-agent.ts
│       │   ├── tools.ts
│       │   └── types.ts
│       ├── auth.ts            # 认证工具
│       ├── database/          # 数据库客户端
│       │   ├── client.ts
│       │   └── index.ts
│       └── utils.ts           # 工具函数
├── db/                        # Drizzle ORM
│   ├── schema.ts             # 数据库表定义
│   ├── relations.ts          # 表关系
│   ├── migrations/           # 迁移文件
│   └── seed/                 # 种子数据
├── .env.example              # 环境变量模板
├── next.config.ts            # Next.js 配置
├── package.json              # 依赖配置
└── tsconfig.json             # TypeScript 配置
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd db-agent

# 安装依赖
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# PostgreSQL 数据库连接 (使用 Docker 中的 PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/db_agent

# Anthropic API Key (从 https://console.anthropic.com 获取)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. 设置数据库

```bash
# 确保 PostgreSQL 正在运行 (项目已配置 Docker)
# 会自动连接到已存在的 PostgreSQL 容器

# 生成并执行迁移
npm run db:generate
npm run db:migrate

# 填充测试数据
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

> **注意**: 首次使用需要配置有效的 Anthropic API Key，否则 AI 功能无法工作。

## 📖 使用说明

### 基本使用

1. 在查询输入框中用自然语言描述您的需求
2. 点击"执行查询"按钮
3. 查看 AI 生成的 SQL 和查询结果

### 查询示例

```
查询最近一周的销售总额，按产品分类统计
```

```
查找价格高于100的所有产品
```

```
统计每个用户的购买次数和总金额
```

```
查询2024年1月销量最高的前5个产品
```

### ReAct 模式说明

每次查询都会展示完整的 ReAct 思考过程：

- **Thought**: AI 分析用户意图
- **Action**: 调用数据库工具（获取结构、执行 SQL、分析数据）
- **Observation**: 查看工具返回结果
- **Final Answer**: 生成最终回答

## 🔧 命令脚本

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build
npm start

# 类型检查
npm run typecheck

# 代码检查
npm run lint

# 运行测试
npm run test

# 数据库操作
npm run db:generate    # 生成迁移
npm run db:migrate     # 执行迁移
npm run db:seed        # 填充测试数据
npm run db:studio      # 打开 Drizzle Studio

# 部署到 Vercel
npm run vercel:deploy
```

## 🛡️ 安全特性

- **SQL 注入防护**: 只允许 SELECT 查询，阻止 DROP、DELETE、INSERT、UPDATE
- **查询长度限制**: 最大 500 字符
- **认证保护**: API 端点需要用户会话或 API Key
- **开发环境隔离**: 测试用户仅在开发环境可用

## 📊 数据库表结构

### users (用户表)
- id (UUID)
- email (VARCHAR, 唯一)
- name (VARCHAR)
- created_at (TIMESTAMP)

### products (产品表)
- id (UUID)
- name (VARCHAR)
- price (DECIMAL)
- category (VARCHAR)
- created_at (TIMESTAMP)

### sales (销售表)
- id (UUID)
- product_id (UUID, 外键)
- quantity (INTEGER)
- sale_date (TIMESTAMP)
- total_amount (DECIMAL)
- user_id (UUID, 外键)

### query_history (查询历史表)
- id (UUID)
- user_id (UUID, 外键)
- natural_language_query (TEXT)
- generated_sql (TEXT)
- result (JSONB)
- react_trace (JSONB)
- execution_time_ms (INTEGER)
- status (VARCHAR)
- created_at (TIMESTAMP)

## 🔌 API 端点

### POST /api/query
执行自然语言查询

**请求体:**
```json
{
  "query": "查询最近一周的销售总额"
}
```

### GET /api/query
获取查询历史

**查询参数:**
- page (默认: 1)
- limit (默认: 20)

### GET /api/schema
获取数据库表结构

### GET /api/health
健康检查

## 🛠️ 技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **框架** | Next.js | 16.1.1 | App Router + Server Actions |
| **UI** | React | 19.2.3 | 最新 React 19 特性 |
| **AI** | Claude Agent SDK | 0.2.1 | AI 智能体核心 |
| **AI** | @anthropic-ai/sdk | 0.33.1 | Anthropic API 客户端 |
| **数据库** | PostgreSQL | 17 | 关系型数据库 |
| **ORM** | Drizzle ORM | 0.38.4 | 类型安全 ORM |
| **状态管理** | Zustand | 5.0.9 | 轻量级状态管理 |
| **样式** | Tailwind CSS | 4 | 现代化 CSS 框架 |
| **类型** | TypeScript | 5.7 | 类型安全 |
| **验证** | Zod | 4.3.5 | Schema 验证 |
| **测试** | Vitest | 2.1.9 | 测试框架 |

## 🤝 开发指南

### 添加新表

1. 在 `db/schema.ts` 中定义表
2. 运行 `npm run db:push` 更新数据库
3. 更新 `lib/agent/tools.ts` 中的 schema 工具

### 添加新工具

1. 在 `lib/agent/tools.ts` 中定义工具
2. 在 `lib/agent/database-agent.ts` 中处理工具调用
3. 更新系统提示词

### 修改 UI

1. 组件位于 `src/components/`
2. 主界面在 `src/components/ChatInterface.tsx`
3. 样式使用 Tailwind CSS

## 📝 注意事项

- ✅ 需要有效的 **Anthropic API Key** 才能使用 AI 功能
- ✅ 开发环境支持测试用户，生产环境需要实现完整的认证系统
- ✅ 数据库连接字符串格式: `postgresql://user:password@host:port/database`
- ✅ 所有查询都会被记录到 `query_history` 表中
- ✅ 项目使用 **ReAct 模式**，每次查询都会显示完整的思考过程
- ✅ 支持 **自然语言查询**（中文/英文）

## 🐛 常见问题

**Q: 数据库连接失败**
A: 检查 `DATABASE_URL` 是否正确，PostgreSQL 是否运行，Docker 容器是否启动

**Q: AI 查询失败 (400 错误)**
A: 检查 `ANTHROPIC_API_KEY` 是否有效，模型名称是否正确，网络连接是否正常

**Q: TypeScript 报错**
A: 运行 `npm run typecheck` 查看详细错误

**Q: 开发服务器启动失败**
A: 检查端口 3000 是否被占用，或运行 `kill $(lsof -t -i:3000)` 停止占用进程

## 📄 许可证

MIT License

---

## 🎉 项目状态

**✅ 所有核心功能已完成并测试通过**

- ✅ 数据库设计和迁移
- ✅ AI 智能体核心 (ReAct 模式)
- ✅ Server Actions 集成
- ✅ 前端 UI 组件
- ✅ 状态管理 (Zustand)
- ✅ 测试脚本
- ✅ 部署配置

**项目已准备好进行部署和使用！** 🚀
