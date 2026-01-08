// Server Actions 通用响应类型
export interface ServerActionResponse<T = any> {
  data?: T;
  error?: string;
  success?: boolean;
}

// 查询历史类型
export interface QueryHistoryItem {
  id: string;
  userId: string;
  naturalLanguageQuery: string;
  generatedSql?: string;
  result?: any[];
  reactTrace?: any[];
  executionTimeMs?: number;
  status: string;
  createdAt: Date;
}
