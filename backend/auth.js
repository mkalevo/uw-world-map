require('dotenv').config(); // Loads credentials from .env
const express = require('express');
const cors = require('cors');

const { fetch } = require('undici');

console.log("✅ fetch loaded:", typeof fetch); // should print "function"


const app = express();
app.use(cors());
app.use(express.json());

// Xano endpoints
const XANO_AUTH_BASE_URL = 'https://xauy-vmur-zbnk.f2.xano.io/api:pwzP4ZE8';
const XANO_MAP_BASE_URL = 'https://xauy-vmur-zbnk.f2.xano.io/api:OaMJaaNt';

// Login credentials (from environment or fallback)
const XANO_EMAIL = process.env.XANO_EMAIL
const XANO_PASSWORD = process.env.XANO_PASSWORD

console.log(XANO_EMAIL)
console.log(XANO_PASSWORD)

let authToken = null;
let tokenExpiry = null;

// Get or reuse an authentication token
async function getAuthToken() {
  const now = Date.now();

  if (!authToken || !tokenExpiry || now >= tokenExpiry) {
    console.log("🔑 Requesting new auth token from Xano...");

    const loginRes = await fetch(`${XANO_AUTH_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: XANO_EMAIL, password: XANO_PASSWORD })
    });

    console.log("🔁 Login response status:", loginRes.status);
    const loginData = await loginRes.json();
    console.log("📥 Login response data:", loginData);

    if (!loginData.authToken) {
      throw new Error("❌ Login failed. No authToken received.");
    }

    authToken = loginData.authToken;
    tokenExpiry = now + 24 * 60 * 60 * 1000; // 24 hours
    console.log("✅ Token saved. Valid until:", new Date(tokenExpiry).toISOString());
  } else {
    console.log("🔐 Using cached token.");
  }

  return authToken;
}

// 📡 Proxy for /map_data
app.post('/map_data', async (req, res) => {
  console.log("🌍 Received /map_data request:", req.body);

  try {
    const token = await getAuthToken();

    console.log("📤 Forwarding to Xano:", {
      url: `${XANO_MAP_BASE_URL}/map_data`,
      body: req.body,
      token
    });

    console.log("➡️ Requesting map data from Xano...");
    const mapRes = await fetch(`${XANO_MAP_BASE_URL}/map_data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(req.body)
    });

    console.log("↩️ Xano /map_data response status:", mapRes.status);
    const data = await mapRes.json();
    console.log("📦 Data received from Xano:", data);

    res.json(data);
  } catch (err) {
    console.error("💥 Error in /map_data route:", err.message);
    res.status(500).json({ error: "Failed to fetch map data" });
  }
});

// 🚀 Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});