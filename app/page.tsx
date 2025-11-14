'use client';

import { useState, useEffect } from 'react';
import Login from './components/Login';
import Spreadsheet from './components/Spreadsheet';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedAuth = localStorage.getItem('excelProAuth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setUserEmail(authData.email);
    }
  }, []);

  const handleLogin = (email: string, password: string) => {
    // Save authentication to localStorage
    const authData = {
      email,
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem('excelProAuth', JSON.stringify(authData));
    setIsAuthenticated(true);
    setUserEmail(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('excelProAuth');
    setIsAuthenticated(false);
    setUserEmail('');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <main className="h-screen w-screen overflow-hidden">
      <Spreadsheet onLogout={handleLogout} userEmail={userEmail} />
    </main>
  );
}

