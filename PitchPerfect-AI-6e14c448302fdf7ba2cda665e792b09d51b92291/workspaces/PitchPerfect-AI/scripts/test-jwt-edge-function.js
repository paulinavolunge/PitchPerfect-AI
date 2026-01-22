import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('Missing JWT_SECRET in .env');
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

fetch('http://127.0.0.1:54321/functions/v1/roleplay-ai-response', {
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
