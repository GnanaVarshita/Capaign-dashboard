import { useState, useCallback } from 'react';
import { Region } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CROPS, INITIAL_ACTIVITIES, INITIAL_REGIONS } from '../lib/mock-data';
import { api } from '../lib/api';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('ad_campaign_db');
    if (raw) {
      const d = JSON.parse(raw);
      return {
        products:   d.products   ?? INITIAL_PRODUCTS,
        crops:      d.crops      ?? INITIAL_CROPS,
        activities: d.activities ?? INITIAL_ACTIVITIES,
        regions:    d.regions    ?? INITIAL_REGIONS,
      };
    }
  } catch {}
  return { products: INITIAL_PRODUCTS, crops: INITIAL_CROPS, activities: INITIAL_ACTIVITIES, regions: INITIAL_REGIONS };
}

export function useConfig() {
  const stored = loadFromStorage();
  const [products, setProducts]     = useState<string[]>(stored.products);
  const [crops, setCrops]           = useState<string[]>(stored.crops);
  const [activities, setActivities] = useState<string[]>(stored.activities);
  const [regions, setRegions]       = useState<Region[]>(stored.regions);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await api.get('/api/config');
      if (data.products)   setProducts(data.products);
      if (data.activities) setActivities(data.activities);
      if (data.crops)      setCrops(data.crops);
      const regionData = await api.get('/api/regions');
      setRegions(regionData);
      return;
    } catch {}

    const fresh = loadFromStorage();
    setProducts(fresh.products);
    setCrops(fresh.crops);
    setActivities(fresh.activities);
    setRegions(fresh.regions);
  }, []);

  // --- Products ---
  const addProduct = useCallback(async (name: string) => {
    if (products.includes(name)) return;
    try { await api.post('/api/config/products', { name }); } catch {}
    setProducts(prev => [...prev, name]);
  }, [products]);

  const updateProduct = useCallback(async (oldName: string, newName: string) => {
    try { await api.put(`/api/config/products/${encodeURIComponent(oldName)}`, { name: newName }); } catch {}
    setProducts(prev => prev.map(p => p === oldName ? newName : p));
  }, []);

  const deleteProduct = useCallback(async (name: string) => {
    try { await api.delete(`/api/config/products/${encodeURIComponent(name)}`); } catch {}
    setProducts(prev => prev.filter(p => p !== name));
  }, []);

  // --- Activities ---
  const addActivity = useCallback(async (name: string) => {
    if (activities.includes(name)) return;
    try { await api.post('/api/config/activities', { name }); } catch {}
    setActivities(prev => [...prev, name]);
  }, [activities]);

  const updateActivity = useCallback(async (oldName: string, newName: string) => {
    try { await api.put(`/api/config/activities/${encodeURIComponent(oldName)}`, { name: newName }); } catch {}
    setActivities(prev => prev.map(a => a === oldName ? newName : a));
  }, []);

  const deleteActivity = useCallback(async (name: string) => {
    try { await api.delete(`/api/config/activities/${encodeURIComponent(name)}`); } catch {}
    setActivities(prev => prev.filter(a => a !== name));
  }, []);

  // --- Crops ---
  const addCrop = useCallback(async (name: string) => {
    if (crops.includes(name)) return;
    try { await api.post('/api/config/crops', { name }); } catch {}
    setCrops(prev => [...prev, name]);
  }, [crops]);

  const deleteCrop = useCallback(async (name: string) => {
    try { await api.delete(`/api/config/crops/${encodeURIComponent(name)}`); } catch {}
    setCrops(prev => prev.filter(c => c !== name));
  }, []);

  // --- Regions ---
  const addRegion = useCallback(async (region: Region) => {
    try { await api.post('/api/regions', region); } catch {}
    setRegions(prev => [...prev, region]);
  }, []);

  const updateRegion = useCallback(async (name: string, updates: Partial<Region>) => {
    try { await api.put(`/api/regions/${encodeURIComponent(name)}`, updates); } catch {}
    setRegions(prev => prev.map(r => r.name === name ? { ...r, ...updates } : r));
  }, []);

  return {
    products, setProducts, crops, setCrops, activities, setActivities, regions, setRegions,
    fetchConfig,
    addProduct, updateProduct, deleteProduct,
    addActivity, updateActivity, deleteActivity,
    addCrop, deleteCrop,
    addRegion, updateRegion,
  };
}
