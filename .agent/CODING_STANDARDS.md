# Coding Standards

- **Language:** TypeScript
- **Typing:** Strict typing (no `any` unless absolutely unavoidable).
- **Architecture:** Reusable components.
- **Naming:** Clear, descriptive naming for functions and variables.
- **Function Size:** Small, focused functions.
- **Component Size:** No giant components; break down complex UI.
- **DRY:** No duplicated logic.
- **Dependencies:** No unnecessary dependencies.
- **Data:** No hardcoded employee data (except the single Phase 0 test record where appropriate during early testing).
- **Secrets:** No hardcoded credentials.

## Requirements
- TypeScript interfaces/types must be defined for data structures.
- Consistent file naming (e.g., PascalCase for React components, kebab-case for utilities if preferred, just be consistent).
- Predictable folder organisation.
- Proper async error handling (try/catch blocks, displaying appropriate UI).
- Loading states.
- Empty states.
- Error states.
- Comments only where logic is not self-explanatory.

> **Note:** Do not create excessive abstraction for an MVP.
