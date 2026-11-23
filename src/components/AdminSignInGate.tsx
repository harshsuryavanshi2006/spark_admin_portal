import { ShieldAlert, LogOut, RefreshCw, ArrowRight } from 'lucide-react';
import { FIREBASE_PROJECT_ID, PRIMARY_ADMIN_EMAIL } from '../firebase';
import { useSparkAuth } from '../context/SparkAuthContext';
import { AdminHeroIllustration } from './AdminHeroIllustration';

export function AdminSignInGate() {
  const {
    user,
    authReady,
    verifyingAdmin,
    accessDenied,
    authError,
    signInWithGoogle,
    signOut,
    recheckAdminStatus,
  } = useSparkAuth();

  return (
    <div className="min-h-screen bg-[#FDF9EE] flex flex-col justify-between">
      <header className="bg-[#121A36] text-white border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path
                d="M16 3L19.6 12.4L29 16L19.6 19.6L16 29L12.4 19.6L3 16L12.4 12.4L16 3Z"
                fill="#FACC15"
              />
            </svg>
            <span className="font-hand text-2xl font-bold tracking-tight text-white">
              Spark
            </span>
            <span className="text-xs text-slate-300 ml-1">Admin Portal</span>
          </div>
          <span className="text-xs font-mono text-slate-300">
            Project: {FIREBASE_PROJECT_ID}
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center pr-0 lg:pr-6">
            <div className="mb-2">
              <AdminHeroIllustration />
            </div>
            <h1 className="font-hand text-3xl sm:text-4xl font-bold tracking-tight text-[#121A36] text-balance">
              Ignite. Engage. Grow.
            </h1>
            <p className="mt-3 text-base text-slate-600 leading-relaxed max-w-xl">
              Manage Spark events, student registrations, attendance check-ins, active
              communities, student ideas, and coordinator permissions from one dashboard.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="h-full bg-white border border-[#EFE6CE] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
              {!authReady || verifyingAdmin ? (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 border-2 border-[#EFE6CE] border-t-[#121A36] rounded-full animate-spin" />
                  <p className="mt-4 text-sm font-semibold text-[#121A36]">
                    {verifyingAdmin ? 'Verifying administrator permissions…' : 'Checking session…'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Checking /admins access list in Firestore
                  </p>
                </div>
              ) : accessDenied && user ? (
                <div>
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-700">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-[#121A36]">
                    Administrator Access Required
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    You are signed in as{' '}
                    <span className="font-mono text-[#121A36] font-medium">{user.email}</span>,
                    which is not currently authorized in the{' '}
                    <span className="font-mono text-slate-800">/admins</span> directory.
                  </p>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    Sign in with <span className="font-mono">{PRIMARY_ADMIN_EMAIL}</span> or ask
                    a Super Admin to add your email in the Admin Team Manager.
                  </p>

                  {authError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                      {authError}
                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => void recheckAdminStatus()}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#121A36] bg-[#FFE89E] hover:bg-[#FDE047] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Recheck Access
                    </button>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#121A36] hover:bg-[#1E2A54] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out &amp; Switch Account
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold text-[#121A36]">
                    Sign in to Admin Portal
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Use your authorized Google account to access Spark administrative tools.
                  </p>

                  {authError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                      {authError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => void signInWithGoogle()}
                    className="mt-6 w-full inline-flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-[#121A36] bg-[#FFE89E] hover:bg-[#FDE047] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-3">
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="#121A36"
                          d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                        />
                      </svg>
                      Continue with Google
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="mt-6 pt-5 border-t border-[#EFE6CE] text-xs text-slate-500 space-y-1">
                    <div>Access restricted to verified administrators</div>
                    <div className="font-mono text-slate-600 truncate">
                      Primary: {PRIMARY_ADMIN_EMAIL}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#EFE6CE] bg-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>Spark — Admin Portal</span>
          <span>Shared Campus Database Connected</span>
        </div>
      </footer>
    </div>
  );
}
