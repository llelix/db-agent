/**
 * 数据库类型定义
 * 支持 PostgreSQL 和 MySQL 的外部数据库连接
 */

export type DatabaseType = 'postgresql' | 'mysql';

export interface DatabaseConfig {
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  schema?: string;  // PostgreSQL schema 名称，默认为 'public'
}

// 默认端口映射
export const DEFAULT_PORTS: Record<DatabaseType, number> = {
  postgresql: 5432,
  mysql: 3306,
};

// 数据库客户端工厂
export class DatabaseClientFactory {
  static getDefaultPort(type: DatabaseType): number {
    return DEFAULT_PORTS[type];
  }
}
