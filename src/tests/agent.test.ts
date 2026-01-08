/**
 * AI Agent 测试脚本
 * 测试数据库智能体的核心功能
 */

import 'dotenv/config';
import { DatabaseAgent } from '../../lib/agent/database-agent';
import { db } from '../../lib/database/client';
import { sql } from 'drizzle-orm';

async function testDatabaseConnection() {
  console.log('🧪 测试数据库连接...');
  try {
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ 数据库连接正常:', result);
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

async function testAgentQuery() {
  console.log('\n🧪 测试 AI Agent 查询...');
  try {
    const agent = new DatabaseAgent();

    // 测试简单查询
    const result = await agent.executeQuery('查询所有用户');
    console.log('✅ 查询成功');
    console.log('   结果:', result.result);
    if (result.sql) {
      console.log('   生成的 SQL:', result.sql);
    }
    console.log('   ReAct 步骤数:', result.steps.length);
    console.log('   Token 使用:', result.usage);

    return true;
  } catch (error) {
    console.error('❌ 查询失败:', error);
    return false;
  }
}

async function testQueryHistory() {
  console.log('\n🧪 测试查询历史记录...');
  try {
    // 检查历史记录表
    const count = await db.execute(
      sql`SELECT COUNT(*) as count FROM query_history`
    );
    console.log('✅ 历史记录查询成功:', count[0].count, '条记录');
    return true;
  } catch (error) {
    console.error('❌ 历史记录查询失败:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('='.repeat(50));
  console.log('开始运行测试套件');
  console.log('='.repeat(50));

  const results = {
    database: false,
    agent: false,
    history: false,
  };

  results.database = await testDatabaseConnection();

  // 只有在数据库连接成功时才运行其他测试
  if (results.database) {
    results.agent = await testAgentQuery();
    results.history = await testQueryHistory();
  }

  console.log('\n' + '='.repeat(50));
  console.log('测试结果汇总');
  console.log('='.repeat(50));
  console.log(`数据库连接: ${results.database ? '✅ 通过' : '❌ 失败'}`);
  console.log(`Agent 查询: ${results.agent ? '✅ 通过' : '❌ 失败'}`);
  console.log(`历史记录: ${results.history ? '✅ 通过' : '❌ 失败'}`);

  const allPassed = Object.values(results).every(r => r);
  console.log('\n' + (allPassed ? '🎉 所有测试通过！' : '⚠️  部分测试失败'));

  return allPassed;
}

// 如果直接运行此文件
if (require.main === module) {
  runAllTests()
    .then(passed => process.exit(passed ? 0 : 1))
    .catch(err => {
      console.error('测试运行错误:', err);
      process.exit(1);
    });
}

export { runAllTests, testDatabaseConnection, testAgentQuery, testQueryHistory };
