import React from 'react';
import { THREAD_STATUS } from './constants';

// Status badge component (displays thread status with proper label and color)
const StatusBadge = ({ status }) => {
    const statusObj = typeof status === 'string' ? THREAD_STATUS[status.toUpperCase()] : status;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusObj?.color || 'bg-gray-100 text-gray-800'}`}>
        {statusObj?.label || status}
      </span>
    );
  };

export default StatusBadge;

  