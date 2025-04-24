import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, X, Send, ChevronUp, ChevronDown, MessageCircle, 
  Search, Filter, MoreVertical, Flag, Edit, Trash,
  Pin, Lock, CheckCircle
} from 'lucide-react';

// Constants
const USER_ROLES = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  USER: 'USER'
};

const AVAILABLE_TAGS = [
  { id: 1, name: 'Announcement', color: 'bg-red-100 text-red-800' },
  { id: 2, name: 'Major Update', color: 'bg-purple-100 text-purple-800' },
  { id: 3, name: 'Minor Update', color: 'bg-blue-100 text-blue-800' },
  { id: 4, name: 'Discussion', color: 'bg-pink-100 text-pink-800' },
  { id: 5, name: 'Question', color: 'bg-yellow-100 text-yellow-800' },
  { id: 6, name: 'Bug Report', color: 'bg-orange-100 text-orange-800' }
];

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_voted', label: 'Most Voted' },
  { value: 'most_discussed', label: 'Most Discussed' }
];

const THREAD_STATUS = {
  OPEN: { id: 'open', label: 'Open', color: 'bg-green-100 text-green-800' },
  RESOLVED: { id: 'resolved', label: 'Resolved', color: 'bg-blue-100 text-blue-800' },
  LOCKED: { id: 'locked', label: 'Locked', color: 'bg-gray-100 text-gray-800' }
};

const currentUser = {
  id: 'user1',
  name: 'You',
  role: USER_ROLES.ADMIN
};

// API URL 
const API_URL = 'http://localhost:5000/api';

// Utility Components
const Tag = ({ tag, onRemove, onClick, isSelected }) => (
  <span 
    onClick={onClick}
    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer mr-2
      ${tag.color} ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
      ${onRemove ? 'pr-1' : ''}`}
  >
    {tag.name}
    {onRemove && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(tag);
        }}
        className="ml-1 p-1 hover:bg-gray-200 rounded-full"
      >
        <X size={12} />
      </button>
    )}
  </span>
);

const StatusBadge = ({ status }) => {
  // Handle both string status and status object
  const statusObj = typeof status === 'string' 
    ? THREAD_STATUS[status.toUpperCase()] 
    : status;
    
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusObj.color}`}>
      {statusObj.label}
    </span>
  );
};

const ActionMenu = ({ actions, position = 'bottom' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-gray-200 rounded"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute ${position === 'bottom' ? 'top-full' : 'bottom-full'} right-0 mt-1 w-48 bg-white rounded shadow-lg z-20 py-1`}>
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                disabled={action.disabled}
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

const Comment = ({ comment, threadId, currentUser, onUpdate, onDelete, threadLocked }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const canModerate = currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.MODERATOR;
  const isAuthor = comment.author === currentUser.name;

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
      onClick: () => {/* Implement report logic */},
      disabled: isAuthor
    }
  ];

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    
    // If invalid date
    if (isNaN(date.getTime())) return timestamp;
    
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  if (isEditing) {
    return (
      <div className="mb-3 p-2 bg-gray-50 rounded">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full p-2 mb-2 border rounded focus:outline-none focus:border-blue-500 h-20"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
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
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionMenu actions={commentActions} position="top" />
        </div>
      </div>
      <p className="text-sm">{comment.content}</p>
    </div>
  );
};

const ThreadPreview = ({ thread, onUpdate, onDelete, currentUser, onSelect }) => {
  const canModerate = currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.MODERATOR;
  const isAuthor = thread.author === currentUser.name;
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);
  const [editContent, setEditContent] = useState(thread.content);

  const handleSaveEdit = () => {
    if (editTitle.trim() && editContent.trim()) {
      onUpdate(thread._id, {
        ...thread,
        title: editTitle,
        content: editContent,
      });
      setIsEditing(false);
    }
  };

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
      onClick: () => {/* Implement report logic */},
      disabled: isAuthor
    }
  ];

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    
    // If invalid date
    if (isNaN(date.getTime())) return timestamp;
    
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

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
          className="w-full p-2 mb-2 border rounded focus:outline-none focus:border-blue-500 h-32"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
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

  return (
    <div 
      className="mb-4 p-4 bg-white rounded shadow border-l-4 border-blue-500 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(thread)}
    >
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              thread.handleVote(thread._id, 1);
            }}
            className="text-gray-400 hover:text-blue-500 transition-colors">
            <ChevronUp size={20} />
          </button>
          <span className="text-sm font-bold text-gray-700 my-1">{thread.votes || 0}</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              thread.handleVote(thread._id, -1);
            }}
            className="text-gray-400 hover:text-red-500 transition-colors">
            <ChevronDown size={20} />
          </button>
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="w-full">
              <h3 className="font-semibold text-lg text-gray-800">{thread.title}</h3>
              <div className="flex flex-wrap my-2">
                {thread.tags && thread.tags.map(tag => (
                  <Tag key={tag.id} tag={tag} />
                ))}
                {thread.status && <StatusBadge status={thread.status} />}
                {thread.isPinned && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pinned
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-3">{thread.content}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <div>
                  <span className="text-gray-500">
                    Last activity {formatTime(thread.updatedAt || thread.createdAt || thread.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle size={14} />
                  <span>{thread.comments ? thread.comments.length : 0} comments</span>
                </div>
              </div>
            </div>
            <div className="ml-2">
              <ActionMenu actions={threadActions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateThreadModal = ({ isOpen, onClose, onSubmit }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTitle.trim() && newContent.trim()) {
      onSubmit(newTitle, newContent, selectedTags);
      setNewTitle('');
      setNewContent('');
      setSelectedTags([]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New Thread</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter your thread title"
              className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTags.map(tag => (
                <Tag 
                  key={tag.id} 
                  tag={tag} 
                  onRemove={() => setSelectedTags(tags => tags.filter(t => t.id !== tag.id))}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.filter(tag => !selectedTags.find(t => t.id === tag.id)).map(tag => (
                <Tag 
                  key={tag.id} 
                  tag={tag}
                  onClick={() => setSelectedTags(tags => [...tags, tag])}
                />
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 h-32"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim() || !newContent.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              Create Thread
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ForumThreadList = ({ threads, currentUser, onUpdateThread, onDeleteThread, onSelectThread, handleVote }) => {
  const threadsWithHandlers = threads.map(thread => ({
    ...thread,
    handleVote
  }));
  
  return (
    <div>
      {threadsWithHandlers.map(thread => (
        <ThreadPreview
          key={thread._id}
          thread={thread}
          currentUser={currentUser}
          onUpdate={onUpdateThread}
          onDelete={onDeleteThread}
          onSelect={onSelectThread}
        />
      ))}
    </div>
  );
};

const ForumHeader = ({ onNewThread }) => {
  return (
    <div className="flex justify-between items-center mb-4 pb-2 border-b">
      <h1 className="text-2xl font-bold text-gray-800">Welcome Agent</h1>
      <button
        onClick={onNewThread}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
      >
        <span>New Thread</span>
      </button>
    </div>
  );
};

const ForumTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'all', label: 'All Threads' },
    { id: 'popular', label: 'Popular' },
    { id: 'recent', label: 'Recent Activity' }
  ];
  
  return (
    <div className="flex border-b mb-4">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === tab.id
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const ForumPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('latest');
  const [activeTab, setActiveTab] = useState('all');
  
  // State for API data
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch threads from API
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        
        // First try the API
        try {
          const response = await fetch(`${API_URL}/threads`);
          if (!response.ok) throw new Error('API returned unsuccessful status');
          
          const data = await response.json();
          setThreads(data);
          setError(null);
          return;
        } catch (apiErr) {
          console.warn('API call failed, using fallback data:', apiErr);
          // If API fails, continue to fallback data
        }
        
        // Fallback data for demonstration or development
        console.log('Using fallback data since API is unavailable');
        setThreads([
          {
            _id: '1',
            title: 'Fix Tag',
            content: 'We need to fix the tag component in our UI library. Currently, it breaks layout when used inside flex containers and has z-index issues with dropdowns. This affects multiple pages in our application.',
            author: 'DevTeam',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            votes: 4,
            comments: Array(7).fill().map((_, i) => ({
              _id: `comment-${i}-thread-1`,
              content: `Comment ${i+1} on fix tag issue`,
              author: i % 2 === 0 ? 'DevTeam' : 'You'
            })),
            tags: [AVAILABLE_TAGS[2], AVAILABLE_TAGS[5]],
            status: 'open',
            views: 42
          },
          {
            _id: '2',
            title: 'MongoDB',
            content: 'Working on MongoDB integration and connection pooling. We need to optimize our database queries and implement proper connection pooling to handle high traffic scenarios. Additionally, we should consider adding indexes to improve query performance.',
            author: 'DBAdmin',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
            votes: 12,
            comments: Array(6).fill().map((_, i) => ({
              _id: `comment-${i}-thread-2`,
              content: `Comment ${i+1} on MongoDB thread`,
              author: i % 2 === 0 ? 'DBAdmin' : 'You'
            })),
            status: 'open',
            views: 87
          },
          {
            _id: '3',
            title: 'Hello There',
            content: 'Just connected to a locally run MongoDB instance. The setup process was surprisingly smooth. I\'ve created initial collections for users, posts, and settings. Let me know if you need any specific information about the schema design or connection parameters.',
            author: 'NewUser',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            votes: 1,
            comments: [{
              _id: 'comment-1-thread-3',
              content: 'Welcome to the team!',
              author: 'You'
            }],
            status: 'open',
            views: 23
          },
          {
            _id: '4',
            title: 'Authentication Flow',
            content: 'Discussing the new authentication flow implementation. We\'re considering moving from session-based auth to JWT tokens. This would simplify our API architecture and make it easier to scale horizontally. There are also security implications to consider - we\'ll need to carefully plan token expiration and refresh strategies.',
            author: 'SecurityTeam',
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
            votes: 8,
            comments: Array(12).fill().map((_, i) => ({
              _id: `comment-${i}-thread-4`,
              content: `Comment ${i+1} on auth flow thread`,
              author: i % 3 === 0 ? 'SecurityTeam' : (i % 3 === 1 ? 'You' : 'DevTeam')
            })),
            tags: [AVAILABLE_TAGS[3], AVAILABLE_TAGS[4]],
            views: 65
          }
        ]);
        setError(null);
      } catch (err) {
        console.error('Error fetching threads:', err);
        setError('Failed to load threads. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchThreads();
    }
  }, [isOpen]);

  // Filter and sort threads
  const filteredThreads = useMemo(() => {
    let filtered = [...threads];

    // Filter by tab
    if (activeTab === 'popular') {
      filtered = filtered.filter(thread => (thread.votes || 0) > 0);
      filtered.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else if (activeTab === 'recent') {
      filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt || b.timestamp) - 
                             new Date(a.updatedAt || a.createdAt || a.timestamp));
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(thread =>
        thread.title.toLowerCase().includes(query) ||
        thread.content.toLowerCase().includes(query)
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(thread =>
        thread.tags && thread.tags.some(tag => selectedTags.find(st => st.id === tag.id))
      );
    }

    // Sort - only apply if not already sorted by tab selection
    if (activeTab !== 'popular' && activeTab !== 'recent') {
      switch (sortBy) {
        case 'oldest':
          filtered.sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp));
          break;
        case 'most_voted':
          filtered.sort((a, b) => (b.votes || 0) - (a.votes || 0));
          break;
        case 'most_discussed':
          filtered.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0));
          break;
        case 'latest':
        default:
          filtered.sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));
      }
    }

    return filtered;
  }, [threads, searchQuery, selectedTags, sortBy, activeTab]);

  // Sort threads with pinned threads always at top
  const sortedThreads = useMemo(() => {
    const pinnedThreads = filteredThreads.filter(thread => thread.isPinned);
    const unpinnedThreads = filteredThreads.filter(thread => !thread.isPinned);
    return [...pinnedThreads, ...unpinnedThreads];
  }, [filteredThreads]);

  const handleVote = async (threadId, direction) => {
    try {
      // Optimistically update UI
      setThreads(threads.map(thread => {
        if (thread._id === threadId) {
          return {
            ...thread,
            votes: (thread.votes || 0) + direction
          };
        }
        return thread;
      }));

      // API call
      const response = await fetch(`${API_URL}/threads/${threadId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: direction === 1 ? 'up' : 'down' })
      });

      if (!response.ok) throw new Error('Failed to vote');
      
      const data = await response.json();
      
      // Update with correct value from server
      setThreads(threads.map(thread => {
        if (thread._id === threadId) {
          return {
            ...thread,
            votes: data.votes
          };
        }
        return thread;
      }));
    } catch (err) {
      console.error('Error voting:', err);
      // Revert on error
      setThreads(prevThreads => [...prevThreads]);
    }
  };

  const handleNewThread = async (title, content, tags) => {
    try {
      const response = await fetch(`${API_URL}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          author: currentUser.name,
          tags
        })
      });
      
      if (!response.ok) throw new Error('Failed to create thread');
      
      const newThread = await response.json();
      setThreads(prevThreads => [newThread, ...prevThreads]);
    } catch (err) {
      console.error('Error creating thread:', err);
      setError('Failed to create thread. Please try again.');
    }
  };

  const handleUpdateThread = async (threadId, updatedThreadData) => {
    try {
      // Optimistically update UI
      const optimisticThreads = threads.map(thread =>
        thread._id === threadId ? { ...thread, ...updatedThreadData } : thread
      );
      setThreads(optimisticThreads);
      
      if (selectedThread?._id === threadId) {
        setSelectedThread({ ...selectedThread, ...updatedThreadData });
      }

      // API call
      const response = await fetch(`${API_URL}/threads/${threadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedThreadData)
      });
      
      if (!response.ok) throw new Error('Failed to update thread');
      
      const updatedThread = await response.json();
      
      // Update with data from server
      setThreads(threads.map(thread =>
        thread._id === threadId ? updatedThread : thread
      ));
      
      if (selectedThread?._id === threadId) {
        setSelectedThread(updatedThread);
      }
    } catch (err) {
      console.error('Error updating thread:', err);
      // Revert on error
      setThreads(prevThreads => [...prevThreads]);
      if (selectedThread?._id === threadId) {
        setSelectedThread(prevThread => ({ ...prevThread }));
      }
    }
  };

  const handleDeleteThread = async (threadId) => {
    if (window.confirm('Are you sure you want to delete this thread?')) {
      try {
        // Optimistically update UI
        setThreads(threads.filter(thread => thread._id !== threadId));
        
        if (selectedThread?._id === threadId) {
          setSelectedThread(null);
        }

        // API call
        const response = await fetch(`${API_URL}/threads/${threadId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete thread');
      } catch (err) {
        console.error('Error deleting thread:', err);
        // Fetch all threads again on error
        const response = await fetch(`${API_URL}/threads`);
        const data = await response.json();
        setThreads(data);
      }
    }
  };

  const handleNewComment = async (e) => {
    e.preventDefault();
    if (newComment.trim() && selectedThread) {
      try {
        // Optimistic update
        const newCommentObj = {
          _id: `temp-${Date.now()}`, // Temporary ID
          content: newComment,
          author: currentUser.name,
          createdAt: new Date().toISOString()
        };
        
        const updatedThread = {
          ...selectedThread,
          comments: [...(selectedThread.comments || []), newCommentObj]
        };
        
        setSelectedThread(updatedThread);
        setThreads(threads.map(thread => 
          thread._id === selectedThread._id ? updatedThread : thread
        ));
        
        setNewComment('');

        // API call
        const response = await fetch(`${API_URL}/threads/${selectedThread._id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newComment })
        });
        
        if (!response.ok) throw new Error('Failed to add comment');
        
        // Get updated thread with the new comment
        const threadResponse = await fetch(`${API_URL}/threads/${selectedThread._id}`);
        if (!threadResponse.ok) throw new Error('Failed to get updated thread');
        
        const updatedThreadFromServer = await threadResponse.json();
        
        setSelectedThread(updatedThreadFromServer);
        setThreads(threads.map(thread => 
          thread._id === selectedThread._id ? updatedThreadFromServer : thread
        ));
      } catch (err) {
        console.error('Error adding comment:', err);
        setNewComment(newComment); // Restore comment text on error
      }
    }
  };

  const handleUpdateComment = async (threadId, commentId, updatedContent) => {
    try {
      // Find the thread and comment
      const thread = threads.find(t => t._id === threadId);
      if (!thread) return;
      
      // Optimistically update UI
      const updatedComments = thread.comments.map(comment =>
        comment._id === commentId 
          ? { ...comment, content: updatedContent, editedAt: new Date().toISOString() }
          : comment
      );
      
      const updatedThread = { ...thread, comments: updatedComments };
      
      setThreads(threads.map(t => t._id === threadId ? updatedThread : t));
      if (selectedThread?._id === threadId) {
        setSelectedThread(updatedThread);
      }

      // API call - this endpoint needs to be implemented in your backend
      const response = await fetch(`${API_URL}/threads/${threadId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updatedContent })
      });
      
      if (!response.ok) throw new Error('Failed to update comment');
      
      // Get the updated thread from server
      const threadResponse = await fetch(`${API_URL}/threads/${threadId}`);
      if (!threadResponse.ok) throw new Error('Failed to get updated thread');
      
      const threadFromServer = await threadResponse.json();
      
      // Update with server data
      setThreads(threads.map(t => t._id === threadId ? threadFromServer : t));
      if (selectedThread?._id === threadId) {
        setSelectedThread(threadFromServer);
      }
    } catch (err) {
      console.error('Error updating comment:', err);
      // Could reload the thread data here on error
    }
  };

  const handleDeleteComment = async (threadId, commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        // Optimistically update UI
        const thread = threads.find(t => t._id === threadId);
        if (!thread) return;
        
        const updatedComments = thread.comments.filter(comment => comment._id !== commentId);
        const updatedThread = { ...thread, comments: updatedComments };
        
        setThreads(threads.map(t => t._id === threadId ? updatedThread : t));
        if (selectedThread?._id === threadId) {
          setSelectedThread(updatedThread);
        }

        // API call - this endpoint needs to be implemented in your backend
        const response = await fetch(`${API_URL}/threads/${threadId}/comments/${commentId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete comment');
        
        // Get updated thread from server
        const threadResponse = await fetch(`${API_URL}/threads/${threadId}`);
        if (!threadResponse.ok) throw new Error('Failed to get updated thread');
        
        const threadFromServer = await threadResponse.json();
        
        // Update with server data
        setThreads(threads.map(t => t._id === threadId ? threadFromServer : t));
        if (selectedThread?._id === threadId) {
          setSelectedThread(threadFromServer);
        }
      } catch (err) {
        console.error('Error deleting comment:', err);
        // Could reload the thread data here on error
      }
    }
  };

  // Reload data when panel opens
  const handleOpenPanel = () => {
    setIsOpen(true);
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpenPanel}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
      >
        <MessageSquare size={24} />
      </button>

      <CreateThreadModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleNewThread}
      />

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      >
        <div 
          className={`relative bg-white w-full max-w-4xl h-5/6 rounded-lg shadow-xl transform transition-transform duration-300 overflow-hidden ${
            isOpen ? 'scale-100' : 'scale-95'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 bg-blue-500 text-white flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Welcome Agent
            </h2>
            <button 
              onClick={() => setIsOpen(false)} 
              className="hover:bg-blue-600 p-1 rounded"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-4">
            <div className="flex border-b mb-4">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'all'
                    ? 'text-blue-600 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('all')}
              >
                All Threads
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'popular'
                    ? 'text-blue-600 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('popular')}
              >
                Popular
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'recent'
                    ? 'text-blue-600 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('recent')}
              >
                Recent Activity
              </button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search threads..."
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:border-blue-500"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                New Thread
              </button>
            </div>
            
            <div className="overflow-y-auto h-[calc(100vh-16rem)]">
              {loading ? (
                <div className="text-center p-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-500">Loading threads...</p>
                </div>
              ) : error ? (
                <div className="text-center p-8 text-red-500">
                  <p>{error}</p>
                  <button 
                    onClick={() => {
                      setLoading(true);
                      fetch(`${API_URL}/threads`)
                        .then(res => {
                          if (!res.ok) throw new Error('Failed to fetch threads');
                          return res.json();
                        })
                        .then(data => {
                          setThreads(data);
                          setError(null);
                        })
                        .catch(err => {
                          console.error('Error fetching threads:', err);
                          setError('Failed to load threads. Please try again.');
                        })
                        .finally(() => setLoading(false));
                    }}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    Retry
                  </button>
                </div>
              ) : !selectedThread ? (
                sortedThreads.length > 0 ? (
                  sortedThreads.map(thread => (
                    <ThreadPreview
                      key={thread._id}
                      thread={{...thread, handleVote}}
                      currentUser={currentUser}
                      onUpdate={handleUpdateThread}
                      onDelete={handleDeleteThread}
                      onSelect={setSelectedThread}
                    />
                  ))
                ) : (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No threads found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                )
              ) : (
                <div className="mb-6">
                  <ThreadPreview
                    thread={{...selectedThread, handleVote}}
                    currentUser={currentUser}
                    onUpdate={handleUpdateThread}
                    onDelete={handleDeleteThread}
                  />
                  <div className="ml-8">
                    {selectedThread.comments && selectedThread.comments.length > 0 ? (
                      selectedThread.comments.map(comment => (
                        <Comment
                          key={comment._id}
                          comment={comment}
                          threadId={selectedThread._id}
                          currentUser={currentUser}
                          onUpdate={handleUpdateComment}
                          onDelete={handleDeleteComment}
                          threadLocked={selectedThread.status === THREAD_STATUS.LOCKED.id}
                        />
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <p>No comments yet. Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {selectedThread && selectedThread.status !== THREAD_STATUS.LOCKED.id && (
              <form onSubmit={handleNewComment} className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 p-2 border rounded focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPanel;