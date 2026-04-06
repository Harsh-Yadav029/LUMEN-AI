import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import App          from './pages/App.jsx';
import LandingPage  from './pages/LandingPage.jsx';
import LoginPage    from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import './index.css';

function Root() {
  const { user } = useAuth();
  const [page, setPage] = useState('landing');

  // Loading
  if (user === undefined) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg-primary">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse-dot" />
      </div>
    );
  }

  // Authenticated → app
  if (user) return <App />;

  // Unauthenticated routing
  if (page === 'landing')  return <LandingPage  goToLogin={() => setPage('login')} goToRegister={() => setPage('register')} />;
  if (page === 'register') return <RegisterPage goToLogin={() => setPage('login')} />;
  return <LoginPage goToRegister={() => setPage('register')} goToLanding={() => setPage('landing')} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>
);
