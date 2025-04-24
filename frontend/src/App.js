import React from 'react';
import ForumPanel from './components/ForumPanel';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">My Website</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to our website!</h2>
          <p className="text-gray-600">
            This is a sample website showcasing our forum component. Click the message
            icon in the bottom right to open the forum.
          </p>
        </div>

        {/* Forum Component */}
        <ForumPanel />
      </main>
    </div>
  );
}

export default App;