# NextAuth v5 实施检查清单

## 📋 执行顺序

请严格按照以下顺序执行，每完成一项请打勾 ✅

---

## 阶段 1: 数据库准备 (预计时间: 10分钟)

- [ ] **1.1** 备份当前数据库
  ```bash
  pg_dump ${DATABASE_URL} > backup_$(date +%Y%m%d).sql
  ```

- [ ] **1.2** 更新 `db/schema.ts` 文件
  - [ ] 添加 `accounts` 表定义
  - [ ] 添加 `sessions` 表定义
  - [ ] 添加 `verificationTokens` 表定义
  - [ ] 可选：更新 `users` 表添加 `emailVerified` 和 `image` 字段

- [ ] **1.3** 生成迁移文件
  ```bash
  npx drizzle-kit generate:pg --out ./db/migrations --schema ./db/schema.ts
  ```

- [ ] **1.4** 执行数据库迁移
  ```bash
  npx drizzle-kit push:pg --connection-string ${DATABASE_URL}
  ```

- [ ] **1.5** 验证数据库结构
  ```sql
  -- 在数据库中执行
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_name IN ('accounts', 'sessions', 'verification_tokens', 'users')
  ORDER BY table_name, ordinal_position;
  ```

**✅ 阶段 1 完成**: 数据库已准备好接收 NextAuth 数据

---

## 阶段 2: 环境配置 (预计时间: 5分钟)

- [ ] **2.1** 生成 NextAuth 密钥
  ```bash
  openssl rand -base64 32
  # 复制输出的密钥
  ```

- [ ] **2.2** 更新 `.env.local` 文件
  ```bash
  # 添加以下内容
  NEXTAUTH_URL=http://localhost:3000
  NEXTAUTH_SECRET=粘贴你生成的密钥
  ```

- [ ] **2.3** 验证环境变量
  ```bash
  echo $NEXTAUTH_URL
  echo $NEXTAUTH_SECRET
  ```

**✅ 阶段 2 完成**: 环境变量已配置

---

## 阶段 3: 创建 NextAuth 核心文件 (预计时间: 15分钟)

- [ ] **3.1** 创建 `src/lib/auth.ts`
  - [ ] 导入所有依赖
  - [ ] 配置 DrizzleAdapter
  - [ ] 配置 CredentialsProvider
  - [ ] 配置 JWT 回调
  - [ ] 配置 Session 回调
  - [ ] 导出 auth, signIn, signOut, GET, POST

- [ ] **3.2** 创建 `src/app/api/auth/[...nextauth]/route.ts`
  ```typescript
  export { GET, POST } from '@/lib/auth';
  ```

- [ ] **3.3** 创建 `src/types/next-auth.d.ts`
  - [ ] 扩展 User 类型
  - [ ] 扩展 Session 类型
  - [ ] 扩展 JWT 类型

- [ ] **3.4** 创建 `src/middleware.ts`
  - [ ] 配置 withAuth
  - [ ] 设置保护路由
  - [ ] 配置重定向

**✅ 阶段 3 完成**: NextAuth 核心配置已就绪

---

## 阶段 4: 更新现有代码 (预计时间: 10分钟)

- [ ] **4.1** 更新 `src/lib/actions/query-action.ts`
  - [ ] 导入 `auth` 从 `@/lib/auth`
  - [ ] 替换 `auth()` 调用
  - [ ] 替换 `sessionData.user.id` 为 `session.user.id`
  - [ ] 移除 `createTestSession()` 调用
  - [ ] 移除开发环境测试用户逻辑

- [ ] **4.2** 更新 `src/app/api/query/route.ts`
  - [ ] 导入 `auth` 从 `@/lib/auth`
  - [ ] 替换 `auth()` 调用
  - [ ] 更新错误响应状态码（401 未授权）
  - [ ] 移除旧认证逻辑

- [ ] **4.3** 更新 `src/app/layout.tsx`
  - [ ] 导入 `SessionProvider`
  - [ ] 包裹 `children` 在 `<SessionProvider>` 中

**✅ 阶段 4 完成**: 现有代码已更新为使用 NextAuth

---

## 阶段 5: 创建认证页面 (预计时间: 20分钟)

- [ ] **5.1** 创建登录页面 `src/app/login/page.tsx`
  - [ ] 表单组件（use client）
  - [ ] email 和 password 输入框
  - [ ] 错误处理
  - [ ] `signIn('credentials')` 调用
  - [ ] 重定向逻辑
  - [ ] UI 样式（使用现有 glass/gradient 类）

- [ ] **5.2** 创建注册页面 `src/app/signup/page.tsx`（可选）
  - [ ] 姓名、邮箱、密码输入
  - [ ] 密码哈希处理
  - [ ] 用户创建逻辑
  - [ ] 成功后重定向到登录

- [ ] **5.3** 创建用户菜单组件 `src/components/user-menu.tsx`
  - [ ] 使用 `useSession` 钩子
  - [ ] 显示用户信息
  - [ ] 退出登录按钮
  - [ ] 下拉菜单 UI

**✅ 阶段 5 完成**: 认证 UI 已创建

---

## 阶段 6: 测试验证 (预计时间: 15分钟)

- [ ] **6.1** 启动开发服务器
  ```bash
  npm run dev
  ```

- [ ] **6.2** 测试登录流程
  - [ ] 访问 `/login`
  - [ ] 输入测试账号
  - [ ] 检查是否成功登录
  - [ ] 检查会话是否保持

- [ ] **6.3** 测试受保护路由
  - [ ] 未登录时访问 `/dashboard` → 应重定向到 `/login`
  - [ ] 登录后访问 `/dashboard` → 应正常显示

- [ ] **6.4** 测试 API 认证
  - [ ] 调用 `/api/query` 未登录 → 返回 401
  - [ ] 登录后调用 → 正常响应

- [ ] **6.5** 测试会话保持
  - [ ] 刷新页面
  - [ ] 关闭重开浏览器
  - [ ] 检查会话是否仍然有效

- [ ] **6.6** 测试退出登录
  - [ ] 点击退出
  - [ ] 检查是否重定向到登录页
  - [ ] 检查会话是否清除

**✅ 阶段 6 完成**: 所有功能测试通过

---

## 阶段 7: 代码清理 (预计时间: 5分钟)

- [ ] **7.1** 备份旧的 `lib/auth.ts`
  ```bash
  cp lib/auth.ts lib/auth.ts.backup
  ```

- [ ] **7.2** 删除旧认证文件（确认新系统工作正常后）
  - [ ] 删除 `lib/auth.ts.backup`
  - [ ] 删除任何其他旧认证相关文件

- [ ] **7.3** 检查代码中是否还有旧认证引用
  ```bash
  grep -r "createTestSession" src/
  grep -r "sessionData" src/
  ```

**✅ 阶段 7 完成**: 代码清理完成

---

## 阶段 8: 生产部署准备 (预计时间: 10分钟)

- [ ] **8.1** 更新生产环境变量
  - [ ] `NEXTAUTH_URL` 改为生产域名（如 `https://yourapp.com`）
  - [ ] 确保 `NEXTAUTH_SECRET` 使用强密钥

- [ ] **8.2** 运行构建测试
  ```bash
  npm run build
  npm start
  ```

- [ ] **8.3** 生产环境测试
  - [ ] 登录流程
  - [ ] 受保护路由
  - [ ] API 认证

- [ ] **8.4** 创建部署文档
  - [ ] 记录环境变量
  - [ ] 记录数据库迁移步骤
  - [ ] 记录回滚步骤

**✅ 阶段 8 完成**: 生产部署准备就绪

---

## 🎉 全部完成！

如果所有检查项都已完成，恭喜你！NextAuth v5 迁移成功！

### 📊 统计信息

- **总阶段数**: 8
- **总任务数**: 35+
- **预计总时间**: 80-90分钟
- **复杂度**: 中等

### 🆘 遇到问题？

1. 查看 `NEXTAUTH_MIGRATION_PLAN.md` 获取详细说明
2. 检查控制台错误信息
3. 确认数据库迁移成功
4. 验证环境变量设置正确
5. 检查类型定义是否被 TypeScript 识别

---

**开始时间**: ______________
**完成时间**: ______________
**执行者**: ______________

**状态**: ⬜ 未开始 | 🟡 进行中 | ✅ 已完成