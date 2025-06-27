// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const KEYS_FILE = path.join(__dirname, 'keys.txt');

app.use(cors());

const userAccessLog = {};
const TIME_WINDOW_MS = 5 * 60 * 60 * 1000; // 5 hours

app.get('/generate-key', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const now = Date.now();

  if (userAccessLog[ip] && now - userAccessLog[ip].timestamp < TIME_WINDOW_MS) {
    return res.status(429).json({
      success: false,
      message: `You already generated a key. Try again in ${(TIME_WINDOW_MS - (now - userAccessLog[ip].timestamp)) / 3600000} hours.`,
      key: userAccessLog[ip].key
    });
  }

  fs.readFile(KEYS_FILE, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Key file error.' });
    }
    const keys = data.split('\n').filter(Boolean);
    const key = keys[Math.floor(Math.random() * keys.length)];

    userAccessLog[ip] = { timestamp: now, key };

    res.json({ success: true, key });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
