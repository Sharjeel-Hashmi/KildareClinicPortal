import { useEffect, useRef, useState } from 'react';
import { PiTimer } from 'react-icons/pi';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../ui/Button.jsx';

const IDLE_MS = 15 * 60 * 1000; // sign out after this long without any activity
const WARN_MS = 60 * 1000; // ...and ask "still there?" during the last minute
const KEY = 'kc:last-activity'; // shared between tabs so working in one tab keeps the others signed in
const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'wheel'];

const clock = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

// Signs the person out after 15 minutes without activity. In the last minute a dialog counts down and
// offers "Stay signed in" / "Sign out". Timing uses timestamps, so it stays right even if the tab sleeps.
export default function IdleLogout() {
  const { logout } = useAuth();
  const logoutRef = useRef(logout);
  const last = useRef(Date.now());
  const warning = useRef(false);
  const dialogRef = useRef(null);
  const [remaining, setRemaining] = useState(null); // seconds left while the warning is open

  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const stamp = (now) => {
    last.current = now;
    try {
      localStorage.setItem(KEY, String(now));
    } catch {
      /* storage blocked: this tab still works on its own */
    }
  };

  const stay = () => {
    warning.current = false;
    setRemaining(null);
    stamp(Date.now());
  };

  useEffect(() => {
    stamp(Date.now());

    // ordinary activity counts only while no warning is showing (then the buttons decide)
    const onActivity = () => {
      if (warning.current) return;
      const now = Date.now();
      if (now - last.current > 1000) stamp(now);
    };
    // activity in another tab of the portal
    const onStorage = (e) => {
      if (e.key !== KEY || !e.newValue) return;
      const t = Number(e.newValue);
      if (t > last.current) {
        last.current = t;
        if (warning.current) {
          warning.current = false;
          setRemaining(null);
        }
      }
    };
    const tick = () => {
      const idle = Date.now() - last.current;
      if (idle >= IDLE_MS) {
        clearInterval(timer);
        logoutRef.current('inactivity');
      } else if (idle >= IDLE_MS - WARN_MS) {
        warning.current = true;
        setRemaining(Math.max(0, Math.ceil((IDLE_MS - idle) / 1000)));
      }
    };

    EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    window.addEventListener('storage', onStorage);
    const timer = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick); // check at once when the tab wakes up
    return () => {
      EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', tick);
      clearInterval(timer);
    };
  }, []);

  const open = remaining !== null;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => e.preventDefault()} // Esc does not dismiss it: pick a button
      aria-labelledby="idle-title"
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-ink/55 print:hidden"
    >
      <div className="p-6">
        <span className="mb-4 grid size-11 place-items-center rounded-full bg-gold-100 text-gold-700">
          <PiTimer size={22} aria-hidden="true" />
        </span>
        <h2 id="idle-title" className="text-xl font-semibold text-ink">
          Still there?
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          For patient privacy you will be signed out in{' '}
          <span className="font-bold tabular-nums text-ink" role="timer">
            {clock(remaining ?? 0)}
          </span>{' '}
          because there has been no activity.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => logout()}>
            Sign out
          </Button>
          <Button onClick={stay} autoFocus>
            Stay signed in
          </Button>
        </div>
      </div>
    </dialog>
  );
}