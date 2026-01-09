import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from '@/db/schema';
import * as relations from '@/db/relations';

// 从环境变量获取连接字符串
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// 配置 PostgreSQL 连接池
const client = postgres(connectionString, {
  max: 10,              // 最大连接数
  idle_timeout: 20,     // 空闲超时(秒)
  max_lifetime: 60 * 30, // 最大生命周期(秒)
  connect_timeout: 10,  // 连接超时(秒)
});

// 创建 Drizzle 实例
export const db = drizzle(client, {
  schema: { ...schema, ...relations },
  // 可选: 启用查询日志
  logger: process.env.NODE_ENV === 'development',
});

// 健康检查函数
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
