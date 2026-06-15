import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, LayoutGrid, ListChecks, Sparkles } from 'lucide-react';

export default function HomeScreen() {
  const navigate = useNavigate();

  const primaryCards = [
    {
      title: 'Find a Meal',
      description: 'Start with mood, cuisine, and budget.',
      action: () => navigate('/search'),
      icon: <Sparkles className="w-4 h-4 text-text-brand" />,
    },
    {
      title: 'Weekly Planner',
      description: 'Build your meal calendar and grocery list.',
      action: () => navigate('/planner'),
      icon: <ListChecks className="w-4 h-4 text-text-brand" />,
    },
    {
      title: 'Dashboard',
      description: 'Track nutrition, streaks, and household stats.',
      action: () => navigate('/profile'),
      icon: <LayoutGrid className="w-4 h-4 text-text-brand" />,
    },
  ];

  const secondaryCards = [
    {
      title: 'Meal History',
      description: 'Revisit what you cooked and loved.',
      action: () => navigate('/history'),
      icon: <Home className="w-4 h-4 text-text-tertiary" />,
    },
  ];

  return (
    <div className="container py-8 space-y-8 screen-enter pb-24">
      <div className="card">
        <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary font-bold">Home</p>
        <h1 className="text-3xl font-display font-black text-text-primary mt-2">Welcome to FoodyBud</h1>
        <p className="text-sm text-text-secondary mt-2">Pick a path and keep the flow clean.</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-display font-black text-text-primary">Start Here</h2>
        </div>
        <div className="flex flex-col gap-3">
          {primaryCards.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={card.action}
              className="flex items-center gap-4 bg-surface-2 border border-border-subtle rounded-2xl p-4 hover:shadow-card-hover transition-base w-full text-left"
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-surface shadow-sm">
                {card.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-text-primary">{card.title}</h3>
                <p className="text-sm text-text-secondary mt-0.5">{card.description}</p>
              </div>
              <div className="flex-shrink-0 text-text-tertiary">
                →
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-display font-black text-text-primary">More</h2>
        </div>
        <div className="flex flex-col gap-3">
          {secondaryCards.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={card.action}
              className="flex items-center gap-4 bg-surface-2 border border-border-subtle rounded-2xl p-4 hover:shadow-card-hover transition-base w-full text-left"
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-surface shadow-sm">
                {card.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-text-primary">{card.title}</h3>
                <p className="text-sm text-text-secondary mt-0.5">{card.description}</p>
              </div>
              <div className="flex-shrink-0 text-text-tertiary">
                →
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
