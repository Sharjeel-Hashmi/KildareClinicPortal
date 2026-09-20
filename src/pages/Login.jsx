import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PiEnvelopeSimple, PiLock, PiEye, PiEyeSlash, PiWarningCircle, PiArrowRight } from 'react-icons/pi';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/client.js';
import Button from '../components/ui/Button.jsx';
import { LogoFull } from '../components/ui/Logo.jsx';
import logoWhite from '../assets/kildare-logo-white.png';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/dashboard'} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Brand panel */}
      <section className="relative isolate hidden overflow-hidden bg-ink text-white lg:flex lg:flex-col lg:justify-evenly lg:p-12 xl:p-14">
        <img
          src={logoWhite}
          alt="Kildare Clinic – GP Walk-in Medical Center"
          className="w-full max-w-110 select-none xl:max-w-125"
        />

        <div className="max-w-md">
          <h1 className="text-[44px] font-bold leading-[1.08] xl:text-5xl">
            Patient records for the Kildare Clinic team.
          </h1>
          <p className="mt-5 max-w-sm text-[17px] leading-relaxed text-[#c4c2b8]">
            Register patients, record consultations and keep every visit on file.
          </p>
          <p className="mt-12 text-sm italic text-[#a9a79d]">Design by <a href="https://www.webpalm.ie/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline"> Webpalm</a></p>
        </div>
      </section>

      {/* Form panel */}
      <section className="flex flex-col bg-white">
        <div className="flex items-center gap-2.5 bg-ink px-5 py-4 lg:hidden">
          <img src={logoWhite} alt="Kildare Clinic – GP Walk-in Medical Center" className="h-11 w-auto" />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-sm">
            <div className="mb-9 hidden lg:block">
              <LogoFull size={36} />
            </div>
            <h2 className="text-[32px] font-bold leading-tight">Sign in</h2>
            <p className="mt-2 text-[15px] text-muted">Use your clinic account to open the doctor portal.</p>

            <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger-50 px-3.5 py-3 text-sm font-medium text-danger"
                >
                  <PiWarningCircle size={20} className="mt-px shrink-0" aria-hidden="true" />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <PiEnvelopeSimple
                    size={20}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@kildaredoc.ie"
                    className="h-12 w-full rounded-lg border border-line-strong bg-white pl-11 pr-3 text-base placeholder:text-[#7c7a71] focus:border-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <PiLock
                    size={20}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-lg border border-line-strong bg-white pl-11 pr-12 text-base placeholder:text-[#7c7a71] focus:border-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-paper hover:text-ink"
                  >
                    {showPassword ? <PiEyeSlash size={21} /> : <PiEye size={21} />}
                  </button>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" loading={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
                {!submitting && <PiArrowRight size={18} aria-hidden="true" />}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted">
              Forgot your password? Ask your clinic administrator to reset it.
            </p>
          </div>
        </div>

        <p className="px-5 pb-6 text-center text-[13px] text-muted lg:hidden">Nua Healthcare Limited</p>
      </section>
    </div>
  );
}