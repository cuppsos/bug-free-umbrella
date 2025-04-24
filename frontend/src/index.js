import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { PostHogProvider } from 'posthog-js/react';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={process.env.REACT_APP_POSTHOG_KEY}
      options={{
        api_host: 'https://us.i.posthog.com',
        debug: process.env.NODE_ENV === "development",
      }}
    >
      <App />
    </PostHogProvider>
  </React.StrictMode>
);
