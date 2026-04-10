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
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 320));
    const ok = await login(id.trim(), pass);
    if (!ok) setError('Invalid Login ID or Password. Please try again.');
    setLoading(false);
  };

  const quickLogin = async (loginId: string, password: string) => {
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 250));
    const ok = await login(loginId, password);
    if (!ok) setError('Login failed.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1B4F72 0%, #2E86AB 100%)' }}>
      <div className="bg-white rounded-2xl p-10 w-full max-w-[420px] shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📊</div>
          <h2 className="text-xl font-bold text-[#1B4F72]">Advertising Campaign</h2>
          <p className="text-xs text-slate-500 mt-1">Dashboard & Management Portal</p>
        </div>

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] px-3.5 py-2.5 rounded-lg text-sm mb-4 animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Login ID</label>
            <input
              type="text"
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="Enter your login ID"
              className="w-full px-3.5 py-2.5 border-[1.5px] border-[#DDE3ED] rounded-lg text-sm text-[#1A1D23] outline-none focus:border-[#1B4F72] transition-colors"
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 border-[1.5px] border-[#DDE3ED] rounded-lg text-sm text-[#1A1D23] outline-none focus:border-[#1B4F72] transition-colors pr-10"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1B4F72] text-white rounded-lg text-sm font-semibold hover:bg-[#154360] transition-colors disabled:opacity-70"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">Quick Demo Login</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map(a => (
              <button
                key={a.id}
                onClick={() => quickLogin(a.id, a.pw)}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                title={`Login as ${a.id}`}
              >
                <span className="text-base mb-1">{a.icon}</span>
                <span className="text-[10px] font-bold text-slate-600">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

