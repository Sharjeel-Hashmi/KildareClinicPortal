import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiBell, PiBellRinging, PiCalendarCheck } from 'react-icons/pi';
import { useNotifications } from '../../context/NotificationContext.jsx';

const ago = (value) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
};

// Bell with an unread badge and a drop-down list. `variant="dark"` is for the dark sidebar / top bar.
export default function NotificationBell({ className = '', align = 'left' }) {
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const openItem = (n) => {
    markRead([n.id]);
    setOpen(false);
    navigate(n.date ? `/appointments?date=${n.date}` : '/appointments');
  };

  const Icon = unreadCount > 0 ? PiBellRinging : PiBell;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative grid size-10 place-items-center rounded-lg text-white transition-colors hover:bg-ink-3"
      >
        <Icon size={22} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-gold-500 px-1 text-[11px] font-bold leading-[18px] text-ink">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className={`absolute z-50 mt-2 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-white text-ink shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[15px] font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="text-sm font-medium text-gold-700 hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-[15px] text-muted">No notifications yet.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-paper ${n.read ? '' : 'bg-gold-50/70'}`}
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-700">
                      <PiCalendarCheck size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-[14px] ${n.read ? 'font-medium' : 'font-semibold'}`}>{n.title}</span>
                      <span className="block text-[13px] text-muted">{n.body}</span>
                      <span className="mt-0.5 block text-xs text-muted">{ago(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
