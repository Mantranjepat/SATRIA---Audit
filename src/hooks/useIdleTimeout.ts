import { useEffect, useRef } from 'react';

/**
 * Custom React hook that monitors user activity (mousemove, click, scroll, keydown)
 * and triggers a callback (e.g., logout) if the user is inactive for a given timeout period.
 * 
 * @param onTimeout Callback function when idle timeout is reached
 * @param timeoutMs Inactivity duration in milliseconds (default: 10 minutes)
 */
export function useIdleTimeout(onTimeout: () => void, timeoutMs: number = 600000) {
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    const handleActivity = () => {
      localStorage.setItem('lastActivityTimestamp', String(Date.now()));
    };

    // Listen to standard activity events
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('keydown', handleActivity);

    // Initial seed on mount if not already present
    if (!localStorage.getItem('lastActivityTimestamp')) {
      localStorage.setItem('lastActivityTimestamp', String(Date.now()));
    }

    // Interval checker running every 3 seconds for high responsiveness
    const interval = setInterval(() => {
      const lastActive = parseInt(localStorage.getItem('lastActivityTimestamp') || '0', 10);
      if (lastActive && Date.now() - lastActive >= timeoutMs) {
        clearInterval(interval);
        onTimeoutRef.current();
      }
    }, 3000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearInterval(interval);
    };
  }, [timeoutMs]);
}
