import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql, eq } from 'drizzle-orm';
import { db } from './client';
import { dbConnections, connectionHistory, type DbConnection } from '@/db/schema';
import * as aesjs from 'aes-js';

// 加密密钥 (从环境变量获取，否则使用默认密钥)
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || 'default-encryption-key-for-dev-only';
const keyBytes = aesjs.utils.hex.toBytes(
  Buffer.from(ENCRYPTION_KEY).toString('hex').padEnd(32 * 2, '0').slice(0, 32 * 2)
);

// 连接池缓存
const connectionPools = new Map<string, postgres.Sql>();

/**
 * 加密密码
 */
function encryptPassword(password: string): string {
  const textBytes = aesjs.utils.utf8.toBytes(password);
  const aesCtr = new aesjs.ModeOfOperation.ctr(keyBytes);
  const encryptedBytes = aesCtr.encrypt(textBytes);
  return aesjs.utils.hex.fromBytes(encryptedBytes);
}

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
 * 数据库连接管理器
 */
export class ConnectionManager {
  /**
   * 获取连接字符串
   */
  private static getConnectionString(config: DbConnection): string {
    const { host, port, database, username, password, ssl } = config;
    const protocol = ssl ? 'postgres' : 'postgres';
    return `${protocol}://${username}:${password}@${host}:${port}/${database}${ssl ? '?sslmode=require' : ''}`;
  }

  /**
   * 获取或创建连接池
   */
  static getPool(connectionConfig: DbConnection): postgres.Sql {
    const connectionId = connectionConfig.id;

    if (connectionPools.has(connectionId)) {
      return connectionPools.get(connectionId)!;
    }

    // 解密密码
    const decryptedPassword = decryptPassword(connectionConfig.password);

    // 创建连接字符串
    const connectionString = this.getConnectionString({
      ...connectionConfig,
      password: decryptedPassword
    });

    // 创建新的连接池
    const pool = postgres(connectionString, {
      max: 5,
      idle_timeout: 20,
      max_lifetime: 60 * 30,
      connect_timeout: 10,
    });

    connectionPools.set(connectionId, pool);
    return pool;
  }

  /**
   * 测试连接
   */
  static async testConnection(config: Omit<DbConnection, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const encryptedPassword = encryptPassword(config.password);
      const connectionString = this.getConnectionString({
        ...config,
        id: 'test',
        password: config.password,
        createdAt: new Date(),
        updatedAt: new Date()
      } as DbConnection);

      const testClient = postgres(connectionString, { max: 1 });
      await testClient`SELECT 1`;
      await testClient.end();
      return true;
    } catch (error) {
      console.error('连接测试失败:', error);
      return false;
    }
  }

  /**
   * 执行查询
   */
  static async executeQuery(connectionId: string, sqlQuery: string): Promise<any[]> {
    const connection = await db.query.dbConnections.findFirst({
      where: eq(dbConnections.id, connectionId),
    });

    if (!connection) {
      throw new Error('连接不存在');
    }

    const pool = this.getPool(connection);
    const result = await pool.unsafe(sqlQuery);
    return result;
  }

  /**
   * 获取表列表
   */
  static async getTables(connectionId: string): Promise<string[]> {
    const result = await this.executeQuery(connectionId, `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    return result.map((row: any) => row.table_name);
  }

  /**
   * 获取表结构
   */
  static async getTableSchema(connectionId: string, tableName: string): Promise<any[]> {
    const result = await this.executeQuery(connectionId, `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = '${tableName}'
      ORDER BY ordinal_position
    `);
    return result;
  }

  /**
   * 获取表数据 (分页)
   */
  static async getTableData(
    connectionId: string,
    tableName: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    const result = await this.executeQuery(connectionId, `
      SELECT * FROM "${safeTableName}"
      LIMIT ${limit} OFFSET ${offset}
    `);
    return result;
  }

  /**
   * 记录连接历史
   */
  static async logHistory(
    userId: string,
    connectionId: string | null,
    action: string,
    details?: any
  ): Promise<void> {
    await db.insert(connectionHistory).values({
      userId,
      connectionId,
      action,
      details: details ? JSON.stringify(details) : null,
    });
  }

  /**
   * 关闭连接池
   */
  static async closeConnection(connectionId: string): Promise<void> {
    const pool = connectionPools.get(connectionId);
    if (pool) {
      await pool.end();
      connectionPools.delete(connectionId);
    }
  }

  /**
   * 关闭所有连接
   */
  static async closeAllConnections(): Promise<void> {
    for (const [id, pool] of connectionPools) {
      await pool.end();
      connectionPools.delete(id);
    }
  }
}

// 导出加密/解密函数供外部使用
export { encryptPassword, decryptPassword };