import React, { useMemo, useState } from 'react';
import { ThumbsDown, ThumbsUp, ShoppingBasket } from 'lucide-react';

const GROUP_ID = 'Flat-4B-Roommates';
const STORAGE_KEY = `foodybud_group_vote_${GROUP_ID}`;

const DEFAULT_RECIPES = [
  {
    id: 'dish-1',
    title: 'Smoky Harissa Chicken Bowl',
    ingredients: ['chicken thighs', 'harissa', 'yogurt', 'lemon', 'couscous', 'cucumber'],
  },
  {
    id: 'dish-2',
    title: 'Creamy Mushroom Orzo',
    ingredients: ['orzo', 'mushrooms', 'garlic', 'parmesan', 'parsley', 'cream'],
  },
  {
    id: 'dish-3',
    title: 'Citrus Chickpea Salad',
    ingredients: ['chickpeas', 'orange', 'spinach', 'olive oil', 'feta', 'mint'],
  },
];

const loadPersistedVotes = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const persistVotes = (votes) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
  } catch {
    // ignore persistence errors
  }
};

export default function HomeGroupVotingCanvas() {
  const [votes, setVotes] = useState(() => {
    const persisted = loadPersistedVotes();
    return persisted || DEFAULT_RECIPES.map((recipe) => ({
      ...recipe,
      choice: null,
      score: 0,
    }));
  });
  const [groceryList, setGroceryList] = useState([]);

  const pantryItems = useMemo(() => {
    const stored = localStorage.getItem('foodyBud_pantry');
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const isComplete = votes.every((item) => item.choice != null);
  const winner = useMemo(() => {
    if (!isComplete) return null;
    return [...votes].sort((a, b) => b.score - a.score)[0] || null;
  }, [isComplete, votes]);

  const handleVote = (id, direction) => {
    setVotes((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id) return item;
        const score = direction === 'up' ? 1 : -1;
        return { ...item, choice: direction, score };
      });
      persistVotes(next);
      return next;
    });
  };

  const generateGroceryList = () => {
    if (!winner) return;
    const pantrySet = new Set(pantryItems.map((item) => String(item).toLowerCase()));
    const needed = (winner.ingredients || []).filter(
      (item) => !pantrySet.has(String(item).toLowerCase())
    );
    setGroceryList(needed);
  };

  return (
    <section className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary font-bold">Home Group</p>
          <h2 className="text-2xl font-black font-display text-text-primary">{GROUP_ID} Voting Canvas</h2>
          <p className="text-sm text-text-secondary">Cast the final group vote for tonight.</p>
        </div>
      </div>

      {!winner ? (
        <div className="grid gap-4 md:grid-cols-3">
          {votes.map((item) => (
            <div key={item.id} className="bg-surface-2 rounded-2xl border border-border-subtle p-4">
              <div className="aspect-food-card rounded-xl bg-surface-3 border border-border-subtle" />
              <h3 className="mt-4 text-lg font-display font-bold text-text-primary">{item.title}</h3>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleVote(item.id, 'up')}
                  className={`btn btn-sm flex-1 ${item.choice === 'up' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <ThumbsUp className="w-4 h-4" /> Thumbs Up
                </button>
                <button
                  type="button"
                  onClick={() => handleVote(item.id, 'down')}
                  className={`btn btn-sm flex-1 ${item.choice === 'down' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <ThumbsDown className="w-4 h-4" /> Thumbs Down
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="bg-surface-2 rounded-2xl border border-border-subtle p-6">
            <div className="aspect-food-card rounded-xl bg-surface-3 border border-border-subtle" />
            <h3 className="mt-4 text-2xl font-display font-black text-text-primary">{winner.title}</h3>
            <p className="text-sm text-text-secondary mt-2">Top pick by the group.</p>
            <button
              type="button"
              onClick={generateGroceryList}
              className="btn btn-primary mt-4 flex items-center gap-2"
            >
              <ShoppingBasket className="w-4 h-4" /> Generate Shared Grocery List
            </button>
          </div>

          {groceryList.length ? (
            <div className="mt-4 bg-surface-2 rounded-2xl border border-border-subtle p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold">Needed Items</div>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                {groceryList.map((item) => (
                  <li key={item} className="flex items-center justify-between">
                    <span>{item}</span>
                    <span className="text-brand font-mono text-xs">add</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
