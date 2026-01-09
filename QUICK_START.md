# NextAuth v5 快速开始指南

## 🚀 一键迁移命令

```bash
# 1. 安装依赖（如果需要）
npm install next-auth @auth/drizzle-adapter bcryptjs

# 2. 执行数据库迁移
npx drizzle-kit push:pg --connection-string ${DATABASE_URL}

# 3. 创建环境变量文件
echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local

# 4. 启动开发服务器
npm run dev
```

---

## 📁 必须创建的文件

### 1. NextAuth 配置
**文件**: `src/lib/auth.ts`
```typescript
import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './database/client';
import { users, accounts, sessions, verificationTokens } from '@/db/schema';
import CredentialsProvider from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: DrizzleAdapter(db, { usersTable: users, accountsTable: accounts, sessionsTable: sessions, verificationTokensTable: verificationTokens }),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: { email: { label: '邮箱', type: 'email' }, password: { label: '密码', type: 'password' } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        // TODO: 实现密码验证逻辑
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.email = user.email; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { session.user.id = token.id as string; }
      return session;
    },
  },
});
```

### 2. API 路由
**文件**: `src/app/api/auth/[...nextauth]/route.ts`
```typescript
export { GET, POST } from '@/lib/auth';
```

### 3. 类型扩展
**文件**: `src/types/next-auth.d.ts`
```typescript
import NextAuth from 'next-auth';
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User extends DefaultUser { id: string; email: string; }
  interface Session { user: { id: string; email: string; } & DefaultSession['user']; }
}

declare module 'next-auth/jwt' { interface JWT extends DefaultJWT { id: string; email: string; } }
```

### 4. 中间件
**文件**: `src/middleware.ts`
```typescript
import { withAuth } from 'next-auth/middleware';

export default withAuth({ pages: { signIn: '/login' } });
export const config = { matcher: ['/dashboard/:path*', '/api/query/:path*'] };
```

### 5. 数据库 Schema 更新
**文件**: `db/schema.ts` (添加以下内容)
```typescript
// 新增表
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
}, (table) => [uniqueIndex('account_provider_idx').on(table.provider, table.providerAccountId)]);

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token').notNull().unique(),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier').notNull(),
  token: varchar('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => [uniqueIndex('identifier_token_idx').on(table.identifier, table.token)]);

// 更新 users 表（可选）
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email').notNull().unique(),
  name: varchar('name'),
  emailVerified: timestamp('email_verified'),  // 新增
  image: varchar('image'),                     // 新增
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 🔧 修改现有文件

### 1. 更新服务器动作
**文件**: `src/lib/actions/query-action.ts`
```typescript
import { auth } from '@/lib/auth';  // ✅ 替换自定义 auth

export async function executeQueryAction(formData: FormData) {
  const session = await auth();  // ✅ 使用 NextAuth
  if (!session?.user?.id) return { error: '未登录' };

  // ... 其余逻辑保持不变，使用 session.user.id
}
```

### 2. 更新 API 路由
**文件**: `src/app/api/query/route.ts`
```typescript
import { auth } from '@/lib/auth';  // ✅ 替换自定义 auth

export async function POST(request: Request) {
  const session = await auth();  // ✅ 使用 NextAuth
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  // ... 其余逻辑保持不变
}
```

### 3. 更新根布局
**文件**: `src/app/layout.tsx`
```typescript
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

---

## 🎨 登录页面示例

**文件**: `src/app/login/page.tsx`
```typescript
'use client';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn('credentials', {
      email, password, redirect: false, callbackUrl: '/dashboard'
    });

    if (result?.error) {
      setError('登录失败');
    } else if (result?.url) {
      router.push(result.url);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 to-blue-600">
      <div className="glass p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 gradient-text">欢迎回来</h1>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="邮箱"
            className="w-full px-4 py-2 rounded-lg border"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="密码"
            className="w-full px-4 py-2 rounded-lg border"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-semibold">
            登录
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## ✅ 验证清单

迁移完成后，按以下顺序验证：

1. **数据库检查**
   ```sql
   -- 确认新表已创建
   SELECT table_name FROM information_schema.tables
   WHERE table_name IN ('accounts', 'sessions', 'verification_tokens');
   ```

2. **API 验证**
   ```bash
   curl -X POST http://localhost:3000/api/auth/signin
   # 应该返回登录页面 HTML
   ```

3. **登录测试**
   - 访问 `/login`
   - 使用测试账号登录
   - 检查会话是否保持

4. **受保护路由测试**
   - 访问 `/dashboard`（未登录应重定向）
   - 登录后访问应正常

5. **API 认证测试**
   ```bash
   curl -X POST http://localhost:3000/api/query \
     -H "Cookie: session=your_session_token" \
     -d '{"query": "SELECT 1"}'
   ```

---

## 🐛 常见问题

### Q: 登录后仍然显示未认证
**A**: 检查 `session` 回调是否正确设置 `user.id`

### Q: 密码验证失败
**A**: 确保在注册时使用 `bcrypt.hash()` 哈希密码，并在 `authorize` 中使用 `bcrypt.compare()` 验证

### Q: 类型错误 "session.user.id 不存在"
**A**: 确保 `src/types/next-auth.d.ts` 已正确配置并被 TypeScript 识别

### Q: 中间件不工作
**A**: 检查 `matcher` 模式是否匹配目标路由，确保 `middleware.ts` 在项目根目录

---

## 📞 获取帮助

如果遇到问题：
1. 查看 `NEXTAUTH_MIGRATION_PLAN.md` 获取详细说明
2. 检查 NextAuth 官方文档：https://authjs.dev/
3. 查看控制台错误信息
4. 确保所有环境变量已正确设置

---

**准备好了吗？** 从步骤 1 开始，按顺序执行每个阶段！