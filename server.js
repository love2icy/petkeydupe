import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Track keys per deviceID with timestamps
const userAccessLog = {};
const TIME_WINDOW_MS = 5 * 60 * 60 * 1000; // 5 hours

const KEYS_FILE = path.resolve('./keys.txt');

app.get('/generate-key', async (req, res) => {
  try {
    // Device ID from query param (sent from frontend)
    const deviceId = req.query.deviceId;
    if (!deviceId) return res.status(400).json({ success: false, message: 'Missing deviceId' });

    const now = Date.now();
    const lastAccess = userAccessLog[deviceId];

    if (lastAccess && now - lastAccess.timestamp < TIME_WINDOW_MS) {
      return res.json({
        success: true,
        key: lastAccess.key,
        message: `Key already generated. Try again in ${(TIME_WINDOW_MS - (now - lastAccess.timestamp)) / 3600000} hours.`,
      });
    }

    const data = await fs.readFile(KEYS_FILE, 'utf8');
    const keys = data.split('\n').filter(Boolean);
    const key = keys[Math.floor(Math.random() * keys.length)];

    userAccessLog[deviceId] = { timestamp: now, key };

    return res.json({ success: true, key, message: 'New key generated' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
