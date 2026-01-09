'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Database, Table as TableIcon, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DbConnection } from '@db/schema';

interface TableBrowserProps {
  connectionId: string | null;
  connections: DbConnection[];
  onConnectionChange: (connectionId: string) => void;
}

interface TableInfo {
  name: string;
  rowCount: number;
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: any;
  }>;
}

interface TableData {
  rows: any[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export function TableBrowser({ connectionId, connections, onConnectionChange }: TableBrowserProps) {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'structure' | 'data'>('list');

  useEffect(() => {
    if (connectionId) {
      loadTables();
      // 切换连接时重置表选择
      setSelectedTable(null);
      setTableInfo(null);
      setTableData(null);
      setActiveTab('list');
    }
  }, [connectionId]);

  useEffect(() => {
    if (selectedTable) {
      if (activeTab === 'structure') {
        loadTableStructure();
      } else if (activeTab === 'data') {
        loadTableData();
      }
    }
  }, [selectedTable, activeTab]);

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/db/${connectionId}/tables`);
      if (!res.ok) {
        throw new Error('加载表列表失败');
      }

      const data = await res.json();
      if (data.success) {
        setTables(data.data);
      } else {
        throw new Error(data.error || '加载表列表失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载表列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTableStructure = async () => {
    if (!selectedTable) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/db/${connectionId}/tables/${selectedTable}`);
      if (!res.ok) {
        throw new Error('加载表结构失败');
      }

      const data = await res.json();
      if (data.success) {
        setTableInfo(data.data);
      } else {
        throw new Error(data.error || '加载表结构失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载表结构失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (offset = 0) => {
    if (!selectedTable) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/db/${connectionId}/data/${selectedTable}?limit=50&offset=${offset}`);
      if (!res.ok) {
        throw new Error('加载表数据失败');
      }

      const data = await res.json();
      if (data.success) {
        setTableData(data.data);
      } else {
        throw new Error(data.error || '加载表数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载表数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newOffset: number) => {
    loadTableData(newOffset);
  };

  if (loading && !tables.length) {
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

      {/* 连接选择器 */}
      <Card>
        <CardHeader>
          <CardTitle>选择数据库连接</CardTitle>
          <CardDescription>
            从已配置的连接中选择一个来浏览数据表
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={connectionId || ''}
            onValueChange={onConnectionChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={connections.length > 0 ? "请选择连接..." : "暂无可用连接"}>
                {connectionId ? connections.find(c => c.id === connectionId)?.name : ""}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {connections.map((conn) => (
                <SelectItem key={conn.id} value={conn.id}>
                  {conn.name} ({conn.host}:{conn.port}/{conn.database})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 只有选择了连接才显示表列表 */}
      {connectionId && (
        <>
          {/* 表列表 */}
      <Card>
        <CardHeader>
          <CardTitle>数据表列表</CardTitle>
          <CardDescription>
            选择要浏览的表，查看结构或数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tables.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              该数据库暂无表
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {tables.map((table) => (
                <Button
                  key={table}
                  variant={selectedTable === table ? 'default' : 'outline'}
                  onClick={() => setSelectedTable(table)}
                  className="justify-start"
                >
                  <TableIcon className="h-4 w-4 mr-2" />
                  {table}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 表详情 */}
      {selectedTable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                <TableIcon className="h-5 w-5 inline mr-2" />
                {selectedTable}
              </span>
              <Badge variant="secondary">
                {tableInfo?.rowCount ?? 0} 行
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as any)}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="list">列表</TabsTrigger>
                <TabsTrigger value="structure">结构</TabsTrigger>
                <TabsTrigger value="data">数据</TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="mt-4">
                <div className="text-sm text-gray-600 space-y-2">
                  <p>点击上方标签页查看：</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>结构</strong>：查看表的列定义、数据类型、约束等</li>
                    <li><strong>数据</strong>：浏览表中的实际数据（最多50行/页）</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="structure" className="mt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    <span className="ml-2 text-gray-500">加载结构中...</span>
                  </div>
                ) : tableInfo ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        总行数: {tableInfo.rowCount}
                      </span>
                      <Badge>
                        {tableInfo.columns.length} 列
                      </Badge>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>列名</TableHead>
                          <TableHead>类型</TableHead>
                          <TableHead>可空</TableHead>
                          <TableHead>默认值</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableInfo.columns.map((col) => (
                          <TableRow key={col.column_name}>
                            <TableCell className="font-medium">
                              {col.column_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{col.data_type}</Badge>
                            </TableCell>
                            <TableCell>
                              {col.is_nullable === 'YES' ? (
                                <Badge variant="secondary">是</Badge>
                              ) : (
                                <Badge className="bg-green-500">否</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {col.column_default || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    请选择一个表查看结构
                  </div>
                )}
              </TabsContent>

              <TabsContent value="data" className="mt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    <span className="ml-2 text-gray-500">加载数据中...</span>
                  </div>
                ) : tableData ? (
                  <div className="space-y-4">
                    {tableData.rows.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        表中无数据
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {Object.keys(tableData.rows[0] || {}).map((key) => (
                                  <TableHead key={key}>{key}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tableData.rows.map((row, idx) => (
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

                        {/* 分页控件 */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            显示 {tableData.pagination.offset + 1} -{' '}
                            {Math.min(
                              tableData.pagination.offset + tableData.rows.length,
                              tableData.pagination.total
                            )}{' '}
                            条，共 {tableData.pagination.total} 条
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePageChange(tableData.pagination.offset - 50)}
                              disabled={tableData.pagination.offset === 0}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              上一页
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePageChange(tableData.pagination.offset + 50)}
                              disabled={!tableData.pagination.hasMore}
                            >
                              下一页
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    点击"数据"标签页加载表数据
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </div>
  );
}
