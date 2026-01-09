'use client';

import { useState } from 'react';
import { Loader2, Terminal, Play, History, Trash2, Info } from 'lucide-react';
import { Flex, Text, Callout, Box, Button, Badge, Table, ScrollArea, TextArea, Dialog } from '@radix-ui/themes';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

interface SQLExecutorProps {
  connectionId: string;
}

interface QueryResult {
  rows: any[];
  executionTime: number;
  rowCount: number;
}

interface QueryHistory {
  id: string;
  query: string;
  executionTime: number;
  rowCount: number;
  createdAt: string;
  success: boolean;
}

export function SQLExecutor({ connectionId }: SQLExecutorProps) {
  const [sql, setSql] = useState('SELECT * FROM your_table LIMIT 10;');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const executeQuery = async () => {
    if (!sql.trim()) {
      setError('请输入SQL查询语句');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch(`/api/db/${connectionId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sql.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '查询执行失败');
      }

      if (data.success) {
        setResult(data.data);
        loadHistory();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询执行失败');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/db/history?limit=20`);
      const data = await res.json();

      if (data.success) {
        setHistory(
          data.data.history
            .filter((h: any) => h.action === 'query')
            .map((h: any) => ({
              id: h.id,
              query: h.details?.sql || h.action,
              executionTime: h.details?.executionTime || 0,
              rowCount: h.details?.rowCount || 0,
              createdAt: h.createdAt,
              success: h.details?.success !== false,
            }))
        );
      }
    } catch (err) {
      console.error('加载历史失败:', err);
    }
  };

  const clearHistory = async () => {
    try {
      const res = await fetch(`/api/db/history?action=query`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setHistory([]);
      }
    } catch (err) {
      console.error('清空历史失败:', err);
    }
  };

  const loadHistoryFromDialog = () => {
    loadHistory();
    setShowHistory(true);
  };

  return (
    <Flex direction="column" gap="4">
      <Flex direction="column" className="border rounded-lg bg-card">
        <Flex direction="column" gap="1.5" p="6">
          <Flex justify="between" align="center">
            <Flex align="center">
              <Terminal style={{ width: 20, height: 20, marginRight: 8 }} />
              <Text size="5" weight="bold">SQL查询编辑器</Text>
            </Flex>
            <Flex gap="2">
              <Dialog.Root open={showHistory} onOpenChange={setShowHistory}>
                <Dialog.Trigger>
                  <Button variant="outline" size="2" onClick={loadHistoryFromDialog}>
                    <History style={{ width: 16, height: 16, marginRight: 4 }} />
                    历史记录
                  </Button>
                </Dialog.Trigger>
                <Dialog.Content style={{ maxWidth: 800, maxHeight: 600 }}>
                  <Dialog.Title>查询历史记录</Dialog.Title>
                  <Dialog.Description>
                    最近执行的SQL查询记录
                  </Dialog.Description>
                  <ScrollArea style={{ height: 400, paddingRight: 16 }}>
                    <Flex direction="column" gap="3">
                      {history.length === 0 ? (
                        <Flex justify="center" py="8" className="text-gray-500">
                          <Text>暂无查询历史</Text>
                        </Flex>
                      ) : (
                        history.map((item) => (
                          <Flex key={item.id} direction="column" gap="2" className="border rounded-lg p-3">
                            <Flex justify="between" align="center">
                              <Badge color={item.success ? 'green' : 'red'}>
                                {item.success ? '成功' : '失败'}
                              </Badge>
                              <Text size="1" className="text-gray-500">
                                {new Date(item.createdAt).toLocaleString()}
                              </Text>
                            </Flex>
                            <Text className="font-mono bg-gray-50 p-2 rounded break-all text-xs">
                              {item.query}
                            </Text>
                            <Flex gap="3" className="text-xs text-gray-600">
                              <Text>耗时: {item.executionTime}ms</Text>
                              <Text>行数: {item.rowCount}</Text>
                            </Flex>
                          </Flex>
                        ))
                      )}
                    </Flex>
                  </ScrollArea>
                  <Flex justify="end" mt="4">
                    <Button
                      color="red"
                      size="2"
                      onClick={clearHistory}
                      disabled={history.length === 0}
                    >
                      <Trash2 style={{ width: 16, height: 16, marginRight: 4 }} />
                      清空历史
                    </Button>
                  </Flex>
                </Dialog.Content>
              </Dialog.Root>

              <Button size="2" onClick={executeQuery} disabled={loading || !sql.trim()}>
                {loading ? (
                  <Loader2 style={{ width: 16, height: 16, marginRight: 4 }} className="animate-spin" />
                ) : (
                  <Play style={{ width: 16, height: 16, marginRight: 4 }} />
                )}
                执行查询
              </Button>
            </Flex>
          </Flex>
          <Text size="2" className="text-muted-foreground">
            输入SQL查询语句，支持SELECT、WITH等查询操作
          </Text>
        </Flex>
        <Box px="6" pb="6">
          <Flex direction="column" gap="4">
            <TextArea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="输入SQL查询语句..."
              style={{ fontFamily: 'monospace', minHeight: 128 }}
              disabled={loading}
              size="2"
            />

            {error && (
              <Callout.Root color="red" variant="soft">
                <Callout.Icon>
                  <ExclamationTriangleIcon />
                </Callout.Icon>
                <Callout.Text>{error}</Callout.Text>
              </Callout.Root>
            )}

            {result && (
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Flex gap="3">
                    <Badge>
                      执行时间: {result.executionTime}ms
                    </Badge>
                    <Badge color="gray">
                      返回行数: {result.rowCount}
                    </Badge>
                  </Flex>
                  <Button variant="outline" size="2" onClick={() => setResult(null)}>
                    清除结果
                  </Button>
                </Flex>

                {result.rowCount === 0 ? (
                  <Callout.Root color="blue" variant="soft">
                    <Callout.Icon>
                      <Info style={{ width: 16, height: 16 }} />
                    </Callout.Icon>
                    <Callout.Text>查询执行成功，但未返回任何数据</Callout.Text>
                  </Callout.Root>
                ) : (
                  <Flex direction="column" className="border rounded-lg overflow-hidden">
                    <ScrollArea style={{ maxHeight: 400 }}>
                      <Table.Root>
                        <Table.Header style={{ position: 'sticky', top: 0, background: 'var(--color-background)' }}>
                          <Table.Row>
                            {Object.keys(result.rows[0] || {}).map((key) => (
                              <Table.ColumnHeaderCell key={key}>{key}</Table.ColumnHeaderCell>
                            ))}
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {result.rows.map((row, idx) => (
                            <Table.Row key={idx}>
                              {Object.values(row).map((val, i) => (
                                <Table.Cell key={i} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(val)}>
                                  {val === null ? (
                                    <Text className="text-gray-400">NULL</Text>
                                  ) : typeof val === 'object' ? (
                                    <Text className="text-gray-500">[Object]</Text>
                                  ) : (
                                    String(val)
                                  )}
                                </Table.Cell>
                              ))}
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </ScrollArea>
                  </Flex>
                )}
              </Flex>
            )}

            <Flex direction="column" gap="1" className="text-xs text-gray-500">
              <Text><strong>支持的操作：</strong> SELECT, WITH, EXPLAIN, DESCRIBE, SHOW</Text>
              <Text><strong>限制：</strong> 禁止执行 INSERT, UPDATE, DELETE, DROP 等修改操作</Text>
              <Text><strong>安全：</strong> 所有查询都会被记录，包含敏感操作的查询将被阻止</Text>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  );
}