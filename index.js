const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

dotenv.config({ path: './key.env' });
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const usageData = {}; 

const API_KEY = process.env.GEMINI_KEY;
const BYPASS_PASSWORD = process.env.MY_PRIVATE_BYPASS; 

app.post('/api/generate', async (req, res) => {
    const userIP = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const clientProvidedPass = req.headers['x-bypass-code']; 
    
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000; // 1 hour in ms

    // 1. Define isOwner first
    const isOwner = (clientProvidedPass === BYPASS_PASSWORD && BYPASS_PASSWORD !== undefined);

    // 2. Perform the rate limit check
    if (!isOwner && usageData[userIP]) {
        const timePassed = now - usageData[userIP];
        if (timePassed < ONE_HOUR) {
            const minutesLeft = Math.ceil((ONE_HOUR - timePassed) / 60000);
            return res.status(429).json({ 
                error: `Rate limit: Try again in ${minutesLeft} minutes.` 
            });
        }
    }

    try {
        if (!API_KEY) return res.status(500).json({ error: "Server Key Missing" });

        const readme = fs.existsSync('./README.md') ? fs.readFileSync('./README.md', 'utf8') : "";

        const model = "gemini-3.1-flash-lite-preview";
        const endpoint = "v1beta"
        const URL = `https://generativelanguage.googleapis.com/${endpoint}/models/${model}:generateContent?key=${API_KEY}`;

        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `SYSTEM: Use these docs: ${readme}\n\nUSER: ${req.body.prompt}`
                    }]
                }]
            })
        });

        const data = await response.json();

        if (response.ok && !isOwner) {
            usageData[userIP] = now;
        }

        console.log(`Request handled for: ${isOwner ? 'OWNER' : userIP}`);
        res.json(data);

    } catch (err) {
        console.error("Server Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Mint Server Secure: http://localhost:${PORT}`);
});