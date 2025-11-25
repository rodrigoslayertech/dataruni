export interface DataruniConfig {
  dbName: string;
  dbVersion?: number;
  storeName?: string;
}

export interface DataruniOptions {
  config: DataruniConfig;
}
