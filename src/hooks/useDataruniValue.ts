import { useState, useEffect, useCallback, useRef } from 'react';
import { getFromStore, setInStore } from '../core/indexedDB';
import { DataruniConfig } from '../types';

export function useDataruniValue<T>(
  key: string, 
  defaultValue: T, 
  config: DataruniConfig
) {
  const defaultValueRef = useRef<T>(defaultValue);
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadValue() {
      try {
        const stored = await getFromStore<T>(key, config);
        if (mounted) {
          setValue(stored !== undefined ? stored : defaultValueRef.current);
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`Dataruni: Error loading ${key}:`, error);
        if (mounted) {
          setValue(defaultValueRef.current);
          setIsLoading(false);
        }
      }
    }

    loadValue();

    return () => {
      mounted = false;
    };
  }, [key, config]);

  const updateValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const updated = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
      
      setInStore(key, updated, config).catch(error => {
        console.error(`Dataruni: Error saving ${key}:`, error);
      });
      
      return updated;
    });
  }, [key, config]);

  return [value, updateValue, isLoading] as const;
}
