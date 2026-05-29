import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/audit';

interface AuthContextType {
  user: User | null;
  token: string | null;
  usersList: User[];
  login: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  addUser: (newUser: Omit<User, 'id'>) => User;
  deleteUser: (id: string) => void;
  updateUserRole: (id: string, role: UserRole) => void;
  failedLoginCount: number;
  lockUntilTimestamp: number | null;
  lastActivityTimestamp: number;
  resetAttempts: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SEED_USERS: User[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    role: 'ADMIN',
    name: 'Anna S.D. Wibowo',
    email: 'annasdianwibowo02@gmail.com',
    opd: 'Dinas Komunikasi dan Informatika'
  },
  {
    id: 'usr-auditor-1',
    username: 'auditor1',
    role: 'AUDITOR',
    name: 'Agus Sutriatno',
    email: 'agus@pemda.go.id',
    opd: 'Dinas Komunikasi dan Informatika'
  },
  {
    id: 'usr-viewer-1',
    username: 'opd1',
    role: 'AUDITEE',
    name: 'Hanifah Khairunisa',
    email: 'hanifah@pemda.go.id',
    opd: 'Badan Kepegawaian Daerah'
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 1. Core Brute Force & Session metrics initializers
  const [failedLoginCount, setFailedLoginCount] = useState<number>(() => {
    const saved = localStorage.getItem('failedLoginCount');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [lockUntilTimestamp, setLockUntilTimestamp] = useState<number | null>(() => {
    const saved = localStorage.getItem('lockUntilTimestamp');
    if (saved) {
      const ts = parseInt(saved, 10);
      if (Date.now() < ts) {
        return ts;
      } else {
        localStorage.removeItem('lockUntilTimestamp');
        localStorage.setItem('failedLoginCount', '0');
        localStorage.setItem('loginAttempts', '0');
        return null;
      }
    }
    return null;
  });

  const [lastActivityTimestamp, setLastActivityTimestamp] = useState<number>(() => {
    const saved = localStorage.getItem('lastActivityTimestamp');
    return saved ? parseInt(saved, 10) : Date.now();
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('satria_auth_token');
  });

  const [user, setUser] = useState<User | null>(() => {
    const savedToken = localStorage.getItem('satria_auth_token');
    const saved = localStorage.getItem('satria_auth_user');
    const lastActivity = parseInt(localStorage.getItem('lastActivityTimestamp') || '0', 10);
    const lockUntil = parseInt(localStorage.getItem('lockUntilTimestamp') || '0', 10);

    // Safeguard session validity on reboot / file reloads:
    if (lockUntil && Date.now() < lockUntil) {
      localStorage.removeItem('satria_auth_user');
      localStorage.removeItem('satria_auth_token');
      return null;
    }

    // Sessions are only valid for 10 minutes of idle state
    if (lastActivity && (Date.now() - lastActivity > 600000)) {
      localStorage.removeItem('satria_auth_user');
      localStorage.removeItem('satria_auth_token');
      return null;
    }

    if (!savedToken) return null;
    return saved ? JSON.parse(saved) : null;
  });

  const [usersList, setUsersList] = useState<User[]>(() => {
    const saved = localStorage.getItem('satria_users_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as User[];
        const hasOpd1 = parsed.some(u => u.username === 'opd1');
        if (!hasOpd1) {
          localStorage.setItem('satria_users_list', JSON.stringify(SEED_USERS));
          return SEED_USERS;
        }
        return parsed;
      } catch (e) {
        return SEED_USERS;
      }
    }
    localStorage.setItem('satria_users_list', JSON.stringify(SEED_USERS));
    return SEED_USERS;
  });

  // Ticker to check and clear lock timer automatically
  useEffect(() => {
    const checker = setInterval(() => {
      const savedLock = localStorage.getItem('lockUntilTimestamp');
      if (savedLock) {
        const ts = parseInt(savedLock, 10);
        if (Date.now() >= ts) {
          setLockUntilTimestamp(null);
          setFailedLoginCount(0);
          localStorage.setItem('failedLoginCount', '0');
          localStorage.setItem('loginAttempts', '0');
          localStorage.removeItem('lockUntilTimestamp');
        }
      }
    }, 1000);
    return () => clearInterval(checker);
  }, []);

  // Sync usersList to localstorage
  useEffect(() => {
    localStorage.setItem('satria_users_list', JSON.stringify(usersList));
  }, [usersList]);

  // Sync current user session
  useEffect(() => {
    if (user) {
      localStorage.setItem('satria_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('satria_auth_user');
    }
  }, [user]);

  // Sync token value
  useEffect(() => {
    if (token) {
      localStorage.setItem('satria_auth_token', token);
    } else {
      localStorage.removeItem('satria_auth_token');
    }
  }, [token]);

  const login = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    // 1. Reject if currently locked
    const currentLockUntil = parseInt(localStorage.getItem('lockUntilTimestamp') || '0', 10);
    if (currentLockUntil && Date.now() < currentLockUntil) {
      const secondsLeft = Math.ceil((currentLockUntil - Date.now()) / 1000);
      const isFullLock = failedLoginCount >= 5;
      
      if (isFullLock) {
        return {
          success: false,
          error: `Akun terkunci karena terlalu banyak percobaan login. Silakan tunggu ${secondsLeft} detik lagi untuk memulihkan gate audit.`
        };
      } else {
        return {
          success: false,
          error: `Pintu gerbang ditangguhkan akibat delay progresif. Coba kembali dalam ${secondsLeft} detik.`
        };
      }
    }

    const foundUser = usersList.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    
    if (!foundUser) {
      return { success: false, error: 'Username tidak ditemukan di database SATRIA' };
    }

    // Password validation logic
    let isValidPassword = false;
    if (foundUser.username === 'admin' && pass === 'admin123') isValidPassword = true;
    else if (foundUser.username === 'auditor1' && pass === 'audit123') isValidPassword = true;
    else if (foundUser.username === 'opd1' && pass === 'opd123') isValidPassword = true;
    else if (pass === 'pwd123' || pass === 'audit123' || pass === 'admin123' || pass === 'opd123') isValidPassword = true;

    if (!isValidPassword) {
      const nextFailCount = failedLoginCount + 1;
      setFailedLoginCount(nextFailCount);
      localStorage.setItem('failedLoginCount', String(nextFailCount));
      localStorage.setItem('loginAttempts', String(nextFailCount));

      let lockDuration = 0;
      let errorMsg = `Password salah. Percobaan login: ${nextFailCount}/5.`;

      if (nextFailCount === 3) {
        lockDuration = 60000; // 1 min
        errorMsg = `Keamanan Siber: 3 kali salah password. Sistem ditangguhkan selama 1 menit (delay progresif).`;
      } else if (nextFailCount === 4) {
        lockDuration = 120000; // 2 mins
        errorMsg = `Keamanan Siber: 4 kali salah password. Sistem ditangguhkan selama 2 menit (delay progresif).`;
      } else if (nextFailCount >= 5) {
        lockDuration = 600000; // 10 mins lockout
        errorMsg = `Akun terkunci karena terlalu banyak percobaan login. Ditangguhkan selama 10 menit guna meredam brute force.`;
      }

      if (lockDuration > 0) {
        const until = Date.now() + lockDuration;
        setLockUntilTimestamp(until);
        localStorage.setItem('lockUntilTimestamp', String(until));
      }

      return { success: false, error: errorMsg };
    }

    // Success login: reset security limits
    setFailedLoginCount(0);
    setLockUntilTimestamp(null);
    localStorage.setItem('failedLoginCount', '0');
    localStorage.setItem('loginAttempts', '0');
    localStorage.removeItem('lockUntilTimestamp');

    const generatedToken = 'session_satria_' + Math.random().toString(36).substring(2, 11);
    setToken(generatedToken);
    
    const now = Date.now();
    setLastActivityTimestamp(now);
    localStorage.setItem('lastActivityTimestamp', String(now));

    setUser(foundUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('satria_auth_user');
    localStorage.removeItem('satria_auth_token');
  };

  const resetAttempts = () => {
    setFailedLoginCount(0);
    setLockUntilTimestamp(null);
    localStorage.setItem('failedLoginCount', '0');
    localStorage.setItem('loginAttempts', '0');
    localStorage.removeItem('lockUntilTimestamp');
  };

  const addUser = (newUser: Omit<User, 'id'>): User => {
    const createdUser: User = {
      ...newUser,
      id: `usr-${Date.now()}`
    };
    setUsersList(prev => [...prev, createdUser]);
    return createdUser;
  };

  const deleteUser = (id: string) => {
    if (user && user.id === id) return;
    setUsersList(prev => prev.filter(u => u.id !== id));
  };

  const updateUserRole = (id: string, role: UserRole) => {
    setUsersList(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    if (user && user.id === id) {
      setUser(prev => prev ? { ...prev, role } : null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      usersList, 
      login, 
      logout, 
      addUser, 
      deleteUser, 
      updateUserRole,
      failedLoginCount,
      lockUntilTimestamp,
      lastActivityTimestamp,
      resetAttempts
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
