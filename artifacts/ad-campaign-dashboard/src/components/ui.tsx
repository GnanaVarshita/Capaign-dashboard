import React, { ReactNode, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ─── Card ───────────────────────────────────────────────── */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.06)]',
      className
    )}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100', className)}>
      <h3 className="font-display font-bold text-slate-800 text-[15px] flex items-center gap-2">{children}</h3>
    </div>
  );
}

/* ─── Button ─────────────────────────────────────────────── */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}
export function Button({ children, className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]';
  const sizes = {
    sm: 'h-7 px-2.5 text-xs gap-1',
    md: 'h-9 px-4 text-sm gap-1.5',
    lg: 'h-11 px-6 text-base gap-2'
  };
  const variants = {
    primary: 'bg-gradient-to-r from-[#1B4F72] to-[#2E86C1] text-white shadow-md shadow-[#1B4F72]/20 hover:shadow-lg hover:shadow-[#1B4F72]/30 hover:from-[#154060] hover:to-[#2476B0] focus:ring-[#1B4F72]/30',
    secondary: 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:border-slate-300 focus:ring-slate-400/20',
    danger: 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md shadow-red-500/20 hover:from-red-700 hover:to-rose-600 focus:ring-red-500/30',
    success: 'bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-green-600 focus:ring-emerald-500/30',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800',
    outline: 'bg-transparent text-[#1B4F72] border border-[#1B4F72]/40 hover:bg-[#1B4F72]/8 hover:border-[#1B4F72] focus:ring-[#1B4F72]/20'
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

/* ─── Input ──────────────────────────────────────────────── */
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full h-9 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1B4F72] focus:ring-2 focus:ring-[#1B4F72]/10 focus:bg-white transition-all',
        className
      )}
      {...props}
    />
  );
}

/* ─── Select ─────────────────────────────────────────────── */
export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full h-9 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-900 focus:outline-none focus:border-[#1B4F72] focus:ring-2 focus:ring-[#1B4F72]/10 focus:bg-white transition-all cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

/* ─── Textarea ───────────────────────────────────────────── */
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1B4F72] focus:ring-2 focus:ring-[#1B4F72]/10 focus:bg-white transition-all resize-none',
        className
      )}
      {...props}
    />
  );
}

/* ─── Label ──────────────────────────────────────────────── */
export function Label({ children, required, className }: { children: ReactNode; required?: boolean; className?: string }) {
  return (
    <label className={cn('block text-xs font-semibold text-slate-500 mb-1.5', className)}>
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

/* ─── Badge ──────────────────────────────────────────────── */
type BadgeVariant = 'default' | 'blue' | 'success' | 'warning' | 'error' | 'purple' | 'orange' | 'green';
const BADGE_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/60',
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  error: 'bg-red-50 text-red-700 ring-1 ring-red-200/60',
  purple: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/60',
  orange: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/60',
  green: 'bg-green-50 text-green-700 ring-1 ring-green-200/60'
};
export function Badge({ children, variant = 'default', className }: { children: ReactNode; variant?: BadgeVariant; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap', BADGE_CLASSES[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <Badge variant="success">✓ Approved</Badge>;
  if (status === 'rejected') return <Badge variant="error">✗ Rejected</Badge>;
  return <Badge variant="warning">⏳ Pending</Badge>;
}

const ROLE_CONFIG: Record<string, { variant: BadgeVariant; dot: string }> = {
  'Owner':              { variant: 'warning', dot: 'bg-amber-400' },
  'All India Manager':  { variant: 'purple',  dot: 'bg-violet-500' },
  'Regional Manager':   { variant: 'blue',    dot: 'bg-blue-500' },
  'Zonal Manager':      { variant: 'success', dot: 'bg-emerald-500' },
  'Area Manager':       { variant: 'error',   dot: 'bg-red-500' },
  'Vendor':             { variant: 'orange',  dot: 'bg-orange-400' },
};
export function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] || { variant: 'default' as BadgeVariant, dot: 'bg-slate-400' };
  return (
    <Badge variant={cfg.variant} className="gap-1">
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {role}
    </Badge>
  );
}

/* ─── Progress Bar ───────────────────────────────────────── */
export function ProgressBar({ value, className, colorClass }: { value: number; className?: string; colorClass?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  const auto = clamped >= 90 ? 'progress-fill-danger' : clamped >= 70 ? 'progress-fill-warn' : 'progress-fill';
  return (
    <div className={cn('h-2 bg-slate-100 rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', colorClass || auto)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* ─── Table ──────────────────────────────────────────────── */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className={cn('w-full text-sm border-collapse', className)}>{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cn(
      'px-3.5 py-3 text-left text-[10.5px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-100 whitespace-nowrap',
      className
    )}>
      {children}
    </th>
  );
}

export function Td({ children, className, colSpan, title }: { children?: ReactNode; className?: string; colSpan?: number; title?: string }) {
  return (
    <td colSpan={colSpan} title={title} className={cn('px-3.5 py-2.5 text-sm text-slate-700 border-b border-slate-50', className)}>
      {children}
    </td>
  );
}

/* ─── Modal ──────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 'max-w-xl' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative bg-white rounded-2xl shadow-[0_24px_64px_rgba(15,23,42,0.18)] w-full max-h-[90vh] overflow-y-auto animate-fade-in',
        width
      )}>
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-slate-100 rounded-t-2xl z-10">
          <h2 className="font-display font-bold text-slate-900 text-base">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold leading-none"
          >×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────── */
export function Toast({ msg, type }: { msg: string; type: string }) {
  const styles = {
    success: 'bg-gradient-to-r from-emerald-600 to-green-500 shadow-emerald-500/25',
    error: 'bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/25',
    info: 'bg-gradient-to-r from-[#1B4F72] to-[#2E86C1] shadow-[#1B4F72]/25',
  };
  const icons = { success: '✓', error: '✗', info: 'ℹ' };
  const style = styles[type as keyof typeof styles] || styles.info;
  const icon = icons[type as keyof typeof icons] || 'ℹ';
  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-[200] flex items-center gap-3 pl-4 pr-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold text-white animate-fade-in',
      style
    )}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">{icon}</span>
      {msg}
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────── */
export function EmptyState({ icon, message }: { icon?: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
      <div className="text-4xl opacity-60">{icon || '📋'}</div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

/* ─── SearchInput ────────────────────────────────────────── */
export function SearchInput({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="pl-8 pr-3" />
    </div>
  );
}

/* ─── KPI Card ───────────────────────────────────────────── */
export function KpiCard({ label, value, sub, color = '#1B4F72', icon }: { label: string; value: string; sub?: ReactNode; color?: string; icon?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden transition-all hover:shadow-md" style={{ borderTop: `4px solid ${color}` }}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-2xl opacity-80">{icon}</div>
      </div>
      <div className="text-2xl font-black text-slate-800 mb-1" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-slate-500 font-medium">{sub}</div>}
    </div>
  );
}

/* ─── Tab Pills ──────────────────────────────────────────── */
export function TabPills({ tabs, active, onChange }: { tabs: { id: string; label: string; badge?: number }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl flex-wrap">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150',
            active === t.id
              ? 'bg-white text-[#1B4F72] shadow-sm shadow-slate-200/80'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          )}
        >
          {t.label}
          {t.badge != null && t.badge > 0 && (
            <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Info Banner ────────────────────────────────────────── */
export function InfoBanner({ color, children, className }: { color: 'blue' | 'green' | 'amber' | 'red'; children: ReactNode; className?: string }) {
  const classes = {
    blue:  'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    red:   'bg-red-50 border-red-200 text-red-800'
  };
  return (
    <div className={cn('border rounded-2xl p-4 text-xs font-medium leading-relaxed', classes[color], className)}>
      {children}
    </div>
  );
}
