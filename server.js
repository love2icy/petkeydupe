import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

const KEYS_FILE = path.join(process.cwd(), 'keys.txt');
const LOG_FILE = path.join(process.cwd(), 'accessLog.json');

const TIME_WINDOW_MS = 5 * 60 * 60 * 1000; // 5 hours

app.use(cors());
app.use(express.json());

// Load or initialize access log from disk
let userAccessLog = {};
try {
  const data = fs.readFileSync(LOG_FILE, 'utf8');
  userAccessLog = JSON.parse(data);
} catch {
  userAccessLog = {};
}

function saveAccessLog() {
  fs.writeFileSync(LOG_FILE, JSON.stringify(userAccessLog, null, 2));
}

app.get('/generate-key', (req, res) => {
  const fp = req.query.fp; // fingerprint sent from client
  if (!fp) {
    return res.status(400).json({ success: false, message: 'Fingerprint (fp) query parameter required' });
  }

  const now = Date.now();

  if (userAccessLog[fp] && (now - userAccessLog[fp].timestamp) < TIME_WINDOW_MS) {
    const timeLeft = (TIME_WINDOW_MS - (now - userAccessLog[fp].timestamp)) / 3600000;
    return res.json({
      success: true,
      message: `You already generated a key. Try again in ${timeLeft.toFixed(2)} hours.`,
      key: userAccessLog[fp].key
    });
  }

  // Read keys from file
  let keys;
  try {
    const data = fs.readFileSync(KEYS_FILE, 'utf8');
    keys = data.split('\n').filter(Boolean);
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to read keys file.' });
  }

  const key = keys[Math.floor(Math.random() * keys.length)];

  userAccessLog[fp] = { timestamp: now, key };
  saveAccessLog();

  res.json({ success: true, key });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
