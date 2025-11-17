'use client';

import { useState, useEffect } from 'react';
import Login from './components/Login';
import Spreadsheet from './components/Spreadsheet';
import AdminPanel from './components/AdminPanel';

type ViewMode = 'spreadsheet' | 'admin';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('spreadsheet');

  // Check if user is admin based on email
  const checkAdminStatus = (email: string): boolean => {
    // Admin detection: email contains "admin" or ends with "@admin.excelpro.com"
    return email.toLowerCase().includes('admin') || email.toLowerCase().endsWith('@admin.excelpro.com');
  };

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedAuth = localStorage.getItem('excelProAuth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setUserEmail(authData.email);
      const adminStatus = checkAdminStatus(authData.email);
      setIsAdmin(adminStatus);
      // If admin, default to admin panel, otherwise spreadsheet
      setCurrentView(adminStatus ? 'admin' : 'spreadsheet');
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
    const adminStatus = checkAdminStatus(email);
    setIsAdmin(adminStatus);
    // If admin, default to admin panel, otherwise spreadsheet
    setCurrentView(adminStatus ? 'admin' : 'spreadsheet');
  };

  const handleLogout = () => {
    localStorage.removeItem('excelProAuth');
    setIsAuthenticated(false);
    setUserEmail('');
    setIsAdmin(false);
    setCurrentView('spreadsheet');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <main className="h-screen w-screen overflow-hidden">
      {currentView === 'admin' && isAdmin ? (
        <AdminPanel
          onLogout={handleLogout}
          userEmail={userEmail}
          onNavigateToSpreadsheet={() => setCurrentView('spreadsheet')}
        />
      ) : (
        <Spreadsheet
          onLogout={handleLogout}
          userEmail={userEmail}
          onNavigateToAdmin={isAdmin ? () => setCurrentView('admin') : undefined}
        />
      )}
    </main>
  );
}

