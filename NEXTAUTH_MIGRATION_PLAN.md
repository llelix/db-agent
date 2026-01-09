# NextAuth v5 迁移计划文档

## 📋 项目概述

当前项目使用自定义认证系统 (`lib/auth.ts`)，需要迁移到 NextAuth v5 以获得更完整的认证功能、OAuth 支持、会话管理和安全性。

---

## 🎯 迁移目标

1. ✅ 替换自定义 auth.js 为 NextAuth v5
2. ✅ 保持现有用户数据兼容性
3. ✅ 支持邮箱密码登录（保持现有功能）
4. ✅ 为未来 OAuth 扩展预留能力
5. ✅ 自动会话管理和中间件保护
6. ✅ 类型安全的认证状态

---

## 📊 当前系统分析

### 现有认证系统 (`lib/auth.ts`)

```typescript
// 当前实现：手动 Cookie 管理
export async function auth(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  // 手动解析、查询用户、错误处理
}

// 开发环境测试用户
export async function createTestSession(): Promise<AuthSession> {
  // 自动创建 test@example.com 用户
}
```

### 数据库结构 (`db/schema.ts`)

```typescript
// 现有 users 表（兼容 NextAuth）
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email').notNull().unique(),
  name: varchar('name'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 使用认证的文件

1. **API 路由**: `src/app/api/query/route.ts`
2. **服务器动作**: `src/lib/actions/query-action.ts`

---

## 🗄️ NextAuth v5 数据库需求

NextAuth v5 需要以下表（使用 Drizzle ORM）：

### 1. 扩展现有 users 表（可选）

```typescript
// db/schema.ts - 更新 users 表
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email').notNull().unique(),
  name: varchar('name'),
  emailVerified: timestamp('email_verified'),  // 新增：用于邮箱验证
  image: varchar('image'),                     // 新增：用户头像
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 2. 新增 accounts 表（用于 OAuth 和凭证）

```typescript
// db/schema.ts - 新增
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type').$type<'credentials' | 'email' | 'oauth'>().notNull(),
  provider: varchar('provider').notNull(),
  providerAccountId: varchar('provider_account_id').notNull(),
  refresh_token: varchar('refresh_token'),
  access_token: varchar('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type'),
  scope: varchar('scope'),
  id_token: text('id_token'),
  session_state: varchar('session_state'),
}, (table) => [
  uniqueIndex('account_provider_idx').on(table.provider, table.providerAccountId),
]);
```

### 3. 新增 sessions 表（会话管理）

```typescript
// db/schema.ts - 新增
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token').notNull().unique(),
  expires: timestamp('expires').notNull(),
});
```

### 4. 新增 verification_tokens 表（邮箱验证）

```typescript
// db/schema.ts - 新增
export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier').notNull(),
  token: varchar('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => [
  uniqueIndex('identifier_token_idx').on(table.identifier, table.token),
]);
```

---

## 📁 需要修改的文件清单

### ✅ 新增文件

| 文件路径 | 用途 | 优先级 |
|---------|------|--------|
| `src/lib/auth.ts` | NextAuth 配置和适配器 | 🔴 高 |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API 路由 | 🔴 高 |
| `src/middleware.ts` | 路由保护中间件 | 🟡 中 |
| `src/app/(auth)/login/page.tsx` | 登录页面 | 🟡 中 |
| `src/app/(auth)/signup/page.tsx` | 注册页面 | 🟡 中 |
| `src/components/auth-form.tsx` | 统一认证表单组件 | 🟢 低 |

### ✅ 修改文件

| 文件路径 | 修改内容 | 优先级 |
|---------|----------|--------|
| `db/schema.ts` | 添加 NextAuth 所需字段和表 | 🔴 高 |
| `src/lib/actions/query-action.ts` | 使用 `auth()` 替换自定义认证 | 🔴 高 |
| `src/app/api/query/route.ts` | 使用 `auth()` 替换自定义认证 | 🔴 高 |
| `src/app/layout.tsx` | 添加 SessionProvider | 🟡 中 |
| `package.json` | 更新依赖（如果需要） | 🟢 低 |
| `tsconfig.json` | 添加类型扩展 | 🟢 低 |

---

## 🔧 详细实施步骤

### 阶段 1: 数据库迁移

#### 步骤 1.1: 更新数据库 schema

```typescript
// db/schema.ts
import { pgTable, uuid, varchar, timestamp, integer, text, uniqueIndex } from 'drizzle-orm/pg-core';

// 保留现有 users 表，添加新字段
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email').notNull().unique(),
  name: varchar('name'),
  emailVerified: timestamp('email_verified'),  // ✅ 新增
  image: varchar('image'),                     // ✅ 新增
  createdAt: timestamp('created_at').defaultNow(),
});

// ✅ 新增：账户表（OAuth/凭证）
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type').$type<'credentials' | 'email' | 'oauth'>().notNull(),
  provider: varchar('provider').notNull(),
  providerAccountId: varchar('provider_account_id').notNull(),
  refresh_token: varchar('refresh_token'),
  access_token: varchar('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type'),
  scope: varchar('scope'),
  id_token: text('id_token'),
  session_state: varchar('session_state'),
}, (table) => [
  uniqueIndex('account_provider_idx').on(table.provider, table.providerAccountId),
]);

// ✅ 新增：会话表
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token').notNull().unique(),
  expires: timestamp('expires').notNull(),
});

// ✅ 新增：验证令牌表
export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier').notNull(),
  token: varchar('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => [
  uniqueIndex('identifier_token_idx').on(table.identifier, table.token),
]);

// 导出类型用于 Drizzle 查询
export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
```

#### 步骤 1.2: 生成并执行迁移

```bash
# 生成迁移文件
npx drizzle-kit generate:pg --out ./db/migrations --schema ./db/schema.ts

# 执行迁移
npx drizzle-kit push:pg --connection-string ${DATABASE_URL}
```

---

### 阶段 2: NextAuth 配置

#### 步骤 2.1: 创建 NextAuth 配置文件

```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './database/client';
import {
  users,
  accounts,
  sessions,
  verificationTokens
} from '@/db/schema';
import CredentialsProvider from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: 'jwt', // 使用 JWT 以获得更好的性能
  },
  pages: {
    signIn: '/login',    // 自定义登录页面路径
    signUp: '/signup',   // 自定义注册页面路径
  },
  providers: [
    // 凭证提供者（邮箱密码）
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // 查找用户
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          // 开发环境：自动创建测试用户
          if (process.env.NODE_ENV === 'development' && email === 'test@example.com') {
            const hashedPassword = await bcrypt.hash('test123', 10);
            const [newUser] = await db.insert(users).values({
              email,
              name: '测试用户',
              // 注意：NextAuth 会通过 accounts 表处理密码
            }).returning();

            // 这里需要额外处理密码存储，见下文说明
            return newUser;
          }
          return null;
        }

        // 验证密码（需要在 users 表添加 password 字段或使用 accounts 表）
        // const isValid = await bcrypt.compare(password, user.password);
        // if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    // JWT 回调：添加自定义字段到 token
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    // Session 回调：使字段在客户端可用
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
});
```

#### 步骤 2.2: 创建 API 路由

```typescript
// src/app/api/auth/[...nextauth]/route.ts
export { GET, POST } from '@/lib/auth';
```

---

### 阶段 3: 类型扩展

#### 步骤 3.1: NextAuth 类型增强

```typescript
// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

// 扩展 User 类型
declare module 'next-auth' {
  interface User extends DefaultUser {
    id: string;
    email: string;
    name?: string;
    image?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
    } & DefaultSession['user'];
  }
}

// 扩展 JWT 类型
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  }
}
```

---

### 阶段 4: 中间件配置

#### 步骤 4.1: 创建路由保护中间件

```typescript
// src/middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',  // 未登录时重定向到登录页
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',      // 保护仪表板
    '/api/query/:path*',      // 保护 API
    '/app/(protected)/:path*', // 保护受保护路由
  ],
};
```

---

### 阶段 5: 更新现有代码

#### 步骤 5.1: 更新服务器动作

```typescript
// src/lib/actions/query-action.ts
import { auth } from '@/lib/auth';  // ✅ 使用 NextAuth 的 auth

export async function executeQueryAction(formData: FormData) {
  // ✅ 替换自定义认证
  const session = await auth();

  if (!session?.user?.id) {
    return { error: '未登录或会话已过期' };
  }

  const query = formData.get('query') as string;

  // ✅ 移除开发环境测试用户逻辑（NextAuth 处理）
  // ✅ 移除 createTestSession() 调用

  if (!query || query.trim().length === 0) {
    return { error: '查询内容不能为空' };
  }

  try {
    const agent = new DatabaseAgent();
    const startTime = Date.now();
    const result = await agent.executeQuery(query);
    const executionTime = Date.now() - startTime;

    // ✅ 使用 session.user.id
    await db.insert(queryHistory).values({
      userId: session.user.id,  // 直接使用 session 中的用户 ID
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

    await db.insert(queryHistory).values({
      userId: session.user.id,
      naturalLanguageQuery: query,
      status: 'error',
      reactTrace: [{ thought: String(error) }],
    });

    return { error: String(error) };
  }
}

// ✅ 更新 getQueryHistoryAction
export async function getQueryHistoryAction(page: number = 1, limit: number = 20) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: '未登录' };
  }

  try {
    const totalResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM query_history WHERE user_id = ${session.user.id}`
    );
    const total = Number(totalResult[0]?.count || 0);

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

// ✅ 更新 getQueryDetailAction
export async function getQueryDetailAction(queryId: string) {
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

#### 步骤 5.2: 更新 API 路由

```typescript
// src/app/api/query/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';  // ✅ 使用 NextAuth

export async function POST(request: Request) {
  // ✅ 替换自定义认证
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: '未登录或会话已过期' },
      { status: 401 }
    );
  }

  try {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: '查询内容不能为空' },
        { status: 400 }
      );
    }

    const agent = new DatabaseAgent();
    const startTime = Date.now();
    const result = await agent.executeQuery(query);
    const executionTime = Date.now() - startTime;

    // 保存历史记录
    await db.insert(queryHistory).values({
      userId: session.user.id,  // ✅ 使用 session.user.id
      naturalLanguageQuery: query,
      generatedSql: result.sql || null,
      result: result.data || null,
      reactTrace: result.steps,
      executionTimeMs: executionTime,
      status: result.sql ? 'completed' : 'no_sql',
    });

    return NextResponse.json({
      data: result,
      executionTime,
    });
  } catch (error) {
    console.error('Query execution error:', error);

    // 保存错误记录
    const { query } = await request.json();
    await db.insert(queryHistory).values({
      userId: session.user.id,
      naturalLanguageQuery: query,
      status: 'error',
      reactTrace: [{ thought: String(error) }],
    });

    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
```

---

### 阶段 6: 前端集成

#### 步骤 6.1: 更新根布局

```typescript
// src/app/layout.tsx
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

#### 步骤 6.2: 创建登录页面

```typescript
// src/app/(auth)/login/page.tsx
'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (result?.error) {
        setError('登录失败，请检查邮箱和密码');
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (err) {
      setError('登录出错，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 to-blue-600">
      <div className="glass p-8 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <h1 className="text-3xl font-bold text-center mb-6 gradient-text">
          欢迎回来
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>测试账号: test@example.com / test123</p>
          <p className="mt-2">
            还没有账号？{' '}
            <a href="/signup" className="text-violet-600 hover:underline">
              立即注册
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

#### 步骤 6.3: 创建注册页面

```typescript
// src/app/(auth)/signup/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import bcrypt from 'bcryptjs';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 检查用户是否已存在
      const existingUser = await fetch('/api/auth/check-email', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }).then(res => res.json());

      if (existingUser.exists) {
        setError('该邮箱已被注册');
        setLoading(false);
        return;
      }

      // 创建用户（这里需要调用服务器动作）
      const hashedPassword = await bcrypt.hash(password, 10);

      // TODO: 创建服务器动作来处理用户注册
      // await signupAction({ name, email, password: hashedPassword });

      router.push('/login?registered=true');
    } catch (err) {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 to-blue-600">
      <div className="glass p-8 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <h1 className="text-3xl font-bold text-center mb-6 gradient-text">
          创建账号
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">姓名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            已有账号？{' '}
            <a href="/login" className="text-violet-600 hover:underline">
              立即登录
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

#### 步骤 6.4: 创建用户菜单组件

```typescript
// src/components/user-menu.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (status === 'loading') {
    return <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-full"></div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white font-bold">
          {session.user.name?.[0] || session.user.email[0].toUpperCase()}
        </div>
        <span className="text-sm font-medium hidden sm:block">
          {session.user.name || session.user.email}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 glass rounded-lg shadow-xl z-50 animate-fade-in">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium">{session.user.name}</p>
              <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
            >
              退出登录
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

---

### 阶段 7: 环境变量配置

#### 步骤 7.1: 更新环境变量

```bash
# .env.local
# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000          # 生产环境改为域名
NEXTAUTH_SECRET=your-secret-key-here        # 生成强随机密钥

# 数据库连接（已存在）
DATABASE_URL=postgres://user:pass@localhost:5432/dbname

# 可选：OAuth 提供者（未来扩展）
# GITHUB_CLIENT_ID=your_github_client_id
# GITHUB_CLIENT_SECRET=your_github_client_secret
```

生成密钥：
```bash
# 生成 NEXTAUTH_SECRET
openssl rand -base64 32
```

---

## 🧪 测试计划

### 单元测试

```typescript
// __tests__/auth.test.ts
import { auth, signIn, signOut } from '@/lib/auth';
import { describe, it, expect } from 'vitest';

describe('NextAuth 集成', () => {
  it('应该正确处理用户登录', async () => {
    const session = await auth();
    expect(session).toBeDefined();
  });

  it('应该返回正确的用户信息', async () => {
    const session = await auth();
    if (session) {
      expect(session.user.id).toBeDefined();
      expect(session.user.email).toBeDefined();
    }
  });
});
```

### 集成测试

```typescript
// __tests__/query-action.test.ts
import { executeQueryAction } from '@/lib/actions/query-action';

describe('查询动作认证', () => {
  it('未登录用户应该被拒绝', async () => {
    const formData = new FormData();
    formData.append('query', 'SELECT * FROM users');

    const result = await executeQueryAction(formData);
    expect(result.error).toContain('未登录');
  });
});
```

### E2E 测试

```bash
# 使用 Playwright 或 Cypress
npx playwright test auth-flow
```

---

## 🔄 回滚计划

如果迁移失败，可以快速回滚：

1. **恢复数据库**：使用迁移前的备份
2. **恢复代码**：使用 Git 回滚到之前的 commit
3. **恢复配置**：还原 `lib/auth.ts` 和相关文件

---

## 📝 迁移检查清单

### ✅ 准备阶段
- [ ] 备份当前数据库
- [ ] 备份当前代码
- [ ] 生成 `NEXTAUTH_SECRET`
- [ ] 更新 `.env.local`

### ✅ 数据库阶段
- [ ] 更新 `db/schema.ts` 添加新表
- [ ] 生成迁移文件
- [ ] 执行数据库迁移
- [ ] 验证新表结构

### ✅ 配置阶段
- [ ] 创建 `src/lib/auth.ts` (NextAuth 配置)
- [ ] 创建 API 路由 `src/app/api/auth/[...nextauth]/route.ts`
- [ ] 添加类型定义 `src/types/next-auth.d.ts`
- [ ] 创建中间件 `src/middleware.ts`

### ✅ 代码更新阶段
- [ ] 更新 `src/lib/actions/query-action.ts`
- [ ] 更新 `src/app/api/query/route.ts`
- [ ] 更新 `src/app/layout.tsx` 添加 SessionProvider
- [ ] 移除旧的 `lib/auth.ts`（备份后删除）

### ✅ 前端阶段
- [ ] 创建登录页面 `/login`
- [ ] 创建注册页面 `/signup`
- [ ] 创建用户菜单组件
- [ ] 更新需要认证的页面

### ✅ 测试阶段
- [ ] 测试登录流程
- [ ] 测试注册流程
- [ ] 测试受保护路由
- [ ] 测试 API 认证
- [ ] 测试会话保持
- [ ] 测试退出登录

### ✅ 部署阶段
- [ ] 更新环境变量
- [ ] 运行构建测试
- [ ] 部署到预览环境
- [ ] 全面功能测试
- [ ] 部署到生产环境

---

## ⚠️ 注意事项

### 1. 密码处理
NextAuth 的 CredentialsProvider 不自动处理密码哈希。需要：
- 在注册时手动哈希密码
- 在 authorize 回调中验证哈希
- 或者使用自定义数据库会话策略

### 2. 开发环境测试用户
当前系统会自动创建 `test@example.com`。NextAuth 迁移后：
- 需要手动创建测试用户，或
- 在登录页面提供"快速测试"按钮

### 3. 数据迁移
现有用户数据可以直接使用，但：
- 如果使用密码登录，需要在 `accounts` 表添加凭证记录
- 建议在迁移后要求用户重置密码

### 4. 类型安全
确保所有使用 `session` 的地方都正确处理可能为 `null` 的情况：
```typescript
const session = await auth();
if (!session?.user?.id) {
  return { error: '未登录' };
}
```

### 5. 中间件配置
中间件会保护指定路由，但：
- API 路由需要单独处理 401 响应
- 客户端组件需要使用 `useSession` 检查状态

---

## 🚀 优势总结

完成迁移后，你将获得：

✅ **更好的安全性** - 专业的会话管理和令牌处理
✅ **OAuth 支持** - 轻松添加 GitHub、Google 等登录
✅ **邮箱验证** - 内置的邮箱验证系统
✅ **自动刷新** - 会话自动续期
✅ **类型安全** - 完整的 TypeScript 支持
✅ **中间件保护** - 声明式的路由保护
✅ **开发者体验** - 标准化的认证流程
✅ **社区支持** - 庞大的 NextAuth 生态系统

---

## 📚 参考资料

- [NextAuth v5 官方文档](https://authjs.dev/)
- [NextAuth Drizzle 适配器](https://authjs.dev/reference/adapter/drizzle)
- [NextAuth 中间件文档](https://authjs.dev/guides/protecting-resources)
- [Drizzle ORM 文档](https://orm.drizzle.team/)

---

**文档版本**: v1.0
**创建日期**: 2026-01-09
**最后更新**: 2026-01-09
**适用版本**: NextAuth v5, Next.js 16+, Drizzle ORM