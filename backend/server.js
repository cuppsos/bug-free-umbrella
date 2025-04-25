// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import the Thread model
const Thread = require('./models/Thread');

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());  // <-- make sure this is here!

// Routes

// Get all threads
app.get('/api/threads', async (req, res) => {
  try {
    const threads = await Thread.find().sort({ isPinned: -1, createdAt: -1 });
    res.json(threads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single thread
app.get('/api/threads/:threadId', async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create thread
app.post('/api/threads', async (req, res) => {
  try {
    const { title, content, tags, author } = req.body;
    const newThread = new Thread({
      title,
      content,
      author,         
      votes: 0,
      tags: tags || []
    });
    
    const savedThread = await newThread.save();
    res.status(201).json(savedThread);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add comment
app.post('/api/threads/:threadId/comments', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content, author } = req.body;

    const thread = await Thread.findById(threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    thread.comments.push({
      content,
      author        // ← now uses req.body.author
    });

    const updatedThread = await thread.save();
    // return only the newly added comment
    const newComment = updatedThread.comments[updatedThread.comments.length - 1];
    res.status(201).json(newComment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Vote on thread
app.post('/api/threads/:threadId/vote', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { direction } = req.body;

    const thread = await Thread.findById(threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    thread.votes += direction === 'up' ? 1 : -1;
    await thread.save();

    res.json({ votes: thread.votes });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update thread
app.put('/api/threads/:threadId', async (req, res) => {
  try {
    const updated = await Thread.findByIdAndUpdate(
      req.params.threadId,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Thread not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete thread
app.delete('/api/threads/:threadId', async (req, res) => {
  try {
    const deleted = await Thread.findByIdAndDelete(req.params.threadId);
    if (!deleted) return res.status(404).json({ message: 'Thread not found' });
    res.json({ message: 'Thread deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Start server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});