import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getPublicPageSettings } from '../services/admin';

interface PageSettingsContextType {
  pages: Record<string, { enabled: boolean; name: string }>;
  isLoading: boolean;
  isPageEnabled: (path: string) => boolean;
  getPageName: (path: string) => string;
  refreshSettings: () => Promise<void>;
}

const PageSettingsContext = createContext<PageSettingsContextType | null>(null);

export const usePageSettings = () => {
  const context = useContext(PageSettingsContext);
  if (!context) {
    throw new Error('usePageSettings must be used within a PageSettingsProvider');
  }
  return context;
};

interface PageSettingsProviderProps {
  children: ReactNode;
}

export const PageSettingsProvider: React.FC<PageSettingsProviderProps> = ({ children }) => {
  const [pages, setPages] = useState<Record<string, { enabled: boolean; name: string }>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await getPublicPageSettings();
      setPages(data.pages);
    } catch (err) {
      console.error('Failed to fetch page settings:', err);
      // On error, assume all pages are enabled
      setPages({});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const isPageEnabled = (path: string): boolean => {
    // If no settings loaded or page not in settings, assume enabled
    if (Object.keys(pages).length === 0) return true;
    const pageSetting = pages[path];
    return pageSetting ? pageSetting.enabled : true;
  };

  const getPageName = (path: string): string => {
    const pageSetting = pages[path];
    return pageSetting ? pageSetting.name : path;
  };

  const refreshSettings = async () => {
    setIsLoading(true);
    await fetchSettings();
  };

  return (
    <PageSettingsContext.Provider value={{ pages, isLoading, isPageEnabled, getPageName, refreshSettings }}>
      {children}
    </PageSettingsContext.Provider>
  );
};

export default PageSettingsContext;
