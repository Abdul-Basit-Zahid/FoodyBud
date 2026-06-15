import React, { useMemo, useState } from 'react';
import { Plus, Sparkles, X } from 'lucide-react';


export default function FridgeToPlate() {
  const [tags, setTags] = useState([]);
  const [draft, setDraft] = useState('');
  const [results, setResults] = useState([]);

  const canGenerate = tags.length >= 2 && tags.length <= 5;

  const matches = useMemo(() => {
    if (!results.length) return [];
    return results.map((recipe) => ({
      ...recipe,
      hitCount: recipe.ingredients.filter((item) => tags.includes(item)).length,
    }));
  }, [results, tags]);

  const addTag = () => {
    const next = draft.trim().toLowerCase();
    if (!next || tags.includes(next) || tags.length >= 5) return;
    setTags((prev) => [...prev, next]);
    setDraft('');
  };

  const removeTag = (tag) => setTags((prev) => prev.filter((item) => item !== tag));

  const generate = () => {
    if (!canGenerate) return;
    setResults([]);
  };

  return (
    <section className="bg-surface rounded-3xl border border-border-subtle p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary font-bold">Fridge-to-Plate</p>
        <h2 className="text-2xl font-display font-black text-text-primary">2-5 Ingredients</h2>
        <p className="text-sm text-text-secondary">Instant recipe ideas from what you have.</p>
      </div>

      <div className="bg-surface-2 border border-border-subtle rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="chip flex items-center gap-2">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="text-text-tertiary">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="input flex-1"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add ingredient"
          />
          <button type="button" onClick={addTag} className="btn btn-secondary">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={!canGenerate}
          className="btn btn-primary mt-4 w-full"
        >
          <Sparkles className="w-4 h-4" /> Generate Recipes
        </button>
        {!canGenerate ? (
          <p className="text-xs text-text-tertiary mt-2">Add 2 to 5 ingredients to continue.</p>
        ) : null}
      </div>

      {matches.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3 animate-fade-in">
          {matches.map((recipe) => (
            <div key={recipe.id} className="bg-surface-2 border border-border-subtle rounded-2xl p-4">
              <div className="aspect-food-card rounded-xl bg-surface-3 border border-border-subtle" />
              <h3 className="mt-4 text-lg font-display font-bold text-text-primary">{recipe.title}</h3>
              <p className="text-xs text-text-tertiary mt-2">Matches: <span className="font-mono text-brand">{recipe.hitCount}</span></p>
              <div className="mt-3 flex flex-wrap gap-2">
                {recipe.ingredients.map((item) => (
                  <span key={item} className="badge badge-secondary">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 text-sm text-text-tertiary">No recipes yet. Coming soon.</div>
      )}
    </section>
  );
}
