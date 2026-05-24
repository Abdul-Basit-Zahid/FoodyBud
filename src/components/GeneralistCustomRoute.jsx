import React, { useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';

const PROMPT_SUGGESTIONS = [
  'Weekdays: solo omnivore meals',
  'Weekends: vegetarian for two',
  'No dairy, keep spice medium',
];

export default function GeneralistCustomRoute() {
  const [prompt, setPrompt] = useState('');
  const [saved, setSaved] = useState(null);

  const savePrompt = () => {
    if (!prompt.trim()) return;
    setSaved({
      id: `custom_${Date.now()}`,
      prompt: prompt.trim(),
      timestamp: new Date().toLocaleString(),
    });
  };

  return (
    <section className="bg-surface rounded-3xl border border-border-subtle p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary font-bold">Generalist Route</p>
        <h2 className="text-2xl font-display font-black text-text-primary">Deep Personalization</h2>
        <p className="text-sm text-text-secondary">Describe your exact cooking rules in one prompt.</p>
      </div>

      <div className="bg-surface-2 border border-border-subtle rounded-2xl p-4">
        <div className="flex items-center gap-2 text-text-primary font-semibold mb-3">
          <Brain className="w-4 h-4 text-brand" /> Custom GPT-style Prompt
        </div>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
          className="input w-full resize-none"
          placeholder="e.g., I cook for myself on weekdays, vegetarian for two on weekends..."
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {PROMPT_SUGGESTIONS.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setPrompt(item)}
              className="chip"
            >
              {item}
            </button>
          ))}
        </div>
        <button type="button" onClick={savePrompt} className="btn btn-primary mt-4 w-full">
          <Sparkles className="w-4 h-4" /> Save Personalization
        </button>
      </div>

      {saved ? (
        <div className="mt-4 bg-surface-2 border border-border-subtle rounded-2xl p-4 animate-fade-in">
          <div className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold">Latest Prompt</div>
          <p className="text-sm text-text-primary mt-2">{saved.prompt}</p>
          <p className="text-xs text-text-tertiary mt-2">Saved: {saved.timestamp}</p>
        </div>
      ) : null}
    </section>
  );
}
