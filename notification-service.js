const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/notify', (req, res) => {
  const { type, message } = req.body;
  console.log(`[NOTIFICATION SERVICE] ${type.toUpperCase()}: ${message}`);
  res.status(200).json({ success: true });
});

app.listen(4000, () => console.log('Notification Service on port 4000'));