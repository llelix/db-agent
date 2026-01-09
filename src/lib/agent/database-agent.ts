import 'dotenv/config';
import { Anthropic } from '@anthropic-ai/sdk';
import { executeSQLTool, getSchemaTool, analyzeDataTool, tools } from './tools';
import { AgentResult, AgentConfig, ReActStep } from './types';
import { CLAUDE_MODEL, DEFAULT_AGENT_CONFIG } from './claude-client';

export class DatabaseAgent {
  private anthropic: Anthropic;
  private config: AgentConfig;

  constructor(config: AgentConfig = {}) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    this.config = {
      model: config.model || DEFAULT_AGENT_CONFIG.model,
      maxSteps: config.maxSteps || 10,
      temperature: config.temperature || DEFAULT_AGENT_CONFIG.temperature,
      systemPrompt: config.systemPrompt || this.getDefaultSystemPrompt(),
    };
  }

  /**
   * 默认系统提示词
   */
  private getDefaultSystemPrompt(): string {
    return `你是一个专业的数据库查询智能体。使用 ReAct 模式：

1. **Thought**: 分析用户需求，确定查询策略
2. **Action**: 调用工具获取信息
3. **Observation**: 分析工具返回结果
4. **Final Answer**: 总结回答

**工具说明**:
- \`get_database_schema\`: 获取数据库表结构 (参数: tableName 可选)
- \`execute_sql\`: 执行安全的 SELECT 查询 (参数: sql, explanation)
- \`analyze_data\`: 分析和处理数据 (参数: data, operation, column, limit)

**工作流程**:
1. 第一步总是调用 \`get_database_schema\` 了解表结构
2. 根据表结构设计 SQL 查询
3. 调用 \`execute_sql\` 执行查询
4. 如需分析，调用 \`analyze_data\`
5. 用中文给出最终答案

**重要规则**:
- 所有 SQL 必须是 SELECT 语句
- 确保表名和列名正确
- 用中文回答用户
- 最多执行 10 步

**安全要求**:
- 只允许 SELECT 查询
- 阻止 DROP, DELETE, INSERT, UPDATE, CREATE, ALTER 等危险操作
- 验证所有 SQL 语句`;
  }

  /**
   * 执行查询主方法
   */
  async executeQuery(naturalLanguage: string): Promise<AgentResult> {
    const messages: any[] = [
      {
        role: 'user',
        content: naturalLanguage
      }
    ];

    const steps: ReActStep[] = [];
    let finalResult = '';
    let sql = '';
    let data: any[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // ReAct 循环
    for (let step = 0; step < this.config.maxSteps!; step++) {
      const response = await this.anthropic.messages.create({
        model: this.config.model!,
        messages: messages,
        system: this.config.systemPrompt!,
        tools: tools,
        max_tokens: 1000,
        temperature: this.config.temperature,
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      // 检查是否有内容
      if (!response.content || response.content.length === 0) {
        finalResult = 'AI 没有返回任何内容';
        break;
      }

      const content = response.content[0];

      // 处理文本回复
      if (content.type === 'text') {
        finalResult = content.text;

        // 检查是否需要继续
        if (!this.shouldContinue(content.text)) {
          break;
        }

        // 记录思考步骤
        steps.push({
          thought: content.text,
        });

        messages.push({
          role: 'assistant',
          content: content.text,
        });
      }

      // 处理工具调用
      if (content.type === 'tool_use') {
        const toolName = content.name;
        const toolArgs = content.input as any;

        const step: ReActStep = {
          thought: `准备调用工具: ${toolName}`,
          action: JSON.stringify(toolArgs, null, 2),
        };

        try {
          let observation: any;

          // 执行对应工具
          if (toolName === 'execute_sql') {
            const result = await executeSQLTool.execute(toolArgs);
            observation = result;

            if (result.success && result.data) {
              sql = toolArgs.sql;
              data = result.data;
            }
          } else if (toolName === 'get_database_schema') {
            observation = await getSchemaTool.execute(toolArgs);
          } else if (toolName === 'analyze_data') {
            observation = await analyzeDataTool.execute(toolArgs);
          } else {
            throw new Error(`未知工具: ${toolName}`);
          }

          step.observation = JSON.stringify(observation, null, 2);
          steps.push(step);

          // 将工具结果添加到消息历史
          messages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: content.id,
                content: JSON.stringify(observation),
              },
            ],
          });

        } catch (error) {
          step.observation = `Error: ${error}`;
          steps.push(step);

          messages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: content.id,
                content: `Error: ${error}`,
                is_error: true,
              },
            ],
          });
        }
      }
    }

    return {
      result: finalResult,
      steps,
      sql,
      data,
      usage: {
        input: totalInputTokens,
        output: totalOutputTokens,
      },
    };
  }

  /**
   * 流式执行查询主方法
   * @param naturalLanguage 自然语言查询
   * @param onStepUpdate 步骤更新回调函数，接收完整的数据对象
   */
  async executeQueryWithStream(
    naturalLanguage: string,
    onStepUpdate?: (step: number, data: any) => void
  ): Promise<AgentResult> {
    const messages: any[] = [
      {
        role: 'user',
        content: naturalLanguage
      }
    ];

    const steps: ReActStep[] = [];
    let finalResult = '';
    let sql = '';
    let data: any[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // ReAct 循环
    for (let step = 0; step < this.config.maxSteps!; step++) {
      // 发送思考中状态
      if (onStepUpdate) {
        onStepUpdate(step, { type: 'thinking', message: `正在思考第 ${step + 1} 步...` });
      }

      const response = await this.anthropic.messages.create({
        model: this.config.model!,
        messages: messages,
        system: this.config.systemPrompt!,
        tools: tools,
        max_tokens: 1000,
        temperature: this.config.temperature,
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      // 检查是否有内容
      if (!response.content || response.content.length === 0) {
        finalResult = 'AI 没有返回任何内容';
        break;
      }

      const content = response.content[0];

      // 处理文本回复
      if (content.type === 'text') {
        finalResult = content.text;

        // 发送思考内容
        if (onStepUpdate) {
          onStepUpdate(step, { type: 'thought', message: content.text });
        }

        // 检查是否需要继续
        if (!this.shouldContinue(content.text)) {
          break;
        }

        // 记录思考步骤
        steps.push({
          thought: content.text,
        });

        messages.push({
          role: 'assistant',
          content: content.text,
        });
      }

      // 处理工具调用
      if (content.type === 'tool_use') {
        const toolName = content.name;
        const toolArgs = content.input as any;

        const stepInfo: ReActStep = {
          thought: `准备调用工具: ${toolName}`,
          action: JSON.stringify(toolArgs, null, 2),
        };

        // 发送工具调用信息
        if (onStepUpdate) {
          onStepUpdate(step, {
            type: 'action',
            message: `准备调用工具: ${toolName}`,
            tool: toolName,
            args: toolArgs
          });
        }

        try {
          let observation: any;

          // 执行对应工具
          if (toolName === 'execute_sql') {
            const result = await executeSQLTool.execute(toolArgs);
            observation = result;

            if (result.success && result.data) {
              sql = toolArgs.sql;
              data = result.data;
            }
          } else if (toolName === 'get_database_schema') {
            observation = await getSchemaTool.execute(toolArgs);
          } else if (toolName === 'analyze_data') {
            observation = await analyzeDataTool.execute(toolArgs);
          } else {
            throw new Error(`未知工具: ${toolName}`);
          }

          stepInfo.observation = JSON.stringify(observation, null, 2);
          steps.push(stepInfo);

          // 发送观察结果
          if (onStepUpdate) {
            onStepUpdate(step, {
              type: 'observation',
              data: observation
            });
          }

          // 将工具结果添加到消息历史
          messages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: content.id,
                content: JSON.stringify(observation),
              },
            ],
          });

        } catch (error) {
          stepInfo.observation = `Error: ${error}`;
          steps.push(stepInfo);

          // 发送错误信息
          if (onStepUpdate) {
            onStepUpdate(step, {
              type: 'error',
              data: String(error)
            });
          }

          messages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: content.id,
                content: `Error: ${error}`,
                is_error: true,
              },
            ],
          });
        }
      }
    }

    return {
      result: finalResult,
      steps,
      sql,
      data,
      usage: {
        input: totalInputTokens,
        output: totalOutputTokens,
      },
    };
  }

  /**
   * 判断是否需要继续执行
   */
  private shouldContinue(text: string): boolean {
    const stopKeywords = ['完成', '最终答案', '总结', '回答', '完毕', '最终结果'];
    const continueKeywords = ['继续', '下一步', '还需要', '考虑', '分析', '查询'];

    const hasStop = stopKeywords.some(k => text.includes(k));
    const hasContinue = continueKeywords.some(k => text.includes(k));

    if (hasStop) return false;
    if (hasContinue) return true;

    // 如果文本较短，可能需要继续
    return text.length < 100;
  }

  /**
   * 批量执行查询
   */
  async executeBatch(queries: string[]): Promise<AgentResult[]> {
    const results: AgentResult[] = [];

    for (const query of queries) {
      const result = await this.executeQuery(query);
      results.push(result);
    }

    return results;
  }
}
