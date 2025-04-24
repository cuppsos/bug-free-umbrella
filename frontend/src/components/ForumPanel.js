import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, X, Send, ChevronUp, ChevronDown, MessageCircle, 
  Search, Filter, MoreVertical, Flag, Edit, Trash, Pin, Lock, CheckCircle 

} from 'lucide-react';
// Constants for user roles, tags, sort options, thread statuses, and agent codes
import { USER_ROLES, AVAILABLE_TAGS, SORT_OPTIONS, THREAD_STATUS, AGENT_CODES } from './elements/constants';

// Utility: Format timestamps to relative or date strings
import { formatTime } from './elements/utils';

// ** UI Components **
// Tag badge component (displays tag name with color and optional removal button)
import { Tag } from './elements/Tag';



// Base API URL (adjust if needed)
const API_URL = 'https://capstone-front-end-r1fu.onrender.com/api/threads';

// Status badge component (displays thread status with proper label and color)
const StatusBadge = ({ status }) => {
  const statusObj = typeof status === 'string' ? THREAD_STATUS[status.toUpperCase()] : status;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusObj?.color || 'bg-gray-100 text-gray-800'}`}>
      {statusObj?.label || status}
    </span>
  );
};

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

// Single comment component (displays a comment with author, timestamp, content, and edit/delete/report actions)
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

// Single thread preview component (for list and detailed view; includes vote, tags, status, etc.)
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

// Modal for creating a new thread
const CreateThreadModal = ({ isOpen, onClose, onSubmit }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTitle.trim() && newContent.trim()) {
      onSubmit(newTitle, newContent, selectedTags);
      // Reset form fields after successful submission
      setNewTitle('');
      setNewContent('');
      setSelectedTags([]);
      onClose();
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-xl transform transition-all duration-300 ease-in-out">
        {/* Modal header */}
        <div className="p-4 bg-blue-500 text-white flex justify-between items-center rounded-t-lg">
          <h2 className="text-xl font-semibold">Create New Thread</h2>
          <button onClick={onClose} className="hover:bg-blue-600 p-1 rounded transition-colors">
            <X size={24} />
          </button>
        </div>
        {/* Modal body */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input 
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter thread title"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              {/* Selected tags list with remove option */}
              <div className="flex flex-wrap gap-2 mb-3 min-h-[2.5rem] p-2 border border-gray-200 rounded-md bg-gray-50">
                {selectedTags.length > 0 ? (
                  selectedTags.map(tag => (
                    <Tag 
                      key={tag.id} 
                      tag={tag} 
                      onRemove={(tagToRemove) => setSelectedTags(tags => tags.filter(t => t.id !== tagToRemove.id))}
                    />
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">No tags selected</span>
                )}
              </div>
              {/* Available tags to select */}
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.filter(tag => !selectedTags.find(t => t.id === tag.id))
                  .map(tag => (
                    <Tag 
                      key={tag.id}
                      tag={tag}
                      onClick={() => setSelectedTags(tags => [...tags, tag])}
                    />
                  ))}
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea 
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write your thread content here..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-32 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700">
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!newTitle.trim() || !newContent.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                Create Thread
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal for agent login authentication
const AgentLoginModal = ({ isOpen, onLogin }) => {
  const [agentCode, setAgentCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (AGENT_CODES[agentCode]) {
      onLogin(agentCode);
    } else {
      setError('Invalid agent code. Please try again.');
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl transform transition-all">
        {/* Modal header */}
        <div className="p-4 bg-blue-500 text-white rounded-t-lg">
          <h2 className="text-xl font-semibold">Agent Authentication Required</h2>
        </div>
        {/* Modal body */}
        <div className="p-6">
          <div className="mb-6 text-center">
            <div className="bg-gray-100 p-4 rounded-full inline-flex justify-center mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <p className="text-gray-700">
              Please enter your 9-digit agent code to access forum content.
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Code</label>
              <input 
                type="text"
                value={agentCode}
                onChange={(e) => setAgentCode(e.target.value)}
                placeholder="Example: CO-000000001"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <button 
              type="submit"
              disabled={!agentCode.trim()}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              Authenticate
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main ForumPanel component
const ForumPanel = () => {
  // Panel state
  const [panelOpen, setPanelOpen] = useState(false);       // whether forum panel is open
  const [selectedThread, setSelectedThread] = useState(null); // current selected thread for detail view
  const [newComment, setNewComment] = useState('');        // new comment text input
  const [showCreateModal, setShowCreateModal] = useState(false); // create thread modal state

  // Filter/sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);   // filter by tags
  const [selectedStatus, setSelectedStatus] = useState(''); // filter by thread status (optional)
  const [sortBy, setSortBy] = useState('latest');         // sorting criteria
  const [activeTab, setActiveTab] = useState('all');      // active tab (all, popular, recent)
  const [showFilterMenu, setShowFilterMenu] = useState(false); // show/hide filter dropdown

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Threads data state
  const [threads, setThreads] = useState([]);
  const [userVotes, setUserVotes] = useState({});   // track user votes for threads (threadId -> 'up'/'down')
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ** Authentication and Initialization **

  // Handle agent login success
  const handleLogin = (agentCode) => {
    const agent = AGENT_CODES[agentCode];
    if (agent) {
      setIsAuthenticated(true);
      setCurrentAgent(agent);
      setShowLoginModal(false);
      // Load saved votes for this agent from localStorage
      const savedVotes = localStorage.getItem(`forumVotes_${agent.name}`);
      if (savedVotes) {
        try {
          setUserVotes(JSON.parse(savedVotes));
        } catch {
          console.warn('Could not parse stored votes');
        }
      }
    }
  };

  // Persist userVotes to localStorage whenever they change
  useEffect(() => {
    if (currentAgent?.name) {
      localStorage.setItem(`forumVotes_${currentAgent.name}`, JSON.stringify(userVotes));
    }
  }, [userVotes, currentAgent?.name]);

  // Fetch threads from API (or fallback data if API fails) when panel opens and user is authenticated
  useEffect(() => {
    const fetchThreads = async () => {
      setLoading(true);
      try {
        // Try API call first
        const response = await fetch(`${API_URL}/threads`);
        if (!response.ok) throw new Error('API returned unsuccessful status');
        const data = await response.json();
        setThreads(data);
        setError(null);
      } catch (apiErr) {
        console.warn('API call failed, using fallback data:', apiErr);
        // Fallback data (for demonstration or offline use)
        setThreads([
          {
            _id: '1',
            title: 'Fix Tag',
            content: 'We need to fix the Tag component in our UI library. It breaks layout in flex containers and has z-index issues with dropdowns. This affects multiple pages in our application.',
            author: 'DevTeam',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            votes: 4,
            comments: Array(3).fill().map((_, i) => ({
              _id: `comment-${i+1}-thread-1`,
              content: `Comment ${i+1} on fix tag issue`,
              author: i % 2 === 0 ? 'DevTeam' : 'You',
              createdAt: new Date(Date.now() - 1000 * 60 * (120 - i * 5)).toISOString() // spaced 5 min apart
            })),
            tags: [AVAILABLE_TAGS[2], AVAILABLE_TAGS[5]], // Minor Update, Bug Report
            status: 'open',
            isPinned: false
          },
          {
            _id: '2',
            title: 'MongoDB Integration',
            content: 'Working on MongoDB integration and connection pooling. We need to optimize database queries and implement proper pooling to handle high traffic. Also consider adding indexes for performance.',
            author: 'DBAdmin',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
            votes: 12,
            comments: Array(2).fill().map((_, i) => ({
              _id: `comment-${i+1}-thread-2`,
              content: `Comment ${i+1} on MongoDB thread`,
              author: i % 2 === 0 ? 'DBAdmin' : 'You',
              createdAt: new Date(Date.now() - 1000 * 60 * (60 - i * 5)).toISOString()
            })),
            tags: [], // no tags
            status: 'open',
            isPinned: false
          },
          {
            _id: '3',
            title: 'Hello There',
            content: 'Just connected to a local MongoDB instance. Setup was smooth. Created initial collections for users, posts, and settings. Let me know if you need info on schema design or connection parameters.',
            author: 'NewUser',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            votes: 1,
            comments: [
              { _id: 'comment-1-thread-3', content: 'Welcome to the team!', author: 'You', createdAt: new Date().toISOString() }
            ],
            tags: [],
            status: 'open',
            isPinned: false
          },
          {
            _id: '4',
            title: 'Authentication Flow',
            content: 'Discussing new authentication flow. Considering moving from session-based auth to JWT tokens for easier horizontal scaling. Need to plan token expiration and refresh strategies carefully.',
            author: 'SecurityTeam',
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
            votes: 8,
            comments: Array(3).fill().map((_, i) => ({
              _id: `comment-${i+1}-thread-4`,
              content: `Comment ${i+1} on auth flow thread`,
              author: i % 3 === 0 ? 'SecurityTeam' : (i % 3 === 1 ? 'You' : 'DevTeam'),
              createdAt: new Date(Date.now() - 1000 * 60 * (15 - i * 3)).toISOString()
            })),
            tags: [AVAILABLE_TAGS[3], AVAILABLE_TAGS[4]], // Discussion, Question
            status: 'open',
            isPinned: true  // example of a pinned thread
          }
        ]);
        setError(null);
      }
      finally {
        setLoading(false);
      }
    };

    if (panelOpen && isAuthenticated) {
      fetchThreads();
    }
  }, [panelOpen, isAuthenticated]);

  // ** Voting and Thread/Comment Actions **

  // Optimistically handle vote (direction: 1 for upvote, -1 for downvote)
  const handleVote = async (threadId, direction) => {
    // Ignore if already voted the same way
    const currentVote = userVotes[threadId];
    const newVoteType = direction === 1 ? 'up' : 'down';
    if (currentVote === newVoteType) return;

    // Determine vote change: if reversing vote, it's ±2 (to remove previous and add new vote)
    const voteChange = currentVote ? (direction === 1 ? 2 : -2) : direction;
    // Optimistic UI update
    setThreads(prev => prev.map(t => t._id === threadId ? { ...t, votes: (t.votes || 0) + voteChange } : t));
    setUserVotes(prevVotes => ({ ...prevVotes, [threadId]: currentVote === newVoteType ? currentVote : newVoteType }));

    try {
      // Send vote to server
      const res = await fetch(`${API_URL}/threads/${threadId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: newVoteType })
      });
      if (!res.ok) throw new Error('Failed to vote');
      const { votes: updatedVotes } = await res.json();
      // Correct vote count with server response
      setThreads(prev => prev.map(t => t._id === threadId ? { ...t, votes: updatedVotes } : t));
    } catch (err) {
      console.error('Error voting:', err);
      // Revert UI on error
      setThreads(prev => [...prev]);
      setUserVotes(prev => {
        const votesCopy = { ...prev };
        // Remove the vote entry if the vote did not succeed
        delete votesCopy[threadId];
        return votesCopy;
      });
    }
  };

  // Create a new thread
  const handleCreateThread = async (title, content, tags) => {
    try {
      const res = await fetch(`${API_URL}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          author: currentAgent?.name || 'User',
          tags
        })
      });
      if (!res.ok) throw new Error('Failed to create thread');
      const newThread = await res.json();
      setThreads(prev => [newThread, ...prev]); // add new thread to top of list
    } catch (err) {
      console.error('Error creating thread:', err);
      setError('Failed to create thread. Please try again.');
    }
  };

  // Update an existing thread (title, content, status, pinned, etc.)
  const handleUpdateThread = async (threadId, updatedData) => {
    // Optimistic UI update for thread and selectedThread
    setThreads(prev => prev.map(t => t._id === threadId ? { ...t, ...updatedData } : t));
    if (selectedThread?._id === threadId) {
      setSelectedThread(prev => prev ? { ...prev, ...updatedData } : prev);
    }
    try {
      const res = await fetch(`${API_URL}/threads/${threadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error('Failed to update thread');
      const serverThread = await res.json();
      // Sync with server response
      setThreads(prev => prev.map(t => t._id === threadId ? serverThread : t));
      if (selectedThread?._id === threadId) {
        setSelectedThread(serverThread);
      }
    } catch (err) {
      console.error('Error updating thread:', err);
      // On error, reload threads (to revert optimistic changes)
      setThreads(prev => [...prev]);
      if (selectedThread?._id === threadId) {
        setSelectedThread(prev => prev ? { ...prev } : prev);
      }
    }
  };

  // Delete a thread
  const handleDeleteThread = async (threadId) => {
    if (!window.confirm('Are you sure you want to delete this thread?')) return;
    // Optimistic removal from UI
    setThreads(prev => prev.filter(t => t._id !== threadId));
    if (selectedThread?._id === threadId) setSelectedThread(null);
    try {
      const res = await fetch(`${API_URL}/threads/${threadId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete thread');
      // (Optionally, could refetch threads or handle in place)
    } catch (err) {
      console.error('Error deleting thread:', err);
      // In case of error, attempt to refetch threads to restore state
      try {
        const res = await fetch(`${API_URL}/threads`);
        const data = await res.json();
        setThreads(data);
      } catch (refetchErr) {
        console.error('Error refetching threads:', refetchErr);
        setError('Failed to load threads. Please try again later.');
      }
    }
  };

  // Post a new comment to the selected thread
  const handlePostComment = async (e) => {
    e.preventDefault();
    // make sure there's something to send
    if (!newComment.trim() || !selectedThread) return;
  
    // 1) Optimistically append to UI
    const tempC = {
      _id: `temp-${Date.now()}`,
      content: newComment,
      author: currentAgent?.name || 'User',
      createdAt: new Date().toISOString(),
    };
    const updatedComments = [...(selectedThread.comments || []), tempC];
    const optimisticThread = { ...selectedThread, comments: updatedComments };
    
    setSelectedThread(optimisticThread);
    setThreads(threads.map(t =>
      t._id === selectedThread._id ? optimisticThread : t
    ));
    setNewComment('');
  
    // 2) Send to server
    try {
      const res = await fetch(`${API_URL}/threads/${selectedThread._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: tempC.content, author: tempC.author })
      });
      if (!res.ok) throw new Error('Failed to post comment');
  
      // 3) Re-fetch thread to get the real comment (with proper ID)
      const threadRes = await fetch(`${API_URL}/threads/${selectedThread._id}`);
      if (!threadRes.ok) throw new Error('Failed to fetch updated thread');
      const fresh = await threadRes.json();

      const comments = fresh.comments || [];
      if (comments.length > 0) {
        const lastIdx = comments.length - 1;
        const last = comments[lastIdx];
        comments[lastIdx] = {
          ...last,
          author: tempC.author,
        };
      }
      const mergedThread = { ...fresh, comments };

      setSelectedThread(mergedThread);
      setThreads(threads.map(t =>
        t._id === mergedThread._id ? mergedThread : t
      ));
    } catch (err) {
      console.error('Error posting comment:', err);
      // Show error to user
      alert('Failed to post comment. Please try again.');
    }
  };

  // Update an existing comment
  const handleUpdateComment = async (threadId, commentId, updatedContent) => {
    // Optimistic update: update comment content and set editedAt
    setThreads(prev => prev.map(t => {
      if (t._id !== threadId) return t;
      const updatedComments = t.comments.map(c => 
        c._id === commentId ? { ...c, content: updatedContent, editedAt: new Date().toISOString() } : c
      );
      return { ...t, comments: updatedComments };
    }));
    if (selectedThread?._id === threadId) {
      setSelectedThread(prev => {
        if (!prev) return prev;
        const updatedComments = prev.comments.map(c => 
          c._id === commentId ? { ...c, content: updatedContent, editedAt: new Date().toISOString() } : c
        );
        return { ...prev, comments: updatedComments };
      });
    }
    try {
      // Send update to server
      const res = await fetch(`${API_URL}/threads/${threadId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updatedContent })
      });
      if (!res.ok) throw new Error('Failed to update comment');
      // Fetch updated thread from server to sync
      const threadRes = await fetch(`${API_URL}/threads/${threadId}`);
      if (!threadRes.ok) throw new Error('Failed to fetch thread after comment update');
      const freshThread = await threadRes.json();
      setThreads(prev => prev.map(t => t._id === threadId ? freshThread : t));
      if (selectedThread?._id === threadId) setSelectedThread(freshThread);
    } catch (err) {
      console.error('Error updating comment:', err);
      // Optionally, refetch thread or notify user
    }
  };

  // Delete a comment
  const handleDeleteComment = async (threadId, commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    // Optimistic removal from UI
    setThreads(prev => prev.map(t => {
      if (t._id !== threadId) return t;
      return { ...t, comments: t.comments.filter(c => c._id !== commentId) };
    }));
    if (selectedThread?._id === threadId) {
      setSelectedThread(prev => prev ? { ...prev, comments: prev.comments.filter(c => c._id !== commentId) } : prev);
    }
    try {
      const res = await fetch(`${API_URL}/threads/${threadId}/comments/${commentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete comment');
      // Fetch updated thread from server
      const threadRes = await fetch(`${API_URL}/threads/${threadId}`);
      if (!threadRes.ok) throw new Error('Failed to fetch thread after comment deletion');
      const freshThread = await threadRes.json();
      setThreads(prev => prev.map(t => t._id === threadId ? freshThread : t));
      if (selectedThread?._id === threadId) setSelectedThread(freshThread);
    } catch (err) {
      console.error('Error deleting comment:', err);
      // Optionally, refetch thread or notify user
    }
  };

  // ** Thread Filtering and Sorting **

  // Compute filtered & sorted threads based on search query, tags, status, tab, and sortBy criteria
  const filteredThreads = useMemo(() => {
    let filtered = [...threads];

    // Tab-based filtering: popular (threads with votes), recent (by last activity)
    if (activeTab === 'popular') {
      filtered = filtered.filter(t => (t.votes || 0) > 0);
      filtered.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else if (activeTab === 'recent') {
      filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt || b.timestamp) - new Date(a.updatedAt || a.createdAt || a.timestamp));
    }

    // Text search filtering on title and content
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q));
    }

    // Tag filtering: thread must contain at least one selected tag
    if (selectedTags.length > 0) {
      filtered = filtered.filter(t => t.tags && t.tags.some(tag => selectedTags.find(st => st.id === tag.id)));
    }

    // Status filtering (if a specific status filter is selected)
    if (selectedStatus) {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }

    // Sorting (only if not already handled by tab selection)
    if (activeTab !== 'popular' && activeTab !== 'recent') {
      switch (sortBy) {
        case 'oldest':
          filtered.sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp));
          break;
        case 'most_voted':
          filtered.sort((a, b) => (b.votes || 0) - (a.votes || 0));
          break;
        case 'most_discussed':
          filtered.sort((a, b) => ((b.comments?.length || 0) - (a.comments?.length || 0)));
          break;
        case 'latest':
        default:
          filtered.sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));
          break;
      }
    }

    return filtered;
  }, [threads, searchQuery, selectedTags, selectedStatus, sortBy, activeTab]);

  // Always show pinned threads at the top of the list
  const sortedThreads = useMemo(() => {
    const pinned = filteredThreads.filter(t => t.isPinned);
    const notPinned = filteredThreads.filter(t => !t.isPinned);
    return [...pinned, ...notPinned];
  }, [filteredThreads]);

  // ** UI Handlers **

  // Open the forum panel (and prompt login if not authenticated)
  const openPanel = () => {
    setPanelOpen(true);
    if (!isAuthenticated) setShowLoginModal(true);
  };
  // Close the forum panel
  const closePanel = () => {
    setPanelOpen(false);
    setSelectedThread(null); // reset to thread list view on close
  };

  // Toggle filter dropdown menu
  const toggleFilterMenu = () => setShowFilterMenu(prev => !prev);

  // Render the forum panel button and content
  return (
    <div className="relative">
      {/* Floating button to open forum panel */}
      <button 
        onClick={openPanel}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
      >
        <MessageSquare size={24} />
      </button>

      {/* Agent Login Modal (shown if authentication required) */}
      <AgentLoginModal isOpen={showLoginModal} onLogin={handleLogin} />

      {/* Create Thread Modal */}
      <CreateThreadModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSubmit={handleCreateThread} />

      {/* Main forum panel overlay */}
      <div 
        className={`fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30 transition-opacity ${panelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={closePanel}
      >
        {/* Forum panel container */}
        <div 
          className={`relative bg-white w-full max-w-4xl h-5/6 rounded-lg shadow-xl transform transition-transform duration-300 overflow-hidden ${panelOpen ? 'scale-100' : 'scale-95'}`}
          onClick={(e) => e.stopPropagation()}  // prevent closing when clicking inside panel
        >
          {/* Panel header with welcome message and close button */}
          <div className="p-4 bg-blue-500 text-white flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {currentAgent ? `Welcome Agent ${currentAgent.name}` : 'Welcome Agent'}
            </h2>
            <button onClick={closePanel} className="hover:bg-blue-600 p-1 rounded">
              <X size={24} />
            </button>
          </div>

          {/* Panel content (only if authenticated) */}
{isAuthenticated ? (
  <div className="p-4 relative h-full flex flex-col">
    {/* only show tabs + search when NOT viewing a single thread */}
    {!selectedThread && (
      <>
        {/* Tabs for filtering by all/popular/recent */}
        <div className="flex border-b mb-4">
          {['all', 'popular', 'recent'].map(tabId => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tabId
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tabId === 'all'
                ? 'All Threads'
                : tabId === 'popular'
                ? 'Popular'
                : 'Recent Activity'}
            </button>
          ))}
        </div>

        {/* Search bar and action buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search threads..."
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:border-blue-500"
            />
            {/* Filter toggle button */}
            <button
              type="button"
              onClick={toggleFilterMenu}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <Filter size={18} />
            </button>
            {/* Filter dropdown menu */}
            {showFilterMenu && (
              <div className="absolute top-10 right-0 w-72 bg-white border rounded shadow-md p-4 z-20">
                {/* …existing filter UI… */}
              </div>
            )}
          </div>
          {/* New Thread button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            New Thread
          </button>
        </div>
      </>
    )}

              {/* Thread list or thread detail view */}
              <div className="flex-1 overflow-y-auto mb-2 pr-1 pb-20"> 
                {loading ? (
                  // Loading indicator
                  <div className="text-center p-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-500">Loading threads...</p>
                  </div>
                ) : error ? (
                  // Error state with retry button
                  <div className="text-center p-8 text-red-500">
                    <p>{error}</p>
                    <button 
                      onClick={() => { setPanelOpen(true); setError(null); setLoading(true); }} 
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                    >
                      Retry
                    </button>
                  </div>
                ) : !selectedThread ? (
                  // Threads list view
                  sortedThreads.length > 0 ? (
                    sortedThreads.map(thread => (
                      <ThreadPreview 
                        key={thread._id}
                        thread={{ ...thread, handleVote, userVote: userVotes[thread._id] || null }}
                        currentUser={currentAgent || { name: 'User', role: USER_ROLES.USER }}
                        onUpdate={handleUpdateThread}
                        onDelete={handleDeleteThread}
                        onSelect={(t) => setSelectedThread(t)}
                      />
                    ))
                  ) : (
                    // No threads found
                    <div className="text-center text-gray-500 mt-8">
                      <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No threads found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  )
                ) : (
                  // Single thread detail view
                  <div className="pb-16">  {/* bottom padding to allow space for input */}
                    {/* Back button to go back to list */}
                    <div className="mb-4">
                      <button 
                        onClick={() => setSelectedThread(null)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors flex items-center"
                      >
                        <span className="mr-2">←</span>
                        <span>Back to threads</span>
                      </button>
                    </div>
                    {/* Show the thread in detail (reuse ThreadPreview for content) */}
                    <ThreadPreview 
                      thread={{ ...selectedThread, handleVote, userVote: userVotes[selectedThread._id] || null }}
                      currentUser={currentAgent || { name: 'User', role: USER_ROLES.USER }}
                      onUpdate={handleUpdateThread}
                      onDelete={handleDeleteThread}
                    />
                    {/* Comments section */}
                    <div className="ml-8">
                      {selectedThread.comments && selectedThread.comments.length > 0 ? (
                        selectedThread.comments.map(comment => (
                          <Comment 
                            key={comment._id}
                            comment={comment}
                            threadId={selectedThread._id}
                            currentUser={currentAgent || { name: 'User', role: USER_ROLES.USER }}
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

              {/* Comment input (visible if a thread is selected and not locked) */}
              
              {selectedThread && selectedThread.status !== THREAD_STATUS.LOCKED.id && (
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t pt-3 pb-3">
        <form onSubmit={handlePostComment} className="w-full">
          <div className="flex items-center gap-2">
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
      </div>
    )}
  </div>
          ) : (
            // Not authenticated: prompt to login
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <p className="text-gray-600 mb-4">Please authenticate to view forum content.</p>
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Agent Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumPanel;
