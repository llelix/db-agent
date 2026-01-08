# 阶段 5: React 19 前端界面 (Day 4-5)

**阶段目标**: 创建完整的用户界面，支持聊天、ReAct 可视化和结果展示
**预计时间**: 1.5 天
**依赖**: 阶段 1, 2, 3, 4 已完成
**核心技术**: React 19, Next.js App Router, Server Actions, Tailwind CSS

---

## 📋 本阶段任务

### 任务 5.1: 聊天界面组件

#### 目标
创建主聊天界面，支持消息显示、乐观更新和实时交互。

#### 5.1.1 主聊天组件

**文件**: `src/components/ChatInterface.tsx`

```typescript
'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { executeQueryAction } from '@/lib/actions/query-action';
import { ReActFlow } from './ReActFlow';
import { QueryResult } from './QueryResult';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, User, Bot } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  trace?: any[];
  sql?: string;
  data?: any[];
  timestamp: Date;
  executionTime?: number;
}

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, startTransition] = useTransition();

  // 乐观更新
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: ChatMessage) => [...state, newMessage]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    // 创建用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    // 乐观更新用户消息
    addOptimisticMessage(userMessage);

    const currentInput = input;
    setInput('');

    // 开始异步处理
    startTransition(async () => {
      const formData = new FormData();
      formData.append('query', currentInput);

      try {
        const result = await executeQueryAction(formData);

        if (result.error) {
          // 错误消息
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `❌ 错误: ${result.error}`,
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, userMessage, errorMessage]);
        } else {
          // 成功消息
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: result.data!.result,
            trace: result.data!.steps,
            sql: result.data!.sql,
            data: result.data!.data,
            timestamp: new Date(),
            executionTime: result.data!.usage?.input + result.data!.usage?.output,
          };

          setMessages(prev => [...prev, userMessage, assistantMessage]);
        }
      } catch (error) {
        // 异常错误
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `🚨 系统错误: ${String(error)}`,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage, errorMessage]);
      }
    });
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-white">
      {/* 头部 */}
      <header className="border-b bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">数据库智能体</h1>
            <p className="text-sm text-gray-500">基于 claude-agent-sdk-typescript + ReAct 模式</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0}
          >
            清空对话
          </Button>
        </div>
      </header>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {optimisticMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg font-medium">开始对话</p>
            <p className="text-sm">输入你的数据库查询需求</p>
            <div className="mt-6 text-xs text-gray-500 space-y-1 text-center">
              <p>示例查询:</p>
              <p>• "查询所有产品"</p>
              <p>• "过去30天销售额最高的前5个产品"</p>
              <p>• "每个类别的平均价格"</p>
            </div>
          </div>
        )}

        {optimisticMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-lg p-4 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white border shadow-sm'
            }`}>
              {/* 消息头部 */}
              <div className="flex items-center gap-2 mb-2">
                {msg.role === 'user' ? (
                  <User className="h-4 w-4 opacity-80" />
                ) : (
                  <Bot className="h-4 w-4 text-blue-600" />
                )}
                <span className="text-xs font-medium opacity-80">
                  {msg.role === 'user' ? '你' : '智能体'}
                </span>
                <span className="text-xs opacity-60">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
                {msg.executionTime && (
                  <span className="text-xs opacity-60 ml-auto">
                    {msg.executionTime}ms
                  </span>
                )}
              </div>

              {/* 消息内容 */}
              <div className="font-medium whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>

              {/* ReAct 过程可视化 */}
              {msg.trace && msg.trace.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  {msg.sql && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        生成的 SQL:
                      </div>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block overflow-x-auto font-mono text-gray-800">
                        {msg.sql}
                      </code>
                    </div>
                  )}
                  <ReActFlow trace={msg.trace} />
                </div>
              )}

              {/* 查询结果 */}
              {msg.data && msg.data.length > 0 && (
                <div className="mt-4">
                  <QueryResult data={msg.data} />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 加载状态 */}
        {isPending && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-lg p-4 flex items-center space-x-3 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm text-gray-700">智能体思考中...</span>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <form onSubmit={handleSubmit} className="border-t bg-white p-4">
        <div className="flex space-x-2 max-w-5xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的数据库查询，例如：'查询过去30天销售额最高的前5个产品'"
            className="flex-1 resize-none min-h-[60px] max-h-[120px]"
            rows={3}
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={isPending || !input.trim()}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="text-xs text-gray-500 mt-2 max-w-5xl mx-auto flex justify-between">
          <span>💡 提示: 按 Enter 发送，Shift+Enter 换行</span>
          <span>支持: SQL 查询、数据分析、表结构查询</span>
        </div>
      </form>
    </div>
  );
}
```

#### 5.1.2 UI 组件 (基础)

**文件**: `src/components/ui/button.tsx`

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700',
      outline: 'border border-gray-300 hover:bg-gray-100',
      ghost: 'hover:bg-gray-100',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
```

**文件**: `src/components/ui/textarea.tsx`

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'resize-none',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
```

**文件**: `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

### 任务 5.2: ReAct 过程可视化

#### 目标
创建可折叠的 ReAct 推理过程展示组件。

#### 5.2.1 ReAct Flow 组件

**文件**: `src/components/ReActFlow.tsx`

```typescript
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Brain, Zap, Eye, AlertCircle } from 'lucide-react';

interface ReActStep {
  thought: string;
  action?: string;
  observation?: string;
}

interface ReActFlowProps {
  trace: ReActStep[];
}

export function ReActFlow({ trace }: ReActFlowProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(
    new Set(trace.map((_, i) => i)) // 默认展开所有步骤
  );

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  const toggleAll = () => {
    if (expandedSteps.size === trace.length) {
      setExpandedSteps(new Set());
    } else {
      setExpandedSteps(new Set(trace.map((_, i) => i)));
    }
  };

  if (!trace || trace.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Brain className="h-4 w-4 text-blue-600" />
          <span>ReAct 推理过程 ({trace.length} 步)</span>
          <span className="text-xs text-gray-500 font-normal">
            - claude-agent-sdk-typescript
          </span>
        </div>
        <button
          onClick={toggleAll}
          className="text-xs text-blue-600 hover:text-blue-700 underline"
        >
          {expandedSteps.size === trace.length ? '全部折叠' : '全部展开'}
        </button>
      </div>

      <div className="space-y-2">
        {trace.map((step, index) => (
          <div
            key={index}
            className="border rounded-lg overflow-hidden bg-white shadow-sm"
          >
            <button
              onClick={() => toggleStep(index)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {expandedSteps.has(index) ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                )}
                <span className="font-medium text-sm">步骤 {index + 1}</span>
                <span className="text-xs text-gray-500 max-w-[200px] truncate">
                  {step.thought.substring(0, 50)}
                  {step.thought.length > 50 ? '...' : ''}
                </span>
              </div>
            </button>

            {expandedSteps.has(index) && (
              <div className="p-3 space-y-3 bg-gray-50/50 border-t">
                {/* Thought */}
                <div className="flex items-start gap-2">
                  <Brain className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-blue-600 mb-1">
                      💭 Thought
                    </div>
                    <div className="text-sm text-gray-800 leading-relaxed">
                      {step.thought}
                    </div>
                  </div>
                </div>

                {/* Action */}
                {step.action && (
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-green-600 mb-1">
                        ⚡ Action
                      </div>
                      <pre className="text-xs font-mono bg-gray-100 p-2 rounded border overflow-x-auto text-gray-800">
                        {step.action}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Observation */}
                {step.observation && (
                  <div className="flex items-start gap-2">
                    <Eye className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-purple-600 mb-1">
                        👀 Observation
                      </div>
                      <pre className="text-xs bg-purple-50 p-2 rounded border overflow-x-auto text-gray-800 max-h-[200px] overflow-y-auto">
                        {step.observation.length > 300
                          ? step.observation.substring(0, 300) + '...'
                          : step.observation}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 任务 5.3: 查询结果展示

#### 目标
创建支持表格/JSON 视图切换和 CSV 导出的结果展示组件。

#### 5.3.1 查询结果组件

**文件**: `src/components/QueryResult.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Download, Table as TableIcon, Code, FileText } from 'lucide-react';
import { Button } from './ui/button';

interface QueryResultProps {
  data: any[] | null | undefined;
}

export function QueryResult({ data }: QueryResultProps) {
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
        <TableIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无数据</p>
      </div>
    );
  }

  // CSV 导出功能
  const exportCSV = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const value = row[h];
          // 处理复杂类型
          const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
          // 转义逗号和引号
          return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON 导出功能
  const exportJSON = () => {
    if (!data || data.length === 0) return;

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON 视图
  if (viewMode === 'json') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">JSON 视图</span>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4 mr-1" />
              表格视图
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportJSON}
            >
              <FileText className="h-4 w-4 mr-1" />
              JSON
            </Button>
          </div>
        </div>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm max-h-[400px] overflow-y-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  // 表格视图
  const columns = Object.keys(data[0]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">
          结果: {data.length} 条记录
        </span>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('json')}
          >
            <Code className="h-4 w-4 mr-1" />
            JSON 视图
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
          >
            <Download className="h-4 w-4 mr-1" />
            导出 CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg max-h-96 overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                  >
                    {typeof row[col] === 'object' && row[col] !== null
                      ? JSON.stringify(row[col])
                      : row[col] ?? 'NULL'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### 任务 5.4: 主页面整合

#### 目标
更新主页面和布局，整合所有组件。

#### 5.4.1 主页面

**文件**: `src/app/page.tsx`

```typescript
import { ChatInterface } from '@/components/ChatInterface';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '数据库智能体 - ReAct 模式',
  description: '基于 claude-agent-sdk-typescript 的自然语言数据库查询智能体',
};

export default function Home() {
  return <ChatInterface />;
}
```

#### 5.4.2 根布局

**文件**: `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: '数据库智能体 - ReAct 模式',
  description: '基于 claude-agent-sdk-typescript 的自然语言数据库查询智能体',
  authors: [{ name: '浮浮酱' }],
  keywords: ['数据库', 'AI智能体', 'ReAct', 'Claude', 'Next.js'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
```

#### 5.4.3 全局样式

**文件**: `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: var(--font-inter), system-ui, sans-serif;
  }

  body {
    @apply bg-gray-50;
  }
}

@layer components {
  /* 自定义滚动条 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-gray-100;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-gray-300 rounded;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400;
  }

  /* 代码块样式 */
  code {
    @apply font-mono;
  }

  /* 工具提示 */
  .tooltip {
    @apply relative;
  }

  .tooltip:hover::after {
    @apply absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap;
    content: attr(data-tip);
  }
}
```

---

## 🎯 验收标准

### 功能验收
- [ ] ChatInterface 能发送和接收消息
- [ ] 乐观更新工作正常
- [ ] ReActFlow 能折叠/展开步骤
- [ ] QueryResult 支持表格/JSON 视图
- [ ] CSV/JSON 导出功能正常
- [ ] 主页面整合所有组件

### 技术验收
- [ ] React 19 hooks 正确使用
- [ ] Server Actions 集成正常
- [ ] Tailwind CSS 样式完整
- [ ] 响应式设计适配
- [ ] 无 TypeScript 错误

### 代码质量
- [ ] 组件结构清晰
- [ ] 样式复用性好
- [ ] 交互体验流畅
- [ ] 错误处理完善

---

## 📝 实施步骤

### 步骤 1: 创建工具组件
```bash
mkdir -p src/components/ui
# 创建 button.tsx, textarea.tsx, utils.ts
```

### 步骤 2: 创建 ReActFlow 组件
```bash
# 创建 src/components/ReActFlow.tsx
# (复制上面的代码)
```

### 步骤 3: 创建 QueryResult 组件
```bash
# 创建 src/components/QueryResult.tsx
# (复制上面的代码)
```

### 步骤 4: 创建 ChatInterface 组件
```bash
# 创建 src/components/ChatInterface.tsx
# (复制上面的代码)
```

### 步骤 5: 更新主页面和布局
```bash
# 更新 src/app/page.tsx
# 更新 src/app/layout.tsx
# 更新 src/app/globals.css
```

### 步骤 6: 测试界面
```bash
npm run dev
# 访问 http://localhost:3000
# 测试聊天功能
# 测试 ReAct 可视化
# 测试结果展示
```

---

## 🔍 常见问题

### Q: useOptimistic 报错？
**A**: 确保 React 版本为 19+，组件使用 'use client' 指令

### Q: 样式不生效？
**A**: 检查 Tailwind 配置，确保已包含所有组件路径

### Q: 导出功能失败？
**A**: 检查浏览器是否支持 Blob 和下载功能

### Q: ReAct 步骤显示不全？
**A**: 检查数据格式，确保 trace 数组正确

---

## 📚 相关文档

- **阶段 4**: `phase4-server-actions.md`
- **完整计划**: `nextjs-agent-app-v3.md`
- **任务列表**: `.spec-workflow/specs/nextjs-db-agent/tasks.md`

---

## ✅ 完成检查清单

在继续阶段 6 之前，请确认:

- [ ] ChatInterface 能正常发送查询
- [ ] 消息显示正确 (用户/智能体)
- [ ] 乐观更新流畅
- [ ] ReActFlow 可视化清晰
- [ ] QueryResult 表格/JSON 视图切换正常
- [ ] CSV/JSON 导出功能正常
- [ ] 主页面布局正确
- [ ] 样式美观且响应式

---

**阶段 5 完成后，继续 [阶段 6: 状态管理与优化](phase6-state-management.md)**

---
**文档版本**: v1.0
**创建时间**: 2026-01-08
**状态**: ✅ 待实施
