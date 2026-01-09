'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, History, Trash2, Filter, Database } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const getActionBadge = (action: string) => {
    const styles = {
      create: 'bg-blue-500',
      update: 'bg-yellow-500',
      delete: 'bg-red-500',
      test: 'bg-green-500',
      browse: 'bg-purple-500',
      query: 'bg-indigo-500',
      security: 'bg-orange-500',
    } as const;

    return (
      <Badge className={styles[action as keyof typeof styles] || 'bg-gray-500'}>
        {action}
      </Badge>
    );
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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 过滤器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              <History className="h-5 w-5 inline mr-2" />
              操作历史记录
            </span>
            <Button
              size="sm"
              variant="destructive"
              onClick={clearHistory}
              disabled={history.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清空记录
            </Button>
          </CardTitle>
          <CardDescription>
            查看所有数据库连接操作的历史记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select
                value={filterConnection}
                onValueChange={setFilterConnection}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择连接" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有连接</SelectItem>
                  {connections.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      {conn.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-gray-500" />
              <Select
                value={filterAction}
                onValueChange={setFilterAction}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择操作类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有操作</SelectItem>
                  <SelectItem value="create">创建</SelectItem>
                  <SelectItem value="update">更新</SelectItem>
                  <SelectItem value="delete">删除</SelectItem>
                  <SelectItem value="test">测试</SelectItem>
                  <SelectItem value="browse">浏览</SelectItem>
                  <SelectItem value="query">查询</SelectItem>
                  <SelectItem value="security">安全</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button size="sm" onClick={loadHistory}>
              刷新
            </Button>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无历史记录
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <Table>
                <TableHeader className="sticky top-0 bg-white">
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>连接</TableHead>
                    <TableHead>操作</TableHead>
                    <TableHead>详情</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getConnectionName(item.connectionId)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getActionBadge(item.action)}</TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="text-xs text-gray-700 break-all">
                          {formatDetails(item.details)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* 统计信息 */}
      <Card>
        <CardHeader>
          <CardTitle>统计信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {history.filter(h => h.action === 'create').length}
              </div>
              <div className="text-sm text-gray-600">创建连接</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {history.filter(h => h.action === 'test').length}
              </div>
              <div className="text-sm text-gray-600">连接测试</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {history.filter(h => h.action === 'browse').length}
              </div>
              <div className="text-sm text-gray-600">浏览操作</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">
                {history.filter(h => h.action === 'query').length}
              </div>
              <div className="text-sm text-gray-600">SQL查询</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
