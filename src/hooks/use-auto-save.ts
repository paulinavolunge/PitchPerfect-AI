
import { useState, useEffect, useCallback } from 'react';

interface AutoSaveOptions {
  key: string;
  data: Record<string, unknown>;
  interval?: number; // in milliseconds
  onSave?: (data: Record<string, unknown>) => void;
  onRestore?: (data: any) => void;
}

export const useAutoSave = ({
  key,
  data,
  interval = 30000, // default to 30 seconds
  onSave,
  onRestore
}: AutoSaveOptions) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isRestored, setIsRestored] = useState(false);

  // Save data to localStorage
  const saveData = useCallback(() => {
    try {
      const dataToSave = {
        timestamp: new Date().toISOString(),
        data
      };
      localStorage.setItem(key, JSON.stringify(dataToSave));
      setLastSaved(new Date());
      if (onSave) onSave(data);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [data, key, onSave]);

  // Restore data from localStorage
  const restoreData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(key);
      if (savedData) {
        const { timestamp, data: storedData } = JSON.parse(savedData);
        if (onRestore) onRestore(storedData);
        setLastSaved(new Date(timestamp));
        setIsRestored(true);
        return storedData;
      }
    } catch (error) {
      console.error('Error restoring data:', error);
    }
    return null;
  }, [key, onRestore]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setLastSaved(null);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }, [key]);

  // Set up auto-save interval
  useEffect(() => {
    const timer = setInterval(() => {
      saveData();
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [interval, saveData]);

  // Initial restore on component mount
  useEffect(() => {
    if (!isRestored) {
      restoreData();
    }
  }, [isRestored, restoreData]);

  return {
    lastSaved,
    saveData,
    restoreData,
    clearSavedData,
    isRestored
  };
};
