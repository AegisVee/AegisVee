import React, { useState, useEffect, useRef } from 'react';
import { Layout, Input, Button, Typography, Space, Card, Tag, message, theme } from 'antd';
import { SendOutlined, RobotOutlined, FileSearchOutlined, CloseOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

const { Sider } = Layout;
const { TextArea } = Input;
const { Text } = Typography;

const ChatSidebar = ({ visible, onClose, selectedRequirement }) => {
  const { token } = theme.useToken();
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hello! I am your Aegis Assistant. How can I help you with your requirements today?' }
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const streamingContentRef = useRef('');
  const [activeModel, setActiveModel] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (visible) {
      api.getAISettings()
        .then((settings) => {
          const provider = settings.active_provider || 'ollama';
          const ragMapping = settings.function_mappings?.find(m => m.function_name === 'rag_query');
          setActiveModel({ provider, model: ragMapping?.model_name || 'gemma3:4b' });
        })
        .catch(() => setActiveModel(null));
    }
  }, [visible]);

  // Improved SSE handling using EventSource logic manually or fetch
  const handleSendWithSSE = async (text = input) => {
    if (!text.trim() || streaming) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg, { role: 'ai', content: '' }]);
    setInput('');
    setStreaming(true);
    streamingContentRef.current = '';

    try {
      const response = await fetch('http://localhost:8000/api/rag/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ query: text })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Normalize EOL
        const requests = buffer.split(/\r?\n\r?\n/);
        buffer = requests.pop() || '';

        for (const request of requests) {
          const lines = request.split(/\r?\n/);
          for (const line of lines) {
            if (line.trim().startsWith('data:')) {
              const dataContent = line.trim().substring(5).trim();
              if (!dataContent) continue;
              if (dataContent === '[DONE]') continue;

              try {
                const token = JSON.parse(dataContent);
                console.log('Processed token:', token);
                streamingContentRef.current += token;

                setMessages(prev => {
                  const newMsgs = [...prev];
                  const lastMsgIndex = newMsgs.length - 1;
                  const lastMsg = { ...newMsgs[lastMsgIndex] };
                  if (lastMsg.role === 'ai') {
                    lastMsg.content = streamingContentRef.current;
                  }
                  newMsgs[lastMsgIndex] = lastMsg;
                  return newMsgs;
                });
              } catch (e) {
                console.error("Parse error:", e);
              }
            }
          }
        }
      }

    } catch (err) {
      console.error(err);
      message.error("Failed to send message");
    } finally {
      setStreaming(false);
    }
  };

  const handleCheckRequirement = () => {
    if (!selectedRequirement) {
      message.warning("Please select a requirement first!");
      return;
    }

    const context = `
Requirement ID: ${selectedRequirement.id}
Description: ${selectedRequirement.description}
Test Steps: ${selectedRequirement.testSteps}
Expected Result: ${selectedRequirement.expectedResult}

Please check if this requirement is clear, testable, and follows best practices.`;

    handleSendWithSSE(context);
  };

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
        display: visible ? 'block' : 'none'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${token.colorBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: token.colorBgElevated }}>
          <Space>
            <RobotOutlined style={{ fontSize: '18px', color: token.colorPrimary }} />
            <Text strong>Aegis Assistant</Text>
            {activeModel && (
              <Tag icon={<ThunderboltOutlined />} color="processing" style={{ fontSize: 11 }}>
                {activeModel.model}
              </Tag>
            )}
          </Space>
          <Button type="text" icon={<CloseOutlined style={{ color: token.colorTextSecondary }} />} onClick={onClose} size="small" />
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
              <Card
                size="small"
                style={{
                  background: msg.role === 'user' ? token.colorPrimary : token.colorBgElevated,
                  border: msg.role === 'user' ? 'none' : `1px solid ${token.colorBorder}`,
                  color: msg.role === 'user' ? '#fff' : token.colorText,
                  borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0'
                }}
                bodyStyle={{ padding: '8px 12px' }}
              >
                {msg.role === 'ai' && <RobotOutlined style={{ marginRight: 8, color: token.colorPrimary }} />}
                <Text style={{ color: msg.role === 'user' ? '#fff' : token.colorText, whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
              </Card>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer actions */}
        <div style={{ padding: '12px', borderTop: `1px solid ${token.colorBorder}`, background: token.colorBgElevated }}>
          {selectedRequirement && (
            <div style={{ marginBottom: 8 }}>
              <Button
                block
                icon={<FileSearchOutlined />}
                onClick={handleCheckRequirement}
                disabled={streaming}
                style={{ borderColor: token.colorPrimary, color: token.colorPrimary, background: 'transparent' }}
              >
                Check Requirement {selectedRequirement.id}
              </Button>
            </div>
          )}

          <Space.Compact style={{ width: '100%' }}>
            <TextArea
              value={input}
              onChange={e => setInput(e.target.value)}
              onPressEnter={e => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSendWithSSE();
                }
              }}
              placeholder="Ask anything..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ background: token.colorBgContainer, color: token.colorText, border: `1px solid ${token.colorBorder}` }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSendWithSSE()}
              loading={streaming}
            />
          </Space.Compact>
        </div>
      </div>
    </Sider>
  );
};

export default ChatSidebar;
