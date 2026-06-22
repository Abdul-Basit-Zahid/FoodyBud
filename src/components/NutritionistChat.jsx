import React, { useEffect, useMemo, useState } from 'react';
import { askNutritionist } from '../services/deepseek';
import { getMockUserState, checkAccess } from '../services/freemium';
import UpgradeModal from './UpgradeModal';
import { Lock, HelpCircle, ShieldCheck } from 'lucide-react';

const DEFAULT_SUGGESTIONS = [
  'Is this recipe strictly Halal?',
  'Scan E-numbers & rennet check',
  'Does soy sauce contain alcohol?'
];

export default function NutritionistChat({ recipe }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [userState, setUserState] = useState(getMockUserState());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const handleStateUpdate = () => {
      setUserState(getMockUserState());
    };
    window.addEventListener('foodybud-user-state-update', handleStateUpdate);
    return () => window.removeEventListener('foodybud-user-state-update', handleStateUpdate);
  }, []);

  const recipeKey = useMemo(() => recipe?.name || recipe?.dishName || '', [recipe]);

  useEffect(() => {
    setMessages([]);
    setShowSuggestions(true);
    setInput('');
  }, [recipeKey]);

  const hasPremiumAccess = useMemo(() => {
    return checkAccess('nutritionistChat', userState);
  }, [userState]);

  const handleSend = async (text) => {
    if (!hasPremiumAccess) {
      setShowUpgradeModal(true);
      return;
    }
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
    if (!hasPremiumAccess) {
      setShowUpgradeModal(true);
      return;
    }
    handleSend();
  };

  if (!recipe) return null;

  return (
    <div className="nutritionist-chat">
      <button
        type="button"
        className="chat-fab flex items-center justify-center text-xl bg-primary shadow-xl hover:scale-105 transition-all text-white w-12 h-12 rounded-full"
        onClick={() => setOpen((value) => !value)}
        title="Consult AI Dietitian"
      >
        💬
      </button>

      <div className={`chat-drawer ${open ? 'open' : ''} border border-border-subtle bg-surface shadow-2xl rounded-l-3xl`}>
        <div className="chat-drawer-header border-b border-border-subtle p-4 flex justify-between items-center bg-gradient-to-r from-primary-light to-surface-2">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-text-brand font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-text-brand" /> Halal Fiqh & Dietitian AI
            </div>
            <div className="text-sm font-black text-text-primary mt-0.5">Screen {recipe?.name || recipe?.dishName}</div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm font-bold" onClick={() => setOpen(false)}>Close</button>
        </div>

        <div className="chat-messages p-4 flex-1 overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-xs font-semibold text-text-tertiary flex items-center gap-2 justify-center py-6 bg-surface-2 border border-dashed border-border-subtle rounded-2xl">
              <HelpCircle className="w-4 h-4 text-text-tertiary" /> Ask about E-numbers, Mushbooh ingredients, or rennet.
            </div>
          ) : null}
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`chat-bubble max-w-[85%] p-3 rounded-2xl text-sm font-medium ${message.role === 'user' ? 'chat-bubble-user ml-auto bg-primary text-white rounded-tr-none' : 'chat-bubble-ai mr-auto bg-surface-2 border border-border-subtle text-text-primary rounded-tl-none'}`}
            >
              {message.content}
            </div>
          ))}
          {loading ? (
            <div className="chat-bubble chat-bubble-ai mr-auto bg-surface-2 border border-border-subtle p-3 rounded-2xl rounded-tl-none">
              <span className="typing-dots flex gap-1 items-center">
                <span className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce delay-200"></span>
              </span>
            </div>
          ) : null}
        </div>

        {/* Suggestions Panel */}
        {showSuggestions && messages.length === 0 && (
          <div className="chat-suggestions px-4 py-2 border-t border-border-subtle flex flex-wrap gap-2">
            {DEFAULT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="chip text-xs hover:border-text-brand"
                onClick={() => handleSend(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input area & Paywall Overlay */}
        <div className="relative p-4 border-t border-border-subtle bg-surface-2">
          {!hasPremiumAccess && (
            <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center z-20">
              <p className="text-xs font-bold text-text-primary flex items-center gap-1.5 justify-center mb-2">
                <Lock className="w-3.5 h-3.5 text-text-brand" />
                Locked Premium Feature
              </p>
              <p className="text-[11px] text-text-secondary mb-2.5 max-w-[250px]">
                Unlock Halal Fiqh & Dietitian AI to screen E-numbers, Mushbooh ingredients, and animal rennet.
              </p>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="btn btn-primary btn-sm px-4"
              >
                Upgrade ($4.99/mo)
              </button>
            </div>
          )}
          
          <form className="chat-input flex gap-2" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="input flex-1 py-2 px-3 border border-border-subtle rounded-xl text-sm"
              placeholder={hasPremiumAccess ? "Ask a Halal/diet question..." : "Upgrade to ask questions..."}
              disabled={!hasPremiumAccess || loading}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm px-4"
              disabled={!hasPremiumAccess || loading || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </div>
  );
}
