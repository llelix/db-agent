'use client';

import { useState, useEffect } from 'react';
import { useDbContext } from '@/lib/db-context';
import { Loader2, Table as TableIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Flex, Text, Callout, Box, Button, Badge, Table, ScrollArea, SegmentedControl } from '@radix-ui/themes';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

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

export function TableBrowser() {
  const { selectedConnectionId, selectedConnection } = useDbContext();
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'structure' | 'data'>('list');

  useEffect(() => {
    if (selectedConnectionId) {
      validateAndClearCache(selectedConnectionId);
      loadTables();
      setSelectedTable(null);
      setTableInfo(null);
      setTableData(null);
      setActiveTab('list');
    }
  }, [selectedConnectionId]);

  const validateAndClearCache = async (connId: string) => {
    try {
      const res = await fetch(`/api/db/${connId}/validate`);
      if (res.ok) {
        const data = await res.json();
        if (data.cleared) {
          console.log('已清除连接缓存:', connId);
        }
      }
    } catch (err) {
      console.warn('连接验证失败:', err);
    }
  };

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
    if (!selectedConnectionId) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/db/${selectedConnectionId}/tables`);
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
    if (!selectedConnectionId || !selectedTable) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/db/${selectedConnectionId}/tables/${selectedTable}`);
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
    if (!selectedConnectionId || !selectedTable) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/db/${selectedConnectionId}/data/${selectedTable}?limit=50&offset=${offset}`);
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
      <Flex align="center" justify="center" py="8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <Text ml="2" className="text-gray-500">加载中...</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="4">
      {/* Error Alert */}
      {error && (
        <Callout.Root color="red" variant="soft">
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}

      {/* No Connection */}
      {!selectedConnectionId && (
        <Flex direction="column" align="center" justify="center" py="8" className="border rounded-lg bg-card">
          <Text className="text-gray-500">请在导航栏的数据库切换器中选择一个数据库连接</Text>
        </Flex>
      )}

      {/* Main Content */}
      {selectedConnectionId && selectedConnection && (
        <>
          {/* Table List Card */}
          <Flex direction="column" className="border rounded-lg bg-card">
            <Flex direction="column" gap="1.5" p="6">
              <Text size="5" weight="bold">数据表列表</Text>
              <Text size="2" className="text-muted-foreground">选择要浏览的表，查看结构或数据</Text>
            </Flex>
            <Box px="6" pb="6">
              {tables.length === 0 ? (
                <Flex justify="center" py="8" className="text-gray-500">
                  <Text>该数据库暂无表</Text>
                </Flex>
              ) : (
                <Flex gap="3" wrap="wrap">
                  {tables.map((table) => (
                    <Button
                      key={table}
                      variant={selectedTable === table ? 'solid' : 'outline'}
                      onClick={() => setSelectedTable(table)}
                      style={{ cursor: 'pointer' }}
                    >
                      <TableIcon style={{ width: 16, height: 16, marginRight: 8 }} />
                      {table}
                    </Button>
                  ))}
                </Flex>
              )}
            </Box>
          </Flex>

          {/* Table Details */}
          {selectedTable && (
            <Flex direction="column" className="border rounded-lg bg-card">
              <Flex direction="column" gap="1.5" p="6">
                <Flex justify="between" align="center">
                  <Flex align="center">
                    <TableIcon style={{ width: 20, height: 20, marginRight: 8 }} />
                    <Text size="5" weight="bold">{selectedTable}</Text>
                  </Flex>
                  <Badge variant="soft">
                    {tableInfo?.rowCount ?? 0} 行
                  </Badge>
                </Flex>
              </Flex>
              <Box px="6" pb="6">
                {/* Tabs */}
                <Flex direction="column" gap="4">
                  <Box>
                    <SegmentedControl.Root
                      value={activeTab}
                      onValueChange={(value) => setActiveTab(value as any)}
                      style={{ width: '100%' }}
                    >
                      <SegmentedControl.Item value="list">列表</SegmentedControl.Item>
                      <SegmentedControl.Item value="structure">结构</SegmentedControl.Item>
                      <SegmentedControl.Item value="data">数据</SegmentedControl.Item>
                    </SegmentedControl.Root>
                  </Box>

                  {/* Tab Content */}
                  <Box mt="2">
                    {activeTab === 'list' && (
                      <Flex direction="column" gap="2" className="text-sm text-gray-600">
                        <Text>点击上方标签页查看：</Text>
                        <ul style={{ paddingLeft: 20 }}>
                          <li><strong>结构</strong>：查看表的列定义、数据类型、约束等</li>
                          <li><strong>数据</strong>：浏览表中的实际数据（最多50行/页）</li>
                        </ul>
                      </Flex>
                    )}

                    {activeTab === 'structure' && (
                      <>
                        {loading ? (
                          <Flex align="center" justify="center" py="8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                            <Text ml="2" className="text-gray-500">加载结构中...</Text>
                          </Flex>
                        ) : tableInfo ? (
                          <Flex direction="column" gap="4">
                            <Flex justify="between" align="center">
                              <Text size="2" className="text-gray-600">
                                总行数: {tableInfo.rowCount}
                              </Text>
                              <Badge variant="outline">{tableInfo.columns.length} 列</Badge>
                            </Flex>

                            <ScrollArea style={{ maxHeight: 400 }}>
                              <Table.Root>
                                <Table.Header>
                                  <Table.Row>
                                    <Table.ColumnHeaderCell>列名</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>类型</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>可空</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>默认值</Table.ColumnHeaderCell>
                                  </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                  {tableInfo.columns.map((col) => (
                                    <Table.Row key={col.column_name}>
                                      <Table.Cell><Text weight="medium">{col.column_name}</Text></Table.Cell>
                                      <Table.Cell>
                                        <Badge variant="outline">{col.data_type}</Badge>
                                      </Table.Cell>
                                      <Table.Cell>
                                        {col.is_nullable === 'YES' ? (
                                          <Badge color="gray">是</Badge>
                                        ) : (
                                          <Badge color="green">否</Badge>
                                        )}
                                      </Table.Cell>
                                      <Table.Cell className="text-xs text-gray-500">
                                        {col.column_default || '-'}
                                      </Table.Cell>
                                    </Table.Row>
                                  ))}
                                </Table.Body>
                              </Table.Root>
                            </ScrollArea>
                          </Flex>
                        ) : (
                          <Flex justify="center" py="8" className="text-gray-500">
                            <Text>请选择一个表查看结构</Text>
                          </Flex>
                        )}
                      </>
                    )}

                    {activeTab === 'data' && (
                      <>
                        {loading ? (
                          <Flex align="center" justify="center" py="8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                            <Text ml="2" className="text-gray-500">加载数据中...</Text>
                          </Flex>
                        ) : tableData ? (
                          <Flex direction="column" gap="4">
                            {tableData.rows.length === 0 ? (
                              <Flex justify="center" py="8" className="text-gray-500">
                                <Text>表中无数据</Text>
                              </Flex>
                            ) : (
                              <>
                                <ScrollArea style={{ maxHeight: 400 }}>
                                  <Table.Root>
                                    <Table.Header style={{ position: 'sticky', top: 0, background: 'var(--color-background)' }}>
                                      <Table.Row>
                                        {Object.keys(tableData.rows[0] || {}).map((key) => (
                                          <Table.ColumnHeaderCell key={key}>{key}</Table.ColumnHeaderCell>
                                        ))}
                                      </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                      {tableData.rows.map((row, idx) => (
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

                                <Flex justify="between" align="center">
                                  <Text size="2" className="text-gray-600">
                                    显示 {tableData.pagination.offset + 1} -{' '}
                                    {Math.min(
                                      tableData.pagination.offset + tableData.rows.length,
                                      tableData.pagination.total
                                    )}{' '}
                                    条，共 {tableData.pagination.total} 条
                                  </Text>
                                  <Flex gap="2">
                                    <Button
                                      variant="outline"
                                      size="2"
                                      onClick={() => handlePageChange(tableData.pagination.offset - 50)}
                                      disabled={tableData.pagination.offset === 0}
                                    >
                                      <ChevronLeft style={{ width: 16, height: 16, marginRight: 4 }} />
                                      上一页
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="2"
                                      onClick={() => handlePageChange(tableData.pagination.offset + 50)}
                                      disabled={!tableData.pagination.hasMore}
                                    >
                                      下一页
                                      <ChevronRight style={{ width: 16, height: 16, marginLeft: 4 }} />
                                    </Button>
                                  </Flex>
                                </Flex>
                              </>
                            )}
                          </Flex>
                        ) : (
                          <Flex justify="center" py="8" className="text-gray-500">
                            <Text>点击"数据"标签页加载表数据</Text>
                          </Flex>
                        )}
                      </>
                    )}
                  </Box>
                </Flex>
              </Box>
            </Flex>
          )}
        </>
      )}
    </Flex>
  );
}