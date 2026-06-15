import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { storage } from '../services/foodybud';

const getSessionId = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('vote');
};

export default function VotingScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const sessionId = useMemo(() => getSessionId(), [location.search]);
  const formatOneDecimal = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    const rounded = Math.round(number * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };

  useEffect(() => {
    if (!sessionId) return;
    const value = storage.get(`vote_${sessionId}`, null);
    setSession(value);
  }, [sessionId]);

  const castVote = (dishName) => {
    if (!session) return;
    const next = {
      ...session,
      dishes: session.dishes.map((dish) => {
        if (dish.name !== dishName) return dish;
        const voterId = `v_${Date.now()}`;
        if (dish.voters?.includes(voterId)) return dish;
        return { ...dish, votes: (dish.votes || 0) + 1, voters: [...(dish.voters || []), voterId] };
      }),
    };
    storage.set(`vote_${sessionId}`, next);
    setSession(next);
  };

  if (!sessionId) {
    return null;
  }

  if (!session) {
    return (
      <div className="container py-20 text-center animate-fade-in">
        <h1 className="text-3xl font-black mb-4 font-display">Voting session not found</h1>
        <button onClick={() => navigate('/')} className="btn btn-primary">Go Home</button>
      </div>
    );
  }

  const winner = [...session.dishes].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];

  return (
    <div className="container py-8 space-y-6 animate-fade-in">
      <div className="card">
        <p className="text-sm uppercase tracking-[0.3em] text-text-tertiary font-bold">Family Consensus Mode</p>
        <h1 className="text-2xl sm:text-3xl font-black mt-2 font-display">Vote with the family</h1>
        <p className="text-text-secondary mt-2">Majority wins. Session expires in 1 hour.</p>
      </div>

      <div className="grid gap-4">
        {session.dishes.map((dish) => (
          <div key={dish.name} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold font-display">{dish.name}</h3>
              <p className="text-sm text-text-secondary font-medium">{dish.time || '—'} · {dish.orderCost != null ? `Rs. ${formatOneDecimal(dish.orderCost)}` : ''}</p>
            </div>
            <button onClick={() => castVote(dish.name)} className="btn btn-primary w-full sm:w-auto shadow-brand">Vote for this</button>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-2xl font-black mb-4 font-display">Live Results</h2>
        <div className="space-y-4">
          {session.dishes.map((dish) => (
            <div key={dish.name}>
              <div className="flex justify-between text-sm mb-2 font-medium"><span>{dish.name}</span><span>{dish.votes || 0} votes</span></div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, ((dish.votes || 0) / Math.max(1, winner.votes || 1)) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('/results')}
            className="btn btn-secondary flex-1"
          >
            Back to Results
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="btn btn-primary flex-1 shadow-brand"
          >
            Close & Cook Winner
          </button>
        </div>
      </div>
    </div>
  );
}
