import React, { useState } from 'react';
import { Gauge, Timer } from 'lucide-react';

const FLAVOR_PRESETS = ['Spicy', 'Smoky', 'Tangy', 'Herby'];
const LOG_KEY = 'foodybud_remix_log';

const loadLogs = () => {
  try {
    const stored = localStorage.getItem(LOG_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function RecipeRemixTracker() {
  const [spiceLevel, setSpiceLevel] = useState(3);
  const [flavors, setFlavors] = useState([]);
  const [calories, setCalories] = useState('');
  const [fastStart, setFastStart] = useState('20:00');
  const [fastEnd, setFastEnd] = useState('12:00');
  const [logs, setLogs] = useState(loadLogs);

  const toggleFlavor = (label) => {
    setFlavors((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]));
  };

  const saveLog = () => {
    const entry = {
      id: `log_${Date.now()}`,
      spiceLevel,
      flavors,
      calories: Number(calories || 0),
      fastingWindow: `${fastStart} - ${fastEnd}`,
    };
    const next = [entry, ...logs].slice(0, 6);
    setLogs(next);
    localStorage.setItem(LOG_KEY, JSON.stringify(next));
  };

  return (
    <section className="bg-surface rounded-3xl border border-border-subtle p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary font-bold">Recipe Remix</p>
        <h2 className="text-2xl font-display font-black text-text-primary">Flavor + Tracker</h2>
        <p className="text-sm text-text-secondary">Boost flavor profiles while logging intake.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-surface-2 border border-border-subtle rounded-2xl p-4">
          <div className="flex items-center gap-2 text-text-primary font-semibold mb-3">
            <Gauge className="w-4 h-4 text-brand" /> Spice Level
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Level</span>
            <span className="font-mono text-brand text-lg">{spiceLevel}</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={spiceLevel}
            onChange={(event) => setSpiceLevel(Number(event.target.value))}
            className="w-full mt-3"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {FLAVOR_PRESETS.map((flavor) => (
              <button
                type="button"
                key={flavor}
                onClick={() => toggleFlavor(flavor)}
                className={`chip ${flavors.includes(flavor) ? 'active' : ''}`}
              >
                {flavor}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-2 border border-border-subtle rounded-2xl p-4">
          <div className="flex items-center gap-2 text-text-primary font-semibold mb-3">
            <Timer className="w-4 h-4 text-brand" /> Tracker
          </div>
          <label className="text-xs text-text-tertiary">
            Calories
            <input
              className="input mt-1 font-mono"
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <label className="text-xs text-text-tertiary">
              Fast Start
              <input
                className="input mt-1 font-mono"
                value={fastStart}
                onChange={(event) => setFastStart(event.target.value)}
              />
            </label>
            <label className="text-xs text-text-tertiary">
              Fast End
              <input
                className="input mt-1 font-mono"
                value={fastEnd}
                onChange={(event) => setFastEnd(event.target.value)}
              />
            </label>
          </div>
          <button type="button" onClick={saveLog} className="btn btn-primary mt-4 w-full">
            Save Log
          </button>
        </div>
      </div>

      {logs.length ? (
        <div className="mt-6 grid gap-3">
          {logs.map((entry) => (
            <div key={entry.id} className="bg-surface-2 border border-border-subtle rounded-2xl px-4 py-3">
              <div className="flex items-center justify-between text-sm text-text-secondary">
                <span>Spice: <span className="font-mono text-brand">{entry.spiceLevel}</span></span>
                <span>Calories: <span className="font-mono text-brand">{entry.calories}</span></span>
              </div>
              <div className="text-xs text-text-tertiary mt-1">Fast: {entry.fastingWindow}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {entry.flavors.map((flavor) => (
                  <span key={flavor} className="badge badge-secondary">{flavor}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
