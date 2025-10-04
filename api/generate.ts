import type { VercelRequest, VercelResponse } from '@vercel/node';

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

    // Simulated delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const emailLower = email.toLowerCase();
    let responses;

    if (emailLower.includes('refund') || emailLower.includes('cancel')) {
      responses = {
        professional: "Thank you for contacting us regarding your refund request. I understand your concerns and want to ensure we address this matter promptly. I will review your account details and process your request according to our refund policy. You should expect a response within 24-48 business hours with the next steps.",
        friendly: "Hey! Thanks for reaching out about this. I totally understand wanting to sort out the refund situation. Let me look into your account and I'll get back to you super quick with what we can do. Appreciate your patience!",
        brief: "Refund request received. Will review and respond within 24-48 hours with next steps."
      };
    } else if (emailLower.includes('bug') || emailLower.includes('error') || emailLower.includes('issue')) {
      responses = {
        professional: "Thank you for bringing this technical issue to our attention. We take all bug reports seriously as they help us improve our product. I've forwarded this to our engineering team for investigation and will keep you updated on the progress. In the meantime, if you have any additional details or screenshots, please feel free to share them.",
        friendly: "Oh no, sorry you're running into this issue! Thanks so much for letting us know - these reports really help us make things better. I've passed this along to our tech team and they're on it. I'll keep you posted on what they find!",
        brief: "Bug report received and forwarded to engineering. Will update you on progress soon."
      };
    } else if (emailLower.includes('thank') || emailLower.includes('great') || emailLower.includes('awesome')) {
      responses = {
        professional: "Thank you for your kind words and positive feedback. We truly appreciate you taking the time to share your experience with us. Customer satisfaction is our top priority, and it's wonderful to hear that we've met your expectations. Please don't hesitate to reach out if you need anything in the future.",
        friendly: "Aw, thank you so much! This really made our day 😊 We're so happy you had a great experience. You're awesome for taking the time to let us know. We're always here if you need anything!",
        brief: "Thanks for the feedback! We're glad we could help. Reach out anytime!"
      };
    } else {
      responses = {
        professional: "Thank you for reaching out to us. I appreciate you bringing this matter to my attention. I will review your inquiry thoroughly and provide you with a comprehensive response within 24 hours. If you have any additional information that might be helpful, please feel free to share it.",
        friendly: "Hey there! Thanks for getting in touch. I really appreciate you reaching out about this. I'll look into it and get back to you soon with all the details you need. Let me know if there's anything else I should know!",
        brief: "Thanks for your message. Will review and respond within 24 hours."
      };
    }

    return res.status(200).json({ responses });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate responses. Please try again.' 
    });
  }
}