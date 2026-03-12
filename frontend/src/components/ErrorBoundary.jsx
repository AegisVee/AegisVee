import React from 'react';
import { Typography, Button } from 'antd';

const { Title, Text } = Typography;

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 24, background: '#1c1c1c', height: '100%', color: 'white' }}>
                    <Title level={3} style={{ color: '#ff4d4f' }}>Something went wrong.</Title>
                    <Text style={{ color: 'white' }}>{this.state.error && this.state.error.toString()}</Text>
                    <br />
                    <Button type="primary" onClick={() => window.location.reload()} style={{ marginTop: 16 }}>
                        Reload Page
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
