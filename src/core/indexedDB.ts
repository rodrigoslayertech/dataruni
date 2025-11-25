import { DataruniConfig } from '../types';

let dbInstance: IDBDatabase | null = null;
let activeConfig: DataruniConfig | null = null;

export function initDB(config: DataruniConfig): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // If we already have a database instance and config matches, reuse it
    if (dbInstance && activeConfig?.dbName === config.dbName) {
      resolve(dbInstance);
      return;
    }

    activeConfig = config;
    const version = config.dbVersion || 1;
    const storeName = config.storeName || 'dataruni-store';

    const request = indexedDB.open(config.dbName, version);

    request.onerror = () => {
      console.error('Dataruni: IndexedDB initialization failed:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'key' });
      }
      
      console.log(`Dataruni: Schema upgraded to version ${version}`);
    };
  });
}

export async function getFromStore<T>(key: string, config: DataruniConfig): Promise<T | undefined> {
  const db = await initDB(config);
  const storeName = config.storeName || 'dataruni-store';
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result?.value);
    };

    request.onerror = () => {
      console.error(`Dataruni: Error getting ${key}:`, request.error);
      reject(request.error);
    };
  });
}

export async function setInStore<T>(key: string, value: T, config: DataruniConfig): Promise<void> {
  const db = await initDB(config);
  const storeName = config.storeName || 'dataruni-store';

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put({ key, value });

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      console.error(`Dataruni: Error setting ${key}:`, request.error);
      reject(request.error);
    };
  });
}
