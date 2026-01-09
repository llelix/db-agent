import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  decimal,
  integer,
  text,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * 用户表 (NextAuth 兼容)
 * 存储使用应用的用户信息
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  password: varchar('password', { length: 255 }),  // 用于 Credentials 登录
  emailVerified: timestamp('email_verified'),  // ✅ NextAuth 新增
  image: varchar('image', { length: 500 }),    // ✅ NextAuth 新增
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * 账户表 (NextAuth 新增)
 * 存储 OAuth 和凭证账户信息
 */
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).$type<'credentials' | 'email' | 'oauth'>().notNull(),
  provider: varchar('provider', { length: 100 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: varchar('refresh_token'),
  access_token: varchar('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 50 }),
  scope: varchar('scope'),
  id_token: text('id_token'),
  session_state: varchar('session_state'),
}, (table) => [
  uniqueIndex('account_provider_idx').on(table.provider, table.providerAccountId),
]);

/**
 * 会话表 (NextAuth 新增)
 * 存储用户会话信息
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
});

/**
 * 验证令牌表 (NextAuth 新增)
 * 存储邮箱验证和密码重置令牌
 */
export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => [
  uniqueIndex('identifier_token_idx').on(table.identifier, table.token),
]);

/**
 * 产品表
 * 存储产品信息
 */
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  category: varchar('category', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * 销售表
 * 存储销售记录
 */
export const sales = pgTable('sales', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id),
  quantity: integer('quantity').notNull(),
  saleDate: timestamp('sale_date').defaultNow(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  userId: uuid('user_id').references(() => users.id),
});

/**
 * 查询历史表
 * 存储用户的查询历史和执行结果
 */
export const queryHistory = pgTable('query_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  naturalLanguageQuery: text('natural_language_query').notNull(),
  generatedSql: text('generated_sql'),
  result: jsonb('result'),
  reactTrace: jsonb('react_trace'),
  executionTimeMs: integer('execution_time_ms'),
  status: varchar('status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// 类型导出
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;

export type QueryHistory = typeof queryHistory.$inferSelect;
export type NewQueryHistory = typeof queryHistory.$inferInsert;
