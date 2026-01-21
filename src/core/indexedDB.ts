import { DataruniConfig } from '../types';

let dbInstance: IDBDatabase | null = null;
let activeConfig: DataruniConfig | null = null;
let initializationPromise: Promise<IDBDatabase> | null = null;

/**
 * Reset the database connection (used for recovery)
 */
export function resetDBConnection(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  activeConfig = null;
  initializationPromise = null;
}

/**
 * Close the database connection gracefully
 * Call this before switching to a different database to prevent blocking
 */
export function closeDB(): Promise<void> {
  return new Promise((resolve) => {
    if (dbInstance) {
      // Set onversionchange to handle other tabs/contexts trying to upgrade
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        activeConfig = null;
        initializationPromise = null;
      };
      
      dbInstance.close();
      dbInstance = null;
    }
    activeConfig = null;
    initializationPromise = null;
    
    // Small delay to ensure the close propagates
    setTimeout(resolve, 50);
  });
}

/**
 * Delete and recreate the database (used for recovery when store is missing)
 */
async function recreateDatabase(config: DataruniConfig): Promise<IDBDatabase> {
  console.warn(`Dataruni: Recreating database "${config.dbName}" due to missing object store`);
  
  // Close existing connection
  resetDBConnection();
  
  // Delete the database
  await new Promise<void>((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(config.dbName);
    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onerror = () => reject(deleteRequest.error);
    deleteRequest.onblocked = () => {
      console.warn('Dataruni: Database deletion blocked, retrying...');
      resolve(); // Continue anyway
    };
  });
  
  // Reinitialize with fresh database
  return initDB(config, false);
}

export function initDB(config: DataruniConfig, allowRecovery = true): Promise<IDBDatabase> {
  const version = config.dbVersion || 1;
  const storeName = config.storeName || 'dataruni-store';
  
  // If we already have a database instance and config matches (name, version, storeName), reuse it
  // But also verify the store exists
  if (dbInstance && 
      activeConfig?.dbName === config.dbName && 
      activeConfig?.dbVersion === version &&
      activeConfig?.storeName === storeName) {
    // Verify the store exists
    if (dbInstance.objectStoreNames.contains(storeName)) {
      return Promise.resolve(dbInstance);
    } else if (allowRecovery) {
      // Store doesn't exist, need to recreate
      return recreateDatabase(config);
    }
  }
  
  // If already initializing the same config, wait for it
  if (initializationPromise && 
      activeConfig?.dbName === config.dbName && 
      activeConfig?.dbVersion === version &&
      activeConfig?.storeName === storeName) {
    return initializationPromise;
  }
  
  // Close existing connection if config changed
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }

  activeConfig = { ...config, dbVersion: version, storeName };

  initializationPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(config.dbName, version);

    request.onerror = () => {
      console.error('Dataruni: IndexedDB initialization failed:', request.error);
      initializationPromise = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;
      
      // Verify the store exists after opening
      if (!db.objectStoreNames.contains(storeName)) {
        db.close();
        dbInstance = null;
        initializationPromise = null;
        
        if (allowRecovery) {
          // Store doesn't exist, recreate database
          recreateDatabase(config).then(resolve).catch(reject);
          return;
        } else {
          reject(new Error(`Object store "${storeName}" not found in database "${config.dbName}"`));
          return;
        }
      }
      
      dbInstance = db;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'key' });
        console.log(`Dataruni: Created object store "${storeName}"`);
      }
      
      console.log(`Dataruni: Schema upgraded to version ${version}`);
    };
  });
  
  return initializationPromise;
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
