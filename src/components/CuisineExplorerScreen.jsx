import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCuisinesTried } from '../services/foodybud';

const CUISINES = [
  'Desi/Pakistani',
  'Indian',
  'Chinese',
  'Italian',
  'Mexican',
  'American',
  'Middle Eastern',
  'Thai',
  'Continental',
];

export default function CuisineExplorerScreen() {
  const navigate = useNavigate();
  const tried = getCuisinesTried();
  const unlockCount = tried.length;

  const cuisineCards = useMemo(() => {
    return CUISINES.map((cuisine) => ({
      cuisine,
      unlocked: tried.includes(cuisine),
    }));
  }, [tried]);

  return (
    <div className="container py-8 screen-enter pb-24">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">Explorer</p>
          <h1 className="text-3xl font-black font-display">Cuisine Explorer</h1>
          <p className="text-sm text-text-secondary mt-1">Unlock cuisines by completing Chef Mode sessions.</p>
        </div>
        <button onClick={() => navigate('/profile')} className="btn btn-secondary btn-sm">Back</button>
      </div>

      <div className="explorer-hero">
        <div className="text-4xl font-black font-display">{unlockCount} / {CUISINES.length}</div>
        <div className="text-sm text-text-secondary">Cuisines unlocked</div>
      </div>

      <div className="explorer-grid">
        {cuisineCards.map((item) => (
          <div key={item.cuisine} className={`explorer-card ${item.unlocked ? 'unlocked' : 'locked'}`}>
            <div className="explorer-card-title">{item.cuisine}</div>
            <div className="explorer-card-status">
              {item.unlocked ? 'Unlocked' : 'Locked'}
            </div>
            {!item.unlocked ? <div className="explorer-card-lock">🔒</div> : <div className="explorer-card-lock">✨</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
