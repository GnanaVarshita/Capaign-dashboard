import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Input, Select, Label, Table, Th, Td, Badge, Modal, cn } from '../../components/ui';

export default function TerritoryTab() {
  const { regions, setRegions } = useAppContext();
  const [editRegion, setEditRegion] = useState<string>('');
  const [editZone, setEditZone] = useState<{ region: string; zone: string } | null>(null);
  const [addZoneModal, setAddZoneModal] = useState('');
  const [addAreaModal, setAddAreaModal] = useState<{ region: string; zone: string } | null>(null);
  const [addRegionModal, setAddRegionModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [newRegionName, setNewRegionName] = useState('');
  const [newRegionColor, setNewRegionColor] = useState('#1B4F72');
  const [newRegionStates, setNewRegionStates] = useState('');

  const addZone = () => {
    if (!newZoneName.trim()) return;
    setRegions(prev => prev.map(r => r.name === addZoneModal ? {
      ...r, zones: [...r.zones, { name: newZoneName.trim(), manager: '', budget: 0, areas: [] }]
    } : r));
    setNewZoneName('');
    setAddZoneModal('');
  };

  const addRegion = () => {
    if (!newRegionName.trim()) return;
    const statesList = newRegionStates.split(',').map(s => s.trim()).filter(s => s);
    setRegions(prev => [...prev, {
      name: newRegionName.trim(),
      manager: '',
      color: newRegionColor,
      states: statesList,
      zones: []
    }]);
    setNewRegionName('');
    setNewRegionColor('#1B4F72');
    setNewRegionStates('');
    setAddRegionModal(false);
  };

  const addArea = () => {
    if (!addAreaModal || !newAreaName.trim()) return;
    setRegions(prev => prev.map(r => r.name === addAreaModal.region ? {
      ...r, zones: r.zones.map(z => z.name === addAreaModal.zone ? {
        ...z, areas: [...z.areas, { name: newAreaName.trim(), manager: '', budget: 0 }]
      } : z)
    } : r));
    setNewAreaName('');
    setAddAreaModal(null);
  };

  const removeZone = (region: string, zone: string) => {
    if (!confirm(`Remove zone "${zone}" from ${region}?`)) return;
    setRegions(prev => prev.map(r => r.name === region ? { ...r, zones: r.zones.filter(z => z.name !== zone) } : r));
  };

  const removeArea = (region: string, zone: string, area: string) => {
    if (!confirm(`Remove area "${area}"?`)) return;
    setRegions(prev => prev.map(r => r.name === region ? {
      ...r, zones: r.zones.map(z => z.name === zone ? { ...z, areas: z.areas.filter(a => a.name !== area) } : z)
    } : r));
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#6B7280]">Configure the territory hierarchy: Regions → Zones → Areas. Changes here reflect in user assignment and PO allocation.</p>

      <div className="flex justify-end mb-4">
        <Button onClick={() => setAddRegionModal(true)}>+ Add New Region</Button>
      </div>

      {regions.map(region => (
        <Card key={region.name} className="overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#1B4F72]/5 to-transparent border-b border-[#DDE3ED]">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: region.color }} />
              <h3 className="font-bold text-[#1B4F72] text-base">🗺️ {region.name} Region</h3>
              <Badge variant="blue">{region.zones.length} zones</Badge>
            </div>
            <Button size="sm" onClick={() => setAddZoneModal(region.name)}>+ Add Zone</Button>
          </div>

          <div className="p-4 space-y-3">
            {region.states && region.states.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {region.states.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] rounded text-xs">{s}</span>
                ))}
              </div>
            )}

            {region.zones.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] italic py-4 text-center">No zones added yet. Click "Add Zone" to get started.</p>
            ) : (
              region.zones.map(zone => (
                <div key={zone.name} className="border border-[#DDE3ED] rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-[#F8FAFC]">
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <div>
                        <span className="font-semibold text-[#374151]">{zone.name}</span>
                        {zone.manager && <span className="text-xs text-[#9CA3AF] ml-2">ZM: {zone.manager}</span>}
                        <Badge variant="default" className="ml-2 text-[9px]">{zone.areas.length} areas</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setAddAreaModal({ region: region.name, zone: zone.name })}>+ Area</Button>
                      <Button size="sm" variant="danger" onClick={() => removeZone(region.name, zone.name)}>✕</Button>
                    </div>
                  </div>

                  {zone.areas.length > 0 && (
                    <div className="p-3 flex flex-wrap gap-2">
                      {zone.areas.map(area => (
                        <div key={area.name} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#DDE3ED] rounded-lg text-xs">
                          <span className="text-[#374151] font-medium">📌 {area.name}</span>
                          {area.manager && <span className="text-[#9CA3AF]">— {area.manager}</span>}
                          <button onClick={() => removeArea(region.name, zone.name, area.name)} className="text-red-400 hover:text-red-600 ml-1 font-bold leading-none">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      ))}

      <Modal open={!!addZoneModal} onClose={() => setAddZoneModal('')} title={`Add Zone — ${addZoneModal} Region`}>
        <div className="space-y-4">
          <div><Label required>Zone Name</Label><Input value={newZoneName} onChange={e => setNewZoneName(e.target.value)} placeholder="e.g. UP Zone" autoFocus onKeyDown={e => e.key === 'Enter' && addZone()} /></div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAddZoneModal('')}>Cancel</Button>
            <Button onClick={addZone} disabled={!newZoneName.trim()}>Add Zone</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!addAreaModal} onClose={() => setAddAreaModal(null)} title={`Add Area — ${addAreaModal?.zone}`}>
        <div className="space-y-4">
          <div><Label required>Area Name</Label><Input value={newAreaName} onChange={e => setNewAreaName(e.target.value)} placeholder="e.g. Lucknow" autoFocus onKeyDown={e => e.key === 'Enter' && addArea()} /></div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAddAreaModal(null)}>Cancel</Button>
            <Button onClick={addArea} disabled={!newAreaName.trim()}>Add Area</Button>
          </div>
        </div>
      </Modal>

      <Modal open={addRegionModal} onClose={() => setAddRegionModal(false)} title="Add New Region">
        <div className="space-y-4">
          <div><Label required>Region Name</Label><Input value={newRegionName} onChange={e => setNewRegionName(e.target.value)} placeholder="e.g. North Region" autoFocus /></div>
          <div>
            <Label>Region Color</Label>
            <div className="flex items-center gap-3 mt-2">
              <input type="color" value={newRegionColor} onChange={e => setNewRegionColor(e.target.value)} className="w-12 h-10 rounded border border-[#DDE3ED] cursor-pointer" />
              <span className="text-xs text-[#6B7280] font-mono">{newRegionColor}</span>
            </div>
          </div>
          <div>
            <Label>States (comma-separated)</Label>
            <Input value={newRegionStates} onChange={e => setNewRegionStates(e.target.value)} placeholder="e.g. Uttar Pradesh, Uttarakhand, Delhi" />
            <p className="text-xs text-[#9CA3AF] mt-1">Optional: Enter state names separated by commas</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAddRegionModal(false)}>Cancel</Button>
            <Button onClick={addRegion} disabled={!newRegionName.trim()}>Add Region</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
