'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2, Play, Edit, CheckCircle, AlertCircle, Database } from 'lucide-react';
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

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false,
    type: 'postgresql' as 'postgresql' | 'mysql',
    schema: 'public',
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
      type: 'postgresql',
      schema: 'public',
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
      type: connection.type || 'postgresql',
      schema: connection.schema || 'public',
    });
    setShowEditDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500 mx-auto mb-2" />
          <p className="text-slate-600 dark:text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="animate-fade-in rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">错误</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="animate-fade-in rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">成功</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Connection List Card */}
      <div className="glass rounded-xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">已配置的连接</h2>
        </div>

        {/* Empty State */}
        {connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
            <Database className="h-12 w-12 mb-3 opacity-50" />
            <p>暂无数据库连接</p>
            <p className="text-sm mt-1">点击下方"新建连接"按钮添加</p>
          </div>
        ) : (
          /* Connection Table */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">名称</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">类型</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">主机</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">数据库</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Schema</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">状态</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {connections.map((conn) => (
                  <tr
                    key={conn.id}
                    className={`
                      cursor-pointer transition-colors duration-150
                      ${selectedConnection === conn.id
                        ? 'bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30'
                        : 'bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }
                    `}
                    onClick={() => onSelectConnection(conn.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{conn.name}</span>
                        {selectedConnection === conn.id && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-medium">
                            当前
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {conn.type === 'mysql' ? 'MySQL' : 'PostgreSQL'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {conn.host}:{conn.port}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {conn.database}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {conn.schema || 'public'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        px-2 py-1 text-xs rounded-full font-medium
                        ${conn.ssl
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }
                      `}>
                        {conn.ssl ? 'SSL' : '普通'}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTest(conn)}
                          disabled={testing === conn.id}
                          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="测试连接"
                        >
                          {testing === conn.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                          ) : (
                            <Play className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                          )}
                        </button>

                        <button
                          onClick={() => openEditDialog(conn)}
                          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          title="编辑"
                        >
                          <Edit className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </button>

                        <button
                          onClick={() => handleDelete(conn)}
                          disabled={deleting === conn.id}
                          className="p-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="删除"
                        >
                          {deleting === conn.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <button
            onClick={() => { resetForm(); setShowCreateDialog(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors shadow-lg shadow-violet-500/30"
          >
            <Plus className="h-4 w-4" />
            新建连接
          </button>
        </div>
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="glass rounded-2xl shadow-2xl max-w-lg w-full border border-white/20 dark:border-slate-700/50 overflow-hidden">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">新建数据库连接</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                配置数据库连接信息，连接将自动测试
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">连接名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="生产数据库"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">数据库类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value as 'postgresql' | 'mysql';
                      setFormData({
                        ...formData,
                        type: newType,
                        port: newType === 'mysql' ? 3306 : 5432,
                        schema: newType === 'mysql' ? '' : formData.schema
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all"
                  >
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">主机地址</label>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    placeholder="localhost"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">端口</label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || (formData.type === 'mysql' ? 3306 : 5432) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">数据库名</label>
                  <input
                    type="text"
                    value={formData.database}
                    onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                    placeholder="mydb"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Schema {formData.type === 'mysql' && '(PostgreSQL only)'}
                  </label>
                  <input
                    type="text"
                    value={formData.schema}
                    onChange={(e) => setFormData({ ...formData, schema: e.target.value })}
                    placeholder="public"
                    disabled={formData.type === 'mysql'}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">用户名</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder={formData.type === 'mysql' ? 'root' : 'postgres'}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
                <input
                  type="checkbox"
                  id="ssl-checkbox"
                  checked={formData.ssl}
                  onChange={(e) => setFormData({ ...formData, ssl: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="ssl-checkbox" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  使用SSL连接
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors shadow-lg shadow-violet-500/30"
              >
                创建连接
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="glass rounded-2xl shadow-2xl max-w-lg w-full border border-white/20 dark:border-slate-700/50 overflow-hidden">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">编辑数据库连接</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">更新连接配置信息</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">连接名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">数据库类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value as 'postgresql' | 'mysql';
                      setFormData({
                        ...formData,
                        type: newType,
                        port: newType === 'mysql' ? 3306 : 5432,
                        schema: newType === 'mysql' ? '' : formData.schema
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all"
                  >
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">主机地址</label>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">端口</label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || (formData.type === 'mysql' ? 3306 : 5432) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">数据库名</label>
                  <input
                    type="text"
                    value={formData.database}
                    onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Schema {formData.type === 'mysql' && '(PostgreSQL only)'}
                  </label>
                  <input
                    type="text"
                    value={formData.schema}
                    onChange={(e) => setFormData({ ...formData, schema: e.target.value })}
                    placeholder="public"
                    disabled={formData.type === 'mysql'}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">用户名</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">新密码 (留空不修改)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
                <input
                  type="checkbox"
                  id="ssl-checkbox-edit"
                  checked={formData.ssl}
                  onChange={(e) => setFormData({ ...formData, ssl: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="ssl-checkbox-edit" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  使用SSL连接
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 flex justify-end gap-2">
              <button
                onClick={() => { setShowEditDialog(false); setEditingConnection(null); }}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors shadow-lg shadow-violet-500/30"
              >
                更新连接
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
