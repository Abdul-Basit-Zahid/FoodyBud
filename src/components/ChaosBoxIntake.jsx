import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const TagInput = ({ label, helper, value, onAdd, onRemove, variant }) => {
  const [draft, setDraft] = useState('');

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft('');
  };

  return (
    <div className={`rounded-2xl border p-4 ${variant}`}>
      <p className="text-sm font-semibold text-text-primary">{label}</p>
      <p className="text-xs text-text-tertiary mt-1">{helper}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {value.map((tag) => (
          <span key={tag} className="chip flex items-center gap-2">
            {tag}
            <button type="button" onClick={() => onRemove(tag)} className="text-text-tertiary">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type and press add"
          className="input flex-1"
        />
        <button type="button" onClick={handleAdd} className="btn btn-secondary">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
    </div>
  );
};

export default function ChaosBoxIntake({ onSubmit }) {
  const [mustUse, setMustUse] = useState([]);
  const [canUse, setCanUse] = useState([]);

  const addMustUse = (tag) => setMustUse((prev) => [...new Set([...prev, tag])]);
  const addCanUse = (tag) => setCanUse((prev) => [...new Set([...prev, tag])]);

  const removeMustUse = (tag) => setMustUse((prev) => prev.filter((item) => item !== tag));
  const removeCanUse = (tag) => setCanUse((prev) => prev.filter((item) => item !== tag));

  const handleSubmit = () => {
    const payload = {
      mustUse,
      canUse,
      query: [...mustUse, ...canUse],
    };
    if (onSubmit) onSubmit(payload);
  };

  return (
    <section className="bg-surface rounded-3xl border border-border-subtle p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary font-bold">Chaos Box</p>
        <h2 className="text-2xl font-display font-black text-text-primary">Two-Tier Pantry Intake</h2>
        <p className="text-sm text-text-secondary">Feed FoodyBud with priority and standby ingredients.</p>
      </div>

      <div className="grid gap-4">
        <TagInput
          label="Tier A: Must-Use Expiring"
          helper="High priority ingredients that must be cooked first."
          value={mustUse}
          onAdd={addMustUse}
          onRemove={removeMustUse}
          variant="border-error bg-surface"
        />
        <TagInput
          label="Tier B: Can-Use Pantry"
          helper="Standard items that can support the meal."
          value={canUse}
          onAdd={addCanUse}
          onRemove={removeCanUse}
          variant="border-border-subtle bg-surface-2"
        />
      </div>

      <button type="button" onClick={handleSubmit} className="btn btn-primary w-full mt-6">
        Build Meal Query
      </button>
    </section>
  );
}
