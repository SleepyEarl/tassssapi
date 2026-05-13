const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- In-memory store ---
let tasks = [];
let categories = [
  { id: uuidv4(), name: 'Work', color: '#4f86f7' },
  { id: uuidv4(), name: 'Personal', color: '#f7a44f' },
  { id: uuidv4(), name: 'School', color: '#6fcf6f' },
  { id: uuidv4(), name: 'Errands', color: '#f76f6f' },
];
const notifications = [];

function pushNotification(type, message) {
  notifications.unshift({
    id: uuidv4(),
    type,
    message,
    createdAt: new Date().toISOString(),
  });
  if (notifications.length > 50) notifications.pop();
}

// --- API ROUTES ---

// Get all tasks (with optional filters)
app.get('/api/tasks', (req, res) => {
  let result = [...tasks];
  const { search, category } = req.query;
  if (search)
    result = result.filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase())
    );
  if (category && category !== 'All')
    result = result.filter((t) => t.categoryId === category);
  res.json({ success: true, data: result });
});

// Create a task
app.post('/api/tasks', (req, res) => {
  const { title, categoryId } = req.body;
  if (!title)
    return res
      .status(400)
      .json({ success: false, message: 'Title is required' });

  const task = {
    id: uuidv4(),
    title: title.trim(),
    completed: false,
    categoryId: categoryId || null,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  pushNotification('add', `Task added: "${task.title}"`);
  res.status(201).json({ success: true, data: task });
});

// Toggle task completion
app.patch('/api/tasks/:id/toggle', (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task)
    return res.status(404).json({ success: false, message: 'Task not found' });

  task.completed = !task.completed;
  const state = task.completed ? 'completed' : 'pending';
  pushNotification('status', `Task marked as ${state}`);
  res.json({ success: true, data: task });
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const idx = tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1)
    return res.status(404).json({ success: false, message: 'Task not found' });

  const [removed] = tasks.splice(idx, 1);
  pushNotification('delete', `Deleted: ${removed.title}`);
  res.json({ success: true, message: 'Deleted' });
});

// Get Categories
app.get('/api/categories', (req, res) => {
  res.json({ success: true, data: categories });
});

// Get Stats
app.get('/api/stats', (req, res) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  res.json({
    success: true,
    data: { total, completed, pending: total - completed },
  });
});

app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
