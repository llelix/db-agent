'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Terminal, Play, History, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        // 刷新历史记录
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
    <div className="space-y-4">
      {/* SQL输入区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              <Terminal className="h-5 w-5 inline mr-2" />
              SQL查询编辑器
            </span>
            <div className="flex gap-2">
              <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadHistoryFromDialog}
                  >
                    <History className="h-4 w-4 mr-2" />
                    历史记录
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[800px] max-h-[600px]">
                  <DialogHeader>
                    <DialogTitle>查询历史记录</DialogTitle>
                    <DialogDescription>
                      最近执行的SQL查询记录
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {history.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          暂无查询历史
                        </div>
                      ) : (
                        history.map((item) => (
                          <Card key={item.id} className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant={item.success ? 'default' : 'destructive'}>
                                {item.success ? '成功' : '失败'}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(item.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm font-mono bg-gray-50 p-2 rounded mb-2 break-all">
                              {item.query}
                            </div>
                            <div className="text-xs text-gray-600 flex gap-3">
                              <span>耗时: {item.executionTime}ms</span>
                              <span>行数: {item.rowCount}</span>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  <div className="flex justify-end mt-4">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={clearHistory}
                      disabled={history.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      清空历史
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                size="sm"
                onClick={executeQuery}
                disabled={loading || !sql.trim()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                执行查询
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            输入SQL查询语句，支持SELECT、WITH等查询操作
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="输入SQL查询语句..."
            className="font-mono h-32"
            disabled={loading}
          />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <Badge>
                    执行时间: {result.executionTime}ms
                  </Badge>
                  <Badge variant="secondary">
                    返回行数: {result.rowCount}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setResult(null)}
                >
                  清除结果
                </Button>
              </div>

              {result.rowCount === 0 ? (
                <Alert>
                  <AlertDescription>
                    查询执行成功，但未返回任何数据
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(result.rows[0] || {}).map((key) => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((row, idx) => (
                        <TableRow key={idx}>
                          {Object.values(row).map((val, i) => (
                            <TableCell key={i} className="max-w-[200px] truncate" title={String(val)}>
                              {val === null ? (
                                <span className="text-gray-400">NULL</span>
                              ) : typeof val === 'object' ? (
                                <span className="text-gray-500">[Object]</span>
                              ) : (
                                String(val)
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>支持的操作：</strong> SELECT, WITH, EXPLAIN, DESCRIBE, SHOW</p>
            <p><strong>限制：</strong> 禁止执行 INSERT, UPDATE, DELETE, DROP 等修改操作</p>
            <p><strong>安全：</strong> 所有查询都会被记录，包含敏感操作的查询将被阻止</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
