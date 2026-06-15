import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../services/foodybud';

const getInitials = (name = '') => {
  const parts = String(name).trim().split(' ').filter(Boolean);
  if (!parts.length) return 'FB';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export default function FeedPostCard({ post }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(() => {
    const likes = storage.get('feedLikes', {});
    return Boolean(likes[post.id]);
  });

  const likeCount = useMemo(() => {
    const base = Number(post.likeCount || 0);
    return liked ? base + 1 : base;
  }, [liked, post.likeCount]);

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    const likes = storage.get('feedLikes', {});
    storage.set('feedLikes', { ...likes, [post.id]: next });
  };

  const handleRemix = () => {
    navigate('/results', {
      state: {
        mood: post.mood || 'Happy',
        cuisine: post.cuisine || 'Desi/Pakistani',
        budget: '1000',
        currency: 'PKR',
        diets: [],
        mealType: 'Dinner',
        leftovers: '',
        timeLimit: '30 mins',
        goalMode: 'maintain',
        chefStyle: '',
        allergies: '',
        dailyTarget: null,
        mealTarget: null,
        householdProfiles: []
      }
    });
  };

  const handleShare = async () => {
    const link = `${window.location.origin}/feed?post=${post.id}`;
    await copyToClipboard(link);
    alert('Link copied to clipboard.');
  };

  return (
    <div className="card bg-surface">
      <img
        src={post.imageUrl}
        alt={post.dishName}
        className="w-full h-40 object-cover rounded-2xl"
        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop'; }}
      />

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-surface-2 border border-border-subtle flex items-center justify-center text-sm font-bold">
            {getInitials(post.author || 'Foody Bud')}
          </div>
          <div>
            <div className="font-semibold text-text-primary">{post.author || 'Foody Bud'}</div>
            <div className="text-xs text-text-tertiary">{post.cuisine}</div>
          </div>
        </div>
        <span className="badge badge-secondary">⏱️ {post.cookTime || '30 mins'}</span>
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-bold font-display">{post.dishName}</h3>
          <span className="badge badge-success">★ {post.rating || 4.6}</span>
        </div>
        <p className="text-sm text-text-secondary mt-2 line-clamp-2">{post.caption}</p>
      </div>

      <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
        <button onClick={handleLike} className={`btn btn-sm ${liked ? 'btn-primary' : 'btn-secondary'}`}>
          {liked ? '❤️' : '🤍'} {likeCount}
        </button>
        <button onClick={handleRemix} className="btn btn-sm btn-secondary">Remix this</button>
        <button onClick={handleShare} className="btn btn-sm btn-ghost">Share</button>
      </div>
    </div>
  );
}
