import React, { useState, useEffect } from 'react';
import { Badge, Tooltip } from 'antd';
import { api } from '../../services/api';

/**
 * AiStatusBadge polls the backend to check if the local AI model (Ollama)
 * is running. It displays a pulsing dot (green if online, red/gray if offline).
 */
const AiStatusBadge = () => {
    const [isOnline, setIsOnline] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const checkStatus = async () => {
            try {
                const res = await api.getAiStatus();
                if (isMounted) {
                    setIsOnline(res.online === true);
                    setError(false);
                }
            } catch (err) {
                if (isMounted) {
                    setIsOnline(false);
                    setError(true);
                }
            }
        };

        // Initial check
        checkStatus();

        // Poll every 10 seconds
        const interval = setInterval(checkStatus, 10000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const statusColor = isOnline ? 'green' : (error ? 'red' : 'default');
    const tooltipText = isOnline ? 'AI Model Online (Ollama)' : 'AI Model Offline (Mock Fallback)';

    return (
        <Tooltip title={tooltipText} placement="bottom">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                <Badge
                    status={isOnline ? "processing" : "default"}
                    color={statusColor}
                    style={{ marginRight: 4 }}
                />
            </div>
        </Tooltip>
    );
};

export default AiStatusBadge;
