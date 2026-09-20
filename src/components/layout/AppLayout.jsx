import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  PiSquaresFour,
  PiUsersThree,
  PiStethoscope,
  PiUserPlus,
  PiSignOut,
  PiList,
  PiX,
} from 'react-icons/pi';
import { useAuth } from '../../context/AuthContext.jsx';
import { LogoMark, Wordmark } from '../ui/Logo.jsx';
import Button from '../ui/Button.jsx';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: PiSquaresFour },
  { to: '/patients', label: 'Patients', icon: PiUsersThree },
  { to: '/consultations', label: 'Consultations', icon: PiStethoscope },
];

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <LogoMark className="h-10 w-auto" />
        <div className="min-w-0">
          <Wordmark className="h-[13px] w-auto text-white" />
          <p className="mt-1.5 text-[13px] text-[#a9a79d]">Doctor portal</p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <Button to="/patients/new" icon={PiUserPlus} className="w-full" onClick={onNavigate}>
          New patient
        </Button>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `relative flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors ${
                isActive
                  ? 'bg-ink-3 text-white before:absolute before:inset-y-2 before:-left-3 before:w-1 before:rounded-r before:bg-gold-500'
                  : 'text-[#c4c2b8] hover:bg-ink-2 hover:text-white'
              }`
            }
          >
            <Icon size={21} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-3 p-4">
        <div className="mb-3 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-500 font-display font-bold text-ink"
          >
            {(user?.name || '?').replace(/^Dr\.?\s*/i, '')[0]?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{user?.name}</p>
            <p className="truncate text-[13px] text-[#a9a79d]">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-[15px] font-medium text-[#c4c2b8] transition-colors hover:bg-ink-2 hover:text-white"
        >
          <PiSignOut size={20} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // close the mobile drawer whenever the route changes
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-dvh print:hidden">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-ink px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-auto" />
          <Wordmark className="h-[11px] w-auto text-white" />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid size-10 place-items-center rounded-lg text-white hover:bg-ink-3"
        >
          <PiList size={24} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            <SidebarContent onNavigate={() => setOpen(false)} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 grid size-9 place-items-center rounded-lg text-white hover:bg-ink-3"
            >
              <PiX size={22} />
            </button>
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}