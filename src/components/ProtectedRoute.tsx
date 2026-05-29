import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/audit';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, token, lastActivityTimestamp, lockUntilTimestamp, failedLoginCount, logout } = useAuth();

  const isIdle = lastActivityTimestamp && (Date.now() - lastActivityTimestamp > 600000);
  const isLocked = lockUntilTimestamp && Date.now() < lockUntilTimestamp && failedLoginCount >= 5;

  useEffect(() => {
    if (user && (isIdle || isLocked || !token)) {
      logout();
    }
  }, [user, token, isIdle, isLocked, logout]);

  if (!user || !token || isIdle || isLocked) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If authenticated but role is not allowed, redirect to respective correct dashboard
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'AUDITOR') {
      return <Navigate to="/auditor/dashboard" replace />;
    } else {
      return <Navigate to="/auditee/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
