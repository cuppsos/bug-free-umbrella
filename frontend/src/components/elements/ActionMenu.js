import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';

// Dropdown action menu for thread/comment actions (edit, delete, etc.)
const ActionMenu = ({ actions, position = 'bottom' }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="p-1 hover:bg-gray-200 rounded">
          <MoreVertical size={16} />
        </button>
        {open && (
          <>
            {/* Overlay to close menu when clicking outside */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className={`absolute ${position === 'bottom' ? 'top-full' : 'bottom-full'} right-0 mt-1 w-48 bg-white rounded shadow-lg z-20 py-1`}>
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  disabled={action.disabled}
                  onClick={() => { action.onClick(); setOpen(false); }}
                  className={`w-full px-4 py-2 text-left flex items-center gap-2 text-sm 
                    ${action.disabled ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'} 
                    ${action.destructive ? 'text-red-600' : 'text-gray-700'}`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

export default ActionMenu;