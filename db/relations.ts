import { relations } from 'drizzle-orm';
import { users, products, sales, queryHistory } from './schema';

// 用户关系
export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
  queryHistories: many(queryHistory),
}));

// 产品关系
export const productsRelations = relations(products, ({ many }) => ({
  sales: many(sales),
}));

// 销售关系
export const salesRelations = relations(sales, ({ one }) => ({
  product: one(products, {
    fields: [sales.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
}));

// 查询历史关系
export const queryHistoryRelations = relations(queryHistory, ({ one }) => ({
  user: one(users, {
    fields: [queryHistory.userId],
    references: [users.id],
  }),
}));
