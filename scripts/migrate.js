// 执行数据库迁移的脚本
const { execSync } = require('child_process');

console.log('🔄 开始执行数据库迁移...\n');

try {
  // 使用 --force 标志自动确认
  console.log('📝 正在创建新表和修改现有表...');
  execSync('npx drizzle-kit push --force', {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\n✅ 数据库迁移完成！');
  console.log('\n已创建的表:');
  console.log('  - accounts (账户表)');
  console.log('  - sessions (会话表)');
  console.log('  - verification_tokens (验证令牌表)');
  console.log('\n已修改的表:');
  console.log('  - users (添加 email_verified, image 字段)');

} catch (error) {
  console.error('\n❌ 迁移失败:', error.message);
  process.exit(1);
}