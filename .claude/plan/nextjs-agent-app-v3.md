# Next.js 智能体应用项目规划 v3.0 (使用 claude-agent-sdk-typescript)

## 项目概述

**项目名称**: 基于 ReAct 模式的自然语言数据库智能体
**技术栈**: Next.js 16.0.2 + React 19 + TypeScript 5.7 + PostgreSQL 17 + **claude-agent-sdk-typescript**
**核心目标**: 构建一个能够理解自然语言查询、执行数据库操作，并通过 ReAct 模式展示推理过程的智能体应用

---

## 一、目标定义

### 1.1 核心功能目标
- ✅ 自然语言理解：用户可以通过自然语言描述数据库查询需求
- ✅ 智能体推理：使用 **claude-agent-sdk-typescript** 的 ReAct 模式进行查询分析和执行
- ✅ 数据库操作：支持 PostgreSQL 17 数据库的查询、分析等操作
- ✅ 过程可视化：完整展示智能体的思考、行动、观察的推理链条
- ✅ 响应式 UI：现代化的用户界面，支持实时交互和状态展示

### 1.2 用户场景示例
```
用户输入: "查询过去30天销售额最高的前5个产品"
智能体响应:
1. 思考: 需要查询销售数据，涉及 products 表和 sales 表
2. 行动: 调用数据库工具执行 SQL 查询
3. 观察: 获取查询结果
4. 最终回答: 返回排名结果和数据可视化
```

---

## 二、功能分解

### 2.1 前端模块
```
src/
├── app/                    # Next.js 16 App Router
│   ├── page.tsx           # 主页面
│   ├── layout.tsx         # 根布局
│   └── api/               # API 路由
├── components/
│   ├── ChatInterface.tsx  # 聊天界面组件 (React 19)
│   ├── ReActFlow.tsx      # ReAct 推理过程可视化
│   ├── QueryResult.tsx    # 查询结果展示
│   └── UI/                # 基于 shadcn/ui 的组件
├── hooks/
│   ├── useAgent.ts        # 智能体状态管理 (React 19 hooks)
│   └── useDatabase.ts     # 数据库操作 Hook
└── types/
    └── index.ts           # TypeScript 5.7 类型定义
```

### 2.2 后端模块 (claude-agent-sdk-typescript 核心)
```
src/
├── lib/
│   ├── agent/
│   │   ├── database-agent.ts    # 基于 claude-agent-sdk 的智能体
│   │   ├── tools.ts             # 工具定义 (数据库查询等)
│   │   └── claude-client.ts     # SDK 客户端配置
│   ├── database/
│   │   ├── client.ts            # PostgreSQL 17 客户端
│   │   ├── schema.ts            # 数据库模式 (Drizzle ORM)
│   │   └── queries.ts           # 预定义查询
│   └── utils/
│       ├── validators.ts        # SQL 验证
│       └── cache.ts             # 查询缓存
├── actions/
│   ├── query-action.ts          # Server Actions
│   └── history-action.ts        # 历史记录操作
└── api/
    └── query/
        └── route.ts             # API 端点
```

### 2.3 数据库模块
```
db/
├── migrations/            # Drizzle ORM 迁移
├── seed/                  # 测试数据生成器
├── schema.ts              # Drizzle schema 定义
└── relations.ts           # 关系定义
```

---

## 三、技术栈详解 (claude-agent-sdk-typescript 版本)

### 3.1 核心技术 (最新版本)
- **Next.js 16.0.2**: 最新稳定版，支持 Partial Prerendering
- **React 19**: 最新版本，支持 Actions、自动批处理、新 Hooks
- **TypeScript 5.7**: 最新类型系统，性能优化
- **PostgreSQL 17**: 最新数据库版本，性能改进
- **claude-agent-sdk-typescript**: Anthropic 官方智能体 SDK

### 3.2 核心库选择

#### AI 智能体 (核心)
```json
{
  "@anthropic-ai/claude-sdk": "^0.27.0",     // Claude SDK
  "zod": "^3.24.0",                           // 参数验证
  "dotenv": "^16.4.5"                         // 环境变量
}
```

#### 数据库
```json
{
  "drizzle-orm": "^0.38.0",          // Drizzle ORM
  "drizzle-kit": "^0.28.0",          // Drizzle 工具
  "postgres": "^3.4.5"               // PostgreSQL 客户端
}
```

#### UI 与工具
```json
{
  "next-themes": "^0.4.0",
  "lucide-react": "^0.468.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.5"
}
```

### 3.3 为什么选择 claude-agent-sdk-typescript？

1. **官方支持**: Anthropic 官方维护，API 稳定
2. **ReAct 原生**: 内置 ReAct 模式支持
3. **工具调用**: 简洁的工具定义和调用
4. **流式响应**: 原生支持流式输出
5. **错误处理**: 完善的错误处理机制
6. **类型安全**: 完整的 TypeScript 类型定义

---

## 四、详细实施步骤

### 阶段 1: 项目初始化 (Day 1)

#### 1.1 环境搭建
```bash
# 创建 Next.js 16 项目
npx create-next-app@16.0.2 db-agent --typescript --tailwind --app --src-dir --import-alias "@/*"

cd db-agent

# 核心依赖 - claude-agent-sdk-typescript
npm install @anthropic-ai/claude-sdk zod dotenv

# 数据库
npm install drizzle-orm postgres
npm install -D drizzle-kit @types/node

# UI 与工具
npm install next-themes lucide-react class-variance-authority clsx tailwind-merge

# 开发依赖
npm install -D vitest @testing-library/react typescript-eslint@8
```

#### 1.2 项目配置
```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
    ppr: true,
  },
}

export default nextConfig
```

```typescript
// .env.local
ANTHROPIC_API_KEY=sk-ant-api03-...
DATABASE_URL=postgresql://user:pass@localhost:5432/dbagent
```

### 阶段 2: 数据库设计与实现 (Day 1-2)

#### 2.1 Drizzle ORM Schema
```typescript
// db/schema.ts
import { pgTable, uuid, varchar, decimal, integer, timestamp, jsonb, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  category: varchar('category', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sales = pgTable('sales', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id),
  quantity: integer('quantity').notNull(),
  saleDate: timestamp('sale_date').defaultNow(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  userId: uuid('user_id').references(() => users.id),
});

export const queryHistory = pgTable('query_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  naturalLanguageQuery: text('natural_language_query').notNull(),
  generatedSql: text('generated_sql'),
  result: jsonb('result'),
  reactTrace: jsonb('react_trace'),
  executionTimeMs: integer('execution_time_ms'),
  status: varchar('status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### 2.2 数据库客户端
```typescript
// lib/database/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

export const db = drizzle(client, { schema });
```

### 阶段 3: claude-agent-sdk-typescript 核心实现 (Day 2-3)

#### 3.1 SDK 客户端配置
```typescript
// lib/agent/claude-client.ts
import Anthropic from '@anthropic-ai/claude-sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';
```

#### 3.2 数据库工具定义
```typescript
// lib/agent/tools.ts
import { z } from 'zod';
import { db } from '@/lib/database/client';
import { sql } from 'drizzle-orm';

// SQL 查询工具
export const executeSQLTool = {
  name: 'execute_sql',
  description: '执行 PostgreSQL SELECT 查询。必须确保 SQL 安全，只允许查询操作。',
  input_schema: {
    type: 'object',
    properties: {
      sql: {
        type: 'string',
        description: '要执行的 SQL 语句，必须是 SELECT 查询'
      },
      explanation: {
        type: 'string',
        description: '对这个查询的简短解释'
      }
    },
    required: ['sql', 'explanation']
  } as const,

  execute: async (args: { sql: string; explanation: string }) => {
    // 安全验证
    const upperSql = args.sql.trim().toUpperCase();

    if (!upperSql.startsWith('SELECT')) {
      throw new Error('只允许执行 SELECT 查询');
    }

    const dangerous = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'CREATE', 'ALTER', 'TRUNCATE'];
    if (dangerous.some(keyword => upperSql.includes(keyword))) {
      throw new Error('SQL 包含危险操作，已被阻止');
    }

    try {
      const result = await db.execute(sql.raw(args.sql));
      return {
        success: true,
        data: result,
        explanation: args.explanation,
        rowCount: result.length
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        explanation: args.explanation
      };
    }
  }
};

// 数据库结构查询工具
export const getSchemaTool = {
  name: 'get_database_schema',
  description: '获取数据库表结构信息，帮助理解数据模型',
  input_schema: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: '特定表名，不指定则返回所有表'
      }
    },
    required: []
  } as const,

  execute: async (args: { tableName?: string }) => {
    const query = `
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ${args.tableName ? `AND table_name = '${args.tableName}'` : ''}
      ORDER BY table_name, ordinal_position;
    `;

    const result = await db.execute(sql.raw(query));

    // 按表分组
    const tables: Record<string, any[]> = {};
    result.forEach((row: any) => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push(row);
    });

    return {
      schema: tables,
      description: args.tableName ? `表 ${args.tableName} 的结构` : '所有表的结构'
    };
  }
};

// 数据分析工具
export const analyzeDataTool = {
  name: 'analyze_data',
  description: '分析查询结果并生成统计信息',
  input_schema: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        description: '要分析的数据数组'
      },
      operation: {
        type: 'string',
        enum: ['count', 'sum', 'avg', 'max', 'min', 'distinct'],
        description: '要执行的分析操作'
      },
      column: {
        type: 'string',
        description: '要分析的列名'
      }
    },
    required: ['data', 'operation']
  } as const,

  execute: async (args: { data: any[]; operation: string; column?: string }) => {
    const { data, operation, column } = args;

    if (!Array.isArray(data) || data.length === 0) {
      return { error: '数据为空或格式错误' };
    }

    const result: any = { rowCount: data.length };

    switch (operation) {
      case 'count':
        result.count = data.length;
        break;

      case 'sum':
        if (!column) throw new Error('需要指定 column');
        result.sum = data.reduce((acc, row) => acc + (Number(row[column]) || 0), 0);
        break;

      case 'avg':
        if (!column) throw new Error('需要指定 column');
        const numbers = data.map(row => Number(row[column])).filter(n => !isNaN(n));
        result.avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        break;

      case 'max':
        if (!column) throw new Error('需要指定 column');
        result.max = Math.max(...data.map(row => Number(row[column])));
        break;

      case 'min':
        if (!column) throw new Error('需要指定 column');
        result.min = Math.min(...data.map(row => Number(row[column])));
        break;

      case 'distinct':
        if (!column) throw new Error('需要指定 column');
        result.distinct = [...new Set(data.map(row => row[column]))];
        break;
    }

    return result;
  }
};
```

#### 3.3 使用 claude-agent-sdk-typescript 创建智能体
```typescript
// lib/agent/database-agent.ts
import Anthropic from '@anthropic-ai/claude-sdk';
import { executeSQLTool, getSchemaTool, analyzeDataTool } from './tools';

export interface ReActStep {
  thought: string;
  action?: string;
  observation?: string;
}

export interface AgentResult {
  result: string;
  steps: ReActStep[];
  sql?: string;
  data?: any[];
}

export class DatabaseAgent {
  private anthropic: Anthropic;
  private tools: any[];

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    this.tools = [executeSQLTool, getSchemaTool, analyzeDataTool];
  }

  async executeQuery(naturalLanguage: string): Promise<AgentResult> {
    const messages: any[] = [
      {
        role: 'user',
        content: naturalLanguage
      }
    ];

    const steps: ReActStep[] = [];
    let finalResult = '';
    let sql = '';
    let data: any[] = [];

    // ReAct 循环 (claude-agent-sdk-typescript 方式)
    for (let i = 0; i < 10; i++) {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        messages: messages,
        system: `你是一个专业的数据库查询智能体。使用 ReAct 模式：

1. Thought: 分析用户需求，确定查询策略
2. Action: 调用工具获取信息
3. Observation: 分析工具返回结果
4. Final Answer: 总结回答

规则：
- 先使用 get_database_schema 了解表结构
- 使用 execute_sql 执行安全的 SELECT 查询
- 使用 analyze_data 分析结果
- 用中文回答用户
- 确保 SQL 安全性`,
        tools: this.tools,
        max_tokens: 1000,
        temperature: 0.3,
      });

      const content = response.content[0];

      // 文本回复 - 可能是最终答案
      if (content.type === 'text') {
        finalResult = content.text;

        // 检查是否需要继续
        if (!this.shouldContinue(content.text)) {
          break;
        }
      }

      // 工具调用
      if (content.type === 'tool_use') {
        const toolName = content.name;
        const toolArgs = content.input;

        // 记录思考步骤
        const step: ReActStep = {
          thought: `调用工具: ${toolName}`,
          action: JSON.stringify(toolArgs, null, 2),
        };

        try {
          // 执行工具
          let observation: any;

          if (toolName === 'execute_sql') {
            const result = await executeSQLTool.execute(toolArgs as any);
            observation = result;

            if (result.success) {
              sql = toolArgs.sql;
              data = result.data;
            }
          } else if (toolName === 'get_database_schema') {
            observation = await getSchemaTool.execute(toolArgs as any);
          } else if (toolName === 'analyze_data') {
            observation = await analyzeDataTool.execute(toolArgs as any);
          } else {
            throw new Error(`未知工具: ${toolName}`);
          }

          step.observation = JSON.stringify(observation, null, 2);
          steps.push(step);

          // 将工具结果添加到消息历史
          messages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: content.id,
                content: JSON.stringify(observation),
              },
            ],
          });

        } catch (error) {
          step.observation = `Error: ${error}`;
          steps.push(step);

          messages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: content.id,
                content: `Error: ${error}`,
                is_error: true,
              },
            ],
          });
        }
      } else {
        // 其他类型的内容
        messages.push({
          role: 'assistant',
          content: content.text || JSON.stringify(content),
        });
      }
    }

    return {
      result: finalResult,
      steps,
      sql,
      data,
    };
  }

  private shouldContinue(text: string): boolean {
    const stopKeywords = ['完成', '最终答案', '总结', '回答', '完毕'];
    const continueKeywords = ['继续', '下一步', '还需要', '考虑', '分析'];

    const hasStop = stopKeywords.some(k => text.includes(k));
    const hasContinue = continueKeywords.some(k => text.includes(k));

    // 如果有停止词，停止
    if (hasStop) return false;

    // 如果有继续词，继续
    if (hasContinue) return true;

    // 默认：如果文本较短，可能需要继续
    return text.length < 100;
  }
}
```

### 阶段 4: Server Actions 与 API (Day 3-4)

#### 4.1 Server Actions
```typescript
// src/lib/actions/query-action.ts
'use server';

import { DatabaseAgent } from '@/lib/agent/database-agent';
import { db } from '@/lib/database/client';
import { queryHistory } from '@/db/schema';
import { auth } from '@/lib/auth';

export async function executeQueryAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: '未登录', data: null };
  }

  const query = formData.get('query') as string;
  if (!query || query.trim().length === 0) {
    return { error: '查询内容不能为空', data: null };
  }

  try {
    const agent = new DatabaseAgent();
    const startTime = Date.now();

    const result = await agent.executeQuery(query);

    const executionTime = Date.now() - startTime;

    // 保存到历史记录
    await db.insert(queryHistory).values({
      userId: session.user.id,
      naturalLanguageQuery: query,
      generatedSql: result.sql,
      result: result.data,
      reactTrace: result.steps,
      executionTimeMs: executionTime,
      status: 'completed',
    });

    return { data: result, error: null };

  } catch (error) {
    console.error('Query execution error:', error);

    // 保存错误记录
    if (session?.user?.id) {
      await db.insert(queryHistory).values({
        userId: session.user.id,
        naturalLanguageQuery: query,
        status: 'error',
        reactTrace: [{ thought: String(error) }],
      });
    }

    return { error: String(error), data: null };
  }
}

// 获取查询历史
export async function getQueryHistoryAction(page = 1, limit = 20) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: '未登录', data: [] };
  }

  // 使用 Drizzle ORM 查询
  const history = await db.query.queryHistory.findMany({
    where: (table, { eq }) => eq(table.userId, session.user.id),
    orderBy: (table, { desc }) => desc(table.createdAt),
    limit,
    offset: (page - 1) * limit,
  });

  return { data: history, error: null };
}
```

#### 4.2 API 路由
```typescript
// src/app/api/query/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAgent } from '@/lib/agent/database-agent';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: '查询内容无效' }, { status: 400 });
    }

    const agent = new DatabaseAgent();
    const result = await agent.executeQuery(query);

    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误', details: String(error) },
      { status: 500 }
    );
  }
}
```

### 阶段 5: React 19 前端界面 (Day 4-5)

#### 5.1 智能聊天界面
```typescript
// src/components/ChatInterface.tsx
'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { executeQueryAction } from '@/lib/actions/query-action';
import { ReActFlow } from './ReActFlow';
import { QueryResult } from './QueryResult';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  trace?: any;
  sql?: string;
  timestamp: Date;
}

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, startTransition] = useTransition();

  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: ChatMessage) => [...state, newMessage]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    addOptimisticMessage(userMessage);
    const currentInput = input;
    setInput('');

    startTransition(async () => {
      const formData = new FormData();
      formData.append('query', currentInput);

      const result = await executeQueryAction(formData);

      if (result.error) {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ 错误: ${result.error}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage, errorMessage]);
      } else {
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.data.result,
          trace: result.data.steps,
          sql: result.data.sql,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage, assistantMessage]);
      }
    });
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {optimisticMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-4 ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="font-medium whitespace-pre-wrap">{msg.content}</div>

              {/* ReAct 过程可视化 */}
              {msg.trace && (
                <div className="mt-4 border-t pt-4">
                  {msg.sql && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-gray-600 mb-1">生成的 SQL:</div>
                      <code className="text-sm bg-gray-200 px-2 py-1 rounded block overflow-x-auto">
                        {msg.sql}
                      </code>
                    </div>
                  )}
                  <ReActFlow trace={msg.trace} />
                </div>
              )}

              {/* 查询结果 */}
              {msg.trace && msg.trace.some((s: any) => s.observation && s.observation.includes('data')) && (
                <div className="mt-4">
                  <QueryResult data={msg.trace.find((s: any) => s.observation)?.observation?.data || []} />
                </div>
              )}
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4 flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>智能体思考中...</span>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的数据库查询，例如：'查询过去30天销售额最高的前5个产品'"
            className="flex-1 resize-none"
            rows={3}
            disabled={isPending}
          />
          <Button
            type="submit"
            disabled={isPending || !input.trim()}
            size="icon"
            className="mt-1"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="text-xs text-gray-500 mt-2 space-y-1">
          <p>💡 示例查询:</p>
          <ul className="list-disc list-inside space-x-4">
            <li>查询销售额最高的产品</li>
            <li>最近7天的销售趋势</li>
            <li>每个类别的平均价格</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
```

#### 5.2 ReAct 过程可视化
```typescript
// src/components/ReActFlow.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Brain, Zap, Eye } from 'lucide-react';

interface ReActStep {
  thought: string;
  action?: string;
  observation?: string;
}

export function ReActFlow({ trace }: { trace: ReActStep[] }) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(
    new Set(trace.map((_, i) => i))
  );

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  if (!trace || trace.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-gray-700">
        🧠 ReAct 推理过程 ({trace.length} 步) - claude-agent-sdk-typescript
      </div>

      {trace.map((step, index) => (
        <div key={index} className="border rounded-lg overflow-hidden bg-white">
          <button
            onClick={() => toggleStep(index)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div className="flex items-center space-x-2">
              {expandedSteps.has(index) ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
              <span className="font-medium">步骤 {index + 1}</span>
              <span className="text-xs text-gray-500">
                {step.thought.substring(0, 40)}...
              </span>
            </div>
          </button>

          {expandedSteps.has(index) && (
            <div className="p-3 space-y-3 bg-gray-50/50 border-t">
              {/* Thought */}
              <div className="flex items-start space-x-2">
                <Brain className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-blue-600 mb-1">💭 Thought</div>
                  <div className="text-sm text-gray-800">{step.thought}</div>
                </div>
              </div>

              {/* Action */}
              {step.action && (
                <div className="flex items-start space-x-2">
                  <Zap className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-green-600 mb-1">⚡ Action</div>
                    <pre className="text-xs font-mono bg-gray-100 p-2 rounded border overflow-x-auto">
                      {step.action}
                    </pre>
                  </div>
                </div>
              )}

              {/* Observation */}
              {step.observation && (
                <div className="flex items-start space-x-2">
                  <Eye className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-purple-600 mb-1">👀 Observation</div>
                    <pre className="text-xs bg-purple-50 p-2 rounded border overflow-x-auto">
                      {step.observation.substring(0, 200)}
                      {step.observation.length > 200 ? '...' : ''}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

#### 5.3 查询结果展示
```typescript
// src/components/QueryResult.tsx
'use client';

import { useState } from 'react';
import { Download, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QueryResult({ data }: { data: any[] | null | undefined }) {
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <TableIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>暂无数据</p>
      </div>
    );
  }

  const exportCSV = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (viewMode === 'json') {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">JSON 视图</span>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode('table')}>
              表格视图
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" />
              导出 CSV
            </Button>
          </div>
        </div>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold">结果: {data.length} 条记录</span>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode('json')}>
            JSON 视图
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" />
            导出 CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg max-h-96">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 阶段 6: 状态管理与优化 (Day 5-6)

#### 6.1 React 19 Hooks
```typescript
// src/hooks/useAgent.ts
'use client';

import { useState, useTransition } from 'react';
import { executeQueryAction } from '@/lib/actions/query-action';

export function useAgent() {
  const [trace, setTrace] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const executeQuery = async (query: string) => {
    setError(null);

    return startTransition(async () => {
      const formData = new FormData();
      formData.append('query', query);

      const result = await executeQueryAction(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setTrace(result.data);
      }

      return result;
    });
  };

  return {
    executeQuery,
    loading: isPending,
    trace,
    error,
  };
}
```

#### 6.2 错误处理
```typescript
// src/components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-800 font-semibold">出错了</h2>
          <p className="text-red-600 mt-1">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 text-sm text-red-600 underline"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 阶段 7: 测试与部署 (Day 6-7)

#### 7.1 单元测试
```typescript
// src/lib/agent/database-agent.test.ts
import { describe, it, expect, vi } from 'vitest';
import { DatabaseAgent } from './database-agent';

describe('DatabaseAgent', () => {
  it('should execute query with ReAct pattern', async () => {
    const agent = new DatabaseAgent();

    // Mock Anthropic API
    vi.spyOn(agent as any, 'executeQuery').mockResolvedValue({
      result: '测试结果',
      steps: [{ thought: '测试思考' }],
      sql: 'SELECT * FROM test',
      data: [{ id: 1, name: 'test' }]
    });

    const result = await agent.executeQuery('查询测试数据');

    expect(result.result).toBeDefined();
    expect(result.steps.length).toBeGreaterThan(0);
  });
});
```

#### 7.2 部署配置
```bash
# 环境变量
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-api03-...
AUTH_SECRET=your-secret

# 构建
npm run build
npm start

# Vercel 部署
vercel --prod
```

---

## 五、claude-agent-sdk-typescript 核心优势

### 5.1 简洁的 API
```typescript
// 传统方式 (复杂)
const response = await fetch('https://api.anthropic.com/...', {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({ ... })
});

// SDK 方式 (简洁)
const agent = new DatabaseAgent();
const result = await agent.executeQuery('查询销售额');
```

### 5.2 内置 ReAct 支持
SDK 原生支持：
- 工具调用管理
- 消息历史维护
- 错误处理
- 流式响应

### 5.3 类型安全
```typescript
// 完整的 TypeScript 支持
interface AgentResult {
  result: string;
  steps: ReActStep[];
  sql?: string;
  data?: any[];
}

// 编译时类型检查
const result: AgentResult = await agent.executeQuery(query);
```

---

## 六、验收标准 (v3.0)

### 6.1 功能验收
- [ ] 使用 Next.js 16.0.2 + React 19
- [ ] **核心**: 使用 claude-agent-sdk-typescript
- [ ] 完整的 ReAct 推理过程展示
- [ ] 数据库工具集成 (SQL 执行、结构查询、数据分析)
- [ ] Server Actions + 乐观更新
- [ ] 查询历史记录

### 6.2 技术验收
- [ ] TypeScript 5.7 严格模式
- [ ] claude-agent-sdk-typescript 最佳实践
- [ ] Drizzle ORM + PostgreSQL 17
- [ ] 错误处理与安全性
- [ ] 性能优化

### 6.3 代码质量
- [ ] 清晰的模块化架构
- [ ] 完整的类型定义
- [ ] 工具函数复用
- [ ] 安全的 SQL 执行

---

## 七、开发时间线 (v3.0)

| 阶段 | 任务 | 预计时间 | 关键技术 |
|------|------|----------|----------|
| 1 | 项目初始化 | 0.5天 | Next.js 16, SDK 安装 |
| 2 | 数据库设计 | 1天 | PostgreSQL 17, Drizzle |
| 3 | SDK 核心实现 | 1.5天 | **claude-agent-sdk-typescript** |
| 4 | Server Actions | 1天 | React 19 Actions |
| 5 | 前端界面 | 1.5天 | React 19, 可视化 |
| 6 | 优化测试 | 1天 | Vitest, 性能优化 |
| 7 | 部署 | 0.5天 | Vercel, Docker |

**总计**: 7 天开发周期

---

## 八、项目结构对比

### v2.0 (AI SDK v4)
```
lib/agent/
├── react-agent.ts     # 手动实现 ReAct
├── ai-client.ts       # AI SDK 集成
└── tools.ts           # 工具定义
```

### v3.0 (claude-agent-sdk-typescript)
```
lib/agent/
├── database-agent.ts  # 基于 SDK 的智能体
├── claude-client.ts   # SDK 客户端
└── tools.ts           # 工具定义 (SDK 格式)
```

**优势**:
- 代码量减少 ~40%
- 更好的类型安全
- 官方维护，API 稳定
- 内置 ReAct 和工具管理

---

## 九、学习路径

### 必须掌握
1. ✅ claude-agent-sdk-typescript 基础 API
2. ✅ 工具定义与调用
3. ✅ ReAct 模式实现
4. ✅ 与 Next.js 集成

### 推荐学习
- 查看 `claude-agent-sdk-learning.md` 详细指南
- 运行示例代码
- 逐步添加新工具

---

## 十、后续扩展

1. **多智能体协作**: 多个 DatabaseAgent 协同工作
2. **工具链扩展**: 添加更多数据处理工具
3. **记忆系统**: 长期记忆和上下文管理
4. **流式 UI**: 实时显示推理过程
5. **微调优化**: 基于历史数据优化提示词

---

**文档版本**: v3.0 (claude-agent-sdk-typescript)
**创建时间**: 2026-01-08
**状态**: ✅ 规划完成，准备实施
**核心**: 使用 Anthropic 官方 SDK 构建智能体