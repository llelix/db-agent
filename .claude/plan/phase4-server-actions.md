# 阶段 4: Server Actions 与 API 路由 (Day 3-4)

**阶段目标**: 实现服务端查询执行和历史记录管理
**预计时间**: 1 天
**依赖**: 阶段 1, 2, 3 已完成
**核心技术**: React 19 Server Actions, Next.js App Router, Drizzle ORM

---

## 📋 本阶段任务

### 任务 4.1: 查询执行 Server Action

#### 目标
创建服务端函数处理查询执行、历史记录保存和认证。

#### 4.1.1 认证工具 (简化版)

**文件**: `lib/auth.ts`

```typescript
import { cookies } from 'next/headers';
import { db } from '@/lib/database/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// 简化的用户会话管理
export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * 获取当前用户会话
 * 注意: 这是一个简化版本，实际项目应使用 NextAuth, Clerk, Auth.js 等
 */
export async function auth(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return null;
    }

    // 解析 session cookie (简化: 假设包含用户 ID)
    const userId = sessionCookie.value;

    // 查询用户
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
      },
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

/**
 * 创建测试会话 (开发环境使用)
 */
export async function createTestSession(): Promise<AuthSession> {
  // 查找或创建测试用户
  const testEmail = 'test@example.com';

  let testUser = await db.query.users.findFirst({
    where: eq(users.email, testEmail),
  });

  if (!testUser) {
    const result = await db.insert(users).values({
      email: testEmail,
      name: '测试用户',
    }).returning();

    testUser = result[0];
  }

  return {
    user: {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name || '',
    },
  };
}
```

#### 4.1.2 查询执行 Action

**文件**: `src/lib/actions/query-action.ts`

```typescript
'use server';

import { DatabaseAgent } from '@/lib/agent/database-agent';
import { db } from '@/lib/database/client';
import { queryHistory } from '@/db/schema';
import { auth } from '@/lib/auth';

export interface QueryActionResult {
  data?: {
    result: string;
    steps: any[];
    sql?: string;
    data?: any[];
    usage?: { input: number; output: number };
  };
  error?: string;
}

/**
 * 执行查询并保存历史记录
 */
export async function executeQueryAction(
  formData: FormData
): Promise<QueryActionResult> {
  // 获取用户会话
  const session = await auth();

  // 开发环境: 如果没有会话，创建测试会话
  if (!session && process.env.NODE_ENV === 'development') {
    session = await createTestSession();
  }

  if (!session?.user?.id) {
    return { error: '未登录或会话已过期' };
  }

  // 获取查询内容
  const query = formData.get('query') as string;

  if (!query || query.trim().length === 0) {
    return { error: '查询内容不能为空' };
  }

  if (query.trim().length > 500) {
    return { error: '查询内容过长 (最大 500 字符)' };
  }

  try {
    // 创建智能体实例
    const agent = new DatabaseAgent();
    const startTime = Date.now();

    // 执行查询
    const result = await agent.executeQuery(query);

    const executionTime = Date.now() - startTime;

    // 保存到历史记录
    await db.insert(queryHistory).values({
      userId: session.user.id,
      naturalLanguageQuery: query,
      generatedSql: result.sql || null,
      result: result.data || null,
      reactTrace: result.steps,
      executionTimeMs: executionTime,
      status: result.sql ? 'completed' : 'no_sql',
    });

    return { data: result };

  } catch (error) {
    console.error('Query execution error:', error);

    // 保存错误记录
    await db.insert(queryHistory).values({
      userId: session.user.id,
      naturalLanguageQuery: query,
      status: 'error',
      reactTrace: [{ thought: String(error) }],
    });

    return { error: String(error) };
  }
}

/**
 * 获取查询历史
 */
export async function getQueryHistoryAction(
  page: number = 1,
  limit: number = 20
): Promise<{
  data?: any[];
  error?: string;
  pagination?: { page: number; limit: number; total: number; pages: number };
}> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: '未登录' };
  }

  try {
    // 获取总数
    const totalResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM query_history WHERE user_id = ${session.user.id}`
    );
    const total = Number(totalResult[0].count);

    // 获取分页数据
    const history = await db.query.queryHistory.findMany({
      where: (table, { eq }) => eq(table.userId, session.user.id),
      orderBy: (table, { desc }) => desc(table.createdAt),
      limit,
      offset: (page - 1) * limit,
    });

    return {
      data: history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return { error: String(error) };
  }
}

/**
 * 获取单条查询详情
 */
export async function getQueryDetailAction(
  queryId: string
): Promise<{
  data?: any;
  error?: string;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: '未登录' };
  }

  try {
    const query = await db.query.queryHistory.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.id, queryId),
          eq(table.userId, session.user.id)
        ),
    });

    if (!query) {
      return { error: '查询记录不存在或无权限访问' };
    }

    return { data: query };
  } catch (error) {
    return { error: String(error) };
  }
}
```

#### 4.1.3 辅助类型定义

**文件**: `src/lib/actions/types.ts`

```typescript
// Server Actions 通用响应类型
export interface ServerActionResponse<T = any> {
  data?: T;
  error?: string;
  success?: boolean;
}

// 查询历史类型
export interface QueryHistoryItem {
  id: string;
  userId: string;
  naturalLanguageQuery: string;
  generatedSql?: string;
  result?: any[];
  reactTrace?: any[];
  executionTimeMs?: number;
  status: string;
  createdAt: Date;
}
```

---

### 任务 4.2: API 路由端点

#### 目标
创建 RESTful API 端点，支持外部调用。

#### 4.2.1 查询 API 端点

**文件**: `src/app/api/query/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAgent } from '@/lib/agent/database-agent';
import { auth } from '@/lib/auth';
import { db } from '@/lib/database/client';
import { queryHistory } from '@/db/schema';

/**
 * POST /api/query
 * 执行数据库查询
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 认证验证
    const session = await auth();

    // 开发环境: 允许测试
    if (!session && process.env.NODE_ENV === 'development') {
      // 可选: 允许 API Key 认证
      const apiKey = request.headers.get('x-api-key');
      if (apiKey === process.env.TEST_API_KEY) {
        // 创建临时会话
      } else {
        return NextResponse.json(
          { error: '未授权 - 需要登录或 API Key' },
          { status: 401 }
        );
      }
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权 - 需要登录' },
        { status: 401 }
      );
    }

    // 2. 解析请求体
    const body = await request.json();
    const { query } = body;

    // 3. 验证请求
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '无效的请求 - 缺少 query 参数' },
        { status: 400 }
      );
    }

    if (query.trim().length === 0 || query.trim().length > 500) {
      return NextResponse.json(
        { error: '查询内容无效 (长度限制: 1-500 字符)' },
        { status: 400 }
      );
    }

    // 4. 执行查询
    const agent = new DatabaseAgent();
    const startTime = Date.now();

    const result = await agent.executeQuery(query);
    const executionTime = Date.now() - startTime;

    // 5. 保存历史记录
    await db.insert(queryHistory).values({
      userId: session.user.id,
      naturalLanguageQuery: query,
      generatedSql: result.sql || null,
      result: result.data || null,
      reactTrace: result.steps,
      executionTimeMs: executionTime,
      status: result.sql ? 'completed' : 'no_sql',
    });

    // 6. 返回结果
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/query
 * 获取查询历史
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 获取历史记录
    const history = await db.query.queryHistory.findMany({
      where: (table, { eq }) => eq(table.userId, session.user.id),
      orderBy: (table, { desc }) => desc(table.createdAt),
      limit,
      offset: (page - 1) * limit,
    });

    // 获取总数
    const totalResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM query_history WHERE user_id = ${session.user.id}`
    );
    const total = Number(totalResult[0].count);

    return NextResponse.json({
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/query/:id
 * 删除查询记录
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const { id } = params;

    // 验证权限并删除
    const result = await db.delete(queryHistory)
      .where(
        and(
          eq(queryHistory.id, id),
          eq(queryHistory.userId, session.user.id)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: '记录不存在或无权限' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });

  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
```

#### 4.2.2 API 文档

**文件**: `src/app/api/README.md`

```markdown
# API 文档

## 认证
所有 API 需要用户登录或提供 API Key。

## 端点

### POST /api/query
执行数据库查询

**请求体**:
```json
{
  "query": "查询过去30天销售额最高的前5个产品"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "result": "最终回答文本",
    "steps": [...],
    "sql": "SELECT ...",
    "data": [...],
    "usage": { "input": 100, "output": 200 }
  },
  "metadata": {
    "executionTime": 1500,
    "timestamp": "2026-01-08T10:00:00Z"
  }
}
```

### GET /api/query
获取查询历史

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)

**响应**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### DELETE /api/query/:id
删除查询记录

**响应**:
```json
{
  "success": true,
  "message": "删除成功"
}
```

## 错误响应
```json
{
  "error": "错误描述",
  "details": "详细信息 (开发环境)"
}
```
```

---

## 🎯 验收标准

### 功能验收
- [ ] executeQueryAction 能执行查询并保存历史
- [ ] getQueryHistoryAction 能分页获取历史
- [ ] API POST /api/query 工作正常
- [ ] API GET /api/query 返回历史记录
- [ ] 认证和权限验证有效
- [ ] 错误处理完善

### 技术验收
- [ ] Server Actions 使用 'use server' 指令
- [ ] API 路由符合 Next.js App Router 规范
- [ ] 数据库操作使用 Drizzle ORM
- [ ] 响应格式统一
- [ ] 状态码使用正确

### 代码质量
- [ ] 类型定义完整
- [ ] 错误处理全面
- [ ] 日志记录完善
- [ ] 安全性考虑周全

---

## 📝 实施步骤

### 步骤 1: 创建认证工具
```bash
# 创建 lib/auth.ts
# (复制上面的代码)
```

### 步骤 2: 创建 Server Actions
```bash
mkdir -p src/lib/actions
# 创建 src/lib/actions/query-action.ts
# 创建 src/lib/actions/types.ts
# (复制上面的代码)
```

### 步骤 3: 创建 API 路由
```bash
mkdir -p src/app/api/query
# 创建 src/app/api/query/route.ts
# (复制上面的代码)
```

### 步骤 4: 添加 API 文档
```bash
# 创建 src/app/api/README.md
# (复制上面的代码)
```

### 步骤 5: 测试
```bash
# 测试 Server Action
# 1. 在浏览器中打开应用
# 2. 调用 executeQueryAction
# 3. 检查数据库记录

# 测试 API
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -H "Cookie: session=你的会话ID" \
  -d '{"query": "查询所有产品"}'

# 或使用测试 API Key
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -H "x-api-key: 测试Key" \
  -d '{"query": "查询所有产品"}'
```

---

## 🔍 常见问题

### Q: Server Action 报 "use server" 错误？
**A**: 确保文件顶部有 `'use server';` 指令

### Q: API 返回 401 未授权？
**A**: 检查认证逻辑，确保 session 或 API Key 验证正确

### Q: 数据库插入失败？
**A**: 检查外键约束，确保用户存在

### Q: 分页参数不生效？
**A**: 检查 offset 和 limit 计算是否正确

---

## 📚 相关文档

- **阶段 3**: `phase3-agent-core.md`
- **完整计划**: `nextjs-agent-app-v3.md`
- **任务列表**: `.spec-workflow/specs/nextjs-db-agent/tasks.md`

---

## ✅ 完成检查清单

在继续阶段 5 之前，请确认:

- [ ] Server Actions 能正常执行查询
- [ ] 历史记录正确保存到数据库
- [ ] API GET /api/query 返回历史
- [ ] API POST /api/query 执行查询
- [ ] 认证和权限验证工作正常
- [ ] 错误处理完善
- [ ] API 文档已创建

---

**阶段 4 完成后，继续 [阶段 5: 前端界面](phase5-frontend-ui.md)**

---
**文档版本**: v1.0
**创建时间**: 2026-01-08
**状态**: ✅ 待实施
