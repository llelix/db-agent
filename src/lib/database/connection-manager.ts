import 'dotenv/config';
import { drizzle as pgDrizzle } from 'drizzle-orm/postgres-js';
import { drizzle as mysqlDrizzle } from 'drizzle-orm/mysql2';
import postgres from 'postgres';
import mysql from 'mysql2/promise';
import { eq } from 'drizzle-orm';
import { db } from './client';
import { dbConnections, type DbConnection } from '@/db/schema';
import * as aesjs from 'aes-js';
import { DatabaseType, DatabaseConfig } from '@/lib/types/database';

// 连接池缓存 - 支持多种数据库类型
const connectionPools = new Map<string, any>();

// 加密密钥 (从环境变量获取，否则使用默认密钥)
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || 'default-encryption-key-for-dev-only';
const keyBytes = aesjs.utils.hex.toBytes(
  Buffer.from(ENCRYPTION_KEY).toString('hex').padEnd(32 * 2, '0').slice(0, 32 * 2)
);

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
 * 支持 PostgreSQL 和 MySQL（用户连接的外部数据库）
 */
export class ConnectionManager {
  /**
   * 从 DbConnection 获取数据库类型
   */
  private static getDatabaseType(config: DbConnection): DatabaseType {
    if (config.type) return config.type as DatabaseType;
    if (config.port === 3306) return 'mysql';
    return 'postgresql';
  }

  /**
   * 获取数据库配置
   */
  private static getDatabaseConfig(config: DbConnection): DatabaseConfig {
    const type = this.getDatabaseType(config);
    const decryptedPassword = decryptPassword(config.password);

    return {
      type,
      host: config.host,
      port: config.port || 5432,
      database: config.database,
      username: config.username,
      password: decryptedPassword,
      ssl: config.ssl || false,
      schema: config.schema || 'public',  // PostgreSQL schema，默认为 'public'
    };
  }

  /**
   * 获取或创建连接池
   * 支持动态数据库类型
   */
  static async getPool(connectionConfig: DbConnection): Promise<any> {
    const connectionId = connectionConfig.id;

    if (connectionPools.has(connectionId)) {
      return connectionPools.get(connectionId);
    }

    const config = this.getDatabaseConfig(connectionConfig);
    const client = await this.createClient(config);

    connectionPools.set(connectionId, client);
    return client;
  }

  /**
   * 创建数据库客户端（内部工厂方法）
   */
  private static async createClient(config: DatabaseConfig) {
    const { type, host, port, database, username, password, ssl } = config;

    switch (type) {
      case 'postgresql': {
        const connectionString = `postgres://${username}:${password}@${host}:${port}/${database}${ssl ? '?sslmode=require' : ''}`;
        const client = postgres(connectionString, {
          max: 10,
          idle_timeout: 20,
          max_lifetime: 60 * 30,
          connect_timeout: 10,
        });
        return pgDrizzle(client);
      }

      case 'mysql': {
        const connection = mysql.createPool({
          host,
          port,
          user: username,
          password,
          database,
          ssl: ssl ? { rejectUnauthorized: false } : undefined,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });
        return mysqlDrizzle(connection);
      }

      default:
        throw new Error(`不支持的数据库类型: ${type}`);
    }
  }

  /**
   * 获取连接配置
   */
  static async getConnection(connectionId: string): Promise<DbConnection | null> {
    try {
      const connection = await db.query.dbConnections.findFirst({
        where: eq(dbConnections.id, connectionId),
      });
      return connection || null;
    } catch (error) {
      console.error('获取连接失败:', error);
      return null;
    }
  }

  /**
   * 测试连接 - 支持多数据库类型
   */
  static async testConnection(config: Omit<DbConnection, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const dbConfig: DatabaseConfig = {
        type: (config as any).type as DatabaseType || 'postgresql',
        host: config.host,
        port: config.port || 5432,
        database: config.database,
        username: config.username,
        password: config.password,
        ssl: config.ssl || false,
        schema: (config as any).schema || 'public',
      };

      if (dbConfig.type === 'mysql') {
        // MySQL 直接使用 mysql2 连接测试
        const mysql = await import('mysql2/promise');
        const connection = mysql.createPool({
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          ssl: dbConfig.ssl ? { rejectUnauthorized: false } : undefined,
          connectionLimit: 1,
        });

        await connection.execute('SELECT 1');
        await connection.end();
      } else {
        // PostgreSQL 使用 postgres 连接测试
        const postgresModule = await import('postgres');
        const postgres = postgresModule.default || postgresModule;
        const sql = postgres(`postgres://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}${dbConfig.ssl ? '?sslmode=require' : ''}`);

        // 如果指定了自定义 schema，先切换到该 schema
        if (dbConfig.schema && dbConfig.schema !== 'public') {
          await sql`SET search_path TO ${sql(dbConfig.schema)}`;
        }

        await sql`SELECT 1`;
        await sql.end();
      }

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
    const connection = await this.getConnection(connectionId);
    if (!connection) throw new Error('连接不存在');

    const pool = await this.getPool(connection);
    // mysql2 execute 返回 [rows, fields]，需要取 rows
    const result = await pool.execute(sqlQuery);
    // 如果是数组格式（mysql2），取第一项
    return Array.isArray(result) ? result[0] : result;
  }

  /**
   * 获取表列表 - 支持多数据库
   */
  static async getTables(connectionId: string): Promise<string[]> {
    const connection = await this.getConnection(connectionId);
    if (!connection) throw new Error('连接不存在');

    const type = this.getDatabaseType(connection);
    const pool = await this.getPool(connection);
    const schema = connection.schema || 'public';

    let query: string;
    switch (type) {
      case 'postgresql':
        query = `SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema}' AND table_type = 'BASE TABLE' ORDER BY table_name`;
        break;
      case 'mysql':
        query = `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' ORDER BY table_name`;
        break;
      default:
        throw new Error(`不支持的数据库类型: ${type}`);
    }

    const result = await pool.execute(query);
    return result.map((row: any) => row.table_name);
  }

  /**
   * 获取表结构 - 支持多数据库
   */
  static async getTableSchema(connectionId: string, tableName: string): Promise<any[]> {
    const connection = await this.getConnection(connectionId);
    if (!connection) throw new Error('连接不存在');

    const type = this.getDatabaseType(connection);
    const pool = await this.getPool(connection);
    const schema = connection.schema || 'public';

    let query: string;
    switch (type) {
      case 'postgresql':
        query = `
          SELECT column_name, data_type, is_nullable, column_default, ordinal_position
          FROM information_schema.columns
          WHERE table_schema = '${schema}' AND table_name = '${tableName}'
          ORDER BY ordinal_position
        `;
        break;
      case 'mysql':
        query = `
          SELECT column_name, data_type, is_nullable, column_default, ordinal_position
          FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = '${tableName}'
          ORDER BY ordinal_position
        `;
        break;
      default:
        throw new Error(`不支持的数据库类型: ${type}`);
    }

    return await pool.execute(query);
  }

  /**
   * 获取表数据 (分页)
   * 注意：MySQL 不支持双引号标识符，需要根据数据库类型调整
   */
  static async getTableData(
    connectionId: string,
    tableName: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    const connection = await this.getConnection(connectionId);
    if (!connection) throw new Error('连接不存在');

    const type = this.getDatabaseType(connection);
    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');

    // 根据数据库类型使用不同的引号
    const quotedName = type === 'mysql' ? `\`${safeTableName}\`` : `"${safeTableName}"`;

    return await this.executeQuery(connectionId, `SELECT * FROM ${quotedName} LIMIT ${limit} OFFSET ${offset}`);
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
    // 导入 connectionHistory 表
    const { connectionHistory } = await import('@/db/schema');
    await db.insert(connectionHistory).values({
      id: crypto.randomUUID(),
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
      if (pool.end) await pool.end();
      connectionPools.delete(connectionId);
    }
  }

  /**
   * 关闭所有连接
   */
  static async closeAllConnections(): Promise<void> {
    for (const [id, pool] of connectionPools) {
      if (pool.end) await pool.end();
      connectionPools.delete(id);
    }
  }

  /**
   * 清除指定连接的缓存
   */
  static clearConnectionCache(connectionId: string): void {
    const pool = connectionPools.get(connectionId);
    if (pool) {
      if (pool.end) pool.end().catch(console.error);
      connectionPools.delete(connectionId);
      console.log(`已清除连接缓存: ${connectionId}`);
    }
  }

  /**
   * 获取所有缓存的连接ID
   */
  static getCachedConnectionIds(): string[] {
    return Array.from(connectionPools.keys());
  }

  /**
   * 验证连接是否有效
   */
  static async validateConnection(connectionId: string): Promise<boolean> {
    try {
      const pool = connectionPools.get(connectionId);
      if (!pool) return false;

      await pool.execute('SELECT 1');
      return true;
    } catch (error) {
      // 如果连接无效，清除缓存
      this.clearConnectionCache(connectionId);
      return false;
    }
  }
}

// 导出加密/解密函数供外部使用
export { encryptPassword, decryptPassword };
