import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layout, Button, Typography, Space, Tag, Select, Input, theme } from 'antd';
import { CloseOutlined, ClearOutlined, ConsoleSqlOutlined } from '@ant-design/icons';

const { Sider } = Layout;
const { Text } = Typography;

const LOG_COLORS = {
  info: '#52c41a',
  warn: '#faad14',
  error: '#ff4d4f',
  debug: '#1677ff',
};

const formatTime = (ts) => {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    + '.' + String(d.getMilliseconds()).padStart(3, '0');
};

const ConsoleSidebar = ({ visible, onClose }) => {
  const { token } = theme.useToken();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const logsEndRef = useRef(null);
  const abortRef = useRef(null);

  // Load initial logs when opened
  useEffect(() => {
    if (!visible) return;
    fetch('http://localhost:8000/api/console/logs?count=200')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setLogs(data); })
      .catch(() => {});
  }, [visible]);

  // SSE stream for real-time logs
  useEffect(() => {
    if (!visible) return;

    const controller = new AbortController();
    abortRef.current = controller;

    const connectSSE = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/console/stream', {
          headers: { 'Accept': 'text/event-stream' },
          signal: controller.signal,
        });
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() || '';

          for (const event of events) {
            const lines = event.split(/\r?\n/);
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const data = line.substring(5).trim();
                if (data && data !== '') {
                  try {
                    const entry = JSON.parse(data);
                    setLogs(prev => [...prev.slice(-499), entry]);
                  } catch (e) { /* ignore parse errors */ }
                }
              }
            }
          }
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('Console SSE error:', e);
        }
      }
    };

    connectSSE();

    return () => {
      controller.abort();
    };
  }, [visible]);

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleClear = useCallback(() => {
    setLogs([]);
    fetch('http://localhost:8000/api/console/logs/clear', { method: 'POST' }).catch(() => {});
  }, []);

  const filteredLogs = logs
    .filter(l => filter === 'all' || l.level === filter)
    .filter(l => !search || l.message.toLowerCase().includes(search.toLowerCase()));

  return (
    <Sider
      width={400}
      collapsedWidth={0}
      collapsed={!visible}
      style={{
        borderLeft: `1px solid ${token.colorBorder}`,
        height: '100%',
        position: 'relative',
        background: token.colorBgContainer,
        display: visible ? 'block' : 'none',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${token.colorBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: token.colorBgElevated,
        }}>
          <Space>
            <ConsoleSqlOutlined style={{ fontSize: 16, color: token.colorPrimary }} />
            <Text strong style={{ fontSize: 13 }}>Console</Text>
            <Tag color="default" style={{ fontSize: 11 }}>{filteredLogs.length}</Tag>
          </Space>
          <Space size={4}>
            <Button type="text" size="small" icon={<ClearOutlined />} onClick={handleClear} title="Clear" />
            <Button type="text" size="small" icon={<CloseOutlined style={{ color: token.colorTextSecondary }} />} onClick={onClose} />
          </Space>
        </div>

        {/* Filters */}
        <div style={{
          padding: '6px 12px',
          borderBottom: `1px solid ${token.colorBorder}`,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          background: token.colorBgElevated,
        }}>
          <Select
            size="small"
            value={filter}
            onChange={setFilter}
            style={{ width: 100 }}
            options={[
              { value: 'all', label: 'All' },
              { value: 'info', label: 'Info' },
              { value: 'warn', label: 'Warn' },
              { value: 'error', label: 'Error' },
              { value: 'debug', label: 'Debug' },
            ]}
          />
          <Input
            size="small"
            placeholder="Filter..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            style={{ flex: 1 }}
          />
        </div>

        {/* Log entries */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 0',
          fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
          fontSize: 11,
          lineHeight: 1.6,
        }}>
          {filteredLogs.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Text type="secondary">No logs yet</Text>
            </div>
          )}
          {filteredLogs.map((log, i) => (
            <div
              key={i}
              style={{
                padding: '2px 12px',
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                background: log.level === 'error' ? 'rgba(255,77,79,0.06)' : 'transparent',
              }}
            >
              <Text style={{ color: token.colorTextSecondary, flexShrink: 0, fontSize: 10 }}>
                {formatTime(log.timestamp)}
              </Text>
              <Tag
                color={LOG_COLORS[log.level] || '#999'}
                style={{ fontSize: 9, lineHeight: '16px', padding: '0 4px', margin: 0, flexShrink: 0 }}
              >
                {log.level.toUpperCase()}
              </Tag>
              <Tag style={{ fontSize: 9, lineHeight: '16px', padding: '0 4px', margin: 0, flexShrink: 0 }}>
                {log.source}
              </Tag>
              <Text style={{ color: token.colorText, wordBreak: 'break-all', fontSize: 11 }}>
                {log.message}
              </Text>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </Sider>
  );
};

export default ConsoleSidebar;
