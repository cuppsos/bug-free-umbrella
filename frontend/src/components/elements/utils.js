// Utility: Format timestamps to relative or date strings
export const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp; // If invalid date, return as-is
  
    const now = new Date();
    const diffMs   = now - date;
    const diffSec  = Math.floor(diffMs / 1000);
    const diffMin  = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay  = Math.floor(diffHour / 24);
  
    if (diffSec < 60)  return 'Just now';
    if (diffMin < 60)  return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    if (diffDay < 7)   return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };