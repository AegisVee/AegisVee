import React from 'react';
import { theme } from 'antd';

/**
 * CardContainer Atom
 * A styled container for cards with hover effects.
 */
const CardContainer = ({ children, style, onClick, className }) => {
    const { token } = theme.useToken();
    const [isHovered, setIsHovered] = React.useState(false);

    const baseStyles = {
        backgroundColor: token.colorBgContainer,
        border: `1px solid ${isHovered ? token.colorPrimary : token.colorBorder}`,
        borderRadius: '12px',
        padding: '24px',
        transition: 'all 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        ...style
    };

    return (
        <div
            style={baseStyles}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
            className={className}
        >
            {children}
        </div>
    );
};

export default CardContainer;
