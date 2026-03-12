import React, { useState, useRef, useEffect } from 'react';
import { Dropdown, Menu } from 'antd';
import { FontSizeOutlined, AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined } from '@ant-design/icons';

const RichTextCell = ({ value, onChange }) => {
    const editableRef = useRef(null);
    const [style, setStyle] = useState({});

    // Parse initial style from simple wrapper if present, specifically textAlign
    // Note: A full rich text parser is complex. For this MVP, we mainly rely on text content 
    // and apply styles to the container or inject simple spans. 
    // Ideally we would use Quill or Draft.js, but user asked for "Right Click" specifically 
    // which implies a custom lightweight approach or overriding browser context menu.
    // Let's implement a cell that applies styles to the block.

    const handleMenuClick = ({ key }) => {
        let newStyle = { ...style };

        switch (key) {
            case 'size-small': newStyle.fontSize = '12px'; break;
            case 'size-normal': newStyle.fontSize = '14px'; break;
            case 'size-large': newStyle.fontSize = '18px'; break;
            case 'size-huge': newStyle.fontSize = '24px'; break;
            case 'align-left': newStyle.textAlign = 'left'; break;
            case 'align-center': newStyle.textAlign = 'center'; break;
            case 'align-right': newStyle.textAlign = 'right'; break;
            default: break;
        }

        setStyle(newStyle);
        // We trigger change callback but we need to persist the style metadata 
        // OR simply return the content wrapped in a styled div.
        // For robustness, let's wrap the inner text in a styled div string.
        if (editableRef.current) {
            onChange(getHtmlWithStyle(editableRef.current.innerText, newStyle));
        }
    };

    const getHtmlWithStyle = (text, css) => {
        if (Object.keys(css).length === 0) {
            return text;
        }
        const styleString = Object.entries(css).map(([k, v]) => {
            const kebab = k.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
            return `${kebab}: ${v}`;
        }).join('; ');
        return `<div style="${styleString}">${text}</div>`;
    };

    // When value comes in, we try to extract text and style if it matches our pattern.
    // Else treat as plain text.
    useEffect(() => {
        if (value === undefined || value === null) return;

        const divMatch = String(value).match(/^<div style="([^"]*)">([\s\S]*)<\/div>$/);
        let content = value;
        let newStyle = {};

        if (divMatch) {
            // It's our format
            const styleStr = divMatch[1];
            content = divMatch[2];

            // Parse style string back to object
            styleStr.split(';').forEach(p => {
                const [k, v] = p.split(':').map(s => s.trim());
                if (k && v) {
                    const camel = k.replace(/-./g, x => x[1].toUpperCase());
                    newStyle[camel] = v;
                }
            });
        } else {
            // Plain text, no style to extract
        }

        setStyle(newStyle);

        // CRITICAL FIX: Only update innerText if it differs to prevent cursor jumping
        if (editableRef.current && editableRef.current.innerText !== content) {
            editableRef.current.innerText = content;
        }
    }, [value]);

    const handleInput = (e) => {
        const text = e.target.innerText;
        onChange(getHtmlWithStyle(text, style));
    };

    const items = [
        {
            key: 'font-size',
            label: 'Font Size',
            icon: <FontSizeOutlined />,
            children: [
                { key: 'size-small', label: 'Small' },
                { key: 'size-normal', label: 'Normal' },
                { key: 'size-large', label: 'Large' },
                { key: 'size-huge', label: 'Huge' },
            ],
        },
        {
            type: 'divider',
        },
        {
            key: 'paragraph',
            label: 'Alignment',
            children: [
                { key: 'align-left', label: 'Left', icon: <AlignLeftOutlined /> },
                { key: 'align-center', label: 'Center', icon: <AlignCenterOutlined /> },
                { key: 'align-right', label: 'Right', icon: <AlignRightOutlined /> },
            ],
        },
    ];

    return (
        <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={['contextMenu']}>
            <div
                ref={editableRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                style={{
                    minHeight: '24px',
                    padding: '4px 8px',
                    border: '1px solid transparent',
                    outline: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    transition: 'all 0.3s',
                    whiteSpace: 'pre-wrap', // Preserve lines
                    ...style // Apply current visual style
                }}
                onFocus={(e) => e.target.style.borderColor = '#00b96b'}
                onBlur={(e) => e.target.style.borderColor = 'transparent'}
            />
        </Dropdown>
    );
};

export default RichTextCell;
