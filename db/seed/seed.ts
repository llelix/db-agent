import { db } from '../../lib/database/client';
import { users, products, sales, queryHistory } from '../schema';
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
      where: (tbl, { eq }) => eq(tbl.id, productId),
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

    const userIds = seededUsers.map((u: { id: string }) => u.id);
    const productIds = seededProducts.map((p: { id: string }) => p.id);

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
