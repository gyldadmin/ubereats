### **1. Architecture Rules**

**Folder roles**

- `services/` → All server I/O (Supabase, REST). No React imports. No Zustand.
- `hooks/` → Orchestrate fetching/mutations, lifecycles, optimistic updates; expose minimal APIs to components.
- `store/` → Zustand for **client/UI-only state** (composer, modals, filters, toasts). Never store server lists or server cache here.
- `components/` → Pure UI rendering + event wiring only.
- `screens/` → Page-level composition of components + hooks.
- `types/` → Shared TypeScript interfaces and type definitions.

**No cross-contamination**: each layer stays in its lane.

---

### **2. State Rules**

- **Server data** (feeds, profiles, counts) → services + hooks (or TanStack Query if adopted).
- **Global UI state** (composer open/draft, global filters, toasts) → Zustand store.
- **Ephemeral UI state** (toggle, pressed, expand/collapse) → component-level state.
- **Read‑mostly globals** (current user ID, config) → React Context.

---

### **3. Prompting Rules, unless explicitly overridden by prompter**

- Every request is **PR-sized** (single feature/sub-feature). No mega-diffs.
- Each request must have **acceptance criteria**: define “done.”
- Freeze **types & contracts** once set; changes require a “Type Change Proposal” prompt.
- No adding/changing dependencies without explicit proposal & approval.
- Agent specifies **exact files** to be edited before any edit.
- Require a **plan step** before coding:
    
    ```
    pgsql
    CopyEdit
    Step 1: Explain in plain English how you’ll do this while following the rules.
    Step 2: Write the code.
    
    ```
    

---

### **4. Testing Rules**

- New **services/hooks** require **unit tests** (mocking network/services).
- Core app flows get **light E2E** happy-path tests early (e.g., load feed → like → compose).
- All tests runnable with:
    
    ```
    bash
    CopyEdit
    pnpm test       # unit/integration
    pnpm e2e:ios    # mobile E2E
    
    ```
    

---

### **5. Lint & Format**

- Use **ESLint**, **Prettier**, and **TypeScript strict** mode.
- No disabling lint rules unless approved in PR.
- Match existing formatting; run:
    
    ```
    lua
    CopyEdit
    pnpm lint
    pnpm format
    
    ```
    
    before commit.
    

---

### **6. Acceptance Checklist for Every Change**

1. Follows **folder purpose** rules.
2. Respects **state rules** (no server data in Zustand).
3. No unapproved dependency changes.
4. Passes lint, format, type-check, and tests.
5. Includes tests for new services/hooks.
6. Meets acceptance criteria in the prompt.