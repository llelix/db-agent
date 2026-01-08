# 阶段 2: 数据库设计与实现 (Day 1-2)

**阶段目标**: 完成 PostgreSQL 17 数据库设计，使用 Drizzle ORM 定义表结构和关系
**预计时间**: 1.5 天 (1 天设计 + 0.5 天实现)
**依赖**: 阶段 1 已完成

---

## 📋 本阶段任务

### 任务 2.1: 创建 Drizzle ORM Schema

#### 目标
定义数据库表结构、字段类型、约束和关系。

#### 2.1.1 用户表 (users)

**文件**: `db/schema.ts`

```typescript
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// 类型导出
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

**字段说明**:
- `id`: UUID 主键，自动生成
- `email`: 唯一邮箱，必填
- `name`: 可选用户名
- `createdAt`: 创建时间，默认当前时间

#### 2.1.2 产品表 (products)

**文件**: `db/schema.ts` (续)

```typescript
import { decimal } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  category: varchar('category', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

**字段说明**:
- `id`: UUID 主键
- `name`: 产品名称，必填
- `price`: 价格，精确到小数点后2位
- `category`: 产品分类，可选

#### 2.1.3 销售表 (sales)

**文件**: `db/schema.ts` (续)

```typescript
import { integer } from 'drizzle-orm/pg-core';

export const sales = pgTable('sales', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id),
  quantity: integer('quantity').notNull(),
  saleDate: timestamp('sale_date').defaultNow(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  userId: uuid('user_id').references(() => users.id),
});

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
```

**字段说明**:
- `id`: UUID 主键
- `productId`: 外键，关联产品表
- `quantity`: 销售数量
- `saleDate`: 销售时间
- `totalAmount`: 总金额
- `userId`: 外键，关联用户表

#### 2.1.4 查询历史表 (query_history)

**文件**: `db/schema.ts` (续)

```typescript
import { text, jsonb, integer } from 'drizzle-orm/pg-core';

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

export type QueryHistory = typeof queryHistory.$inferSelect;
export type NewQueryHistory = typeof queryHistory.$inferInsert;
```

**字段说明**:
- `id`: UUID 主键
- `userId`: 外键，关联用户表
- `naturalLanguageQuery`: 用户原始查询
- `generatedSql`: 生成的 SQL 语句
- `result`: 查询结果 (JSONB 格式)
- `reactTrace`: ReAct 推理过程 (JSONB 格式)
- `executionTimeMs`: 执行时间(毫秒)
- `status`: 执行状态
- `createdAt`: 创建时间

#### 2.1.5 关系定义

**文件**: `db/relations.ts`

```typescript
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
```

---

### 任务 2.2: 实现数据库客户端

#### 目标
配置 PostgreSQL 连接池和 Drizzle ORM 实例。

#### 2.2.1 数据库客户端配置

**文件**: `lib/database/client.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
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
```

#### 2.2.2 导出配置

**文件**: `lib/database/index.ts`

```typescript
export { db, checkDatabaseConnection } from './client';
export * from '@/db/schema';
export * from '@/db/relations';
```

---

### 任务 2.3: 创建数据库迁移和种子数据

#### 目标
生成迁移文件并创建测试数据生成器。

#### 2.3.1 Drizzle 配置文件

**文件**: `drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

#### 2.3.2 生成迁移

```bash
# 生成迁移文件
npx drizzle-kit generate:pg

# 推送到数据库
npx drizzle-kit push:pg

# 查看迁移状态
npx drizzle-kit check:pg
```

#### 2.3.3 种子数据生成器

**文件**: `db/seed/seed.ts`

```typescript
import { db } from '@/lib/database/client';
import { users, products, sales, queryHistory } from '@/db/schema';
import { sql } from 'drizzle-orm';

// 生成测试用户
export async function seedUsers() {
  const testUsers = [
    { email: 'admin@example.com', name: '管理员' },
    { email: 'user1@example.com', name: '张三' },
    { email: 'user2@example.com', name: '李四' },
  ];

  return await db.insert(users).values(testUsers).returning();
}

// 生成测试产品
export async function seedProducts() {
  const testProducts = [
    { name: '笔记本电脑', price: '5999.99', category: '电子产品' },
    { name: '智能手机', price: '3999.50', category: '电子产品' },
    { name: '办公椅', price: '899.00', category: '家具' },
    { name: '咖啡机', price: '1299.00', category: '家电' },
    { name: '蓝牙耳机', price: '299.99', category: '电子产品' },
  ];

  return await db.insert(products).values(testProducts).returning();
}

// 生成测试销售数据
export async function seedSales(userIds: string[], productIds: string[]) {
  const salesData = [];

  for (let i = 0; i < 50; i++) {
    const productId = productIds[Math.floor(Math.random() * productIds.length)];
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;

    // 获取产品价格
    const product = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, productId),
    });

    if (product) {
      const totalAmount = parseFloat(product.price) * quantity;

      salesData.push({
        productId,
        userId,
        quantity,
        totalAmount: totalAmount.toFixed(2),
        saleDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 过去30天
      });
    }
  }

  return await db.insert(sales).values(salesData).returning();
}

// 主种子函数
export async function seed() {
  console.log('🌱 开始填充测试数据...');

  try {
    // 清空现有数据 (可选)
    await db.execute(sql`TRUNCATE TABLE sales, query_history, products, users CASCADE`);

    // 填充数据
    const seededUsers = await seedUsers();
    console.log(`✅ 已创建 ${seededUsers.length} 个用户`);

    const seededProducts = await seedProducts();
    console.log(`✅ 已创建 ${seededProducts.length} 个产品`);

    const userIds = seededUsers.map(u => u.id);
    const productIds = seededProducts.map(p => p.id);

    const seededSales = await seedSales(userIds, productIds);
    console.log(`✅ 已创建 ${seededSales.length} 条销售记录`);

    console.log('🎉 种子数据填充完成！');
  } catch (error) {
    console.error('❌ 种子数据填充失败:', error);
    throw error;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}
```

#### 2.3.4 运行种子脚本

```bash
# 编译并运行种子脚本
npx tsx db/seed/seed.ts

# 或者在 package.json 中添加脚本
# "db:seed": "tsx db/seed/seed.ts"
```

---

## 🎯 验收标准

### 功能验收
- [ ] 所有表结构定义完成
- [ ] 外键关系正确配置
- [ ] 数据库客户端连接正常
- [ ] 迁移文件生成成功
- [ ] 种子数据能正常填充
- [ ] 类型导出完整

### 技术验收
- [ ] UUID 主键正确使用
- [ ] JSONB 字段配置正确
- [ ] Decimal 类型精度准确
- [ ] 连接池参数合理
- [ ] 错误处理完善

### 代码质量
- [ ] Schema 定义清晰
- [ ] 关系定义准确
- [ ] 类型导出完整
- [ ] 注释详细

---

## 📝 实施步骤

### 步骤 1: 创建 Schema
```bash
# 创建目录
mkdir -p db/{migrations,seed}

# 创建 schema.ts
# (复制上面的代码)
```

### 步骤 2: 创建关系文件
```bash
# 创建 relations.ts
# (复制上面的代码)
```

### 步骤 3: 创建数据库客户端
```bash
# 创建目录
mkdir -p lib/database

# 创建 client.ts
# (复制上面的代码)
```

### 步骤 4: 生成迁移
```bash
# 创建 drizzle.config.ts
# (复制上面的代码)

# 生成迁移
npx drizzle-kit generate:pg

# 推送到数据库
npx drizzle-kit push:pg
```

### 步骤 5: 创建并运行种子
```bash
# 创建 seed.ts
# (复制上面的代码)

# 运行种子
npx tsx db/seed/seed.ts
```

### 步骤 6: 验证
```bash
# 检查数据库表
docker-compose exec postgres psql -U postgres -d ai_knowledge_db -c "\dt"

# 检查数据
docker-compose exec postgres psql -U postgres -d ai_knowledge_db -c "SELECT COUNT(*) FROM users;"
docker-compose exec postgres psql -U postgres -d ai_knowledge_db -c "SELECT COUNT(*) FROM products;"
docker-compose exec postgres psql -U postgres -d ai_knowledge_db -c "SELECT COUNT(*) FROM sales;"
```

---

## 🔍 常见问题

### Q: 迁移生成失败？
**A**: 检查 `drizzle.config.ts` 中的 schema 路径和数据库连接字符串

### Q: 外键约束错误？
**A**: 确保表创建顺序正确，先创建被引用的表

### Q: 种子数据重复？
**A**: 在运行种子前执行 TRUNCATE 或使用 `ON CONFLICT DO NOTHING`

### Q: Decimal 类型精度问题？
**A**: 确保 precision 和 scale 设置正确 (precision: 10, scale: 2)

---

## 📚 相关文档

- **阶段 1**: `phase1-project-init.md`
- **完整计划**: `nextjs-agent-app-v3.md`
- **任务列表**: `.spec-workflow/specs/nextjs-db-agent/tasks.md`

---

## ✅ 完成检查清单

在继续阶段 3 之前，请确认:

- [ ] 所有表结构定义完成
- [ ] 外键关系正确
- [ ] 数据库连接正常
- [ ] 迁移文件已生成
- [ ] 种子数据填充成功
- [ ] 类型导出完整
- [ ] 数据库查询测试通过

---

**阶段 2 完成后，继续 [阶段 3: AI 智能体核心](phase3-agent-core.md)**

---
**文档版本**: v1.0
**创建时间**: 2026-01-08
**状态**: ✅ 待实施
