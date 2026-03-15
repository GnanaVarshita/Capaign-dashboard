import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button, Input } from '../components/ui';

const DEMO_ACCOUNTS = [
  { id: 'abc', pw: 'Abc@123', label: 'Owner' },
  { id: 'arjun.aim', pw: 'AIM@2026', label: 'AIM' },
  { id: 'rajesh.north', pw: 'North@123', label: 'Reg. Mgr' },
  { id: 'amit.up', pw: 'Zone@123', label: 'Zonal Mgr' },
  { id: 'ravi.lko', pw: 'Area@123', label: 'Area Mgr' },
  { id: 'mahesh.vendor', pw: 'Vendor@123', label: 'Vendor' },
];

export default function Login() {
  const { login } = useAppContext();
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!login(id.trim(), pass)) {
      setError('Invalid Login ID or Password, or account is inactive.');
    }
  };

  const quickLogin = (loginId: string, password: string) => {
    setId(loginId);
    setPass(password);
    setError('');
    if (!login(loginId, password)) setError('Login failed.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F2D45] via-[#1B4F72] to-[#2C6E8A] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-[#1B4F72] px-8 py-10 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <span className="text-3xl">📊</span>
            </div>
            <h1 className="text-2xl font-black text-white">Ad Campaign Dashboard</h1>
            <p className="text-white/70 text-sm mt-1">Regional Campaign Management Portal</p>
          </div>

          <div className="px-8 py-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Login ID</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">👤</span>
                  <Input type="text" value={id} onChange={e => setId(e.target.value)} placeholder="e.g. abc" className="pl-9 h-11" required autoFocus />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">🔒</span>
                  <Input type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" className="pl-9 pr-12 h-11" required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] text-xs font-semibold">
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-base mt-2">
                Sign In Securely
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#DDE3ED]">
              <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3 text-center">Quick Demo Login</p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => quickLogin(a.id, a.pw)}
                    className="p-2 bg-[#F0F4F8] hover:bg-[#E5E9EF] rounded-lg text-xs font-semibold text-[#374151] transition-colors text-center"
                  >
                    <div className="text-[#1B4F72] font-bold">{a.label}</div>
                    <div className="text-[#9CA3AF] font-mono text-[9px] mt-0.5 truncate">{a.id}</div>
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
