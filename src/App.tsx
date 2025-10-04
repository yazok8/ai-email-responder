import axios from 'axios';
import { useState } from 'react';
import './App.css';

interface Responses {
  professional: string;
  friendly: string;
  brief: string;
}

function App() {
  const [email, setEmail] = useState('');
  const [responses, setResponses] = useState<Responses | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!email.trim()) {
      setError('Please enter an email');
      return;
    }

    setLoading(true);
    setError('');
    setResponses(null);

    try {
      const response = await axios.post<{ responses: Responses }>(
        '/api/generate',  // Vercel automatically routes /api/* to serverless functions
        { email }
      );
      setResponses(response.data.responses);
    } catch (err: any) {
      setError(
        err.response?.data?.error || 
        'Failed to generate responses. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="app">
      <div className="container">
        <header>
          <h1>AI Email Responder</h1>
          <p className="subtitle">
            Paste a customer email and get 3 AI-generated response options
          </p>
          <p className="demo-notice">
            🔒 Demo Mode: 3 tries per 15 minutes
          </p>
        </header>

        <div className="input-section">
          <label htmlFor="email">Customer Email:</label>
          <textarea
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Paste the customer email here..."
            rows={8}
          />
          
          <button 
            onClick={handleGenerate} 
            disabled={loading}
            className="generate-btn"
          >
            {loading ? 'Generating...' : 'Generate Responses'}
          </button>

          {error && <div className="error">{error}</div>}
        </div>

        {responses && (
          <div className="responses-section">
            <h2>Generated Responses:</h2>
            
            {Object.entries(responses).map(([type, text]) => (
              <div key={type} className="response-card">
                <div className="response-header">
                  <h3>{type.charAt(0).toUpperCase() + type.slice(1)} Tone</h3>
                  <button
                    onClick={() => copyToClipboard(text, type)}
                    className="copy-btn"
                  >
                    {copied === type ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <p className="response-text">{text}</p>
              </div>
            ))}
          </div>
        )}

      <footer>
        <p>
          <strong>Demo Version</strong> - Smart pre-generated responses
        </p>
        <p>
          Built by <strong>Yazan Kherfan</strong> | 
          <a href="https://github.com/yourusername/email-ai-responder" target="_blank"> View Code</a>
        </p>
        <p>
          Want the live AI version? → <a href="mailto:ykherfan8@gmail.com">Contact Me</a>
        </p>
      </footer>
            </div>
          </div>
        );
      }

export default App;