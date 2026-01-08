# 阶段 7: 测试与部署 (Day 6-7)

**阶段目标**: 完成单元测试、集成测试和生产环境部署配置
**预计时间**: 1 天 (0.5 天测试 + 0.5 天部署)
**依赖**: 阶段 1-6 已完成
**核心技术**: Vitest, React Testing Library, Docker, Vercel

---

## 📋 本阶段任务

### 任务 7.1: 单元测试

#### 目标
为智能体、工具函数和关键组件编写全面的单元测试。

#### 7.1.1 智能体测试

**文件**: `src/lib/agent/database-agent.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseAgent } from './database-agent';
import { executeSQLTool, getSchemaTool, analyzeDataTool } from './tools';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/claude-sdk', () => ({
  default: class {
    constructor() {}
    messages = {
      create: vi.fn(),
    };
  },
}));

// Mock database client
vi.mock('@/lib/database/client', () => ({
  db: {
    execute: vi.fn(),
  },
}));

describe('DatabaseAgent', () => {
  let agent: DatabaseAgent;

  beforeEach(() => {
    agent = new DatabaseAgent();
  });

  describe('executeQuery', () => {
    it('应该成功执行简单查询', async () => {
      // Mock Claude API 响应
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: '查询完成，找到 5 条记录',
          },
        ],
        usage: { input_tokens: 50, output_tokens: 30 },
      };

      vi.spyOn(agent as any, 'anthropic').mockReturnValue({
        messages: { create: vi.fn().mockResolvedValue(mockResponse) },
      });

      const result = await agent.executeQuery('查询所有产品');

      expect(result.result).toBe('查询完成，找到 5 条记录');
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.usage).toBeDefined();
    });

    it('应该处理工具调用', async () => {
      const mockResponse = {
        content: [
          {
            type: 'tool_use',
            name: 'execute_sql',
            id: 'tool_123',
            input: {
              sql: 'SELECT * FROM products',
              explanation: '查询所有产品',
            },
          },
        ],
        usage: { input_tokens: 50, output_tokens: 30 },
      };

      // Mock 工具执行
      vi.spyOn(executeSQLTool, 'execute').mockResolvedValue({
        success: true,
        data: [{ id: '1', name: '产品1' }],
        rowCount: 1,
      });

      vi.spyOn(agent as any, 'anthropic').mockReturnValue({
        messages: { create: vi.fn().mockResolvedValue(mockResponse) },
      });

      const result = await agent.executeQuery('查询产品');

      expect(result.sql).toBe('SELECT * FROM products');
      expect(result.data).toHaveLength(1);
    });

    it('应该处理错误情况', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: '发生错误: 数据库连接失败',
          },
        ],
        usage: { input_tokens: 50, output_tokens: 30 },
      };

      vi.spyOn(agent as any, 'anthropic').mockReturnValue({
        messages: { create: vi.fn().mockResolvedValue(mockResponse) },
      });

      const result = await agent.executeQuery('查询失败测试');

      expect(result.result).toContain('错误');
    });

    it('应该限制最大步数', async () => {
      // Mock 连续的工具调用
      const toolResponse = {
        content: [
          {
            type: 'tool_use',
            name: 'get_database_schema',
            id: 'tool_1',
            input: {},
          },
        ],
        usage: { input_tokens: 50, output_tokens: 30 },
      };

      const textResponse = {
        content: [{ type: 'text', text: '继续...' }],
        usage: { input_tokens: 50, output_tokens: 30 },
      };

      const mockCreate = vi.fn()
        .mockResolvedValueOnce(toolResponse)
        .mockResolvedValueOnce(textResponse)
        .mockResolvedValueOnce(textResponse)
        .mockResolvedValueOnce(textResponse);

      vi.spyOn(agent as any, 'anthropic').mockReturnValue({
        messages: { create: mockCreate },
      });

      vi.spyOn(getSchemaTool, 'execute').mockResolvedValue({ schema: {} });

      // 设置最大步数为 3
      const limitedAgent = new DatabaseAgent({ maxSteps: 3 });
      const result = await limitedAgent.executeQuery('循环查询');

      // 应该在 3 步内停止
      expect(result.steps.length).toBeLessThanOrEqual(3);
    });
  });
});
```

#### 7.1.2 工具函数测试

**文件**: `src/lib/agent/tools.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSQLTool, getSchemaTool, analyzeDataTool } from './tools';
import { db } from '@/lib/database/client';
import { sql } from 'drizzle-orm';

// Mock database
vi.mock('@/lib/database/client', () => ({
  db: {
    execute: vi.fn(),
  },
}));

describe('Tools', () => {
  describe('executeSQLTool', () => {
    it('应该执行安全的 SELECT 查询', async () => {
      const mockData = [{ id: 1, name: '测试' }];
      (db.execute as any).mockResolvedValue(mockData);

      const result = await executeSQLTool.execute({
        sql: 'SELECT * FROM products',
        explanation: '查询产品',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.rowCount).toBe(1);
    });

    it('应该阻止危险的 SQL 操作', async () => {
      const dangerousQueries = [
        'DROP TABLE users',
        'DELETE FROM products',
        'UPDATE users SET admin = true',
        'INSERT INTO users VALUES (1)',
        'SELECT * FROM users; -- DROP TABLE users',
      ];

      for (const query of dangerousQueries) {
        const result = await executeSQLTool.execute({
          sql: query,
          explanation: 'test',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }
    });

    it('应该处理 SQL 执行错误', async () => {
      (db.execute as any).mockRejectedValue(new Error('语法错误'));

      const result = await executeSQLTool.execute({
        sql: 'SELECT * FROM invalid_table',
        explanation: '测试错误',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('语法错误');
    });

    it('应该拒绝非 SELECT 查询', async () => {
      const result = await executeSQLTool.execute({
        sql: 'CREATE TABLE test (id INT)',
        explanation: '创建表',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('只允许执行 SELECT');
    });
  });

  describe('getSchemaTool', () => {
    it('应该返回数据库表结构', async () => {
      const mockSchema = [
        { table_name: 'users', column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
        { table_name: 'users', column_name: 'email', data_type: 'varchar', is_nullable: 'NO' },
      ];

      (db.execute as any).mockResolvedValue(mockSchema);

      const result = await getSchemaTool.execute({});

      expect(result.schema).toBeDefined();
      expect(result.schema.users).toBeDefined();
      expect(result.schema.users).toHaveLength(2);
    });

    it('应该支持特定表查询', async () => {
      const mockSchema = [
        { table_name: 'products', column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
      ];

      (db.execute as any).mockResolvedValue(mockSchema);

      const result = await getSchemaTool.execute({ tableName: 'products' });

      expect(result.schema.products).toBeDefined();
    });
  });

  describe('analyzeDataTool', () => {
    const testData = [
      { id: 1, amount: 100, category: 'A' },
      { id: 2, amount: 200, category: 'B' },
      { id: 3, amount: 150, category: 'A' },
    ];

    it('应该计算总数', async () => {
      const result = await analyzeDataTool.execute({
        data: testData,
        operation: 'count',
      });

      expect(result.count).toBe(3);
    });

    it('应该计算总和', async () => {
      const result = await analyzeDataTool.execute({
        data: testData,
        operation: 'sum',
        column: 'amount',
      });

      expect(result.sum).toBe(450);
    });

    it('应该计算平均值', async () => {
      const result = await analyzeDataTool.execute({
        data: testData,
        operation: 'avg',
        column: 'amount',
      });

      expect(result.avg).toBe(150);
    });

    it('应该找到最大值', async () => {
      const result = await analyzeDataTool.execute({
        data: testData,
        operation: 'max',
        column: 'amount',
      });

      expect(result.max).toBe(200);
    });

    it('应该找到最小值', async () => {
      const result = await analyzeDataTool.execute({
        data: testData,
        operation: 'min',
        column: 'amount',
      });

      expect(result.min).toBe(100);
    });

    it('应该获取去重值', async () => {
      const result = await analyzeDataTool.execute({
        data: testData,
        operation: 'distinct',
        column: 'category',
      });

      expect(result.distinct).toEqual(['A', 'B']);
    });

    it('应该排序数据', async () => {
      const result = await analyzeDataTool.execute({
        data: testData,
        operation: 'sort',
        column: 'amount',
        limit: 2,
      });

      expect(result.sorted).toHaveLength(2);
      expect(result.sorted[0].amount).toBe(200);
      expect(result.sorted[1].amount).toBe(150);
    });

    it('应该处理空数据', async () => {
      const result = await analyzeDataTool.execute({
        data: [],
        operation: 'count',
      });

      expect(result.error).toBeDefined();
    });

    it('应该处理缺少列名的情况', async () => {
      const result = await analyzeDataTool.execute({
        data: testData,
        operation: 'sum',
      });

      expect(result.error).toBeDefined();
    });
  });
});
```

#### 7.1.3 React 组件测试

**文件**: `src/components/ChatInterface.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from './ChatInterface';
import { executeQueryAction } from '@/lib/actions/query-action';
import { vi } from 'vitest';

// Mock Server Action
vi.mock('@/lib/actions/query-action', () => ({
  executeQueryAction: vi.fn(),
}));

// Mock ReActFlow and QueryResult components
vi.mock('./ReActFlow', () => ({
  ReActFlow: ({ trace }: { trace: any[] }) => <div data-testid="react-flow">ReAct 流</div>,
}));

vi.mock('./QueryResult', () => ({
  QueryResult: ({ data }: { data: any[] }) => <div data-testid="query-result">结果</div>,
}));

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染聊天界面', () => {
    render(<ChatInterface />);

    expect(screen.getByText('数据库智能体')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/输入你的数据库查询/)).toBeInTheDocument();
  });

  it('应该处理用户输入', () => {
    render(<ChatInterface />);

    const textarea = screen.getByPlaceholderText(/输入你的数据库查询/);
    fireEvent.change(textarea, { target: { value: '查询所有产品' } });

    expect(textarea).toHaveValue('查询所有产品');
  });

  it('应该提交查询并显示结果', async () => {
    (executeQueryAction as any).mockResolvedValue({
      data: {
        result: '找到 3 个产品',
        steps: [{ thought: '分析查询' }],
        sql: 'SELECT * FROM products',
        data: [{ id: 1, name: '产品1' }],
      },
    });

    render(<ChatInterface />);

    const textarea = screen.getByPlaceholderText(/输入你的数据库查询/);
    const button = screen.getByRole('button', { name: /发送/ });

    fireEvent.change(textarea, { target: { value: '查询产品' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(executeQueryAction).toHaveBeenCalled();
      expect(screen.getByText('找到 3 个产品')).toBeInTheDocument();
    });
  });

  it('应该显示错误信息', async () => {
    (executeQueryAction as any).mockResolvedValue({
      error: '数据库连接失败',
    });

    render(<ChatInterface />);

    const textarea = screen.getByPlaceholderText(/输入你的数据库查询/);
    const button = screen.getByRole('button', { name: /发送/ });

    fireEvent.change(textarea, { target: { value: '查询测试' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/错误: 数据库连接失败/)).toBeInTheDocument();
    });
  });

  it('应该禁用提交按钮当输入为空或正在加载', async () => {
    (executeQueryAction as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: { result: 'test' } }), 100))
    );

    render(<ChatInterface />);

    const button = screen.getByRole('button', { name: /发送/ });

    // 初始状态应该禁用
    expect(button).toBeDisabled();

    // 输入后启用
    const textarea = screen.getByPlaceholderText(/输入你的数据库查询/);
    fireEvent.change(textarea, { target: { value: '查询' } });
    expect(button).not.toBeDisabled();

    // 提交后禁用
    fireEvent.click(button);
    expect(button).toBeDisabled();
  });

  it('应该清空对话', async () => {
    (executeQueryAction as any).mockResolvedValue({
      data: { result: '测试结果', steps: [], sql: '', data: [] },
    });

    render(<ChatInterface />);

    // 先发送一条消息
    const textarea = screen.getByPlaceholderText(/输入你的数据库查询/);
    const button = screen.getByRole('button', { name: /发送/ });
    fireEvent.change(textarea, { target: { value: '查询' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('测试结果')).toBeInTheDocument();
    });

    // 点击清空按钮
    const clearButton = screen.getByText('清空对话');
    fireEvent.click(clearButton);

    // 消息应该被清空
    expect(screen.queryByText('测试结果')).not.toBeInTheDocument();
  });
});
```

#### 7.1.4 测试配置

**文件**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/types.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**文件**: `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';

// 全局测试配置
beforeEach(() => {
  // 重置所有 mock
  vi.clearAllMocks();
});

// 模拟 window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

**文件**: `package.json` (测试脚本)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

---

### 任务 7.2: 部署配置

#### 目标
配置生产环境部署，包括 Docker、环境变量和 CI/CD。

#### 7.2.1 Docker 配置

**文件**: `Dockerfile`

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖 (包括 devDependencies 用于构建)
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 运行阶段
FROM node:20-alpine AS runner

WORKDIR /app

# 设置为生产环境
ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./

# 仅安装生产依赖
RUN npm ci --only=production --omit=dev

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动命令
CMD ["npm", "start"]
```

**文件**: `.dockerignore`

```
node_modules
.next
.git
.gitignore
README.md
.env.local
.env.*.local
Dockerfile
.dockerignore
coverage
test
*.md
```

#### 7.2.2 Docker Compose (生产)

**文件**: `docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: db-agent-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/dbagent_prod
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:17-alpine
    container_name: db-agent-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: dbagent_prod
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./db/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5433:5432"  # 生产环境使用不同端口
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_prod_data:
```

#### 7.2.3 生产环境环境变量

**文件**: `.env.production.example`

```env
# 生产环境配置示例
# 复制此文件为 .env.production 并填写实际值

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_BASE_URL=https://api.anthropic.com

# 数据库 (Docker 内部网络)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db:5432/dbagent_prod

# 数据库 (外部连接 - 用于迁移)
DATABASE_URL_EXTERNAL=postgresql://postgres:YOUR_PASSWORD@localhost:5433/dbagent_prod

# 安全
AUTH_SECRET=your-super-secret-auth-key-change-this-in-production
TEST_API_KEY=your-test-api-key

# Next.js
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# 可选: 监控
# SENTRY_DSN=your-sentry-dsn
# LOGROCKET_KEY=your-logrocket-key
```

#### 7.2.4 健康检查 API

**文件**: `src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/database/client';

export async function GET() {
  try {
    // 检查数据库连接
    const dbHealthy = await checkDatabaseConnection();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'connected' : 'disconnected',
      version: process.env.npm_package_version || '1.0.0',
    }, {
      status: dbHealthy ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: String(error),
    }, {
      status: 500,
    });
  }
}
```

#### 7.2.5 Vercel 部署配置

**文件**: `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-api-key",
    "DATABASE_URL": "@database-url",
    "AUTH_SECRET": "@auth-secret"
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "crons": [
    {
      "path": "/api/health",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### 7.2.6 CI/CD 配置 (GitHub Actions)

**文件**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: npm run test:coverage

      - name: Build application
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### 7.2.7 部署脚本

**文件**: `scripts/deploy.sh`

```bash
#!/bin/bash

set -e

echo "🚀 开始部署..."

# 检查环境变量
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "❌ 错误: ANTHROPIC_API_KEY 未设置"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ 错误: DATABASE_URL 未设置"
  exit 1
fi

echo "✅ 环境变量检查通过"

# 运行测试
echo "🧪 运行测试..."
npm run test:run

if [ $? -ne 0 ]; then
  echo "❌ 测试失败，停止部署"
  exit 1
fi

echo "✅ 测试通过"

# 构建应用
echo "📦 构建应用..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ 构建失败，停止部署"
  exit 1
fi

echo "✅ 构建成功"

# 数据库迁移
echo "🗄️ 运行数据库迁移..."
npx drizzle-kit push:pg

if [ $? -ne 0 ]; then
  echo "⚠️  警告: 数据库迁移失败"
  echo "   请手动运行: npx drizzle-kit push:pg"
fi

# Docker 部署 (可选)
if [ "$1" = "--docker" ]; then
  echo "🐳 使用 Docker 部署..."

  docker-compose -f docker-compose.prod.yml down
  docker-compose -f docker-compose.prod.yml up -d --build

  echo "✅ Docker 部署完成"
  echo "   应用访问: http://localhost:3000"
  echo "   数据库端口: 5433"
else
  echo "🚀 Vercel 部署..."
  echo "   请运行: vercel --prod"
fi

echo ""
echo "🎉 部署完成！"
echo "   检查状态: npm run start"
```

```bash
# 赋予执行权限
chmod +x scripts/deploy.sh
```

---

## 🎯 验收标准

### 测试验收
- [ ] 单元测试覆盖率达到 80%+
- [ ] 所有测试通过
- [ ] 智能体测试覆盖主要场景
- [ ] 工具函数测试完整
- [ ] 组件测试通过

### 部署验收
- [ ] Dockerfile 正确配置
- [ ] Docker Compose 能启动服务
- [ ] 健康检查 API 工作
- [ ] 环境变量配置完整
- [ ] CI/CD 流程通过

### 生产环境
- [ ] 数据库连接正常
- [ ] API Key 配置正确
- [ ] 错误日志记录
- [ ] 性能监控就绪

---

## 📝 实施步骤

### 步骤 1: 安装测试依赖
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### 步骤 2: 创建测试文件
```bash
mkdir -p src/test
# 创建所有 .test.ts 和 .test.tsx 文件
```

### 步骤 3: 运行测试
```bash
# 运行所有测试
npm run test:run

# 查看覆盖率
npm run test:coverage

# 交互式测试
npm run test:ui
```

### 步骤 4: 配置生产环境
```bash
# 创建生产环境变量
cp .env.production.example .env.production
# 编辑 .env.production 填入实际值
```

### 步骤 5: Docker 测试
```bash
# 构建并启动
docker-compose -f docker-compose.prod.yml up -d --build

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 停止
docker-compose -f docker-compose.prod.yml down
```

### 步骤 6: Vercel 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

---

## 🔍 常见问题

### Q: 测试覆盖率不足？
**A**: 检查未覆盖的代码路径，添加更多测试用例

### Q: Docker 构建失败？
**A**: 检查 Dockerfile 中的路径和依赖版本

### Q: 数据库连接失败？
**A**: 确认 DATABASE_URL 格式正确，网络可访问

### Q: CI/CD 失败？
**A**: 检查 secrets 配置，确保 GitHub Actions 有访问权限

---

## 📚 相关文档

- **阶段 6**: `phase6-state-management.md`
- **完整计划**: `nextjs-agent-app-v3.md`
- **任务列表**: `.spec-workflow/specs/nextjs-db-agent/tasks.md`

---

## ✅ 完成检查清单

### 测试完成
- [ ] 单元测试全部通过
- [ ] 覆盖率报告生成
- [ ] 组件测试覆盖主要功能
- [ ] 错误场景测试通过

### 部署完成
- [ ] Docker 配置验证
- [ ] 生产环境变量配置
- [ ] 健康检查 API 工作
- [ ] CI/CD 流程通过
- [ ] 应用成功部署

---

## 🎉 项目完成！

**恭喜！** 完成所有阶段后，你将拥有一个完整的数据库智能体应用：

### ✅ 已实现功能
1. **自然语言查询**: 用户可以用中文描述查询需求
2. **ReAct 推理**: 完整展示思考-行动-观察过程
3. **数据库操作**: 安全的 SQL 执行和数据分析
4. **历史记录**: 保存所有查询和执行结果
5. **响应式 UI**: 现代化的聊天界面
6. **类型安全**: 完整的 TypeScript 类型系统
7. **测试覆盖**: 全面的单元测试
8. **生产就绪**: Docker 和 CI/CD 配置

### 🚀 核心技术栈
- Next.js 16 + React 19
- claude-agent-sdk-typescript
- PostgreSQL 17 + Drizzle ORM
- TypeScript 5.7
- Vitest + Testing Library

---

**文档版本**: v1.0
**创建时间**: 2026-01-08
**状态**: ✅ 待实施
**预计总开发时间**: 7 天
