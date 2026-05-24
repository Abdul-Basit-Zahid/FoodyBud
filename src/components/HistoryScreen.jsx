import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RecipeModal from './RecipeModal';
import { Clock } from 'lucide-react';
import { getDishImage, storage } from '../services/foodybud';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setHistory(storage.get('history', JSON.parse(localStorage.getItem('moodMealHistory') || '[]')));
  }, []);

  return (
    <div className="container py-8 screen-enter">
      <div className="flex items-center gap-3 mb-6 sm:mb-8 border-b border-border-subtle pb-4">
        <Clock className="w-8 h-8 text-text-brand" />
        <h1 className="text-3xl font-black font-display">Your Meal History</h1>
      </div>

      {history.length === 0 ? (
        <div className="card text-center py-12">
          <h2 className="text-2xl font-bold text-text-secondary mb-4">No meals saved yet.</h2>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Find a Meal
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {history.map((dish, idx) => (
            <div 
              key={idx} 
              className="dish-card stagger-1" 
              onClick={() => setSelectedRecipe(dish)}
            >
              <div className="dish-card-image" style={{ height: '140px' }}>
                <img 
                  src={dish.imageUrl || getDishImage(dish.name, dish.cuisine || 'Food')} 
                  alt={dish.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-modal to-transparent"></div>
                <div className="absolute bottom-3 left-3 text-text-inverse text-xs font-semibold bg-modal px-2 py-1 rounded backdrop-blur-md">
                  {dish.dateEaten || 'Unknown date'}
                </div>
              </div>
              <div className="dish-card-body">
                <h3 className="dish-name line-clamp-1">{dish.name}</h3>
                <p className="text-sm text-text-secondary line-clamp-2">
                  {dish.whyThisMood}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          currency="PKR" /* Fallback if not tracked per recipe */
          onClose={() => setSelectedRecipe(null)} 
          onSave={() => {}} /* Already in history */
        />
      )}
    </div>
  );
}
