import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { notificationsApi } from '../api/services.js';
import { useAuth } from './AuthContext.jsx';

// Notifications for the signed-in user. They are stored on the server (so unread ones are waiting after
// login) and fetched again every 30 seconds while the tab is visible - no live connection is needed.
const POLL_MS = 30000;

const NotificationContext = createContext(null);

const EMPTY = { items: [], unreadCount: 0, version: 0, markRead() {}, markAllRead() {} };
// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => useContext(NotificationContext) || EMPTY;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [version, setVersion] = useState(0); // goes up whenever something new arrives (pages can refresh on it)
  const seen = useRef(null); // ids already shown; null until the first load, so old unread ones do not pop up as toasts
  const itemsRef = useRef([]);
  const baseTitle = useRef(typeof document !== 'undefined' ? document.title : '');

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const load = useCallback(async () => {
    try {
      const data = await notificationsApi.list({ limit: 20 });
      const list = data.notifications || [];
      if (seen.current === null) {
        seen.current = new Set(list.map((n) => n.id));
      } else {
        const fresh = list.filter((n) => !seen.current.has(n.id) && !n.read);
        list.forEach((n) => seen.current.add(n.id));
        if (fresh.length) {
          const more = fresh.length > 1 ? ` (+${fresh.length - 1} more)` : '';
          toast(`${fresh[0].title}${more}\n${fresh[0].body}`, { id: 'new-appointment', duration: 7000, icon: '🔔' });
          setVersion((v) => v + 1);
        }
      }
      setItems(list);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // a network blip is not worth bothering anyone about; the next check tries again
    }
  }, []);

  useEffect(() => {
    if (!user) {
      seen.current = null;
      setItems([]);
      setUnreadCount(0);
      return undefined;
    }
    load();
    const tick = () => {
      if (document.visibilityState === 'visible') load();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick); // check straight away when the tab comes back
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [user?.id, load]); // eslint-disable-line react-hooks/exhaustive-deps

  // "(2) Kildare Clinic" in the browser tab while something is unread
  useEffect(() => {
    const base = baseTitle.current;
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
    return () => {
      document.title = base;
    };
  }, [unreadCount]);

  const markRead = useCallback(
    async (ids) => {
      const unreadIds = ids.filter((id) => itemsRef.current.some((n) => n.id === id && !n.read));
      if (!unreadIds.length) return;
      setItems((list) => list.map((n) => (unreadIds.includes(n.id) ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - unreadIds.length));
      try {
        await notificationsApi.markRead({ ids: unreadIds });
      } catch {
        load(); // put the real state back
      }
    },
    [load]
  );

  const markAllRead = useCallback(async () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await notificationsApi.markRead({ all: true });
    } catch {
      load();
    }
  }, [load]);

  return (
    <NotificationContext.Provider value={{ items, unreadCount, version, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}
