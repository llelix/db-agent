'use client';

import { useState } from 'react';
import { useDbContext } from '@/lib/db-context';
import { ConnectionManager } from './ConnectionManager';
import { TableBrowser } from './TableBrowser';
import { SQLExecutor } from './SQLExecutor';
import { HistoryViewer } from './HistoryViewer';
import { Database, Terminal, History, Settings, AlertCircle } from 'lucide-react';

export function DatabaseDashboard() {
  const { connections, selectedConnectionId, selectConnection, loading, error, refreshConnections } = useDbContext();
  const [localLoading, setLocalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('connections');

  const handleConnectionCreated = async () => {
    setLocalLoading(true);
    await refreshConnections();
    setLocalLoading(false);
  };

  const handleConnectionDeleted = async () => {
    setLocalLoading(true);
    await refreshConnections();
    if (selectedConnectionId && !connections.find(c => c.id === selectedConnectionId)) {
      selectConnection(null);
    }
    setLocalLoading(false);
  };

  const tabs = [
    { id: 'connections', label: '连接管理', icon: Database },
    { id: 'browser', label: '数据浏览', icon: Settings, disabled: !selectedConnectionId },
    { id: 'sql', label: 'SQL查询', icon: Terminal, disabled: !selectedConnectionId },
    { id: 'history', label: '历史记录', icon: History },
  ];

  return (
    <div className="space-y-6">
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

      {/* Tabs */}
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = tab.disabled;

            return (
              <button
                key={tab.id}
                disabled={isDisabled}
                className={`
                  flex items-center justify-center gap-2
                  px-3 py-2 text-sm font-medium rounded-lg
                  border transition-all duration-200
                  ${isActive
                    ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-500/30'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-violet-300 dark:hover:border-violet-700'}
                `}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-2">
          {activeTab === 'connections' && (
            <ConnectionManager
              connections={connections}
              selectedConnection={selectedConnectionId}
              onSelectConnection={selectConnection}
              onConnectionCreated={handleConnectionCreated}
              onConnectionDeleted={handleConnectionDeleted}
              loading={loading || localLoading}
            />
          )}

          {activeTab === 'browser' && selectedConnectionId && <TableBrowser />}

          {activeTab === 'sql' && selectedConnectionId && (
            <SQLExecutor connectionId={selectedConnectionId} />
          )}

          {activeTab === 'history' && <HistoryViewer />}
        </div>
      </div>
    </div>
  );
}