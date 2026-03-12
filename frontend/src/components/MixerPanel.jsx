// frontend/src/components/MixerPanel.jsx
import React from 'react';

export default function MixerPanel({ output, isLoading, onProcess }) {
  return (
    <div className="mixer-panel" style={{ padding: '20px', background: '#1e1e1e', height: '100%', color: '#fff', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3>🎚️ Mixer (AI Pipeline)</h3>
        <button 
          onClick={onProcess} 
          disabled={isLoading}
          style={{ 
            background: isLoading ? '#555' : '#00FFCC', 
            color: '#000', 
            border: 'none', 
            padding: '8px 16px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? "Processing..." : "▶ RUN PIPELINE"}
        </button>
      </div>
      
      <div className="console-output" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#ddd' }}>
        {output || <span style={{color: '#666'}}>Waiting for input routing...</span>}
      </div>
    </div>
  );
}