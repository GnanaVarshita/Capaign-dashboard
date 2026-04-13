import React from 'react';
import { Modal, Button, Input, Textarea, Label, Select, cn } from '../../../components/ui';
import { formatCurrency } from '../../../lib/mock-data';

// ─── PO Wizard Modal ────────────────────────────────────────────────────────

interface POWizardModalProps {
  open: boolean;
  onClose: () => void;
  editMode: boolean;
  wizardStep: number;
  setWizardStep: (s: number) => void;
  form: {
    poNumber: string;
    budget: string;
    from: string;
    to: string;
    status: string;
    remarks: string;
    regionBudgets: Record<string, string>;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  regions: { name: string; color: string }[];
  onSave: () => void;
  onAutoGen: () => void;
}

export function POWizardModal({
  open, onClose, editMode, wizardStep, setWizardStep, form, setForm, regions, onSave, onAutoGen
}: POWizardModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={editMode ? 'Edit Purchase Order' : 'Create Purchase Order'} width="max-w-2xl">
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className={cn('flex-1 h-1.5 rounded-full transition-all', s <= wizardStep ? 'bg-[#1B4F72]' : 'bg-[#E5E9EF]')} />
        ))}
      </div>

      {wizardStep === 1 && (
        <div className="space-y-4">
          <p className="text-sm font-bold text-[#6B7280] mb-3">Step 1 — PO Details</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label required>PO Number</Label>
              <Input value={form.poNumber} onChange={e => setForm((f: any) => ({ ...f, poNumber: e.target.value }))} placeholder="PO-2026-001" />
            </div>
            <Button variant="secondary" onClick={onAutoGen} className="self-end h-9">Auto-generate</Button>
          </div>
          <div>
            <Label required>Total Budget (₹)</Label>
            <Input type="number" value={form.budget} onChange={e => setForm((f: any) => ({ ...f, budget: e.target.value }))} placeholder="1000000" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label required>From Date</Label><Input type="date" value={form.from} onChange={e => setForm((f: any) => ({ ...f, from: e.target.value }))} /></div>
            <div><Label required>To Date</Label><Input type="date" value={form.to} onChange={e => setForm((f: any) => ({ ...f, to: e.target.value }))} /></div>
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea value={form.remarks} onChange={e => setForm((f: any) => ({ ...f, remarks: e.target.value }))} rows={2} placeholder="e.g. Q1 2026 National Campaign" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={() => setWizardStep(2)} disabled={!form.poNumber || !form.budget || !form.from || !form.to}>Next →</Button>
          </div>
        </div>
      )}

      {wizardStep === 2 && (
        <div className="space-y-4">
          <p className="text-sm font-bold text-[#6B7280] mb-3">Step 2 — Region Budget Allocation</p>
          <p className="text-xs text-[#9CA3AF]">
            Total Budget: <strong className="text-[#1B4F72]">{formatCurrency(parseFloat(form.budget) || 0)}</strong>
            &nbsp;·&nbsp;
            Remaining: <strong>{formatCurrency(Math.max(0, (parseFloat(form.budget) || 0) - Object.values(form.regionBudgets).reduce((s: number, v: string) => s + (parseFloat(v) || 0), 0)))}</strong>
          </p>
          <div className="space-y-2">
            {regions.map(r => (
              <div key={r.name} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-28">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="text-sm font-semibold text-[#374151]">{r.name}</span>
                </div>
                <Input
                  type="number" min="0"
                  value={form.regionBudgets[r.name] || ''}
                  onChange={e => setForm((f: any) => ({ ...f, regionBudgets: { ...f.regionBudgets, [r.name]: e.target.value } }))}
                  placeholder="0" className="flex-1"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between gap-3 pt-2">
            <Button variant="secondary" onClick={() => setWizardStep(1)}>← Back</Button>
            <Button onClick={() => setWizardStep(3)}>Next →</Button>
          </div>
        </div>
      )}

      {wizardStep === 3 && (
        <div className="space-y-4">
          <p className="text-sm font-bold text-[#6B7280] mb-3">Step 3 — Review & Save</p>
          <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2 text-sm">
            <p><span className="text-[#6B7280]">PO Number:</span> <strong>{form.poNumber}</strong></p>
            <p><span className="text-[#6B7280]">Budget:</span> <strong className="text-[#1B4F72]">{formatCurrency(parseFloat(form.budget) || 0)}</strong></p>
            <p><span className="text-[#6B7280]">Period:</span> <strong>{form.from} to {form.to}</strong></p>
            {form.remarks && <p><span className="text-[#6B7280]">Remarks:</span> {form.remarks}</p>}
            <div>
              <p className="text-[#6B7280] mb-1">Region Budgets:</p>
              {Object.entries(form.regionBudgets).filter(([, v]) => parseFloat(v as string) > 0).map(([r, v]) => (
                <p key={r} className="text-xs">{r}: <strong>{formatCurrency(parseFloat(v as string))}</strong></p>
              ))}
            </div>
          </div>
          <div className="flex justify-between gap-3 pt-2">
            <Button variant="secondary" onClick={() => setWizardStep(2)}>← Back</Button>
            <Button onClick={onSave}>{editMode ? 'Save Changes' : 'Create PO'}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Distribution Modal ──────────────────────────────────────────────────────

interface PODistributionModalProps {
  open: boolean;
  onClose: () => void;
  distRegion: string;
  regionBudget: number;
  products: string[];
  crops: string[];
  activities: string[];
  distData: Record<string, Record<string, Record<string, number>>>;
  setDistData: React.Dispatch<React.SetStateAction<Record<string, Record<string, Record<string, number>>>>>;
  onSave: () => void;
}

export function PODistributionModal({
  open, onClose, distRegion, regionBudget, products, crops, activities, distData, setDistData, onSave
}: PODistributionModalProps) {
  const total = Object.values(distData).reduce((s, crops_obj) =>
    s + Object.values(crops_obj).reduce((cs, acts) =>
      cs + Object.values(acts).reduce((as, v) => as + (v || 0), 0), 0), 0);

  return (
    <Modal open={open} onClose={onClose} title={`Distribute Budget — ${distRegion}`} width="max-w-2xl">
      <div className="space-y-4">
        <div className="flex justify-between text-xs text-[#6B7280] font-semibold">
          <span>Region Budget: <strong className="text-[#1B4F72]">{formatCurrency(regionBudget)}</strong></span>
          <span>Allocated: <strong className={total > regionBudget ? 'text-red-600' : 'text-green-600'}>{formatCurrency(total)}</strong></span>
        </div>
        {total > regionBudget && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
            ⚠ Total allocation exceeds region budget by {formatCurrency(total - regionBudget)}
          </p>
        )}
        <div className="max-h-[420px] overflow-y-auto space-y-4 pr-1">
          {products.map(prod => (
            <div key={prod} className="border border-[#DDE3ED] rounded-xl p-4">
              <p className="font-bold text-[#374151] text-sm mb-3">{prod}</p>
              {crops.map(crop => (
                <div key={crop} className="border border-[#E5E7EB] rounded-lg p-3 mb-3 bg-[#F9FAFB]">
                  <p className="font-semibold text-[#374151] text-sm mb-2">{crop}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {activities.map(act => (
                      <div key={act}>
                        <Label className="text-[9px]">{act}</Label>
                        <Input
                          type="number" min="0"
                          value={distData[prod]?.[crop]?.[act] || ''}
                          onChange={e => setDistData(d => ({
                            ...d,
                            [prod]: { ...(d[prod] || {}), [crop]: { ...(d[prod]?.[crop] || {}), [act]: parseFloat(e.target.value) || 0 } }
                          }))}
                          placeholder="0"
                          className="h-8 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Save Distribution</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Generic Master Item Modal (Product / Activity / Crop) ────────────────────

interface MasterItemModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  label: string;
  placeholder: string;
  itemName: string;
  setItemName: (name: string) => void;
  itemDescription: string;
  setItemDescription: (desc: string) => void;
  isEditing: boolean;
  onSave: () => void;
}

export function MasterItemModal({
  open, onClose, title, label, placeholder,
  itemName, setItemName, itemDescription, setItemDescription,
  isEditing, onSave
}: MasterItemModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-lg">
      <div className="space-y-4">
        <div>
          <Label required>{label}</Label>
          <Input
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            placeholder={placeholder}
            autoFocus
          />
        </div>
        <div>
          <Label>Description (Optional)</Label>
          <Textarea
            value={itemDescription}
            onChange={e => setItemDescription(e.target.value)}
            placeholder="Add optional description..."
            rows={2}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={!itemName.trim()}>
            {isEditing ? `Update ${label}` : `Add ${label}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
