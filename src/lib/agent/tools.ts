import { z } from 'zod';
import { Pool } from 'pg';
import mysql from 'mysql2';
import * as aesjs from 'aes-js';
import { db } from '@/lib/database/client';
import { dbConnections } from '@/db/schema';
import { eq } from 'drizzle-orm';

// 连接池缓存 - AI Agent专用
const agentPools = new Map<string, any>();

// 加密密钥
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || 'default-encryption-key-for-dev-only';
const keyBytes = aesjs.utils.hex.toBytes(
  Buffer.from(ENCRYPTION_KEY).toString('hex').padEnd(32 * 2, '0').slice(0, 32 * 2)
);

/**
 * 解密密码
 */
function decryptPassword(encrypted: string): string {
  try {
    const encryptedBytes = aesjs.utils.hex.toBytes(encrypted);
    const aesCtr = new aesjs.ModeOfOperation.ctr(keyBytes);
    const decryptedBytes = aesCtr.decrypt(encryptedBytes);
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  } catch (error) {
    console.error('密码解密失败:', error);
    throw new Error('密码解密失败');
  }
}

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

  // 检查 UNION
  if (/\bUNION\b/i.test(sqlQuery)) {
    return { safe: false, error: 'SQL 包含危险操作: UNION' };
  }

  return { safe: true };
}

/**
 * 获取数据库连接配置
 */
async function getDatabaseConfig(connectionId: string) {
  const connection = await db.query.dbConnections.findFirst({
    where: eq(dbConnections.id, connectionId),
  });

  if (!connection) {
    throw new Error('连接不存在');
  }

  const decryptedPassword = decryptPassword(connection.password);

  return {
    type: connection.type || (connection.port === 3306 ? 'mysql' : 'postgresql'),
    host: connection.host,
    port: connection.port || 5432,
    database: connection.database,
    username: connection.username,
    password: decryptedPassword,
    ssl: connection.ssl || false,
    schema: connection.schema || 'public'
  };
}

/**
 * 获取AI Agent专用连接池
 */
async function getAgentPool(connectionId: string, config: any) {
  if (agentPools.has(connectionId)) {
    return agentPools.get(connectionId);
  }

  const { type, host, port, database, username, password, ssl } = config;

  let pool;
  if (type === 'postgresql') {
    // 使用原生pg连接池
    pool = new Pool({
      host,
      port,
      database,
      user: username,
      password,
      ssl: ssl ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
    });
    await pool.query('SELECT 1');
  } else {
    // 使用原生mysql2连接池
    pool = mysql.createPool({
      host,
      port,
      user: username,
      password,
      database,
      ssl: ssl ? { rejectUnauthorized: false } : undefined,
      connectionLimit: 20,
      waitForConnections: true,
      queueLimit: 0,
    });
    await pool.execute('SELECT 1');
  }

  agentPools.set(connectionId, pool);
  return pool;
}

/**
 * 工具工厂 - 根据 connectionId 创建工具
 */
export function createTools(connectionId: string) {
  /**
   * 执行 SQL 查询工具
   */
  const executeSQLTool = {
    name: 'execute_sql',
    description: '执行 SQL 查询。必须确保 SQL 安全，只允许查询操作。',
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
      const startTime = Date.now();

      try {
        // 安全验证
        const security = validateSQLSecurity(args.sql);
        if (!security.safe) {
          return {
            success: false,
            error: security.error,
            explanation: args.explanation
          };
        }

        const config = await getDatabaseConfig(connectionId);
        const pool = await getAgentPool(connectionId, config);

        let result;
        if (pool instanceof Pool) {
          // PostgreSQL 使用 pg
          result = await pool.query(args.sql);
          result = result.rows || [];
        } else {
          // MySQL 使用 mysql2
          const [rows] = await pool.execute(args.sql);
          result = rows || [];
        }

        const executionTime = Date.now() - startTime;

        return {
          success: true,
          data: result,
          explanation: args.explanation,
          rowCount: result.length,
          executionTime
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
  const getSchemaTool = {
    name: 'get_database_schema',
    description: '获取数据库表结构信息，包括表名、表注释、列名、列注释和数据类型，帮助理解数据模型',
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
      try {
        const config = await getDatabaseConfig(connectionId);
        const pool = await getAgentPool(connectionId, config);

        let query: string;
        if (config.type === 'postgresql') {
          query = `
            SELECT
              c.table_name,
              c.column_name,
              c.data_type,
              c.ordinal_position,
              pgd.description as column_comment,
              pt.description as table_comment
            FROM information_schema.columns c
            LEFT JOIN pg_catalog.pg_statio_all_tables st ON (st.schemaname = '${config.schema}' AND st.relname = c.table_name)
            LEFT JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position)
            LEFT JOIN pg_catalog.pg_description pt ON (pt.objoid = st.relid AND pt.objsubid = 0)
            WHERE c.table_schema = '${config.schema}'
            ${args.tableName ? `AND c.table_name = '${args.tableName}'` : ''}
            ORDER BY c.table_name, c.ordinal_position;
          `;
        } else {
          // 使用配置中的 database 名称
          query = `
            SELECT
              table_name,
              column_name,
              data_type,
              ordinal_position
            FROM information_schema.columns
            WHERE table_schema = '${config.database}'
            ${args.tableName ? `AND table_name = '${args.tableName}'` : ''}
            ORDER BY table_name, ordinal_position;
          `;
        }

        let result;
        if (pool instanceof Pool) {
          result = await pool.query(query);
          result = result.rows || [];
        } else {
          // mysql2 execute 可能返回不同格式
          try {
            const execResult = await pool.execute(query);
            // mysql2 可能返回 [rows, fields] 或直接是 rows
            if (Array.isArray(execResult)) {
              result = execResult[0] || [];
            } else {
              result = execResult || [];
            }
          } catch (e) {
            console.error('MySQL query error:', e);
            result = [];
          }
        }

        // 按表分组
        const tables: Record<string, any> = {};
        result.forEach((row: any) => {
          if (!tables[row.table_name]) {
            tables[row.table_name] = {
              table_name: row.table_name,
              table_comment: row.table_comment || '',
              columns: []
            };
          }
          tables[row.table_name].columns.push({
            column_name: row.column_name,
            data_type: row.data_type,
            column_comment: row.column_comment || ''
          });
        });

        const schema = Object.values(tables);

        return {
          schema: schema,
          description: args.tableName ? `表 ${args.tableName} 的结构（包含表注释和列注释）` : '所有表的结构（包含表注释和列注释）',
          tableCount: schema.length
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
  const analyzeDataTool = {
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
            const distinctSet = new Set(data.map(row => row[column]));
            result.distinct = Array.from(distinctSet);
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

  return [executeSQLTool, getSchemaTool, analyzeDataTool];
}

// 工具执行结果类型
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  explanation?: string;
  rowCount?: number;
  [key: string]: any;
}
