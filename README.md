# Dataruni

**Dataruni** is a lightweight, unified database system designed for React applications. It bridges the gap between persistent local storage (IndexedDB) and React state, providing a seamless "sync-to-state" experience for offline-first applications.

Built originally for the Codecious ecosystem, Dataruni abstracts away the complexity of IndexedDB, offering a simple hook-based API that feels just like `useState`, but with the power of a robust database backing it up.

## Features

- 🚀 **React-First API**: Use `useDataruniValue` just like `useState`.
- 💾 **IndexedDB Powered**: Handles large datasets asynchronously without blocking the UI.
- 🔄 **State Synchronization**: Automatically loads data on mount and persists updates in the background.
- 📦 **Zero-Config**: Works out of the box with sensible defaults, but fully configurable.
- 🔒 **Type-Safe**: Built with TypeScript for full type inference.
- 📱 **Offline Ready**: Perfect for PWAs and mobile-first web apps.

## Installation

```bash
npm install @codecious/dataruni
# or
pnpm add @codecious/dataruni
# or
yarn add @codecious/dataruni
```

## Usage

### Basic Usage

The core of Dataruni is the `useDataruniValue` hook. It binds a database key to a React state variable.

```tsx
import { useDataruniValue } from '@codecious/dataruni';

// Define your configuration once
const dbConfig = {
  dbName: 'MyAppDB',
  dbVersion: 1,
  storeName: 'my-store' // Optional, defaults to 'dataruni-store'
};

function AppSettings() {
  // usage is identical to useState, but with a key and config
  const [theme, setTheme, isLoading] = useDataruniValue<string>(
    'app-theme', // Key in the database
    'light',     // Default value
    dbConfig     // Database configuration
  );

  if (isLoading) {
    return <div>Loading preferences...</div>;
  }

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current theme: {theme}
    </button>
  );
}
```

### Advanced Configuration

You can manage complex objects and arrays easily. Dataruni handles the serialization and storage for you.

```tsx
interface UserProfile {
  id: string;
  name: string;
  preferences: {
    notifications: boolean;
  };
}

const [user, setUser] = useDataruniValue<UserProfile | null>(
  'user-profile',
  null,
  dbConfig
);

// Updates are persisted automatically
const updateName = (newName: string) => {
  setUser(prev => prev ? { ...prev, name: newName } : null);
};
```

## API Reference

### `useDataruniValue<T>(key, defaultValue, config)`

The main hook for data persistence.

- **Parameters**:
  - `key` (string): The unique identifier for the data in the store.
  - `defaultValue` (T): The value to use if no data is found in the DB or while loading.
  - `config` (DataruniConfig): Configuration object for the database connection.

- **Returns**: `[value, setValue, isLoading]`
  - `value` (T): The current state.
  - `setValue` (function): Function to update state and persist to DB. Accepts a value or a callback `(prev) => newValue`.
  - `isLoading` (boolean): True while the initial value is being fetched from IndexedDB.

### `initDB(config)`

Initializes the IndexedDB connection. Useful for pre-loading or side-effects outside of React components.

- **Parameters**:
  - `config` (DataruniConfig): `{ dbName: string, dbVersion?: number, storeName?: string }`

- **Returns**: `Promise<IDBDatabase>`

## License

MIT © [Codecious](https://github.com/rodrigoslayertech)
