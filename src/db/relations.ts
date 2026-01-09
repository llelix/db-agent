import { relations } from 'drizzle-orm';
import { users, queryHistory } from './schema';

// 用户关系
export const usersRelations = relations(users, ({ many }) => ({
  queryHistories: many(queryHistory),
}));


// 查询历史关系
export const queryHistoryRelations = relations(queryHistory, ({ one }) => ({
  user: one(users, {
    fields: [queryHistory.userId],
    references: [users.id],
  }),
}));
