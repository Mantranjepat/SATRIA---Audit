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

// Helper functions for encrypted token handling
const SECRET_KEY = 'SATRIA_CYBER_SECURE_SALT_2026';

function encryptToken(payload: object): string {
  const jsonStr = JSON.stringify(payload);
  let result = '';
  for (let i = 0; i < jsonStr.length; i++) {
    const charCode = jsonStr.charCodeAt(i);
    const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
    result += String.fromCharCode(charCode ^ keyChar);
  }
  try {
    return btoa(unescape(encodeURIComponent(result)));
  } catch (e) {
    return btoa(result);
  }
}

function decryptToken(token: string): any | null {
  try {
    if (!token) return null;
    let decoded = '';
    try {
      decoded = decodeURIComponent(escape(atob(token)));
    } catch (e) {
      decoded = atob(token);
    }
    let jsonStr = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i);
      const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      jsonStr += String.fromCharCode(charCode ^ keyChar);
    }
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to decrypt security token', err);
    return null;
  }
}

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
    if (!savedToken) return null;

    const decrypted = decryptToken(savedToken);
    if (!decrypted) {
      localStorage.removeItem('satria_auth_token');
      localStorage.removeItem('satria_auth_user');
      return null;
    }

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

    const saved = localStorage.getItem('satria_auth_user');
    return saved ? JSON.parse(saved) : decrypted.user;
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

  // Active activity monitoring for 10-minute automatic logout
  useEffect(() => {
    if (!user) return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    let lastUpdate = Date.now();

    const updateActivity = () => {
      const now = Date.now();
      // Update at most once every 5 seconds to reduce state/storage writes
      if (now - lastUpdate > 5000) {
        lastUpdate = now;
        setLastActivityTimestamp(now);
        localStorage.setItem('lastActivityTimestamp', String(now));
      }
    };

    // Attach listeners
    activityEvents.forEach(evt => {
      window.addEventListener(evt, updateActivity);
    });

    // Inactivity checker interval (runs every 5 seconds)
    const interval = setInterval(() => {
      const savedLast = parseInt(localStorage.getItem('lastActivityTimestamp') || '0', 10);
      if (savedLast && (Date.now() - savedLast > 600000)) { // 10 minutes = 600,000ms
        logout();
      }
    }, 5000);

    return () => {
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, updateActivity);
      });
      clearInterval(interval);
    };
  }, [user]);

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
      return {
        success: false,
        error: `Login ditangguhkan sementara karena terlalu banyak kegagalan pintu gerbang siber. Silakan kembali dalam ${secondsLeft} detik.`
      };
    }

    const foundUser = usersList.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    
    if (!foundUser) {
      const nextFailCount = failedLoginCount + 1;
      setFailedLoginCount(nextFailCount);
      localStorage.setItem('failedLoginCount', String(nextFailCount));
      localStorage.setItem('loginAttempts', String(nextFailCount));

      let lockDuration = 0;
      let errorMsg = 'Username dan password tidak di temukan';

      if (nextFailCount >= 5) {
        const minutes = 2 * (nextFailCount - 4);
        lockDuration = minutes * 60 * 1000;
        errorMsg = `Keamanan Siber: ${nextFailCount} kali kesalahan login. Sistem diblokir selama ${minutes} menit (anti brute-force).`;
      }

      if (lockDuration > 0) {
        const until = Date.now() + lockDuration;
        setLockUntilTimestamp(until);
        localStorage.setItem('lockUntilTimestamp', String(until));
      }

      return { success: false, error: errorMsg };
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
      let errorMsg = 'Username dan password tidak di temukan';

      if (nextFailCount >= 5) {
        // Multiplier starting at 2 minutes for the 5th mistake, and 2 extra minutes of lock for each mistake after that.
        const minutes = 2 * (nextFailCount - 4);
        lockDuration = minutes * 60 * 1000;
        errorMsg = `Keamanan Siber: ${nextFailCount} kali kesalahan login. Sistem diblokir selama ${minutes} menit (anti brute-force).`;
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

    const now = Date.now();
    const generatedToken = encryptToken({
      userId: foundUser.id,
      username: foundUser.username,
      role: foundUser.role,
      user: foundUser,
      createdAt: now
    });
    setToken(generatedToken);
    
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
    if (!user || user.role !== 'ADMIN') {
      throw new Error('Akses Ditolak: Hanya Administrator siber yang memiliki wewenang meregistrasi pengguna.');
    }
    const createdUser: User = {
      ...newUser,
      id: `usr-${Date.now()}`
    };
    setUsersList(prev => [...prev, createdUser]);
    return createdUser;
  };

  const deleteUser = (id: string) => {
    if (!user || user.role !== 'ADMIN') {
      throw new Error('Akses Ditolak: Hanya Administrator siber yang memiliki wewenang menghapus pengguna.');
    }
    if (user && user.id === id) return;
    setUsersList(prev => prev.filter(u => u.id !== id));
  };

  const updateUserRole = (id: string, roleToSet: UserRole) => {
    if (!user || user.role !== 'ADMIN') {
      throw new Error('Akses Ditolak: Hanya Administrator siber yang memiliki wewenang merubah otorisasi peran.');
    }
    setUsersList(prev => prev.map(u => u.id === id ? { ...u, role: roleToSet } : u));
    if (user.id === id) {
      setUser(prev => prev ? { ...prev, role: roleToSet } : null);
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
