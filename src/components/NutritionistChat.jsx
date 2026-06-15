import React, { useEffect, useMemo, useState } from 'react';
import { askNutritionist } from '../services/deepseek';

const DEFAULT_SUGGESTIONS = [
  'Is this good for weight loss?',
  'Halal ingredient check',
  'Lower calorie version?'
];

export default function NutritionistChat({ recipe }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const recipeKey = useMemo(() => recipe?.name || recipe?.dishName || '', [recipe]);

  useEffect(() => {
    setMessages([]);
    setShowSuggestions(true);
    setInput('');
  }, [recipeKey]);

  const handleSend = async (text) => {
    const content = String(text || input).trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setShowSuggestions(false);

    try {
      const reply = await askNutritionist(nextMessages, recipe || {});
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I had trouble answering that. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  if (!recipe) return null;

  return (
    <div className="nutritionist-chat">
      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen((value) => !value)}
      >
        🥗
      </button>

      <div className={`chat-drawer ${open ? 'open' : ''}`}>
        <div className="chat-drawer-header">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold">AI Nutritionist</div>
            <div className="text-sm font-semibold">Ask about {recipe?.name || recipe?.dishName}</div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Close</button>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="text-sm text-text-tertiary">Ask any nutrition question about this recipe.</div>
          ) : null}
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`chat-bubble ${message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}
            >
              {message.content}
            </div>
          ))}
          {loading ? (
            <div className="chat-bubble chat-bubble-ai">
              <span className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          ) : null}
        </div>

        {showSuggestions && messages.length === 0 ? (
          <div className="chat-suggestions">
            {DEFAULT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="chip"
                onClick={() => handleSend(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        <form className="chat-input" onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input"
            placeholder="Ask a nutrition question..."
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
