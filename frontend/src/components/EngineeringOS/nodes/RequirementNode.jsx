import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText, AlertTriangle, CheckCircle } from 'lucide-react';

const RequirementNode = ({ data }) => {
    const { id, title, status, compliance } = data;

    const getStatusColor = (s) => {
        switch (s) {
            case 'Verified': return 'text-green-400';
            case 'Draft': return 'text-yellow-400';
            case 'Review': return 'text-blue-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="px-4 py-2 shadow-sm rounded-md bg-gray-800 border-2 border-gray-700 min-w-[200px]">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />

            <div className="flex items-center border-b border-gray-700 pb-2 mb-2">
                <FileText className="w-4 h-4 mr-2 text-blue-400" />
                <span className="text-xs font-mono text-gray-400">{id}</span>
                {compliance === 'warning' && (
                    <AlertTriangle className="w-4 h-4 ml-auto text-yellow-500" />
                )}
                {status === 'Verified' && (
                    <CheckCircle className="w-4 h-4 ml-auto text-green-500" />
                )}
            </div>

            <div className="text-sm font-bold text-gray-100 mb-1">{title}</div>

            <div className={`text-xs ${getStatusColor(status)}`}>
                {status}
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
        </div>
    );
};

export default memo(RequirementNode);
