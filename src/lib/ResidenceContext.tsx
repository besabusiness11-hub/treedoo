import React, { createContext, useContext, useState, useEffect } from 'react';

export type Residence = {
  id: string;
  address: string;
  interior: string;
  lat: number;
  lng: number;
};

const SAMPLE_RESIDENCES: Residence[] = [
  {
    id: '1',
    address: 'Via Garibaldi 15',
    interior: 'Int. 3A',
    lat: 41.8902, // Mock: Roma Centro
    lng: 12.4922,
  },
  {
    id: '2',
    address: 'Via Roma 10',
    interior: 'Int. 1',
    lat: 45.4642, // Mock: Milano Centro
    lng: 9.1900,
  }
];

interface ResidenceContextType {
  residences: Residence[];
  currentResidence: Residence;
  setResidence: (id: string) => void;
  addResidence: (res: Omit<Residence, 'id'>) => void;
  removeResidence: (id: string) => void;
  autoSwitch: boolean;
  setAutoSwitch: (val: boolean) => void;
  isNearAny: boolean;
}

const ResidenceContext = createContext<ResidenceContextType | undefined>(undefined);

export function ResidenceProvider({ children }: { children: React.ReactNode }) {
  const [residences, setResidences] = useState<Residence[]>(() => {
    const saved = localStorage.getItem('treedoo_residences');
    if (saved) return JSON.parse(saved);

    // Initial fallback if nothing saved
    return [{
      id: 'default',
      address: 'Via Garibaldi 15',
      interior: 'Int. 3A',
      lat: 41.8902,
      lng: 12.4922,
    }];
  });

  const [currentResidence, setCurrentResidence] = useState<Residence>(() => {
    const savedActive = localStorage.getItem('treedoo_active_residence');
    return residences.find(r => r.id === savedActive) || residences[0];
  });

  const [autoSwitch, setAutoSwitch] = useState<boolean>(() => {
    return localStorage.getItem('treedoo_auto_switch') === 'true';
  });

  const [isNearAny, setIsNearAny] = useState(false);

  useEffect(() => {
    localStorage.setItem('treedoo_residences', JSON.stringify(residences));
  }, [residences]);

  useEffect(() => {
    localStorage.setItem('treedoo_active_residence', currentResidence.id);
  }, [currentResidence]);

  useEffect(() => {
    localStorage.setItem('treedoo_auto_switch', autoSwitch.toString());
  }, [autoSwitch]);

  // Auto-switch logic
  useEffect(() => {
    if (!autoSwitch) return;

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;

        let nearest: Residence | null = null;
        let minDistance = Infinity;

        residences.forEach(res => {
          const dist = Math.sqrt(
            Math.pow(res.lat - latitude, 2) + Math.pow(res.lng - longitude, 2)
          );
          if (dist < 0.005) { // Roughly 500m threshold
            if (dist < minDistance) {
              minDistance = dist;
              nearest = res;
            }
          }
        });

        if (nearest && (nearest as Residence).id !== currentResidence.id) {
          setCurrentResidence(nearest);
        }

        setIsNearAny(!!nearest);
      }, undefined, { enableHighAccuracy: true });
    }, 10000);

    return () => clearInterval(interval);
  }, [autoSwitch, currentResidence.id, residences]);

  const setResidence = (id: string) => {
    const found = residences.find(r => r.id === id);
    if (found) setCurrentResidence(found);
  };

  const addResidence = (res: Omit<Residence, 'id'>) => {
    const newRes = { ...res, id: Date.now().toString() };
    setResidences(prev => [...prev, newRes]);
    setCurrentResidence(newRes);
  };

  const removeResidence = (id: string) => {
    if (residences.length <= 1) return; // Keep at least one
    setResidences(prev => {
      const filtered = prev.filter(r => r.id !== id);
      if (currentResidence.id === id) {
        setCurrentResidence(filtered[0]);
      }
      return filtered;
    });
  };

  return (
    <ResidenceContext.Provider value={{
      residences,
      currentResidence,
      setResidence,
      addResidence,
      removeResidence,
      autoSwitch,
      setAutoSwitch,
      isNearAny
    }}>
      {children}
    </ResidenceContext.Provider>
  );
}

export function useResidences() {
  const ctx = useContext(ResidenceContext);
  if (!ctx) throw new Error("useResidences must be used within ResidenceProvider");
  return ctx;
}
