import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import InputScreen from './components/InputScreen';
import HomeScreen from './components/HomeScreen';
import ResultsScreen from './components/ResultsScreen';
import HistoryScreen from './components/HistoryScreen';
import ProfileScreen from './components/ProfileScreen';
import VotingScreen from './components/VotingScreen';
import PlannerScreen from './components/PlannerScreen';
import SmartCartModal from './components/SmartCartModal';
import { logMoodSearch, clearImageSession } from './services/foodybud';
import { getCartCount } from './services/groceryCart';

function AppContent() {
  const [showCart, setShowCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    const savedTheme = window.localStorage.getItem('foodyBud_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('foodyBud_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (location.pathname === '/') {
      clearImageSession();
    }
  }, [location.pathname]);

  useEffect(() => {
    const updateCart = () => setCartCount(getCartCount());
    updateCart();
    window.addEventListener('foodybud-cart-update', updateCart);
    return () => window.removeEventListener('foodybud-cart-update', updateCart);
  }, []);

  const handleSearch = (searchParams) => {
    logMoodSearch({ mood: searchParams?.mood, cuisine: searchParams?.cuisine });
    return true; // Proceed with search
  };

  const navItems = [
    { path: '/', label: 'Home', icon: '⌂' },
    { path: '/search', label: 'Search', icon: '◎' },
    { path: '/planner', label: 'Planner', icon: '▦' },
  ];

  return (
    <div className="min-h-screen bg-base text-text-primary font-sans flex flex-col relative overflow-x-hidden app-wrapper">

      <header className="sticky top-0 z-40 border-b border-border-subtle bg-overlay/90 backdrop-blur-xl">
        <div className="container py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="flex items-center gap-3 text-left"
              onClick={() => navigate('/')}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-text-inverse shadow-brand" style={{ background: 'var(--gradient-brand)' }}>
                <span className="font-display text-xl leading-none">🍴</span>
              </div>
              <div>
                <div className="font-display text-2xl font-semibold tracking-tight text-text-primary">FoodyBud</div>
                <div className="text-xs uppercase tracking-[0.35em] text-text-tertiary">Warm. Premium. Alive.</div>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{
                  width: '44px',
                  height: '26px',
                  borderRadius: 'var(--radius-full)',
                  background: theme === 'dark' ? 'var(--gradient-brand)' : 'var(--border-default)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'var(--transition-base)'
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: '3px',
                  left: theme === 'dark' ? '21px' : '3px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'var(--transition-spring)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px'
                }}>
                  {theme === 'dark' ? '🌙' : '☀️'}
                </span>
              </button>
              <button onClick={() => navigate('/search')} className="btn btn-secondary btn-sm hidden sm:inline-flex">
                Find a Meal
              </button>
              <button onClick={() => navigate('/planner')} className="btn btn-secondary btn-sm hidden sm:inline-flex">
                Planner
              </button>
              <button onClick={() => navigate('/profile')} className="btn btn-secondary btn-sm hidden sm:inline-flex">
                Dashboard
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm relative"
                onClick={() => setShowCart(true)}
              >
                🛒 Cart
                {cartCount > 0 ? (
                  <span className="absolute -top-2 -right-2 bg-success text-text-inverse text-xs rounded-full px-2 py-0.5">
                    {cartCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-24 md:pb-8">
        {new URLSearchParams(location.search).get('vote') ? (
          <VotingScreen />
        ) : null}
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/search" element={<InputScreen onSearch={handleSearch} />} />
          <Route path="/results" element={<ResultsScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/planner" element={<PlannerScreen />} />
        </Routes>
      </main>

      <nav className="bottom-nav md:hidden">
        {navItems.map((item) => {
          const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              type="button"
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {showCart ? (
        <SmartCartModal onClose={() => setShowCart(false)} />
      ) : null}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
