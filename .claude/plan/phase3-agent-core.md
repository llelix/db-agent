# 阶段 3: claude-agent-sdk-typescript 核心实现 (Day 2-3)

**阶段目标**: 使用 claude-agent-sdk-typescript 实现 ReAct 模式的数据库智能体
**预计时间**: 1.5 天
**依赖**: 阶段 1, 2 已完成
**核心技术**: claude-agent-sdk-typescript, ReAct 模式, 工具调用

---

## 📋 本阶段任务

### 任务 3.1: 配置 Claude SDK 客户端

#### 目标
初始化 Anthropic SDK，配置模型参数。

#### 3.1.1 SDK 客户端配置

**文件**: `lib/agent/claude-client.ts`

```typescript
import Anthropic from '@anthropic-ai/claude-sdk';

// 创建 Anthropic 客户端实例
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  // 可选: 自定义基础 URL (用于代理)
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

// 模型配置
export const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

// 默认参数配置
export const DEFAULT_AGENT_CONFIG = {
  model: CLAUDE_MODEL,
  maxTokens: 1000,
  temperature: 0.3,
  topP: 0.9,
};

// 类型定义
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | any[];
}

export interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text' | 'tool_use';
    text?: string;
    name?: string;
    input?: any;
    id?: string;
  }>;
  model: string;
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
```

#### 3.1.2 验证配置

```typescript
// lib/agent/claude-client.ts (续)

/**
 * 验证 Claude API 配置
 */
export async function validateClaudeConfig(): Promise<boolean> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    // 发送一个简单的测试请求
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      messages: [
        { role: 'user', content: 'Hello, test connection' }
      ],
      max_tokens: 10,
    });

    return response.content.length > 0;
  } catch (error) {
    console.error('Claude API validation failed:', error);
    return false;
  }
}
```

---

### 任务 3.2: 实现数据库工具函数

#### 目标
定义三个核心工具：execute_sql, get_database_schema, analyze_data

#### 3.2.1 SQL 执行工具

**文件**: `lib/agent/tools.ts`

```typescript
import { z } from 'zod';
import { db } from '@/lib/database/client';
import { sql } from 'drizzle-orm';

// 输入验证 Schema
const executeSQLSchema = z.object({
  sql: z.string().min(1, 'SQL 语句不能为空').describe('要执行的 SQL 语句，必须是 SELECT 查询'),
  explanation: z.string().min(1, '解释不能为空').describe('对这个查询的简短解释'),
});

/**
 * SQL 安全验证
 */
function validateSQLSecurity(sqlQuery: string): { safe: boolean; error?: string } {
  const upperSql = sqlQuery.trim().toUpperCase();

  // 必须是 SELECT 开头
  if (!upperSql.startsWith('SELECT')) {
    return { safe: false, error: '只允许执行 SELECT 查询' };
  }

  // 阻止危险关键词
  const dangerous = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'CREATE', 'ALTER', 'TRUNCATE', 'EXEC', 'UNION'];
  const foundDangerous = dangerous.filter(keyword => upperSql.includes(keyword));

  if (foundDangerous.length > 0) {
    return { safe: false, error: `SQL 包含危险操作: ${foundDangerous.join(', ')}` };
  }

  // 检查注释注入
  if (sqlQuery.includes('--') || sqlQuery.includes('/*')) {
    return { safe: false, error: 'SQL 注入检测: 避免使用注释' };
  }

  return { safe: true };
}

/**
 * 执行 SQL 查询工具
 */
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
    const security = validateSQLSecurity(args.sql);
    if (!security.safe) {
      return {
        success: false,
        error: security.error,
        explanation: args.explanation
      };
    }

    try {
      // 执行查询
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
```

#### 3.2.2 数据库结构查询工具

**文件**: `lib/agent/tools.ts` (续)

```typescript
/**
 * 获取数据库表结构工具
 */
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
        column_default,
        ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ${args.tableName ? `AND table_name = '${args.tableName}'` : ''}
      ORDER BY table_name, ordinal_position;
    `;

    try {
      const result = await db.execute(sql.raw(query));

      // 按表分组
      const tables: Record<string, any[]> = {};
      result.forEach((row: any) => {
        if (!tables[row.table_name]) {
          tables[row.table_name] = [];
        }
        tables[row.table_name].push({
          column: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable === 'YES',
          default: row.column_default,
        });
      });

      return {
        schema: tables,
        description: args.tableName ? `表 ${args.tableName} 的结构` : '所有表的结构',
        tableCount: Object.keys(tables).length
      };
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }
};
```

#### 3.2.3 数据分析工具

**文件**: `lib/agent/tools.ts` (续)

```typescript
/**
 * 数据分析工具
 */
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
        enum: ['count', 'sum', 'avg', 'max', 'min', 'distinct', 'sort'],
        description: '要执行的分析操作'
      },
      column: {
        type: 'string',
        description: '要分析的列名'
      },
      limit: {
        type: 'number',
        description: '结果限制数量 (用于 sort)'
      }
    },
    required: ['data', 'operation']
  } as const,

  execute: async (args: {
    data: any[];
    operation: string;
    column?: string;
    limit?: number
  }) => {
    const { data, operation, column, limit } = args;

    if (!Array.isArray(data) || data.length === 0) {
      return { error: '数据为空或格式错误' };
    }

    const result: any = { rowCount: data.length };

    try {
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
          result.avg = numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
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

        case 'sort':
          if (!column) throw new Error('需要指定 column');
          const sorted = [...data].sort((a, b) => {
            const aVal = Number(a[column]);
            const bVal = Number(b[column]);
            return bVal - aVal; // 降序
          });
          result.sorted = limit ? sorted.slice(0, limit) : sorted;
          break;

        default:
          throw new Error(`不支持的操作: ${operation}`);
      }

      return result;
    } catch (error) {
      return { error: String(error) };
    }
  }
};
```

#### 3.2.4 工具导出

**文件**: `lib/agent/tools.ts` (结尾)

```typescript
// 导出所有工具
export const tools = [executeSQLTool, getSchemaTool, analyzeDataTool];

// 工具类型定义
export type Tool = (typeof tools)[number];

// 工具执行结果类型
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  explanation?: string;
  rowCount?: number;
  [key: string]: any;
}
```

---

### 任务 3.3: 创建 DatabaseAgent 智能体

#### 目标
实现完整的 ReAct 模式智能体，支持多轮工具调用和步骤追踪。

#### 3.3.1 类型定义

**文件**: `lib/agent/types.ts`

```typescript
// ReAct 步骤类型
export interface ReActStep {
  thought: string;      // 思考过程
  action?: string;      // 动作 (JSON 字符串)
  observation?: string; // 观察结果 (JSON 字符串)
}

// 智能体结果类型
export interface AgentResult {
  result: string;       // 最终回答
  steps: ReActStep[];   // 推理过程
  sql?: string;         // 执行的 SQL
  data?: any[];         // 查询结果数据
  usage?: {             // Token 使用情况
    input: number;
    output: number;
  };
}

// 智能体配置
export interface AgentConfig {
  model?: string;
  maxSteps?: number;
  temperature?: number;
  systemPrompt?: string;
}
```

#### 3.3.2 DatabaseAgent 类

**文件**: `lib/agent/database-agent.ts`

```typescript
import Anthropic from '@anthropic-ai/claude-sdk';
import { executeSQLTool, getSchemaTool, analyzeDataTool, tools } from './tools';
import { AgentResult, AgentConfig, ReActStep } from './types';
import { CLAUDE_MODEL, DEFAULT_AGENT_CONFIG } from './claude-client';

export class DatabaseAgent {
  private anthropic: Anthropic;
  private config: AgentConfig;

  constructor(config: AgentConfig = {}) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    this.config = {
      model: config.model || DEFAULT_AGENT_CONFIG.model,
      maxSteps: config.maxSteps || 10,
      temperature: config.temperature || DEFAULT_AGENT_CONFIG.temperature,
      systemPrompt: config.systemPrompt || this.getDefaultSystemPrompt(),
    };
  }

  /**
   * 默认系统提示词
   */
  private getDefaultSystemPrompt(): string {
    return `你是一个专业的数据库查询智能体。使用 ReAct 模式：

1. **Thought**: 分析用户需求，确定查询策略
2. **Action**: 调用工具获取信息
3. **Observation**: 分析工具返回结果
4. **Final Answer**: 总结回答

**工具说明**:
- \`get_database_schema\`: 获取数据库表结构
- \`execute_sql\`: 执行安全的 SELECT 查询
- \`analyze_data\`: 分析和处理数据

**规则**:
1. 先使用 \`get_database_schema\` 了解表结构
2. 使用 \`execute_sql\` 执行查询 (只允许 SELECT)
3. 使用 \`analyze_data\` 分析结果
4. 用中文回答用户
5. 确保 SQL 安全性
6. 最多执行 10 步

**安全要求**:
- 只允许 SELECT 查询
- 阻止 DROP, DELETE, INSERT, UPDATE 等危险操作
- 验证所有 SQL 语句`;
  }

  /**
   * 执行查询主方法
   */
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
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // ReAct 循环
    for (let step = 0; step < this.config.maxSteps!; step++) {
      const response = await this.anthropic.messages.create({
        model: this.config.model!,
        messages: messages,
        system: this.config.systemPrompt!,
        tools: tools,
        max_tokens: 1000,
        temperature: this.config.temperature,
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      const content = response.content[0];

      // 处理文本回复
      if (content.type === 'text') {
        finalResult = content.text;

        // 检查是否需要继续
        if (!this.shouldContinue(content.text)) {
          break;
        }

        // 记录思考步骤
        steps.push({
          thought: content.text,
        });

        messages.push({
          role: 'assistant',
          content: content.text,
        });
      }

      // 处理工具调用
      if (content.type === 'tool_use') {
        const toolName = content.name;
        const toolArgs = content.input;

        const step: ReActStep = {
          thought: `准备调用工具: ${toolName}`,
          action: JSON.stringify(toolArgs, null, 2),
        };

        try {
          let observation: any;

          // 执行对应工具
          if (toolName === 'execute_sql') {
            const result = await executeSQLTool.execute(toolArgs as any);
            observation = result;

            if (result.success && result.data) {
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
      }
    }

    return {
      result: finalResult,
      steps,
      sql,
      data,
      usage: {
        input: totalInputTokens,
        output: totalOutputTokens,
      },
    };
  }

  /**
   * 判断是否需要继续执行
   */
  private shouldContinue(text: string): boolean {
    const stopKeywords = ['完成', '最终答案', '总结', '回答', '完毕', '最终结果'];
    const continueKeywords = ['继续', '下一步', '还需要', '考虑', '分析', '查询'];

    const hasStop = stopKeywords.some(k => text.includes(k));
    const hasContinue = continueKeywords.some(k => text.includes(k));

    if (hasStop) return false;
    if (hasContinue) return true;

    // 如果文本较短，可能需要继续
    return text.length < 100;
  }

  /**
   * 批量执行查询
   */
  async executeBatch(queries: string[]): Promise<AgentResult[]> {
    const results: AgentResult[] = [];

    for (const query of queries) {
      const result = await this.executeQuery(query);
      results.push(result);
    }

    return results;
  }
}
```

#### 3.3.3 智能体工厂函数

**文件**: `lib/agent/index.ts`

```typescript
export { DatabaseAgent } from './database-agent';
export { executeSQLTool, getSchemaTool, analyzeDataTool, tools } from './tools';
export { anthropic, CLAUDE_MODEL, validateClaudeConfig } from './claude-client';
export * from './types';

/**
 * 创建数据库智能体实例
 */
export function createDatabaseAgent(config?: any) {
  return new DatabaseAgent(config);
}
```

---

## 🎯 验收标准

### 功能验收
- [ ] Claude SDK 配置正确
- [ ] 三个工具函数完整实现
- [ ] SQL 安全验证工作正常
- [ ] DatabaseAgent 类完整
- [ ] ReAct 循环执行成功
- [ ] 步骤追踪准确

### 技术验收
- [ ] Zod 验证正确使用
- [ ] 错误处理完善
- [ ] 类型定义完整
- [ ] 工具调用逻辑正确
- [ ] 消息历史管理正确

### 代码质量
- [ ] 代码结构清晰
- [ ] 注释详细
- [ ] 安全性考虑周全
- [ ] 可测试性强

---

## 📝 实施步骤

### 步骤 1: 创建类型定义
```bash
mkdir -p lib/agent
# 创建 lib/agent/types.ts
```

### 步骤 2: 配置 SDK 客户端
```bash
# 创建 lib/agent/claude-client.ts
# (复制上面的代码)
```

### 步骤 3: 实现工具函数
```bash
# 创建 lib/agent/tools.ts
# (复制上面的代码)
```

### 步骤 4: 创建 DatabaseAgent
```bash
# 创建 lib/agent/database-agent.ts
# (复制上面的代码)

# 创建 lib/agent/index.ts
# (复制上面的代码)
```

### 步骤 5: 测试智能体
```bash
# 创建测试文件
cat > test-agent.ts << 'EOF'
import { createDatabaseAgent } from './lib/agent';

async function test() {
  const agent = createDatabaseAgent();
  const result = await agent.executeQuery('查询所有产品');
  console.log(JSON.stringify(result, null, 2));
}

test();
EOF

# 运行测试
npx tsx test-agent.ts
```

---

## 🔍 常见问题

### Q: API Key 错误？
**A**: 检查 `.env.local` 中的 `ANTHROPIC_API_KEY`

### Q: 工具调用失败？
**A**: 确保数据库已启动，表结构已创建

### Q: ReAct 循环不结束？
**A**: 调整 `shouldContinue` 方法的判断逻辑

### Q: SQL 安全验证太严格？
**A**: 根据实际需求调整危险关键词列表

---

## 📚 相关文档

- **阶段 2**: `phase2-database-design.md`
- **完整计划**: `nextjs-agent-app-v3.md`
- **SDK 学习**: `claude-agent-sdk-learning.md`

---

## ✅ 完成检查清单

在继续阶段 4 之前，请确认:

- [ ] Claude SDK 配置正确
- [ ] 三个工具函数测试通过
- [ ] SQL 安全验证有效
- [ ] DatabaseAgent 能执行简单查询
- [ ] ReAct 过程正确追踪
- [ ] 类型定义完整
- [ ] 错误处理完善

---

**阶段 3 完成后，继续 [阶段 4: Server Actions](phase4-server-actions.md)**

---
**文档版本**: v1.0
**创建时间**: 2026-01-08
**状态**: ✅ 待实施
