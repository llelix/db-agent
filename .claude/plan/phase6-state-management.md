# 阶段 6: 状态管理与优化 (Day 5-6)

**阶段目标**: 实现自定义 Hooks 和错误处理机制
**预计时间**: 0.5 天
**依赖**: 阶段 1, 2, 3, 4, 5 已完成
**核心技术**: React 19 Hooks, Error Boundaries, TypeScript

---

## 📋 本阶段任务

### 任务 6.1: 实现自定义 Hooks

#### 目标
封装智能体状态管理和数据库操作逻辑。

#### 6.1.1 智能体状态 Hook

**文件**: `src/hooks/useAgent.ts`

```typescript
'use client';

import { useState, useTransition } from 'react';
import { executeQueryAction, getQueryHistoryAction } from '@/lib/actions/query-action';
import type { AgentResult } from '@/lib/agent/types';

interface UseAgentReturn {
  // 状态
  loading: boolean;
  error: string | null;
  result: AgentResult | null;
  history: any[] | null;

  // 方法
  executeQuery: (query: string) => Promise<void>;
  fetchHistory: (page?: number, limit?: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;

  // 元数据
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * 智能体状态管理 Hook
 * 集成查询执行、历史记录、错误处理
 */
export function useAgent(): UseAgentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [history, setHistory] = useState<any[] | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  // 执行查询
  const executeQuery = async (query: string): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      // 使用过渡包装以支持乐观更新
      await new Promise<void>((resolve, reject) => {
        startTransition(async () => {
          try {
            const formData = new FormData();
            formData.append('query', query);

            const response = await executeQueryAction(formData);

            if (response.error) {
              reject(new Error(response.error));
            } else {
              setResult(response.data!);
              resolve();
            }
          } catch (err) {
            reject(err);
          }
        });
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Query execution failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取查询历史
  const fetchHistory = async (page: number = 1, limit: number = 20): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      const response = await getQueryHistoryAction(page, limit);

      if (response.error) {
        throw new Error(response.error);
      }

      setHistory(response.data || []);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  // 清除错误
  const clearError = () => {
    setError(null);
  };

  // 重置状态
  const reset = () => {
    setLoading(false);
    setError(null);
    setResult(null);
    setHistory(null);
    setPagination(null);
  };

  return {
    loading: isPending || loading,
    error,
    result,
    history,
    pagination,
    executeQuery,
    fetchHistory,
    clearError,
    reset,
  };
}
```

#### 6.1.2 数据库操作 Hook

**文件**: `src/hooks/useDatabase.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getQueryHistoryAction } from '@/lib/actions/query-action';

interface UseDatabaseReturn {
  // 状态
  loading: boolean;
  error: string | null;
  tables: string[] | null;
  schema: Record<string, any> | null;

  // 方法
  fetchTableList: () => Promise<void>;
  fetchTableSchema: (tableName: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * 数据库信息管理 Hook
 * 用于获取表结构和数据库信息
 */
export function useDatabase(): UseDatabaseReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<string[] | null>(null);
  const [schema, setSchema] = useState<Record<string, any> | null>(null);

  // 获取表列表
  const fetchTableList = async (): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      // 通过查询 history 获取最近的 schema 信息，或使用专门的 API
      // 这里简化处理，实际项目应添加专门的 API 端点
      const response = await getQueryHistoryAction(1, 50);

      if (response.error) {
        throw new Error(response.error);
      }

      // 从历史记录中提取表信息 (简化方案)
      const schemaEntries = response.data
        ?.map(item => item.reactTrace)
        .flat()
        .filter(step => step?.observation?.includes('schema'))
        .map(step => {
          try {
            const obs = JSON.parse(step.observation);
            return obs.schema ? Object.keys(obs.schema) : [];
          } catch {
            return [];
          }
        })
        .flat();

      const uniqueTables = [...new Set(schemaEntries)];
      setTables(uniqueTables.length > 0 ? uniqueTables : ['users', 'products', 'sales', 'query_history']);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取表结构
  const fetchTableSchema = async (tableName: string): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      // 模拟通过智能体查询表结构
      // 实际项目中应调用专门的 API
      const mockSchema = {
        [tableName]: [
          { column: 'id', type: 'uuid', nullable: false },
          { column: 'created_at', type: 'timestamp', nullable: true },
        ],
      };

      setSchema(mockSchema);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to fetch schema:', err);
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const refresh = async (): Promise<void> => {
    await fetchTableList();
  };

  // 初始加载
  useEffect(() => {
    fetchTableList();
  }, []);

  return {
    loading,
    error,
    tables,
    schema,
    fetchTableList,
    fetchTableSchema,
    refresh,
  };
}
```

#### 6.1.3 实时状态 Hook (可选)

**文件**: `src/hooks/useRealtime.ts`

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';

interface UseRealtimeOptions {
  enabled?: boolean;
  interval?: number;
  onUpdate?: (data: any) => void;
}

/**
 * 实时状态更新 Hook
 * 用于轮询或 WebSocket 连接
 */
export function useRealtime<T>(
  fetchFn: () => Promise<T>,
  options: UseRealtimeOptions = {}
) {
  const { enabled = false, interval = 5000, onUpdate } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await fetchFn();
      setData(result);
      onUpdate?.(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // 立即获取一次
    fetchData();

    // 设置轮询
    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval]);

  const manualRefresh = async () => {
    await fetchData();
  };

  return {
    data,
    loading,
    error,
    refresh: manualRefresh,
  };
}
```

---

### 任务 6.2: 错误边界和异常处理

#### 目标
捕获和处理 React 渲染错误和运行时异常。

#### 6.2.1 错误边界组件

**文件**: `src/components/ErrorBoundary.tsx`

```typescript
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * 错误边界组件
 * 捕获子组件的渲染错误
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // 记录错误
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 调用错误回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 可选: 发送到错误监控服务
    if (typeof window !== 'undefined') {
      // 示例: Sentry, LogRocket 等
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🚨</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                出现了一些问题
              </h2>
              <p className="text-gray-600 mb-4">
                应用遇到了意外错误，我们的工程师正在处理。
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-left mb-4">
                  <p className="text-xs font-semibold text-red-800 mb-1">
                    开发环境错误信息:
                  </p>
                  <pre className="text-xs text-red-700 overflow-x-auto">
                    {this.state.error.message}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-red-600 mt-2 overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              <button
                onClick={this.resetError}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 函数式错误捕获 Hook
 */
export function useErrorHandler() {
  const handleError = (error: unknown, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught:', error, errorInfo);

    // 统一错误处理
    if (error instanceof Error) {
      // 可以在这里添加错误上报逻辑
      console.error('Error message:', error.message);
    }

    // 可以添加用户友好的错误提示
    // toast.error('操作失败，请稍后重试');
  };

  return { handleError };
}
```

#### 6.2.2 API 错误处理工具

**文件**: `src/lib/utils/error-handler.ts`

```typescript
/**
 * API 错误类型
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 统一错误处理函数
 */
export function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    // 网络错误
    if (error.message.includes('Failed to fetch')) {
      return new ApiError('网络连接失败，请检查网络', 503);
    }

    // 超时错误
    if (error.message.includes('timeout')) {
      return new ApiError('请求超时，请稍后重试', 408);
    }

    return new ApiError(error.message, 500);
  }

  return new ApiError('未知错误', 500);
}

/**
 * 错误分类
 */
export function categorizeError(error: ApiError): {
  type: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
} {
  if (error.status >= 500) {
    return { type: 'server', severity: 'high' };
  }

  if (error.status === 401 || error.status === 403) {
    return { type: 'auth', severity: 'critical' };
  }

  if (error.status === 400 || error.status === 422) {
    return { type: 'validation', severity: 'medium' };
  }

  if (error.status === 503 || error.status === 408) {
    return { type: 'network', severity: 'medium' };
  }

  return { type: 'unknown', severity: 'low' };
}

/**
 * 用户友好的错误消息
 */
export function getUserFriendlyErrorMessage(error: ApiError): string {
  const { type } = categorizeError(error);

  const messages: Record<string, string> = {
    network: '网络连接不稳定，请检查网络后重试',
    auth: '登录已过期，请重新登录',
    validation: '输入数据有误，请检查后重试',
    server: '服务器暂时不可用，请稍后重试',
    unknown: '发生未知错误，请联系技术支持',
  };

  return messages[type] || messages.unknown;
}

/**
 * 重试逻辑
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 如果是最后一次尝试，抛出错误
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // 指数退避
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

#### 6.2.3 全局错误处理

**文件**: `src/lib/utils/global-error-handler.ts`

```typescript
'use client';

import { useEffect } from 'react';

/**
 * 全局错误监听 Hook
 */
export function useGlobalErrorHandling() {
  useEffect(() => {
    // 未捕获的 JavaScript 错误
    const handleOnError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      // 可以发送到错误监控服务
    };

    // 未处理的 Promise 拒绝
    const handleOnUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // 可以发送到错误监控服务
    };

    window.addEventListener('error', handleOnError);
    window.addEventListener('unhandledrejection', handleOnUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleOnError);
      window.removeEventListener('unhandledrejection', handleOnUnhandledRejection);
    };
  }, []);
}

/**
 * 包装异步函数以添加错误处理
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  onError?: (error: unknown) => void
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Error in wrapped function:', error);
      onError?.(error);
      throw error;
    }
  }) as T;
}
```

---

## 🎯 验收标准

### 功能验收
- [ ] useAgent Hook 能执行查询和获取历史
- [ ] useDatabase Hook 能获取表信息
- [ ] ErrorBoundary 能捕获渲染错误
- [ ] 错误处理工具正常工作
- [ ] 全局错误监听启用

### 技术验收
- [ ] Hook 类型定义完整
- [ ] 错误边界正确实现
- [ ] 错误分类准确
- [ ] 用户友好错误消息
- [ ] 重试机制有效

### 代码质量
- [ ] Hook 可复用性强
- [ ] 错误处理全面
- [ ] 日志记录完善
- [ ] TypeScript 类型安全

---

## 📝 实施步骤

### 步骤 1: 创建 Hooks
```bash
mkdir -p src/hooks
# 创建 useAgent.ts
# 创建 useDatabase.ts
# 创建 useRealtime.ts (可选)
```

### 步骤 2: 创建错误边界
```bash
# 创建 src/components/ErrorBoundary.tsx
```

### 步骤 3: 创建错误处理工具
```bash
mkdir -p src/lib/utils
# 创建 error-handler.ts
# 创建 global-error-handler.ts
```

### 步骤 4: 集成到应用
```bash
# 在 src/app/layout.tsx 中添加全局错误处理
# 在主要组件中使用 ErrorBoundary
```

### 步骤 5: 测试
```bash
# 1. 测试 Hook 功能
# 2. 测试错误边界
# 3. 测试错误处理
# 4. 验证类型安全
```

---

## 🔍 常见问题

### Q: Hook 报 "use" 前缀错误？
**A**: 确保文件名和函数名都以 use 开头

### Q: ErrorBoundary 不生效？
**A**: 确保组件是类组件，且正确实现 getDerivedStateFromError

### Q: 错误类型判断不准确？
**A**: 检查 error 实例的属性和原型链

### Q: 重试机制导致无限循环？
**A**: 确保 maxRetries 限制正确

---

## 📚 相关文档

- **阶段 5**: `phase5-frontend-ui.md`
- **完整计划**: `nextjs-agent-app-v3.md`
- **任务列表**: `.spec-workflow/specs/nextjs-db-agent/tasks.md`

---

## ✅ 完成检查清单

在继续阶段 7 之前，请确认:

- [ ] useAgent Hook 功能完整
- [ ] useDatabase Hook 工作正常
- [ ] ErrorBoundary 捕获错误
- [ ] 错误处理工具完善
- [ ] 全局错误监听启用
- [ ] 类型定义完整
- [ ] 测试通过

---

**阶段 6 完成后，继续 [阶段 7: 测试与部署](phase7-testing-deployment.md)**

---
**文档版本**: v1.0
**创建时间**: 2026-01-08
**状态**: ✅ 待实施
