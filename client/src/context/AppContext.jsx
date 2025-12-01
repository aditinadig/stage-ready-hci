import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [team, setTeam] = useState(null);
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedTeam = localStorage.getItem('stageready_team');
    const savedUser = localStorage.getItem('stageready_user');
    
    if (savedTeam) {
      try {
        setTeam(JSON.parse(savedTeam));
      } catch (e) {
        console.error('Error loading team from localStorage:', e);
      }
    }
    
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error loading user from localStorage:', e);
      }
    }
  }, []);

  // Save to localStorage when team/user changes
  useEffect(() => {
    if (team) {
      localStorage.setItem('stageready_team', JSON.stringify(team));
    } else {
      localStorage.removeItem('stageready_team');
    }
  }, [team]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('stageready_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('stageready_user');
    }
  }, [user]);

  const clearSession = () => {
    setTeam(null);
    setUser(null);
    localStorage.removeItem('stageready_team');
    localStorage.removeItem('stageready_user');
  };

  const showNotification = (message) => {
    setNotification({ message, id: Date.now() });
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return (
    <AppContext.Provider value={{ 
      team, setTeam, 
      user, setUser, 
      clearSession,
      notification,
      showNotification,
      hideNotification
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

