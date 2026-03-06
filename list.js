// 1. Force load from the specific filename
require('dotenv').config({ path: './key.env' });

async function listModels() {
  const apikey = process.env.GEMINI_KEY;
  
  // Debug check to ensure the key is actually loaded
  if (!apikey) {
    console.error("❌ Error: GEMINI_KEY is undefined. Is 'key.env' in this folder?");
    return;
  }
  
  console.log("✅ Key found. Fetching models...");

  // Use v1beta for the most recent preview models (like 3.1 Flash-Lite)
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apikey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("❌ API Error:", data.error.message);
      return;
    }

    console.log("--- Available Models ---");
    data.models.forEach(m => {
      // This will help you find the exact string for your index.js
      console.log(`- ${m.name}`); 
    });
    console.log("------------------------");

  } catch (err) {
    console.error("❌ Fetch Error:", err.message);
  }
}

listModels();