import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const DEMO_ACCOUNTS = [
  { id: 'abc', pw: 'Abc@123', label: 'Owner', color: 'from-amber-500 to-orange-400', icon: '👑' },
  { id: 'arjun.aim', pw: 'AIM@2026', label: 'All India Mgr', color: 'from-purple-600 to-violet-500', icon: '🌐' },
  { id: 'rajesh.north', pw: 'North@123', label: 'Regional Mgr', color: 'from-blue-600 to-sky-500', icon: '🗺️' },
  { id: 'amit.up', pw: 'Zone@123', label: 'Zonal Mgr', color: 'from-emerald-600 to-green-500', icon: '📍' },
  { id: 'ravi.lko', pw: 'Area@123', label: 'Area Mgr', color: 'from-rose-600 to-pink-500', icon: '📌' },
  { id: 'mahesh.vendor', pw: 'Vendor@123', label: 'Vendor', color: 'from-orange-500 to-amber-400', icon: '🏪' },
];

const FEATURES = [
  { icon: '📊', text: 'Real-time budget tracking across all regions' },
  { icon: '✅', text: 'Multi-level approval workflows' },
  { icon: '📈', text: 'Activity analytics & spending insights' },
  { icon: '🔒', text: 'Role-based access for 6 user types' },
];

export default function Login() {
  const { login } = useAppContext();
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 320));
    if (!login(id.trim(), pass)) {
      setError('Invalid credentials or account is inactive.');
    }
    setLoading(false);
  };

  const quickLogin = async (loginId: string, password: string) => {
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 250));
    if (!login(loginId, password)) setError('Login failed.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex mesh-bg">
      {/* ── Left branded panel ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="shimmer absolute inset-0 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
              <span className="text-xl">📊</span>
            </div>
            <span className="text-white font-display font-bold text-lg tracking-tight">AdCampaign</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-display font-black text-white leading-tight mb-5">
            Manage campaigns<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-blue-200">at every level.</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            A unified platform for regional ad campaign budgeting, approvals, and real-time spend tracking.
          </p>

          <div className="mt-12 space-y-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-sm shrink-0">
                  {f.icon}
                </div>
                <span className="text-white/70 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/8 border border-white/15 backdrop-blur-sm">
            <div className="flex -space-x-2">
              {['#1B4F72','#6D28D9','#059669','#DC2626'].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white/30 flex items-center justify-center text-white text-[10px] font-bold" style={{ background: c }}>
                  {['O','A','Z','V'][i]}
                </div>
              ))}
            </div>
            <p className="text-white/60 text-xs">6 role types · 4 regions · Real-time sync</p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px] animate-fade-in">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
              <span>📊</span>
            </div>
            <span className="text-white font-display font-bold">AdCampaign Dashboard</span>
          </div>

          <div className="glass rounded-3xl shadow-2xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-display font-black text-slate-900">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to access your dashboard</p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 font-medium">
                <span className="text-base">⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Login ID</label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    type="text" value={id} onChange={e => setId(e.target.value)}
                    placeholder="e.g. abc"
                    autoFocus required
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#1B4F72] focus:ring-2 focus:ring-[#1B4F72]/10 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full h-11 pl-10 pr-16 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#1B4F72] focus:ring-2 focus:ring-[#1B4F72]/10 focus:bg-white transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-[#1B4F72] to-[#2E86C1] text-white font-semibold text-sm shadow-lg shadow-[#1B4F72]/25 hover:shadow-[#1B4F72]/40 hover:from-[#154060] hover:to-[#2476B0] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading
                  ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" /><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg> Signing in…</>
                  : 'Sign In Securely →'}
              </button>
            </form>

            <div className="mt-7 pt-6 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-center mb-4">Quick Demo Login</p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => quickLogin(a.id, a.pw)}
                    className="group relative overflow-hidden rounded-xl p-2.5 border border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white hover:shadow-md transition-all text-center"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${a.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    <div className="text-base mb-0.5">{a.icon}</div>
                    <div className="text-[11px] font-bold text-slate-700">{a.label}</div>
                    <div className="text-[9px] text-slate-400 font-mono truncate mt-0.5">{a.id}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
