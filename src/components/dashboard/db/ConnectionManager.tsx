'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2, Play, Edit } from 'lucide-react';
import type { DbConnection } from '@db/schema';
import { Flex, Text, Box, Button, Badge, Table, ScrollArea, Dialog, TextField, Checkbox, Grid, Callout } from '@radix-ui/themes';
import { CheckCircledIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';

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

      {success && (
        <Callout.Root color="green" variant="soft">
          <Callout.Icon>
            <CheckCircledIcon />
          </Callout.Icon>
          <Callout.Text>{success}</Callout.Text>
        </Callout.Root>
      )}

      <Flex direction="column" className="border rounded-lg bg-card">
        <Flex direction="column" gap="1.5" p="6">
          <Text size="5" weight="bold">已配置的连接</Text>
        </Flex>
        <Box px="6" pb="6">
          {connections.length === 0 ? (
            <Flex justify="center" py="8" className="text-gray-500">
              <Text>暂无数据库连接，请点击"新建连接"添加</Text>
            </Flex>
          ) : (
            <ScrollArea>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>名称</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>主机</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>数据库</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>状态</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>操作</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {connections.map((conn) => (
                    <Table.Row
                      key={conn.id}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedConnection === conn.id ? 'var(--blue-2)' : undefined
                      }}
                      onClick={() => onSelectConnection(conn.id)}
                    >
                      <Table.Cell>
                        <Flex align="center" gap="2">
                          <Text weight="medium">{conn.name}</Text>
                          {selectedConnection === conn.id && (
                            <Badge color="blue" variant="soft">当前</Badge>
                          )}
                        </Flex>
                      </Table.Cell>
                      <Table.Cell>{conn.host}:{conn.port}</Table.Cell>
                      <Table.Cell>{conn.database}</Table.Cell>
                      <Table.Cell>
                        <Badge color={conn.ssl ? 'green' : 'gray'} variant="soft">
                          {conn.ssl ? 'SSL' : '普通'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell onClick={(e) => e.stopPropagation()}>
                        <Flex gap="2">
                          <Button
                            size="2"
                            variant="outline"
                            onClick={() => handleTest(conn)}
                            disabled={testing === conn.id}
                          >
                            {testing === conn.id ? (
                              <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                            ) : (
                              <Play style={{ width: 16, height: 16 }} />
                            )}
                          </Button>

                          <Button
                            size="2"
                            variant="outline"
                            onClick={() => openEditDialog(conn)}
                          >
                            <Edit style={{ width: 16, height: 16 }} />
                          </Button>

                          <Button
                            size="2"
                            color="red"
                            onClick={() => handleDelete(conn)}
                            disabled={deleting === conn.id}
                          >
                            {deleting === conn.id ? (
                              <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                            ) : (
                              <Trash2 style={{ width: 16, height: 16 }} />
                            )}
                          </Button>
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </ScrollArea>
          )}
        </Box>
        <Box px="6" pb="6">
          <Dialog.Root open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <Dialog.Trigger>
              <Button onClick={resetForm}>
                <Plus style={{ width: 16, height: 16, marginRight: 4 }} />
                新建连接
              </Button>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: 500 }}>
              <Dialog.Title>新建数据库连接</Dialog.Title>
              <Dialog.Description>
                配置PostgreSQL数据库连接信息，连接将自动测试
              </Dialog.Description>

              <Grid columns="2" gap="4" mt="4">
                <Flex direction="column" gap="2">
                  <Text size="2" weight="bold">连接名称</Text>
                  <TextField.Root
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="生产数据库"
                  />
                </Flex>
                <Flex direction="column" gap="2">
                  <Text size="2" weight="bold">端口</Text>
                  <TextField.Root
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 5432 })}
                  />
                </Flex>
              </Grid>

              <Flex direction="column" gap="2" mt="4">
                <Text size="2" weight="bold">主机地址</Text>
                <TextField.Root
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="localhost"
                />
              </Flex>

              <Flex direction="column" gap="2" mt="4">
                <Text size="2" weight="bold">数据库名</Text>
                <TextField.Root
                  value={formData.database}
                  onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                  placeholder="mydb"
                />
              </Flex>

              <Grid columns="2" gap="4" mt="4">
                <Flex direction="column" gap="2">
                  <Text size="2" weight="bold">用户名</Text>
                  <TextField.Root
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="postgres"
                  />
                </Flex>
                <Flex direction="column" gap="2">
                  <Text size="2" weight="bold">密码</Text>
                  <TextField.Root
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </Flex>
              </Grid>

              <Flex align="center" gap="2" mt="4" className="border rounded-lg p-3">
                <Checkbox
                  checked={formData.ssl}
                  onCheckedChange={(checked) => setFormData({ ...formData, ssl: !!checked })}
                />
                <Text size="2" weight="bold">使用SSL连接</Text>
              </Flex>

              <Flex justify="end" gap="2" mt="4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleCreate}>创建连接</Button>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Box>
      </Flex>

      <Dialog.Root open={showEditDialog} onOpenChange={setShowEditDialog}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>编辑数据库连接</Dialog.Title>
          <Dialog.Description>
            更新连接配置信息
          </Dialog.Description>

          <Grid columns="2" gap="4" mt="4">
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">连接名称</Text>
              <TextField.Root
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Flex>
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">端口</Text>
              <TextField.Root
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 5432 })}
              />
            </Flex>
          </Grid>

          <Flex direction="column" gap="2" mt="4">
            <Text size="2" weight="bold">主机地址</Text>
            <TextField.Root
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            />
          </Flex>

          <Flex direction="column" gap="2" mt="4">
            <Text size="2" weight="bold">数据库名</Text>
            <TextField.Root
              value={formData.database}
              onChange={(e) => setFormData({ ...formData, database: e.target.value })}
            />
          </Flex>

          <Grid columns="2" gap="4" mt="4">
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">用户名</Text>
              <TextField.Root
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </Flex>
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">新密码 (留空不修改)</Text>
              <TextField.Root
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </Flex>
          </Grid>

          <Flex align="center" gap="2" mt="4" className="border rounded-lg p-3">
            <Checkbox
              checked={formData.ssl}
              onCheckedChange={(checked) => setFormData({ ...formData, ssl: !!checked })}
            />
            <Text size="2" weight="bold">使用SSL连接</Text>
          </Flex>

          <Flex justify="end" gap="2" mt="4">
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
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
}