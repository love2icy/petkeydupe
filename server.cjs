const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const KEYS_FILE = path.join(__dirname, 'keys.txt');
const TIME_WINDOW_MS = 5 * 60 * 60 * 1000; // 5 hours

app.use(cors());

// Store access info by fingerprint
const userAccessLog = {};

app.get('/generate-key', (req, res) => {
  const fp = req.query.fp;
  if (!fp) return res.status(400).json({ success: false, message: 'Fingerprint required' });

  const now = Date.now();

  if (userAccessLog[fp] && (now - userAccessLog[fp].timestamp) < TIME_WINDOW_MS) {
    // Within 5 hours - return the existing key
    return res.json({
      success: true,
      message: `You already generated a key. Try again in ${((TIME_WINDOW_MS - (now - userAccessLog[fp].timestamp)) / 3600000).toFixed(2)} hours.`,
      key: userAccessLog[fp].key
    });
  }

  // Read keys file
  fs.readFile(KEYS_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ success: false, message: 'Key file error.' });

    const keys = data.split('\n').filter(Boolean);
    if (keys.length === 0) return res.status(500).json({ success: false, message: 'No keys available.' });

    const key = keys[Math.floor(Math.random() * keys.length)];

    userAccessLog[fp] = { timestamp: now, key };

    res.json({ success: true, key });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
