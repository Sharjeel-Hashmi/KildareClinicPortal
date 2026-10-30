import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/services.js';
import { TOKEN_KEY } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  // Forget the session on this device (used when the token has expired: nothing to tell the server)
  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // "Sign out" button: leave a note in the audit log first (never blocks the sign-out for long)
  // reason 'inactivity' = signed out automatically after 15 idle minutes (recorded as such in the audit log)
  const logout = useCallback((reason) => {
    const note = authApi.logout(typeof reason === 'string' ? reason : undefined).catch(() => {});
    const wait = new Promise((resolve) => setTimeout(resolve, 1500));
    Promise.race([note, wait]).finally(clearSession);
  }, [clearSession]);

  // Restore the session on page load
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authApi
      .me()
      .then((res) => setUser(res.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  // API interceptor fires this when the token expires
  useEffect(() => {
    window.addEventListener('kc:unauthorized', clearSession);
    return () => window.removeEventListener('kc:unauthorized', clearSession);
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, res.token);
    setUser(res.user);
    return res.user;
  }, []);

  // Called after a successful "My profile" save so the sidebar / header update immediately
  const updateUser = useCallback((next) => setUser(next), []);

  const value = useMemo(
    () => ({ user, loading, login, logout, updateUser }),
    [user, loading, login, logout, updateUser]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);