import { useEffect, useRef, useState, useCallback } from 'react';

const STORAGE_KEY = 'alt_hub_auto_logout_minutes';

export const AUTO_LOGOUT_OPTIONS = [
  { value: 0, label: 'Disabled' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 480, label: '8 hours' },
] as const;

export function getAutoLogoutSetting(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) return parsed;
    }
  } catch (e) {
    // LocalStorage access errors (e.g. strict privacy mode)
  }
  return 60; // Default 1 hour
}

export function setAutoLogoutSetting(minutes: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, minutes.toString());
  } catch (e) {
    // LocalStorage access errors
  }
}

interface UseInactivityLogoutProps {
  enabled: boolean;
  onLogout: () => void;
}

export function useInactivityLogout({ enabled, onLogout }: UseInactivityLogoutProps) {
  const [autoLogoutMinutes, setAutoLogoutMinutesState] = useState<number>(getAutoLogoutSetting);
  const [wasAutoLoggedOut, setWasAutoLoggedOut] = useState<boolean>(false);
  const lastActivityRef = useRef<number>(Date.now());
  const onLogoutRef = useRef(onLogout);

  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  const updateAutoLogoutMinutes = (minutes: number) => {
    setAutoLogoutSetting(minutes);
    setAutoLogoutMinutesState(minutes);
  };

  const handleUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const clearAutoLogoutMessage = () => {
    setWasAutoLoggedOut(false);
  };

  useEffect(() => {
    if (!enabled || autoLogoutMinutes <= 0) return;

    // Reset last activity timestamp when enabled or timeout setting changes
    lastActivityRef.current = Date.now();

    const checkInactivity = () => {
      const inactiveMs = Date.now() - lastActivityRef.current;
      const thresholdMs = autoLogoutMinutes * 60 * 1000;

      if (inactiveMs >= thresholdMs) {
        setWasAutoLoggedOut(true);
        onLogoutRef.current();
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

    // Throttle event listener updates
    let lastUpdate = Date.now();
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastUpdate > 2000) {
        lastUpdate = now;
        handleUserActivity();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, throttledHandler, { passive: true });
    });

    const intervalId = setInterval(checkInactivity, 10000); // Check every 10 seconds

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkInactivity);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, throttledHandler);
      });
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkInactivity);
    };
  }, [enabled, autoLogoutMinutes, handleUserActivity]);

  return {
    autoLogoutMinutes,
    setAutoLogoutMinutes: updateAutoLogoutMinutes,
    wasAutoLoggedOut,
    clearAutoLogoutMessage,
  };
}
