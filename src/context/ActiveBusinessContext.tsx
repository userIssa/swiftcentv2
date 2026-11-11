'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchJsonWithBuffer } from '@/lib/api-fetch';

export interface BusinessProfile {
  _id: string;
  name: string;
  email: string;
  currency: string;
  quotePrefix?: string;
  invoicePrefix?: string;
  taxId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
}

interface ActiveBusinessContextType {
  activeBusiness: BusinessProfile | null;
  businesses: BusinessProfile[];
  loading: boolean;
  setActiveBusinessId: (id: string) => void;
  refreshBusinesses: () => Promise<void>;
}

const ActiveBusinessContext = createContext<ActiveBusinessContextType>({
  activeBusiness: null,
  businesses: [],
  loading: true,
  setActiveBusinessId: () => {},
  refreshBusinesses: async () => {},
});

export function ActiveBusinessProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [activeBusinessId, setActiveBusinessIdState] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchBusinesses = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setBusinesses([]);
      setActiveBusinessIdState('');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchJsonWithBuffer('/api/organizations', {
        timeoutMs: 18000,
        retry: true,
      });
      if (data.success && Array.isArray(data.organizations)) {
        setBusinesses(data.organizations);

        if (data.organizations.length > 0) {
          const userStorageKey = `swiftcent_active_org_${user.id}`;
          const savedId = typeof window !== 'undefined' ? localStorage.getItem(userStorageKey) : null;
          const exists = data.organizations.some((b: BusinessProfile) => b._id === savedId);

          if (savedId && exists) {
            setActiveBusinessIdState(savedId);
          } else {
            const firstId = data.organizations[0]._id;
            setActiveBusinessIdState(firstId);
            if (typeof window !== 'undefined') {
              localStorage.setItem(userStorageKey, firstId);
            }
          }
        } else {
          setActiveBusinessIdState('');
        }
      }
    } catch (err) {
      console.error('Failed to load businesses', err);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const setActiveBusinessId = (id: string) => {
    setActiveBusinessIdState(id);
    const userStorageKey = user ? `swiftcent_active_org_${user.id}` : 'swiftcent_active_org';
    if (typeof window !== 'undefined') {
      localStorage.setItem(userStorageKey, id);
    }
  };

  const activeBusiness = businesses.find((b) => b._id === activeBusinessId) || businesses[0] || null;

  return (
    <ActiveBusinessContext.Provider
      value={{
        activeBusiness,
        businesses,
        loading,
        setActiveBusinessId,
        refreshBusinesses: fetchBusinesses,
      }}
    >
      {children}
    </ActiveBusinessContext.Provider>
  );
}

export function useActiveBusiness() {
  return useContext(ActiveBusinessContext);
}
