import React, { ReactNode, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('bg-white rounded-xl border border-[#DDE3ED] shadow-sm', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 pb-4 mb-4 border-b border-[#DDE3ED]', className)}>
      <h3 className="font-bold text-[#1A1D23] text-base flex items-center gap-2">{children}</h3>
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}
export function Button({ children, className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'h-7 px-2.5 text-xs gap-1', md: 'h-9 px-4 text-sm gap-1.5', lg: 'h-11 px-6 text-base gap-2' };
  const variants = {
    primary: 'bg-[#1B4F72] text-white hover:bg-[#154060] focus:ring-[#1B4F72]/30',
    secondary: 'bg-[#F0F4F8] text-[#374151] hover:bg-[#E5E9EF] border border-[#DDE3ED]',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/30',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500/30',
    ghost: 'bg-transparent text-[#374151] hover:bg-[#F0F4F8]',
    outline: 'bg-transparent text-[#1B4F72] border border-[#1B4F72] hover:bg-[#1B4F72]/10'
  };
  return <button className={cn(base, sizes[size], variants[variant], className)} {...props}>{children}</button>;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn('w-full h-9 rounded-lg border border-[#DDE3ED] bg-white px-3 text-sm text-[#1A1D23] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1B4F72] focus:ring-2 focus:ring-[#1B4F72]/10 transition-all', className)}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn('w-full h-9 rounded-lg border border-[#DDE3ED] bg-white px-3 text-sm text-[#1A1D23] focus:outline-none focus:border-[#1B4F72] focus:ring-2 focus:ring-[#1B4F72]/10 transition-all', className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn('w-full rounded-lg border border-[#DDE3ED] bg-white px-3 py-2 text-sm text-[#1A1D23] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1B4F72] focus:ring-2 focus:ring-[#1B4F72]/10 transition-all resize-none', className)}
      {...props}
    />
  );
}

export function Label({ children, required, className }: { children: ReactNode; required?: boolean; className?: string }) {
  return (
    <label className={cn('block text-xs font-semibold text-[#374151] mb-1.5', className)}>
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

type BadgeVariant = 'default' | 'blue' | 'success' | 'warning' | 'error' | 'purple' | 'orange' | 'green';
const BADGE_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-[#F3F4F6] text-[#374151]',
  blue: 'bg-[#DBEAFE] text-[#1E40AF]',
  success: 'bg-[#D1FAE5] text-[#166534]',
  warning: 'bg-[#FEF3C7] text-[#92400E]',
  error: 'bg-[#FEE2E2] text-[#991B1B]',
  purple: 'bg-[#EDE9FE] text-[#5B21B6]',
  orange: 'bg-[#FFF7ED] text-[#C2410C]',
  green: 'bg-[#F0FDF4] text-[#166534]'
};
export function Badge({ children, variant = 'default', className }: { children: ReactNode; variant?: BadgeVariant; className?: string }) {
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap', BADGE_CLASSES[variant], className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <Badge variant="success">✓ Approved</Badge>;
  if (status === 'rejected') return <Badge variant="error">✗ Rejected</Badge>;
  return <Badge variant="warning">⏳ Pending</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const variants: Record<string, BadgeVariant> = {
    'Owner': 'warning', 'All India Manager': 'purple', 'Regional Manager': 'blue',
    'Zonal Manager': 'success', 'Area Manager': 'error', 'Vendor': 'orange'
  };
  return <Badge variant={variants[role] || 'default'}>{role}</Badge>;
}

export function ProgressBar({ value, className, colorClass }: { value: number; className?: string; colorClass?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  const auto = clamped >= 90 ? 'bg-red-500' : clamped >= 70 ? 'bg-amber-500' : 'bg-[#1B4F72]';
  return (
    <div className={cn('h-2 bg-[#E5E9EF] rounded-full overflow-hidden', className)}>
      <div className={cn('h-full rounded-full transition-all', colorClass || auto)} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm border-collapse', className)}>{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn('px-3 py-2.5 text-left text-[11px] font-bold text-[#6B7280] uppercase tracking-wider bg-[#F8FAFC] border-b border-[#DDE3ED] whitespace-nowrap', className)}>{children}</th>;
}

export function Td({ children, className, colSpan, title }: { children?: ReactNode; className?: string; colSpan?: number; title?: string }) {
  return <td colSpan={colSpan} title={title} className={cn('px-3 py-2.5 text-sm text-[#374151] border-b border-[#F0F4F8]', className)}>{children}</td>;
}

export function Modal({ open, onClose, title, children, width = 'max-w-xl' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto', width)}>
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white border-b border-[#DDE3ED] rounded-t-2xl z-10">
          <h2 className="font-bold text-[#1A1D23] text-base">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#F0F4F8] flex items-center justify-center text-[#6B7280] hover:text-[#374151] transition-colors font-bold text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Toast({ msg, type }: { msg: string; type: string }) {
  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold',
      type === 'success' ? 'bg-green-600 text-white' : type === 'error' ? 'bg-red-600 text-white' : 'bg-[#1B4F72] text-white'
    )}>
      {type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'} {msg}
    </div>
  );
}

export function EmptyState({ icon, message }: { icon?: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#9CA3AF]">
      <div className="text-4xl">{icon || '📋'}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">🔍</span>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="pl-8" />
    </div>
  );
}

export function KpiCard({ label, value, sub, color = '#1B4F72', bg = '#EFF6FF' }: { label: string; value: string; sub?: string; color?: string; bg?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-[#9CA3AF] mt-0.5">{sub}</p>}
    </Card>
  );
}

export function TabPills({ tabs, active, onChange }: { tabs: { id: string; label: string; badge?: number }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 p-1 bg-[#F0F4F8] rounded-xl flex-wrap">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
            active === t.id ? 'bg-white text-[#1B4F72] shadow-sm' : 'text-[#6B7280] hover:text-[#374151]'
          )}
        >
          {t.label}
          {t.badge != null && t.badge > 0 && <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{t.badge}</span>}
        </button>
      ))}
    </div>
  );
}

export function InfoBanner({ color, children, className }: { color: 'blue' | 'green' | 'amber' | 'red'; children: ReactNode; className?: string }) {
  const classes = {
    blue: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]',
    green: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]',
    amber: 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]',
    red: 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
  };
  return <div className={cn('border rounded-xl p-3.5 text-xs font-medium', classes[color], className)}>{children}</div>;
}
