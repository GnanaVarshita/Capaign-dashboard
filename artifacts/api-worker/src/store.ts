import {
  SEED_USERS,
  SEED_ENTRIES,
  SEED_POS,
  SEED_REGIONS,
  SEED_PRODUCTS,
  SEED_CROPS,
  SEED_ACTIVITIES,
} from "./data/seed";

export const store = {
  users: structuredClone(SEED_USERS) as any[],
  entries: structuredClone(SEED_ENTRIES) as any[],
  pos: structuredClone(SEED_POS) as any[],
  regions: structuredClone(SEED_REGIONS) as any[],
  products: [...SEED_PRODUCTS] as string[],
  crops: [...SEED_CROPS] as string[],
  activities: [...SEED_ACTIVITIES] as string[],
  bills: [] as any[],
  serviceReceivers: [] as any[],
  vendorProfiles: {} as Record<string, any>,
  budgetRequests: [] as any[],
  budgetRequestGroups: [] as any[],
};
