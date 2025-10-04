import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting - 3 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: { error: 'Demo limit reached. Please contact me for full access.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Types
interface EmailRequest {
  email: string;
}

interface EmailResponse {
  responses: {
    professional: string;
    friendly: string;
    brief: string;
  };
}

// Email generation endpoint
app.post('/api/generate', limiter, async (req: Request<{}, {}, EmailRequest>, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || email.trim().length === 0) {
      return res.status(400).json({ error: 'Email content is required' });
    }

    const prompt = `You are an expert email assistant. Given the following email, generate 3 different response options:

1. Professional tone
2. Friendly tone  
3. Brief/concise tone

Original email:
"""
${email}
"""

Return a JSON object with this structure:
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

    res.json({ responses });
  } catch (error) {
    console.error('Error generating responses:', error);
    res.status(500).json({ 
      error: 'Failed to generate responses. Please try again.' 
    });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});