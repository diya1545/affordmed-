const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;
const API_TIMEOUT = 1000; // in ms

// In-memory storage for each type
const slidingWindows = {
  p: [],
  f: [],
  e: [],
  r: []
};

const expiresIn = 1744702723;
const currentTime = Math.floor(Date.now() / 1000); // current Unix time in seconds

if (currentTime > expiresIn) {
  console.log("⚠️ Token has expired");
} else {
  console.log("✅ Token is still valid");
}


// Mapping for API endpoints
const apiMap = {
  p: 'http://20.244.56.144/evaluation-service/primes',
  f: 'http://20.244.56.144/evaluation-service/fibo',
  e: 'http://20.244.56.144/evaluation-service/even',
  r: 'http://20.244.56.144/evaluation-service/rand'
};

app.get('/numbers/:numberid', async (req, res) => {
  const type = req.params.numberid;
  
  if (!['p', 'f', 'e', 'r'].includes(type)) {
    return res.status(400).json({ error: 'Invalid number type. Use p, f, e, or r.' });
  }

  const apiURL = apiMap[type];
  const prevWindow = [...slidingWindows[type]];

  try {
    const response = await axios.get(apiURL, {
        timeout: API_TIMEOUT,
        auth: {
          username: 'PwzufG',  // Username if Basic Auth is required
          password: ''  // Leave password blank unless specified
        }
      });
      
      
    const fetchedNumbers = response.data.numbers || [];

    // Update sliding window with unique new numbers
    const currentSet = new Set(slidingWindows[type]);
    for (let num of fetchedNumbers) {
      if (!currentSet.has(num)) {
        slidingWindows[type].push(num);
        currentSet.add(num);
        if (slidingWindows[type].length > WINDOW_SIZE) {
          slidingWindows[type].shift();
        }
      }
    }

    const window = slidingWindows[type];
    const avg = (window.reduce((sum, n) => sum + n, 0) / window.length).toFixed(2);

    res.json({
      windowPrevState: prevWindow,
      windowCurrState: window,
      numbers: fetchedNumbers,
      avg: parseFloat(avg)
    });

  } catch (err) {
    console.error('API Error or Timeout:', err.message);
    return res.json({
      windowPrevState: prevWindow,
      windowCurrState: prevWindow,
      numbers: [],
      avg: prevWindow.length ? parseFloat((prevWindow.reduce((sum, n) => sum + n, 0) / prevWindow.length).toFixed(2)) : 0
    });
  }
});

app.listen(PORT, () => {
  console.log(`Average Calculator Microservice running at http://localhost:${PORT}`);
});

