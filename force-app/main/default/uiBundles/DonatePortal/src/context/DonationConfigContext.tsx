import { createContext, useContext, type ReactNode } from 'react';
import { fetchDonationConfig } from '@/api/donation/donationService';
import type { DonationConfig } from '@/api/donation/types';
import { useAsyncData } from '@/hooks/useAsyncData';

interface DonationConfigState {
  config: DonationConfig | null;
  loading: boolean;
  error: string | null;
}

const DonationConfigContext = createContext<DonationConfigState>({ config: null, loading: true, error: null });

/** Loads the org's donation settings + offered FinDock methods once and shares them with every page. */
export function DonationConfigProvider({ children }: { children: ReactNode }) {
  const { data, loading, error } = useAsyncData<DonationConfig>(fetchDonationConfig, []);
  return (
    <DonationConfigContext.Provider value={{ config: data, loading, error }}>{children}</DonationConfigContext.Provider>
  );
}

export function useDonationConfig(): DonationConfigState {
  return useContext(DonationConfigContext);
}
