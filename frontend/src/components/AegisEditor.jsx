// frontend/src/components/AegisEditor.jsx
import React, { useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';

export default function AegisEditor({ value, onChange, language = 'aegis-pattern' }) {
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      // 定義自訂語言 'aegis-pattern'，模擬 FL Studio Pattern
      monaco.languages.register({ id: 'aegis-pattern' });
      monaco.languages.setMonarchTokensProvider('aegis-pattern', {
        tokenizer: {
          root: [
            [/@\w+/, 'keyword'], // 關鍵字例如 @REQ, @TEST
            [/\{\{.*?\}\}/, 'variable'], // 變數 {{variable}}
            [/#.*$/, 'comment'], // 註解
          ],
        },
      });
      monaco.editor.defineTheme('aegis-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: 'FF0055', fontStyle: 'bold' }, // 亮粉色
          { token: 'variable', foreground: '00FFCC' }, // 螢光綠
        ],
        colors: {
          'editor.foreground': '#F0F0F0',
          'editor.background': '#1e1e1e',
          'editorCursor.foreground': '#00b96b',
          'editor.lineHighlightBackground': '#2a2a2a',
          'editorLineNumber.foreground': '#858585',
        }
      });
    }
  }, [monaco]);

  return (
    <Editor
      height="100%"
      defaultLanguage="aegis-pattern"
      language={language}
      theme="aegis-dark"
      value={value}
      onChange={onChange}
      options={{ minimap: { enabled: false }, fontSize: 14 }}
    />
  );
}