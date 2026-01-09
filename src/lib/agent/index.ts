export { DatabaseAgent } from './database-agent';
export { createTools } from './tools';
export { anthropic, CLAUDE_MODEL, validateClaudeConfig } from './claude-client';
export * from './types';

/**
 * 创建数据库智能体实例
 */
export function createDatabaseAgent(config?: any) {
  return new (require('./database-agent').DatabaseAgent)(config);
}
