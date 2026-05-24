import React, { useMemo, useState } from 'react';
import { CalendarDays, ListChecks } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RECIPES = [
  { id: 'mc-1', title: 'High-Protein Bowl', protein: 45, carbs: 40, fats: 18, ingredients: ['chicken', 'rice', 'spinach'] },
  { id: 'mc-2', title: 'Fiber-Packed Lentils', protein: 28, carbs: 55, fats: 10, ingredients: ['lentils', 'tomato', 'cumin'] },
  { id: 'mc-3', title: 'Lean Turkey Skillet', protein: 38, carbs: 20, fats: 12, ingredients: ['turkey', 'zucchini', 'garlic'] },
];

const STORAGE_KEY = 'foodybud_macros_plan';

const loadPlan = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return parsed && parsed.days ? parsed : null;
  } catch {
    return null;
  }
};

export default function MacrosChefMealPlanChef() {
  const [plan, setPlan] = useState(loadPlan());
  const [targets, setTargets] = useState({ protein: 140, carbs: 220, fats: 60 });

  const generatePlan = () => {
    const next = {
      days: DAYS.map((day, index) => ({ day, recipe: RECIPES[index % RECIPES.length] })),
    };
    setPlan(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const groceryList = useMemo(() => {
    if (!plan) return [];
    const items = plan.days.flatMap((entry) => entry.recipe.ingredients);
    return [...new Set(items)];
  }, [plan]);

  return (
    <section className="bg-surface rounded-3xl border border-border-subtle p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary font-bold">MacrosChef</p>
          <h2 className="text-2xl font-display font-black text-text-primary">Weekly Macro Scheduler</h2>
          <p className="text-sm text-text-secondary">Structured schedules bound to fitness targets.</p>
        </div>
        <button type="button" onClick={generatePlan} className="btn btn-primary">
          Generate Week
        </button>
      </div>

      <div className="bg-surface-2 border border-border-subtle rounded-2xl p-4 mb-6">
        <div className="text-sm font-semibold text-text-primary mb-3">Macro Targets</div>
        <div className="grid grid-cols-3 gap-3">
          {['protein', 'carbs', 'fats'].map((key) => (
            <label key={key} className="text-xs text-text-tertiary">
              {key}
              <input
                className="input mt-1 font-mono"
                value={targets[key]}
                onChange={(event) => setTargets((prev) => ({ ...prev, [key]: event.target.value }))}
              />
            </label>
          ))}
        </div>
      </div>

      {plan ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-surface-2 border border-border-subtle rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4 text-text-primary font-semibold">
              <CalendarDays className="w-4 h-4 text-brand" /> Weekly Schedule
            </div>
            <div className="space-y-2">
              {plan.days.map((entry) => (
                <div key={entry.day} className="flex items-center justify-between bg-surface rounded-xl border border-border-subtle px-3 py-2">
                  <span className="text-sm font-semibold text-text-primary">{entry.day}</span>
                  <span className="text-sm text-text-secondary">{entry.recipe.title}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-2 border border-border-subtle rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4 text-text-primary font-semibold">
              <ListChecks className="w-4 h-4 text-brand" /> Unified Grocery List
            </div>
            <div className="grid gap-2">
              {groceryList.map((item) => (
                <div key={item} className="flex items-center justify-between bg-surface rounded-xl border border-border-subtle px-3 py-2">
                  <span className="text-sm text-text-primary">{item}</span>
                  <span className="text-xs font-mono text-brand">need</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-text-tertiary">Generate a plan to view schedule and grocery list.</div>
      )}
    </section>
  );
}
