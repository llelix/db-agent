import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  decimal,
  integer,
  text,
  jsonb,
} from 'drizzle-orm/pg-core';

/**
 * 用户表
 * 存储使用应用的用户信息
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

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
