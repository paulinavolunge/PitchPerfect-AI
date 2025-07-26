import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required');
  console.log('💡 Add JWT_SECRET to your .env file');
  process.exit(1);
}

if (!SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL environment variable is required');
  console.log('💡 Add VITE_SUPABASE_URL to your .env file');
  process.exit(1);
}

const token = jwt.sign(
  {
    role: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes
  },
  JWT_SECRET,
  { algorithm: 'HS256' }
);

const functionUrl = process.env.NODE_ENV === 'production' 
  ? `${SUPABASE_URL}/functions/v1/roleplay-ai-response`
  : 'http://127.0.0.1:54321/functions/v1/roleplay-ai-response';

console.log(`Testing endpoint: ${functionUrl}`);

fetch(functionUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    userInput: "I don’t think we need this tool right now.",
    scenario: {
      industry: "real estate",
      objection: "Need",
      difficulty: "Easy"
    },
    voiceStyle: "friendly"
  })
})
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
