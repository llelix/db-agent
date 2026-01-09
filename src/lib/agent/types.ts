// ReAct 步骤类型
export interface ReActStep {
  thought: string;      // 思考过程
  action?: string;      // 动作 (JSON 字符串)
  observation?: string; // 观察结果 (JSON 字符串)
}

// 智能体结果类型
export interface AgentResult {
  result: string;       // 最终回答
  steps: ReActStep[];   // 推理过程
  sql?: string;         // 执行的 SQL
  data?: any[];         // 查询结果数据
  usage?: {             // Token 使用情况
    input: number;
    output: number;
  };
}

// 智能体配置
export interface AgentConfig {
  model?: string;
  maxSteps?: number;
  temperature?: number;
  systemPrompt?: string;
}
