import React, { useEffect, useMemo, useState } from 'react';
import FeedPostCard from './FeedPostCard';
import { getDishImage, getWeekKey, storage } from '../services/foodybud';

const COMMUNITY_SEED = [
  { id: 'community-1', dishName: 'Chicken Karahi', cuisine: 'Desi/Pakistani', cookTime: '35 mins', rating: 4.8, caption: 'Smoky tomatoes with fresh ginger — tastes like home.', mood: 'Happy', author: 'Ayesha K.', imageKey: 'chicken-karahi' },
  { id: 'community-2', dishName: 'Nasi Lemak Bowl', cuisine: 'Southeast Asian', cookTime: '30 mins', rating: 4.6, caption: 'Coconut rice + sambal, kept mild for the family.', mood: 'Celebratory', author: 'Nur S.', imageKey: 'nasi-lemak' },
  { id: 'community-3', dishName: 'Jollof Rice', cuisine: 'Nigerian', cookTime: '40 mins', rating: 4.7, caption: 'Bold flavors, halal chicken on top.', mood: 'Energetic', author: 'Yusuf A.', imageKey: 'jollof-rice' },
  { id: 'community-4', dishName: 'Chicken Shawarma Plate', cuisine: 'Middle Eastern', cookTime: '25 mins', rating: 4.5, caption: 'Garlic sauce + crunchy salad, fast prep.', mood: 'Hungry', author: 'Mariam F.', imageKey: 'shawarma' },
  { id: 'community-5', dishName: 'Spiced Fish Tacos', cuisine: 'American', cookTime: '20 mins', rating: 4.4, caption: 'Halal-friendly tacos with lime crema.', mood: 'Happy', author: 'Omar J.', imageKey: 'fish-tacos' },
  { id: 'community-6', dishName: 'Butter Chicken Light', cuisine: 'Indian', cookTime: '35 mins', rating: 4.9, caption: 'Creamy but balanced — perfect for meal prep.', mood: 'Relaxed', author: 'Hina R.', imageKey: 'butter-chicken' },
  { id: 'community-7', dishName: 'Beef Stir Fry', cuisine: 'Chinese', cookTime: '20 mins', rating: 4.3, caption: 'High protein, quick wok heat, no alcohol sauces.', mood: 'Energetic', author: 'Imran L.', imageKey: 'beef-stir-fry' }
];

const getCommunityPosts = () => {
  const existing = storage.get('communityFeed', []);
  if (existing.length) return existing;
  const seeded = COMMUNITY_SEED.map((post) => ({
    ...post,
    imageUrl: getDishImage(post.imageKey, post.cuisine || 'Food'),
    likeCount: Math.floor(Math.random() * 120) + 20,
    createdAt: new Date().toISOString()
  }));
  storage.set('communityFeed', seeded);
  return seeded;
};

const getAutoPostsFromWeeks = () => {
  const posts = [];
  for (let i = 0; i < 8; i += 1) {
    const date = new Date(Date.now() - i * 7 * 86400000);
    const weekKey = getWeekKey(date);
    const weekData = storage.get(weekKey, null);
    if (!weekData?.meals?.length) continue;
    weekData.meals.forEach((meal, index) => {
      posts.push({
        id: `auto-${weekKey}-${index}`,
        dishName: meal.name || 'Home Cooked Meal',
        cuisine: meal.cuisine || 'Food',
        cookTime: meal.cookTime || '30 mins',
        rating: 4.7,
        caption: 'Cooked this recently with FoodyBud — easy and satisfying.',
        mood: 'Happy',
        author: 'You',
        imageUrl: getDishImage(meal.name || 'home-cook', meal.cuisine || 'Food'),
        createdAt: meal.cookedAt || new Date().toISOString(),
        likeCount: Math.floor(Math.random() * 30)
      });
    });
  }
  return posts;
};

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState('community');
  const [communityPosts, setCommunityPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);

  useEffect(() => {
    setCommunityPosts(getCommunityPosts());
    const saved = storage.get('myFeedPosts', []);
    const autoPosts = getAutoPostsFromWeeks();
    const combined = [...saved, ...autoPosts.filter((post) => !saved.find((savedPost) => savedPost.id === post.id))];
    setMyPosts(combined);
  }, []);

  const feedPosts = useMemo(() => {
    return activeTab === 'community' ? communityPosts : myPosts;
  }, [activeTab, communityPosts, myPosts]);

  return (
    <div className="container py-8 screen-enter pb-24">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">Feed</p>
          <h1 className="text-3xl font-black font-display">Friends Recipe Feed</h1>
          <p className="text-sm text-text-secondary mt-1">Share and remix halal meals from the community.</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => setActiveTab('community')} className={`chip ${activeTab === 'community' ? 'active' : ''}`}>Community</button>
        <button onClick={() => setActiveTab('my')} className={`chip ${activeTab === 'my' ? 'active' : ''}`}>My Posts</button>
      </div>

      {feedPosts.length === 0 ? (
        <div className="card bg-surface-2 text-text-tertiary">No posts yet. Cook a meal and share it to the feed.</div>
      ) : (
        <div className="grid gap-4">
          {feedPosts.map((post) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
