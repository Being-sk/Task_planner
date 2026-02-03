require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  let key = process.env.GEMINI_API_KEY;
  if (!key) return console.error('No key');
  
  // TRIM THE KEY
  key = key.trim();
  console.log(`Key: ${key.substring(0, 5)}...${key.substring(key.length-4)} (Length: ${key.length})`);

  try {
    const genAI = new GoogleGenerativeAI(key);
    // explicit version
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    console.log('Sending request to Gemini 1.5 Flash...');
    const result = await model.generateContent("Hello?");
    console.log('SUCCESS!');
    console.log(result.response.text());
  } catch (e) {
    console.error('Gemini Error:', e.message);
    if (e.message.includes('404')) {
        console.log("SUGGESTION: The API key might be valid but the model alias 'gemini-1.5-flash' is not reachable.");
    }
  }
}

test();
