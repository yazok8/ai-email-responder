import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

interface EmailRequest {
  email: string;
}

// Simple in-memory rate limiting (resets on cold start)
const rateLimitMap = new Map<string, number[]>();

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting by IP
    const ip = req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    
    if (!rateLimitMap.has(ip as string)) {
      rateLimitMap.set(ip as string, []);
    }
    
    const requests = rateLimitMap.get(ip as string)!;
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= 3) {
      return res.status(429).json({ 
        error: 'Demo limit reached. Please contact me for full access.' 
      });
    }
    
    recentRequests.push(now);
    rateLimitMap.set(ip as string, recentRequests);

    const { email } = req.body as EmailRequest;

    if (!email || email.trim().length === 0) {
      return res.status(400).json({ error: 'Email content is required' });
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are an expert email assistant. Given the following email, generate 3 different response options:

1. Professional tone
2. Friendly tone  
3. Brief/concise tone

Original email:
"""
${email}
"""

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "professional": "response here",
  "friendly": "response here", 
  "brief": "response here"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful email assistant that generates appropriate responses.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0].message.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const responses = JSON.parse(responseText);

    return res.status(200).json({ responses });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate responses. Please try again.' 
    });
  }
}