'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Loader2, Plus, Trash2, Play, Edit, CheckCircle2, XCircle } from 'lucide-react';
import type { DbConnection } from '@db/schema';

interface ConnectionManagerProps {
  connections: DbConnection[];
  selectedConnection: string | null;
  onSelectConnection: (id: string) => void;
  onConnectionCreated: () => void;
  onConnectionDeleted: () => void;
  loading: boolean;
}

export function ConnectionManager({
  connections,
  selectedConnection,
  onSelectConnection,
  onConnectionCreated,
  onConnectionDeleted,
  loading,
}: ConnectionManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DbConnection | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: 5432,
      database: '',
      username: '',
      password: '',
      ssl: false,
    });
    setError(null);
    setSuccess(null);
  };

  const handleCreate = async () => {
    try {
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/db/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '创建连接失败');
      }

      if (data.success) {
        setSuccess('连接创建成功');
        setShowCreateDialog(false);
        resetForm();
        onConnectionCreated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建连接失败');
    }
  };

  const handleUpdate = async () => {
    if (!editingConnection) return;

    try {
      setError(null);
      setSuccess(null);

      const res = await fetch(`/api/db/connections/${editingConnection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '更新连接失败');
      }

      if (data.success) {
        setSuccess('连接更新成功');
        setShowEditDialog(false);
        setEditingConnection(null);
        resetForm();
        onConnectionCreated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新连接失败');
    }
  };

  const handleTest = async (connection: DbConnection) => {
    try {
      setTesting(connection.id);
      setError(null);
      setSuccess(null);

      const res = await fetch(`/api/db/connections/${connection.id}/test`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '连接测试失败');
      }

      if (data.success) {
        setSuccess(`连接测试成功: ${data.data.host}:${data.data.port}/${data.data.database}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '连接测试失败');
    } finally {
      setTesting(null);
    }
  };

  const handleDelete = async (connection: DbConnection) => {
    if (!confirm(`确定要删除连接 "${connection.name}" 吗？`)) return;

    try {
      setDeleting(connection.id);
      setError(null);
      setSuccess(null);

      const res = await fetch(`/api/db/connections/${connection.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '删除连接失败');
      }

      if (data.success) {
        setSuccess('连接删除成功');
        onConnectionDeleted();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除连接失败');
    } finally {
      setDeleting(null);
    }
  };

  const openEditDialog = (connection: DbConnection) => {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      host: connection.host,
      port: connection.port || 5432,
      database: connection.database,
      username: connection.username,
      password: '', // 不回显密码
      ssl: connection.ssl || false,
    });
    setShowEditDialog(true);
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

      {success && (
        <Alert className="border-green-500 bg-green-50">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* 连接列表 */}
      <Card>
        <CardHeader>
          <CardTitle>已配置的连接</CardTitle>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无数据库连接，请点击"新建连接"添加
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>主机</TableHead>
                  <TableHead>数据库</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((conn) => (
                  <TableRow
                    key={conn.id}
                    className={`cursor-pointer ${selectedConnection === conn.id ? 'bg-blue-50' : ''}`}
                    onClick={() => onSelectConnection(conn.id)}
                  >
                    <TableCell className="font-medium">
                      {conn.name}
                      {selectedConnection === conn.id && (
                        <Badge className="ml-2" variant="secondary">当前</Badge>
                      )}
                    </TableCell>
                    <TableCell>{conn.host}:{conn.port}</TableCell>
                    <TableCell>{conn.database}</TableCell>
                    <TableCell>
                      <Badge
                        variant={conn.ssl ? 'default' : 'secondary'}
                        className={conn.ssl ? 'bg-green-500' : ''}
                      >
                        {conn.ssl ? 'SSL' : '普通'}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTest(conn)}
                          disabled={testing === conn.id}
                        >
                          {testing === conn.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(conn)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(conn)}
                          disabled={deleting === conn.id}
                        >
                          {deleting === conn.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                新建连接
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>新建数据库连接</DialogTitle>
                <DialogDescription>
                  配置PostgreSQL数据库连接信息，连接将自动测试
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-semibold text-foreground">
                      连接名称
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="生产数据库"
                      className="bg-white dark:bg-[hsl(var(--secondary))] border-2 focus:bg-[hsl(var(--accent))] dark:focus:bg-[hsl(var(--accent))]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port" className="font-semibold text-foreground">
                      端口
                    </Label>
                    <Input
                      id="port"
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 5432 })}
                      className="bg-white dark:bg-[hsl(var(--secondary))] border-2 focus:bg-[hsl(var(--accent))] dark:focus:bg-[hsl(var(--accent))]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="host" className="font-semibold text-foreground">
                    主机地址
                  </Label>
                  <Input
                    id="host"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    placeholder="localhost"
                    className="bg-white dark:bg-[hsl(var(--secondary))] border-2 focus:bg-[hsl(var(--accent))] dark:focus:bg-[hsl(var(--accent))]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="database" className="font-semibold text-foreground">
                    数据库名
                  </Label>
                  <Input
                    id="database"
                    value={formData.database}
                    onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                    placeholder="mydb"
                    className="bg-white dark:bg-[hsl(var(--secondary))] border-2 focus:bg-[hsl(var(--accent))] dark:focus:bg-[hsl(var(--accent))]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="font-semibold text-foreground">
                      用户名
                    </Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="postgres"
                      className="bg-white dark:bg-[hsl(var(--secondary))] border-2 focus:bg-[hsl(var(--accent))] dark:focus:bg-[hsl(var(--accent))]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-semibold text-foreground">
                      密码
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="bg-white dark:bg-[hsl(var(--secondary))] border-2 focus:bg-[hsl(var(--accent))] dark:focus:bg-[hsl(var(--accent))]"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 rounded-lg border border-[hsl(var(--border))] p-3 bg-[hsl(var(--background))] dark:bg-[hsl(var(--secondary))]">
                  <Checkbox
                    id="ssl"
                    checked={formData.ssl}
                    onCheckedChange={(checked) => setFormData({ ...formData, ssl: !!checked })}
                  />
                  <Label htmlFor="ssl" className="font-semibold text-foreground cursor-pointer">
                    使用SSL连接
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleCreate}>创建连接</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑数据库连接</DialogTitle>
            <DialogDescription>
              更新连接配置信息
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="font-semibold text-foreground">
                  连接名称
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white dark:bg-[hsl(var(--secondary))] border-2 focus:bg-[hsl(var(--accent))] dark:focus:bg-[hsl(var(--accent))]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-port" className="font-semibold text-foreground">
                  端口
                </Label>
                <Input
                  id="edit-port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 5432 })}
                  className="bg-white dark:bg-[hsl(var(--secondary))] border-2 focus:bg-[hsl(var(--accent))] dark:focus:bg-[hsl(var(--accent))]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-host" className="font-semibold text-foreground">
                主机地址
              </Label>
              <Input
                id="edit-host"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                className="bg-white dark:bg-[hsl(var(--secondary))] border-2 focus:bg-[hsl(var(--accent))] dark:focus:bg-[hsl(var(--accent))]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-database" className="font-semibold text-foreground">
                数据库名
              </Label>
              <Input
                id="edit-database"
                value={formData.database}
                onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                className="bg-white dark:bg-[hsl(var(--secondary))] border-2 focus:bg-[hsl(var(--accent))] dark:focus:bg-[hsl(var(--accent))]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username" className="font-semibold text-foreground">
                  用户名
                </Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="bg-white dark:bg-[hsl(var(--secondary))] border-2 focus:bg-[hsl(var(--accent))] dark:focus:bg-[hsl(var(--accent))]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password" className="font-semibold text-foreground">
                  新密码 (留空不修改)
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="bg-white dark:bg-[hsl(var(--secondary))] border-2 focus:bg-[hsl(var(--accent))] dark:focus:bg-[hsl(var(--accent))]"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border border-[hsl(var(--border))] p-3 bg-[hsl(var(--background))] dark:bg-[hsl(var(--secondary))]">
              <Checkbox
                id="edit-ssl"
                checked={formData.ssl}
                onCheckedChange={(checked) => setFormData({ ...formData, ssl: !!checked })}
              />
              <Label htmlFor="edit-ssl" className="font-semibold text-foreground cursor-pointer">
                使用SSL连接
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingConnection(null);
              }}
            >
              取消
            </Button>
            <Button onClick={handleUpdate}>更新连接</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
