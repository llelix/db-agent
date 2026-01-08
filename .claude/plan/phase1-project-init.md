# 阶段 1: 项目初始化 (Day 1)

**项目名称**: 基于 ReAct 模式的自然语言数据库智能体
**阶段目标**: 完成基础环境搭建和依赖安装
**预计时间**: 1 天 (0.5 天开发 + 0.5 天配置)

---

## 📋 本阶段任务

### 任务 1.1: 安装核心依赖

#### 目标
安装所有必需的依赖包，为后续开发奠定基础。

#### 依赖清单

**AI 智能体核心**:
```bash
npm install @anthropic-ai/claude-sdk@^0.27.0  # Anthropic 官方 SDK
npm install zod@^3.24.0                        # 参数验证
npm install dotenv@^16.4.5                     # 环境变量管理
```

**数据库**:
```bash
npm install drizzle-orm@^0.38.0               # Drizzle ORM
npm install postgres@^3.4.5                   # PostgreSQL 客户端
npm install -D drizzle-kit@^0.28.0            # Drizzle 工具
```

**UI 与工具库**:
```bash
npm install next-themes@^0.4.0                # 主题管理
npm install lucide-react@^0.468.0             # 图标库
npm install class-variance-authority@^0.7.0   # CSS 变量
npm install clsx@^2.1.1                       # 类名合并
npm install tailwind-merge@^2.5.5             # Tailwind 工具
```

**测试**:
```bash
npm install -D vitest@^2.1.8                  # 测试框架
npm install -D @testing-library/react@^16.1.0 # React 测试
```

#### 验证步骤
```bash
# 检查安装结果
npm list @anthropic-ai/claude-sdk drizzle-orm next-themes

# 检查是否有安全漏洞
npm audit

# 验证 TypeScript 类型
npx tsc --noEmit
```

#### 预期结果
- ✅ `package.json` 包含所有依赖
- ✅ 无安装错误
- ✅ 无严重安全漏洞
- ✅ TypeScript 类型检查通过

---

### 任务 1.2: 配置环境和 TypeScript

#### 目标
配置开发环境、TypeScript 严格模式和 Next.js 实验特性。

#### 1.2.1 环境变量配置

**文件**: `.env.local`

```env
# Anthropic API Key (从 https://console.anthropic.com 获取)
ANTHROPIC_API_KEY=sk-ant-api03-...

# PostgreSQL 数据库连接
DATABASE_URL=postgresql://postgres:ai_knowledge_pw@localhost:5432/ai_knowledge_db

# 可选: API Base URL (如果需要代理)
ANTHROPIC_BASE_URL=https://api.anthropic.com
```

**安全提示**:
- 🔒 不要提交 `.env.local` 到 Git
- 🔒 在 `.gitignore` 中添加 `.env.local`
- 🔒 使用环境变量管理工具 (如 Vercel, Railway)

#### 1.2.2 TypeScript 配置

**文件**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@db/*": ["./db/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**关键配置**:
- ✅ `"strict": true` - 启用严格模式
- ✅ `"baseUrl": "."` 和 `"paths"` - 路径别名
- ✅ `"incremental": true` - 增量编译

#### 1.2.3 Next.js 配置

**文件**: `next.config.ts`

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',  // Server Actions 最大请求体
    },
    ppr: true,  // Partial Prerendering (部分预渲染)
  },

  // 可选: 自定义配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

export default nextConfig
```

**实验特性说明**:
- **Server Actions**: React 19 新特性，服务端函数直接调用
- **PPR**: Next.js 16 部分预渲染，提升首屏性能

#### 1.2.4 Git 忽略配置

**文件**: `.gitignore`

```
# 环境变量
.env.local
.env.*.local

# 依赖
node_modules/
npm-debug.log*

# 构建
.next/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# 系统
.DS_Store
Thumbs.db

# 日志
*.log

# 测试
coverage/
.nyc_output/
```

#### 1.2.5 路径别名配置

**文件**: `jsconfig.json` (可选，用于 VS Code 路径提示)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@db/*": ["./db/*"],
      "@lib/*": ["./src/lib/*"],
      "@components/*": ["./src/components/*"]
    }
  },
  "include": ["src/**/*", "db/**/*"]
}
```

---

## 🎯 验收标准

### 功能验收
- [ ] 所有依赖包成功安装
- [ ] `.env.local` 配置完成
- [ ] TypeScript 严格模式启用
- [ ] Next.js 实验特性配置
- [ ] 路径别名工作正常
- [ ] Git 忽略文件配置

### 技术验收
- [ ] 无安装错误或警告
- [ ] TypeScript 编译无错误
- [ ] 环境变量安全隔离
- [ ] 配置文件符合最佳实践

### 代码质量
- [ ] 配置文件有清晰注释
- [ ] 使用最新稳定版本
- [ ] 遵循项目结构规范

---

## 📝 实施步骤

### 步骤 1: 安装依赖
```bash
# 进入项目目录
cd /home/llelix/node/db-agent

# 安装所有依赖 (一次性)
npm install @anthropic-ai/claude-sdk@^0.27.0 zod@^3.24.0 dotenv@^16.4.5 \
            drizzle-orm@^0.38.0 postgres@^3.4.5 \
            next-themes@^0.4.0 lucide-react@^0.468.0 \
            class-variance-authority@^0.7.0 clsx@^2.1.1 tailwind-merge@^2.5.5 \
            -D drizzle-kit@^0.28.0 vitest@^2.1.8 @testing-library/react@^16.1.0
```

### 步骤 2: 创建环境变量
```bash
# 创建 .env.local 文件
cat > .env.local << 'EOF'
ANTHROPIC_API_KEY=sk-ant-api03-...
DATABASE_URL=postgresql://postgres:ai_knowledge_pw@localhost:5432/ai_knowledge_db
EOF

# 编辑配置
nano .env.local
```

### 步骤 3: 更新配置文件
```bash
# 更新 next.config.ts
cat > next.config.ts << 'EOF'
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
EOF

# 更新 tsconfig.json (如果需要)
# 手动编辑或使用现有配置
```

### 步骤 4: 验证配置
```bash
# 检查 TypeScript
npx tsc --noEmit

# 检查依赖
npm list @anthropic-ai/claude-sdk drizzle-orm

# 启动开发服务器测试
npm run dev
```

---

## 🔍 常见问题

### Q: 安装时出现网络错误？
**A**: 使用淘宝镜像或配置代理
```bash
npm config set registry https://registry.npmmirror.com
# 或
npm install --registry=https://registry.npmmirror.com
```

### Q: TypeScript 报类型错误？
**A**: 检查 tsconfig.json 中的 "strict" 配置，确保包含所有必要文件

### Q: 环境变量不生效？
**A**: 确保文件名为 `.env.local` 并重启开发服务器

### Q: Next.js 实验特性报错？
**A**: 确认 Next.js 版本为 16.0.2+，检查 next.config.ts 语法

---

## 📚 相关文档

- **完整计划**: `nextjs-agent-app-v3.md`
- **任务列表**: `.spec-workflow/specs/nextjs-db-agent/tasks.md`
- **快速开始**: `QUICKSTART.md`

---

## ✅ 完成检查清单

在继续阶段 2 之前，请确认:

- [ ] 所有依赖已安装且版本正确
- [ ] `.env.local` 已创建并配置 API Key
- [ ] TypeScript 编译无错误
- [ ] Next.js 开发服务器能正常启动
- [ ] Git 忽略文件已配置
- [ ] 路径别名工作正常

---

**阶段 1 完成后，继续 [阶段 2: 数据库设计](phase2-database-design.md)**

---
**文档版本**: v1.0
**创建时间**: 2026-01-08
**状态**: ✅ 待实施
