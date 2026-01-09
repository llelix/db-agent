import { z } from 'zod';
import { db } from '../database/client';
import { sql, eq, and, desc } from 'drizzle-orm';

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

  // 阻止危险关键词 - 使用单词边界匹配，避免误判
  const dangerous = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'TRUNCATE', 'EXEC'];
  const foundDangerous = dangerous.filter(keyword => {
    // 使用正则表达式匹配单词边界
    const regex = new RegExp(`\\b${keyword}\\b`);
    return regex.test(upperSql);
  });

  if (foundDangerous.length > 0) {
    return { safe: false, error: `SQL 包含危险操作: ${foundDangerous.join(', ')}` };
  }

  // 检查注释注入
  if (sqlQuery.includes('--') || sqlQuery.includes('/*')) {
    return { safe: false, error: 'SQL 注入检测: 避免使用注释' };
  }

  // 检查 UNION - 特殊处理，因为可能在子查询中
  if (/\bUNION\b/i.test(sqlQuery)) {
    return { safe: false, error: 'SQL 包含危险操作: UNION' };
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
