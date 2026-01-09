'use client';

import { useState, useEffect } from 'react';
import { ConnectionManager } from './ConnectionManager';
import { TableBrowser } from './TableBrowser';
import { SQLExecutor } from './SQLExecutor';
import { HistoryViewer } from './HistoryViewer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Terminal, History, Settings } from 'lucide-react';
import type { DbConnection } from '@db/schema';

export function DatabaseDashboard() {
  const [connections, setConnections] = useState<DbConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/db/connections');
      if (!res.ok) {
        throw new Error('加载连接失败');
      }

      const data = await res.json();
      if (data.success) {
        setConnections(data.data);
        // 自动选择第一个连接
        if (data.data.length > 0 && !selectedConnection) {
          setSelectedConnection(data.data[0].id);
        }
      } else {
        throw new Error(data.error || '加载连接失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载连接失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionCreated = () => {
    loadConnections();
  };

  const handleConnectionDeleted = () => {
    loadConnections();
    if (selectedConnection && !connections.find(c => c.id === selectedConnection)) {
      setSelectedConnection(null);
    }
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
          <TabsTrigger value="browser" disabled={!selectedConnection}>
            <Settings className="w-4 h-4 mr-2" />
            数据浏览
          </TabsTrigger>
          <TabsTrigger value="sql" disabled={!selectedConnection}>
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
                selectedConnection={selectedConnection}
                onSelectConnection={setSelectedConnection}
                onConnectionCreated={handleConnectionCreated}
                onConnectionDeleted={handleConnectionDeleted}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browser" className="mt-6">
          <TableBrowser
            connectionId={selectedConnection}
            connections={connections}
            onConnectionChange={setSelectedConnection}
          />
        </TabsContent>

        <TabsContent value="sql" className="mt-6">
          {selectedConnection && (
            <SQLExecutor connectionId={selectedConnection} />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <HistoryViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
