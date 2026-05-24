import React, { useMemo, useState } from 'react';
import { CalendarCheck, Flame, Target } from 'lucide-react';

const STORAGE_KEY = 'foodybud_macro_goals';
const LOG_KEY = 'foodybud_macro_log';

const DEFAULT_GOALS = {
  calories: 2000,
  protein: 140,
  carbs: 220,
  fats: 60,
};

const loadGoals = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return parsed ? { ...DEFAULT_GOALS, ...parsed } : DEFAULT_GOALS;
  } catch {
    return DEFAULT_GOALS;
  }
};

const loadLog = () => {
  try {
    const stored = localStorage.getItem(LOG_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function NutritionStreaksGoals() {
  const [goals, setGoals] = useState(loadGoals);
  const [log, setLog] = useState(loadLog);
  const [draft, setDraft] = useState(goals);

  const weeklyTotals = useMemo(() => {
    return log.slice(-7).reduce(
      (acc, entry) => ({
        calories: acc.calories + (entry.calories || 0),
        protein: acc.protein + (entry.protein || 0),
        carbs: acc.carbs + (entry.carbs || 0),
        fats: acc.fats + (entry.fats || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [log]);

  const streak = useMemo(() => {
    return log.slice(-7).filter((entry) => entry.completed).length;
  }, [log]);

  const handleSaveGoals = () => {
    const next = {
      calories: Number(draft.calories || 0),
      protein: Number(draft.protein || 0),
      carbs: Number(draft.carbs || 0),
      fats: Number(draft.fats || 0),
    };
    setGoals(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const logToday = () => {
    const entry = {
      date: new Date().toISOString(),
      calories: Math.round(goals.calories * 0.9),
      protein: Math.round(goals.protein * 0.95),
      carbs: Math.round(goals.carbs * 0.85),
      fats: Math.round(goals.fats * 0.9),
      completed: true,
    };
    const next = [...log, entry].slice(-30);
    setLog(next);
    localStorage.setItem(LOG_KEY, JSON.stringify(next));
  };

  const macroRows = [
    { key: 'calories', label: 'Calories', text: 'text-macro-calories', bg: 'bg-macro-calories' },
    { key: 'protein', label: 'Protein', text: 'text-macro-protein', bg: 'bg-macro-protein' },
    { key: 'carbs', label: 'Carbs', text: 'text-macro-carbs', bg: 'bg-macro-carbs' },
    { key: 'fats', label: 'Fats', text: 'text-macro-fats', bg: 'bg-macro-fats' },
  ];

  return (
    <section className="bg-surface rounded-3xl border border-border-subtle p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary font-bold">Nutrition</p>
          <h2 className="text-2xl font-display font-black text-text-primary">Streaks + Weekly Goals</h2>
          <p className="text-sm text-text-secondary">Track macro targets and keep the streak alive.</p>
        </div>
        <div className="flex gap-2">
          <span className="chip flex items-center gap-2">
            <Flame className="w-4 h-4" />
            <span className="font-mono">{streak} day streak</span>
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-surface-2 rounded-2xl border border-border-subtle p-4">
          <div className="flex items-center gap-2 mb-4 text-text-primary font-semibold">
            <Target className="w-4 h-4 text-brand" /> Weekly Macro Targets
          </div>
          <div className="grid grid-cols-2 gap-3">
            {macroRows.map((row) => (
              <label key={row.key} className="text-xs font-semibold text-text-secondary">
                {row.label}
                <input
                  className="input mt-1 font-mono"
                  value={draft[row.key]}
                  onChange={(event) => setDraft((prev) => ({ ...prev, [row.key]: event.target.value }))}
                />
              </label>
            ))}
          </div>
          <button type="button" onClick={handleSaveGoals} className="btn btn-secondary mt-4">
            Save Goals
          </button>
        </div>

        <div className="bg-surface-2 rounded-2xl border border-border-subtle p-4">
          <div className="flex items-center gap-2 mb-4 text-text-primary font-semibold">
            <CalendarCheck className="w-4 h-4 text-brand" /> Weekly Progress
          </div>
          <div className="space-y-3">
            {macroRows.map((row) => {
              const total = weeklyTotals[row.key];
              const target = goals[row.key] * 7 || 1;
              const percent = Math.min(100, Math.round((total / target) * 100));
              return (
                <div key={row.key}>
                  <div className="flex items-center justify-between text-xs text-text-tertiary font-semibold mb-2">
                    <span>{row.label}</span>
                    <span className="font-mono">{Math.round(total)} / {target}</span>
                  </div>
                  <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                    <div className={`h-2 ${row.bg}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={logToday} className="btn btn-primary mt-4 w-full">
            Log Today
          </button>
        </div>
      </div>
    </section>
  );
}
