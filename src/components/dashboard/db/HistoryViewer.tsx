'use client';

import { useState, useEffect } from 'react';
import { Flex, Text, Callout, Box, Button, Badge, Table, ScrollArea, SegmentedControl, Grid } from '@radix-ui/themes';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Loader2, History, Trash2, Filter, Database, RefreshCw } from 'lucide-react';

interface HistoryEntry {
  id: string;
  connectionId: string | null;
  action: string;
  details: any;
  createdAt: string;
}

export function HistoryViewer() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [connections, setConnections] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterConnection, setFilterConnection] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    loadHistory();
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const res = await fetch('/api/db/connections');
      const data = await res.json();
      if (data.success) {
        setConnections(data.data);
      }
    } catch (err) {
      console.error('加载连接失败:', err);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterConnection !== 'all') params.set('connectionId', filterConnection);
      if (filterAction !== 'all') params.set('action', filterAction);

      const res = await fetch(`/api/db/history?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setHistory(data.data.history);
      } else {
        throw new Error(data.error || '加载历史失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载历史失败');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('确定要清空所有历史记录吗？此操作不可恢复。')) return;

    try {
      const params = new URLSearchParams();
      if (filterConnection !== 'all') params.set('connectionId', filterConnection);

      const res = await fetch(`/api/db/history?${params.toString()}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setHistory([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '清空历史失败');
    }
  };

  const getActionBadgeColor = (action: string) => {
    const colors = {
      create: 'blue',
      update: 'orange',
      delete: 'red',
      test: 'green',
      browse: 'purple',
      query: 'indigo',
      security: 'amber',
    } as const;
    return colors[action as keyof typeof colors] || 'gray';
  };

  const getConnectionName = (connectionId: string | null) => {
    if (!connectionId) return '系统';
    return connections.find(c => c.id === connectionId)?.name || connectionId;
  };

  const formatDetails = (details: any) => {
    if (!details) return '-';
    if (typeof details === 'string') return details;
    return JSON.stringify(details);
  };

  if (loading) {
    return (
      <Flex align="center" justify="center" py="8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <Text ml="2" className="text-gray-500">加载中...</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="4">
      {error && (
        <Callout.Root color="red" variant="soft">
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}

      <Box>
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center" gap="4">
            <Flex align="center" gap="2">
              <History className="h-5 w-5" />
              <Text size="5" weight="bold">操作历史记录</Text>
            </Flex>
            <Button
              color="red"
              size="2"
              onClick={clearHistory}
              disabled={history.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清空记录
            </Button>
          </Flex>

          <Text size="2" className="text-gray-600">
            查看所有数据库连接操作的历史记录
          </Text>

          <Flex gap="4" wrap="wrap" align="center">
            <Flex gap="2" align="center">
              <Filter className="h-4 w-4 text-gray-500" />
              <SegmentedControl.Root
                value={filterConnection}
                onValueChange={setFilterConnection}
              >
                <SegmentedControl.Item value="all">所有连接</SegmentedControl.Item>
                {connections.map((conn) => (
                  <SegmentedControl.Item key={conn.id} value={conn.id}>
                    {conn.name}
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl.Root>
            </Flex>

            <Flex gap="2" align="center">
              <Database className="h-4 w-4 text-gray-500" />
              <SegmentedControl.Root
                value={filterAction}
                onValueChange={setFilterAction}
              >
                <SegmentedControl.Item value="all">所有操作</SegmentedControl.Item>
                <SegmentedControl.Item value="create">创建</SegmentedControl.Item>
                <SegmentedControl.Item value="update">更新</SegmentedControl.Item>
                <SegmentedControl.Item value="delete">删除</SegmentedControl.Item>
                <SegmentedControl.Item value="test">测试</SegmentedControl.Item>
                <SegmentedControl.Item value="browse">浏览</SegmentedControl.Item>
                <SegmentedControl.Item value="query">查询</SegmentedControl.Item>
                <SegmentedControl.Item value="security">安全</SegmentedControl.Item>
              </SegmentedControl.Root>
            </Flex>

            <Button size="2" onClick={loadHistory} variant="soft">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </Flex>

          {history.length === 0 ? (
            <Flex justify="center" py="8" className="text-gray-500">
              <Text size="3">暂无历史记录</Text>
            </Flex>
          ) : (
            <ScrollArea style={{ height: 500 }}>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>时间</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>连接</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>操作</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>详情</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {history.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell>
                        <Text size="2" className="text-gray-600">
                          {new Date(item.createdAt).toLocaleString()}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color="gray" variant="soft">
                          {getConnectionName(item.connectionId)}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={getActionBadgeColor(item.action)} variant="solid">
                          {item.action}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" className="text-gray-700" style={{ maxWidth: 300, wordBreak: 'break-all' }}>
                          {formatDetails(item.details)}
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </ScrollArea>
          )}
        </Flex>
      </Box>

      <Box>
        <Flex direction="column" gap="4">
          <Text size="4" weight="bold">统计信息</Text>
          <Grid columns="2" gap="4">
            <Box className="text-center p-4 bg-blue-50 rounded-lg">
              <Text size="6" weight="bold" className="text-blue-600">
                {history.filter(h => h.action === 'create').length}
              </Text>
              <Text size="2" className="text-gray-600">创建连接</Text>
            </Box>
            <Box className="text-center p-4 bg-green-50 rounded-lg">
              <Text size="6" weight="bold" className="text-green-600">
                {history.filter(h => h.action === 'test').length}
              </Text>
              <Text size="2" className="text-gray-600">连接测试</Text>
            </Box>
            <Box className="text-center p-4 bg-purple-50 rounded-lg">
              <Text size="6" weight="bold" className="text-purple-600">
                {history.filter(h => h.action === 'browse').length}
              </Text>
              <Text size="2" className="text-gray-600">浏览操作</Text>
            </Box>
            <Box className="text-center p-4 bg-indigo-50 rounded-lg">
              <Text size="6" weight="bold" className="text-indigo-600">
                {history.filter(h => h.action === 'query').length}
              </Text>
              <Text size="2" className="text-gray-600">SQL查询</Text>
            </Box>
          </Grid>
        </Flex>
      </Box>
    </Flex>
  );
}