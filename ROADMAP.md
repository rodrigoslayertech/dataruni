# Dataruni Roadmap

*Unified Database System for PWA React projects.*

## 🚀 Short-term Goals
- [ ] **Advanced Querying**:
    - [ ] Fluent query builder (e.g., `.where('age', '>', 18).orderBy('name')`).
    - [ ] Full-text search capabilities within the client-side DB.
- [ ] **Schema Management**:
    - [ ] Migration system for handling IndexedDB version changes and data transformation.
    - [ ] Strict TypeScript schema validation and inference.
- [ ] **React Integration**:
    - [ ] Hooks for common patterns: `useQuery`, `useLiveQuery` (reactive updates).
    - [ ] Built-in pagination and infinite scroll helpers.

## 🌟 Long-term Vision
- [ ] **Sync Engine (Sync Adapters)**:
    - [ ] Pluggable adapters for remote backends (Supabase, Firebase, REST API, GraphQL).
    - [ ] Offline-first conflict resolution strategies.
- [ ] **Performance**:
    - [ ] Web Worker support to offload database operations from the main thread.
    - [ ] Compression for large datasets stored locally.
- [ ] **DevTools**:
    - [ ] Browser extension or in-app debugger to inspect and modify the local database state.

---

## 🤝 Contributing
We welcome contributions! If you have ideas or want to work on any of these items, please open an issue or a pull request.
