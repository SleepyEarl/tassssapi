const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// --- MONGODB CONNECTION ---
// Use environment variable for deployment, or fallback to local
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskdb';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('DB Connection Error:', err));

// --- TASK SCHEMA ---
const TaskSchema = new mongoose.Schema({
  title: String,
  completed: { type: Boolean, default: false },
  categoryId: String,
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', TaskSchema);

// --- NOTIFICATION HELPER ---
const NOTIF_SERVICE_URL = process.env.NOTIF_SERVICE_URL || 'http://localhost:4000/notify';

async function pushNotification(type, message) {
  try {
    await axios.post(NOTIF_SERVICE_URL, { type, message });
  } catch (err) {
    console.error('Notification service unreachable');
  }
}

// --- ROUTES ---

// GET tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, categoryId } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const task = new Task({ title, categoryId });
    await task.save();

    await pushNotification('add', `Task added: "${task.title}"`);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// TOGGLE task
app.patch('/api/tasks/:id/toggle', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.completed = !task.completed;
    await task.save();

    const state = task.completed ? 'completed' : 'pending';
    await pushNotification('status', `Task marked as ${state}`);
    
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// AI Categorization API
app.post('/api/ai/categorize', (req, res) => {
  try {
    const { title } = req.body;
    let suggestedCategory = 'Personal';
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('work') || lowerTitle.includes('meeting') || lowerTitle.includes('email')) {
      suggestedCategory = 'Work';
    } else if (lowerTitle.includes('exam') || lowerTitle.includes('study') || lowerTitle.includes('project')) {
      suggestedCategory = 'School';
    }

    res.json({ success: true, category: suggestedCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Task Service running on port ${PORT}`);
});