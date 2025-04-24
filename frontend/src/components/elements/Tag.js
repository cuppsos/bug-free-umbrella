import React from 'react';
import { X } from 'lucide-react';

// Tag badge component (displays tag name with color and optional removal button)
const Tag = ({ tag, onClick, onRemove, isSelected }) => (
    <span 
      onClick={onClick}
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer mr-2 
        ${tag.color} ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''} 
        ${onRemove ? 'pr-1' : ''}`}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(tag); }}
          className="ml-1 p-1 hover:bg-gray-200 rounded-full"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );

export default Tag;