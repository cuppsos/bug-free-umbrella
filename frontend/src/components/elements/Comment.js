// Single comment component (displays a comment with author, timestamp, content, and edit/delete/report actions)
import React, { useState } from 'react';
import { Edit, Trash, Flag } from 'lucide-react';
import ActionMenu from './ActionMenu';
import { USER_ROLES } from './constants';

const Comment = ({ comment, threadId, currentUser, onUpdate, onDelete, threadLocked }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const isAuthor = comment.author === currentUser.name;
    const canModerate = [USER_ROLES.ADMIN, USER_ROLES.MODERATOR].includes(currentUser.role);
  
    // Actions available for comments
    const commentActions = [
      ...(isAuthor || canModerate ? [
        {
          label: 'Edit',
          icon: <Edit size={16} />,
          onClick: () => setIsEditing(true),
          disabled: threadLocked
        },
        {
          label: 'Delete',
          icon: <Trash size={16} />,
          onClick: () => onDelete(threadId, comment._id),
          destructive: true
        }
      ] : []),
      {
        label: 'Report',
        icon: <Flag size={16} />,
        onClick: () => {/* Implement report logic if needed */},
        disabled: isAuthor // Author cannot report their own comment
      }
    ];
  
    // Editing state: show textarea and save/cancel buttons
    if (isEditing) {
      return (
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-2 mb-2 border rounded focus:outline-none focus:border-blue-500 h-20"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsEditing(false)} className="px-3 py-1 border rounded hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => {
                if (editContent.trim()) {
                  onUpdate(threadId, comment._id, editContent);
                  setIsEditing(false);
                }
              }}
              disabled={!editContent.trim()}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              Save
            </button>
          </div>
        </div>
      );
    }
  
    // Default comment display
    return (
      <div className="mb-3 p-2 bg-gray-50 rounded group">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <div>
            <span>{comment.author}</span>
            <span className="mx-1">•</span>
            <span>{formatTime(comment.createdAt || comment.timestamp)}</span>
            {comment.editedAt && (
              <span className="italic ml-1">• Edited {formatTime(comment.editedAt)}</span>
            )}
          </div>
          {/* Actions (visible on hover) */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionMenu actions={commentActions} position="top" />
          </div>
        </div>
        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
      </div>
    );
  };

  export default Comment;