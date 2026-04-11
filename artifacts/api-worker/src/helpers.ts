export const uid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const today = () => new Date().toISOString().split("T")[0];
export const safeUser = (u: any) => {
  const { password: _p, ...rest } = u;
  return rest;
};

export const GLOBAL_ROLES = ["Owner", "All India Manager"];
export const APPROVER_ROLES = [
  "Owner",
  "All India Manager",
  "Regional Manager",
  "Zonal Manager",
];

export function scopeEntries(entries: any[], user: any, allUsers: any[]) {
  if (GLOBAL_ROLES.includes(user.role)) return entries;
  const userMap = Object.fromEntries(allUsers.map((u: any) => [u.id, u]));
  if (user.role === "Regional Manager") {
    return entries.filter(
      (e) => userMap[e.userId]?.territory?.region === user.territory?.region,
    );
  }
  if (user.role === "Zonal Manager") {
    return entries.filter(
      (e) =>
        userMap[e.userId]?.territory?.zone === user.territory?.zone &&
        userMap[e.userId]?.territory?.region === user.territory?.region,
    );
  }
  if (user.role === "Area Manager")
    return entries.filter((e) => e.userId === user.id);
  if (user.role === "Vendor")
    return entries.filter((e) => e.vendorId === user.id);
  return [];
}

export function scopePOs(pos: any[], user: any, entries: any[]) {
  if (GLOBAL_ROLES.includes(user.role)) return pos;
  if (user.role === "Vendor") {
    const myRegions = (user.territory?.assignedZones || []).map(
      (z: any) => z.region,
    );
    return pos.filter(
      (po) =>
        myRegions.some((r: string) => po.regionBudgets?.[r]) ||
        entries.some((e) => e.po === po.poNumber && e.vendorId === user.id),
    );
  }
  const myRegion = user.territory?.region;
  if (!myRegion) return [];
  return pos.filter((po) => {
    if (!po.regionBudgets?.[myRegion]) return false;
    if (user.role === "Zonal Manager") {
      const myZone = user.territory?.zone;
      const za = po.zoneAllocations?.[myRegion] || {};
      if (Object.keys(za).length > 0 && !za[myZone]) return false;
    }
    return true;
  });
}

export function getPendingForApprover(
  entries: any[],
  user: any,
  allUsers: any[],
) {
  const pending = entries.filter((e) => e.status === "pending");
  if (GLOBAL_ROLES.includes(user.role)) return pending;
  const userMap = Object.fromEntries(allUsers.map((u: any) => [u.id, u]));
  if (user.role === "Regional Manager") {
    return pending.filter((e) => {
      const eu = userMap[e.userId];
      return (
        eu?.territory?.region === user.territory?.region &&
        ["Zonal Manager", "Area Manager", "Vendor"].includes(eu?.role)
      );
    });
  }
  if (user.role === "Zonal Manager") {
    return pending.filter((e) => {
      const eu = userMap[e.userId];
      return (
        eu?.territory?.zone === user.territory?.zone &&
        eu?.territory?.region === user.territory?.region &&
        ["Area Manager", "Vendor"].includes(eu?.role)
      );
    });
  }
  return [];
}
