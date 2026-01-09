'use client';

import { useState, useEffect } from 'react';
import { useDbContext } from '@/lib/db-context';
import { ConnectionManager } from './ConnectionManager';
import { TableBrowser } from './TableBrowser';
import { SQLExecutor } from './SQLExecutor';
import { HistoryViewer } from './HistoryViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Terminal, History, Settings } from 'lucide-react';

export function DatabaseDashboard() {
  const { connections, selectedConnectionId, selectConnection, loading, error, refreshConnections } = useDbContext();
  const [localLoading, setLocalLoading] = useState(false);

  const handleConnectionCreated = async () => {
    setLocalLoading(true);
    await refreshConnections();
    setLocalLoading(false);
  };

  const handleConnectionDeleted = async () => {
    setLocalLoading(true);
    await refreshConnections();
    // 如果删除了当前选择的连接，清除选择
    if (selectedConnectionId && !connections.find(c => c.id === selectedConnectionId)) {
      selectConnection(null);
    }
    setLocalLoading(false);
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections">
            <Database className="w-4 h-4 mr-2" />
            连接管理
          </TabsTrigger>
          <TabsTrigger value="browser" disabled={!selectedConnectionId}>
            <Settings className="w-4 h-4 mr-2" />
            数据浏览
          </TabsTrigger>
          <TabsTrigger value="sql" disabled={!selectedConnectionId}>
            <Terminal className="w-4 h-4 mr-2" />
            SQL查询
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            历史记录
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>数据库连接管理</CardTitle>
              <CardDescription>
                管理您的PostgreSQL数据库连接，支持多个连接配置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectionManager
                connections={connections}
                selectedConnection={selectedConnectionId}
                onSelectConnection={selectConnection}
                onConnectionCreated={handleConnectionCreated}
                onConnectionDeleted={handleConnectionDeleted}
                loading={loading || localLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browser" className="mt-6">
          <TableBrowser />
        </TabsContent>

        <TabsContent value="sql" className="mt-6">
          {selectedConnectionId && (
            <SQLExecutor connectionId={selectedConnectionId} />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <HistoryViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
