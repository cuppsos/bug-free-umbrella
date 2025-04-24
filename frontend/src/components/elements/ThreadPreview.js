// Single thread preview component (for list and detailed view; includes vote, tags, status, etc.)

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, MessageCircle, Edit, Trash, Pin, Lock, CheckCircle, Flag } from 'lucide-react';
import Tag from './Tag';
import StatusBadge from './StatusBadge';
import ActionMenu from './ActionMenu';
import { THREAD_STATUS, USER_ROLES } from './constants';
import { formatTime } from './utils';
    
const ThreadPreview = ({ thread, currentUser, onUpdate, onDelete, onSelect }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(thread.title);
    const [editContent, setEditContent] = useState(thread.content);
    const isAuthor = thread.author === currentUser.name;
    const canModerate = [USER_ROLES.ADMIN, USER_ROLES.MODERATOR].includes(currentUser.role);
  
    // Save thread edits (title/content)
    const handleSaveEdit = () => {
      if (editTitle.trim() && editContent.trim()) {
        onUpdate(thread._id, { ...thread, title: editTitle, content: editContent });
        setIsEditing(false);
      }
    };
  
    // Actions available for threads
    const threadActions = [
      ...(isAuthor || canModerate ? [
        {
          label: 'Edit',
          icon: <Edit size={16} />,
          onClick: () => setIsEditing(true),
          disabled: thread.status === THREAD_STATUS.LOCKED.id
        },
        {
          label: 'Delete',
          icon: <Trash size={16} />,
          onClick: () => onDelete(thread._id),
          destructive: true
        }
      ] : []),
      ...(canModerate ? [
        {
          label: thread.isPinned ? 'Unpin' : 'Pin',
          icon: <Pin size={16} />,
          onClick: () => onUpdate(thread._id, { ...thread, isPinned: !thread.isPinned })
        },
        {
          label: thread.status === THREAD_STATUS.LOCKED.id ? 'Unlock' : 'Lock',
          icon: <Lock size={16} />,
          onClick: () => onUpdate(thread._id, { 
            ...thread, 
            status: thread.status === THREAD_STATUS.LOCKED.id ? THREAD_STATUS.OPEN.id : THREAD_STATUS.LOCKED.id 
          })
        },
        {
          label: thread.status === THREAD_STATUS.RESOLVED.id ? 'Reopen' : 'Mark Resolved',
          icon: <CheckCircle size={16} />,
          onClick: () => onUpdate(thread._id, { 
            ...thread, 
            status: thread.status === THREAD_STATUS.RESOLVED.id ? THREAD_STATUS.OPEN.id : THREAD_STATUS.RESOLVED.id 
          })
        }
      ] : []),
      {
        label: 'Report',
        icon: <Flag size={16} />,
        onClick: () => {/* Implement report logic if needed */},
        disabled: isAuthor // Author cannot report their own thread
      }
    ];
  
    // If the thread is being edited (title/content)
    if (isEditing) {
      return (
        <div className="mb-4 p-3 bg-gray-50 rounded shadow">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full p-2 mb-2 border rounded focus:outline-none focus:border-blue-500"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-2 mb-2 border rounded focus:outline-none focus:border-blue-500 h-24"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsEditing(false)} className="px-3 py-1 border rounded hover:bg-gray-50">
              Cancel
            </button>
            <button 
              onClick={handleSaveEdit} 
              disabled={!editTitle.trim() || !editContent.trim()}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              Save
            </button>
          </div>
        </div>
      );
    }
  
    // Default thread preview display
    return (
      <div 
        className="mb-4 p-4 bg-white rounded shadow border-l-4 border-blue-500 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onSelect && onSelect(thread)}
      >
        <div className="flex gap-3">
          {/* Voting controls */}
          <div className="flex flex-col items-center">
            <button 
              onClick={(e) => { e.stopPropagation(); thread.handleVote(thread._id, 1); }}
              className={`transition-colors ${thread.userVote === 'up' ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
            >
              <ChevronUp size={20} />
            </button>
            <span className="text-sm font-bold text-gray-700 my-1">{thread.votes || 0}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); thread.handleVote(thread._id, -1); }}
              className={`transition-colors ${thread.userVote === 'down' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
            >
              <ChevronDown size={20} />
            </button>
          </div>
          {/* Thread content */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="w-full">
                <h3 className="font-semibold text-lg text-gray-800">{thread.title}</h3>
                {/* Tags, Status, Pinned indicator */}
                <div className="flex flex-wrap my-2">
                  {thread.tags && thread.tags.map(tag => <Tag key={tag.id} tag={tag} />)}
                  {thread.status && <StatusBadge status={thread.status} />}
                  {thread.isPinned && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ml-2">
                      Pinned
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-3 whitespace-pre-wrap">{thread.content}</p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <div>
                    <span>Last activity {formatTime(thread.updatedAt || thread.createdAt || thread.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle size={14} />
                    <span>{thread.comments ? thread.comments.length : 0} comments</span>
                  </div>
                </div>
              </div>
              {/* Thread actions (visible at all times in preview) */}
              <div className="ml-2">
                <ActionMenu actions={threadActions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default ThreadPreview;