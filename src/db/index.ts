/**
 * NextAuth v5 使用的数据库导出
 * 重导出 lib/database/client 中的 db 实例
 */

export { db } from '@/lib/database/client';
export * from '@db/schema';