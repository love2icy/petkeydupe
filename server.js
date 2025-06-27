const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const KEYS_FILE = path.join(__dirname, 'keys.txt');

app.use(cors());
app.use(express.json());

const userAccessLog = {};
const TIME_WINDOW_MS = 5 * 60 * 60 * 1000; // 5 hours

app.post('/generate-key', (req, res) => {
  const deviceId = req.body.deviceId;
  if (!deviceId) {
    return res.status(400).json({ success: false, message: 'Device ID missing' });
  }

  const now = Date.now();

  if (userAccessLog[deviceId] && now - userAccessLog[deviceId].timestamp < TIME_WINDOW_MS) {
    return res.json({
      success: false,
      message: `Key already generated. Try again later.`,
      key: userAccessLog[deviceId].key
    });
  }

  fs.readFile(KEYS_FILE, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Key file error.' });
    }
    const keys = data.split('\n').filter(Boolean);
    const key = keys[Math.floor(Math.random() * keys.length)];

    userAccessLog[deviceId] = { timestamp: now, key };

    res.json({ success: true, key });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
