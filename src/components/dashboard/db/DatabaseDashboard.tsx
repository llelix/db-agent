'use client';

import { useState } from 'react';
import { useDbContext } from '@/lib/db-context';
import { ConnectionManager } from './ConnectionManager';
import { TableBrowser } from './TableBrowser';
import { SQLExecutor } from './SQLExecutor';
import { HistoryViewer } from './HistoryViewer';
import { Database, Terminal, History, Settings } from 'lucide-react';
import { Flex, Text, Callout, Box } from '@radix-ui/themes';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

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
    <Flex direction="column" gap="6">
      {error && (
        <Callout.Root color="red" variant="soft">
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}

      {/* Tabs */}
      <Flex direction="column" gap="4">
        <Flex gap="1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = tab.disabled;

            return (
              <button
                key={tab.id}
                disabled={isDisabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderRadius: '0.25rem',
                  border: '1px solid var(--gray-6)',
                  background: isActive ? 'var(--color-background)' : 'transparent',
                  color: isActive ? 'var(--color-foreground)' : 'inherit',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                onMouseEnter={(e) => {
                  if (!isDisabled && !isActive) {
                    e.currentTarget.style.background = 'var(--gray-3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon style={{ width: 16, height: 16, marginRight: 8 }} />
                {tab.label}
              </button>
            );
          })}
        </Flex>

        {/* Tab Content */}
        <Box mt="2">
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
        </Box>
      </Flex>
    </Flex>
  );
}