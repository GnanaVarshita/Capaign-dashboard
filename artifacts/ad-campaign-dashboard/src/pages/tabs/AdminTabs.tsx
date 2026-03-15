import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Table, Th, Td, Badge, Button } from '../../components/ui';

export function UserMgmtTab() {
  const { users } = useAppContext();

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'Owner': return <Badge variant="warning">{role}</Badge>;
      case 'All India Manager': return <Badge variant="purple">{role}</Badge>;
      case 'Regional Manager': return <Badge variant="blue">{role}</Badge>;
      case 'Zonal Manager': return <Badge variant="success">{role}</Badge>;
      case 'Vendor': return <Badge variant="default" className="bg-orange-100 text-orange-800">{role}</Badge>;
      default: return <Badge>{role}</Badge>;
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-6">
        <CardTitle>System Users</CardTitle>
        <Table>
          <thead>
            <tr><Th>Name</Th><Th>Login ID</Th><Th>Role</Th><Th>Territory</Th><Th>Permissions</Th><Th>Status</Th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <Td className="font-bold">{u.name}</Td>
                <Td className="font-mono text-xs">{u.loginId}</Td>
                <Td>{getRoleBadge(u.role)}</Td>
                <Td className="text-xs text-muted-foreground">
                  {u.territory.region && <div>Reg: {u.territory.region}</div>}
                  {u.territory.zone && <div>Zone: {u.territory.zone}</div>}
                  {u.territory.area && <div>Area: {u.territory.area}</div>}
                  {u.territory.tradeName && <div>Vendor: {u.territory.tradeName}</div>}
                  {!u.territory.region && !u.territory.tradeName && <div>All Regions</div>}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {u.perms.view && <Badge variant="success" className="text-[9px]">View</Badge>}
                    {u.perms.enter && <Badge variant="blue" className="text-[9px]">Enter</Badge>}
                    {u.perms.edit && <Badge variant="warning" className="text-[9px]">Edit</Badge>}
                    {u.perms.approve && <Badge variant="purple" className="text-[9px]">Approve</Badge>}
                  </div>
                </Td>
                <Td>
                  {u.status === 'active' ? <Badge variant="success">Active</Badge> : <Badge variant="error">Inactive</Badge>}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

export function POMasterTab() {
  const { pos } = useAppContext();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-0 flex flex-col h-[600px] border-r-0 rounded-r-none">
          <div className="p-4 border-b border-border/50 bg-secondary/30">
            <h3 className="font-bold flex justify-between items-center">
              Purchase Orders
              <Button className="h-8 px-3 text-xs">New PO</Button>
            </h3>
          </div>
          <div className="overflow-y-auto p-2 space-y-2">
            {pos.map(po => (
              <div key={po.id} className="p-4 rounded-xl border border-border/50 bg-card hover:bg-secondary/50 cursor-pointer transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-primary">{po.poNumber}</span>
                  <Badge variant={po.status === 'Active' ? 'success' : po.status === 'Draft' ? 'default' : 'warning'}>{po.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{po.from} to {po.to}</div>
                <div className="font-bold mt-2">₹{(po.budget/100000).toFixed(1)}L Total</div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="lg:col-span-2 p-8 border-l-0 rounded-l-none bg-slate-50/50 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <p>Select a Purchase Order from the list to view its allocation details.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
