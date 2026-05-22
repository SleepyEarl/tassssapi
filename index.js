const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose'); // Add this

const app = express();
app.use(cors());
app.use(express.json());

// --- MONGODB CONNECTION ---
mongoose.connect('mongodb+srv://admin:admin123@cluster0.pkknnfk.mongodb.net/taskmanager?appName=Cluster0')
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

// --- ROUTES ---

// GET tasks
app.get('/api/tasks', async (req, res) => {
  const tasks = await Task.find();
  res.json({ success: true, data: tasks });
});

// CREATE task
app.post('/api/tasks', async (req, res) => {
  const { title, categoryId } = req.body;
  const task = new Task({ title, categoryId });
  await task.save();
  
  await pushNotification('add', `Task added: "${task.title}"`);
  res.status(201).json({ success: true, data: task });
});

// TOGGLE task
app.patch('/api/tasks/:id/toggle', async (req, res) => {
  const task = await Task.findById(req.params.id);
  task.completed = !task.completed;
  await task.save();
  
  await pushNotification('status', `Task marked as ${task.completed ? 'completed' : 'pending'}`);
  res.json({ success: true, data: task });
});

app.post('/api/ai/categorize', (req, res) => {
  const { title } = req.body;
  
  let suggestedCategory = 'Personal'; // Default
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes('work') || lowerTitle.includes('meeting') || lowerTitle.includes('email')) {
    suggestedCategory = 'Work';
  } else if (lowerTitle.includes('exam') || lowerTitle.includes('study') || lowerTitle.includes('project')) {
    suggestedCategory = 'School';
  }

  res.json({ success: true, category: suggestedCategory });
});