(() => {
  const keysUrl = 'https://raw.githubusercontent.com/love2icy/petkeysystem/main/keys.txt';
  const cooldownHours = 5;
  const cooldownMs = cooldownHours * 60 * 60 * 1000;

  const generateBtn = document.getElementById('generateBtn');
  const keyDiv = document.getElementById('key');
  const cooldownMsg = document.getElementById('cooldownMsg');

  // LocalStorage keys
  const STORAGE_KEY = 'generatedKey';
  const STORAGE_TIME = 'generatedKeyTimestamp';

  // Load keys from URL
  let keys = [];

  function loadKeys() {
    return fetch(keysUrl)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load keys');
        return res.text();
      })
      .then(text => {
        keys = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        console.log(`Loaded ${keys.length} keys`);
      })
      .catch(err => {
        console.error('Error loading keys:', err);
        keyDiv.textContent = 'Failed to load keys. Try again later.';
        generateBtn.disabled = true;
      });
  }

  // Check cooldown, returns true if cooldown active
  function isCooldownActive() {
    const timestamp = localStorage.getItem(STORAGE_TIME);
    if (!timestamp) return false;
    const elapsed = Date.now() - Number(timestamp);
    return elapsed < cooldownMs;
  }

  // Get remaining cooldown time formatted
  function getRemainingTime() {
    const timestamp = localStorage.getItem(STORAGE_TIME);
    if (!timestamp) return 0;
    const elapsed = Date.now() - Number(timestamp);
    return Math.max(0, cooldownMs - elapsed);
  }

  // Format ms to h:m:s
  function formatMs(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
  }

  // Show stored key & disable button if cooldown active
  function showStoredKeyOrReset() {
    if (isCooldownActive()) {
      const storedKey = localStorage.getItem(STORAGE_KEY);
      keyDiv.textContent = storedKey ? `Your key: ${storedKey}` : 'No key found.';
      generateBtn.disabled = true;
      updateCooldownMessage();
      startCooldownInterval();
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIME);
      keyDiv.textContent = 'Click the button to get a key';
      cooldownMsg.textContent = '';
      generateBtn.disabled = false;
    }
  }

  // Update cooldown countdown message
  function updateCooldownMessage() {
    const remaining = getRemainingTime();
    if (remaining > 0) {
      cooldownMsg.textContent = `You can generate a new key in ${formatMs(remaining)}`;
    } else {
      cooldownMsg.textContent = '';
      generateBtn.disabled = false;
    }
  }

  // Interval to update cooldown message every second
  let cooldownInterval;
  function startCooldownInterval() {
    if (cooldownInterval) clearInterval(cooldownInterval);
    cooldownInterval = setInterval(() => {
      if (!isCooldownActive()) {
        clearInterval(cooldownInterval);
        cooldownMsg.textContent = '';
        generateBtn.disabled = false;
        keyDiv.textContent = 'Click the button to get a key';
      } else {
        updateCooldownMessage();
      }
    }, 1000);
  }

  // Pick a random key from keys array
  function getRandomKey() {
    if (keys.length === 0) return null;
    const idx = Math.floor(Math.random() * keys.length);
    return keys[idx];
  }

  // Generate key handler
  async function generateKey() {
    if (isCooldownActive()) {
      alert('You must wait before generating another key.');
      return;
    }

    const newKey = getRandomKey();
    if (!newKey) {
      alert('No keys available.');
      return;
    }

    localStorage.setItem(STORAGE_KEY, newKey);
    localStorage.setItem(STORAGE_TIME, Date.now().toString());

    keyDiv.textContent = `Your key: ${newKey}`;
    generateBtn.disabled = true;
    startCooldownInterval();
  }

  // Init
  async function init() {
    await loadKeys();
    showStoredKeyOrReset();
    generateBtn.addEventListener('click', generateKey);
  }

  init();
})();
