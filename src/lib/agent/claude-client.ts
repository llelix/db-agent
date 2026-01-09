import 'dotenv/config';
import { Anthropic } from '@anthropic-ai/sdk';

// 创建 Anthropic 客户端实例
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  // 可选: 自定义基础 URL (用于代理)
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

// 模型配置
// 优先使用环境变量中的模型，否则使用默认模型
export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

// 默认参数配置
export const DEFAULT_AGENT_CONFIG = {
  model: CLAUDE_MODEL,
  maxTokens: 1000,
  temperature: 0.3,
  topP: 0.9,
};

// 类型定义
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | any[];
}

export interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text' | 'tool_use';
    text?: string;
    name?: string;
    input?: any;
    id?: string;
  }>;
  model: string;
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * 验证 Claude API 配置
 */
export async function validateClaudeConfig(): Promise<boolean> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    // 发送一个简单的测试请求
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      messages: [
        { role: 'user', content: 'Hello, test connection' }
      ],
      max_tokens: 10,
    });

    return response.content.length > 0;
  } catch (error) {
    console.error('Claude API validation failed:', error);
    return false;
  }
}
