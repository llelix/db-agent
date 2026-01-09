'use client';

import { useAppStore } from '../store';
import { useCallback, useTransition, useState } from 'react';
import { useDbContext } from '../db-context';

export function useQuery() {
  const {
    queryState,
    setQuery,
    setResult,
    setError,
    setIsPending,
    setActiveTab,
    reset,
  } = useAppStore();

  const { selectedConnectionId } = useDbContext();
  const [isTransition, startTransition] = useTransition();

  // 流式处理状态
  const [streamStatus, setStreamStatus] = useState<string>('');
  const [streamSteps, setStreamSteps] = useState<any[]>([]);

  // 流式提交
  const handleSubmitStream = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryState.query || !queryState.query.trim() || queryState.isPending) return;

    // 检查是否有选中的数据库连接
    if (!selectedConnectionId) {
      setError('请先选择一个数据库连接');
      return;
    }

    setError(null);
    setResult(null);
    setIsPending(true);
    setStreamStatus('开始分析查询...');
    setStreamSteps([]);

    startTransition(async () => {
      try {
        // 调用流式 API
        const response = await fetch('/api/query/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: queryState.query,
            connectionId: selectedConnectionId
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法读取响应流');
        }

        const decoder = new TextDecoder();
        let finalResult: any = null;
        let buffer = ''; // 用于处理跨块的 JSON

        // 读取流数据
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          buffer += text;

          // 处理完整的行（以 \n 分隔）
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留最后一个不完整的行

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const data = JSON.parse(line);

              switch (data.type) {
                case 'status':
                case 'thinking':
                  setStreamStatus(data.message || data.data || '思考中...');
                  break;

                case 'thought':
                  setStreamSteps(prev => [...prev, { thought: data.message }]);
                  break;

                case 'action':
                  setStreamSteps(prev => [...prev, {
                    thought: data.message || `准备调用工具: ${data.tool}`,
                    action: JSON.stringify(data.args || {}, null, 2)
                  }]);
                  break;

                case 'observation':
                  setStreamSteps(prev => {
                    const newSteps = [...prev];
                    if (newSteps.length > 0) {
                      newSteps[newSteps.length - 1].observation = JSON.stringify(data.data, null, 2);
                    }
                    return newSteps;
                  });
                  break;

                case 'complete':
                  finalResult = data.data;
                  break;

                case 'error':
                  setError(data.data || data.message);
                  break;
              }
            } catch (parseError) {
              console.error('解析流数据失败:', parseError, '原始数据:', line);
            }
          }
        }

        if (finalResult) {
          setResult(finalResult);
          setQuery(''); // 清空输入框
          setStreamStatus('查询完成');
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : '流式查询执行失败');
        setResult(null);
        setStreamStatus('');
      } finally {
        setIsPending(false);
      }
    });
  }, [queryState.query, queryState.isPending, setError, setResult, setIsPending, setQuery]);

  const handleQuerySelect = useCallback((selectedQuery: string) => {
    setQuery(selectedQuery);
    setActiveTab('query');
  }, [setQuery, setActiveTab]);

  const clearQuery = useCallback(() => {
    setQuery('');
    setStreamStatus('');
    setStreamSteps([]);
  }, [setQuery]);

  return {
    // State
    query: queryState.query,
    result: queryState.result,
    error: queryState.error,
    isPending: queryState.isPending || isTransition,
    activeTab: queryState.activeTab,
    streamStatus,
    streamSteps,

    // Actions
    setQuery,
    handleSubmitStream,
    handleQuerySelect,
    clearQuery,
    setActiveTab,
    reset,
  };
}
