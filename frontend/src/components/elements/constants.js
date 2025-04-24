// DEFINED CONSTANTS FOR UI
// UTILIZED IN ForumPanel.js

// User roles 
export const USER_ROLES = { 
    ADMIN: 'ADMIN',
    MODERATOR: 'MODERATOR',
    USER: 'USER' 
};

// Available thread tags
export const AVAILABLE_TAGS = [
    { id: 1, name: 'Announcement', color: 'bg-red-100 text-red-800' },
    { id: 2, name: 'Major Update', color: 'bg-purple-100 text-purple-800' },
    { id: 3, name: 'Minor Update', color: 'bg-blue-100 text-blue-800' },
    { id: 4, name: 'Discussion', color: 'bg-pink-100 text-pink-800' },
    { id: 5, name: 'Question', color: 'bg-yellow-100 text-yellow-800' },
    { id: 6, name: 'Bug Report', color: 'bg-orange-100 text-orange-800' }
];

// Thread sorting options
export const SORT_OPTIONS = [
    { value: 'latest', label: 'Latest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'most_voted', label: 'Most Voted' },
    { value: 'most_discussed', label: 'Most Discussed' }
];

// Thread statuses
export const THREAD_STATUS = {
    OPEN:     { id: 'open', label: 'Open',     color: 'bg-green-100 text-green-800' },
    RESOLVED: { id: 'resolved', label: 'Resolved', color: 'bg-blue-100 text-blue-800' },
    LOCKED:   { id: 'locked', label: 'Locked',   color: 'bg-gray-100 text-gray-800' }
};

// Agent code authentication mapping (id to user info)
export const AGENT_CODES = {
    'CO-000000001': { name: 'John Doe',    role: USER_ROLES.ADMIN },
    'CO-000000002': { name: 'Jane Smith',  role: USER_ROLES.MODERATOR },
    'CO-000000003': { name: 'Alex Johnson',role: USER_ROLES.USER }
};