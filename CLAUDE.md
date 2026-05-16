# CLAUDE.md — Path to Glory Campaign Manager

## 0. How to Use This Document

This file is the **single source of truth** for the project.

**At the start of every session, Claude must:**

1. Read this entire file before doing anything else.
2. Check section 20 (Current Project Status) to know which phase is active and what is done.
3. Confirm the active phase to the user before writing any code.
4. Never advance to the next phase without explicit user confirmation.

**Conflict resolution:**

If there is any conflict between chat history and this document, **this document wins.**

---

# 1. Project Goal

Build a mobile-first web app to manage Age of Sigmar Path to Glory campaigns.

The app is for a **single user**.

The app **does not need:**

- login / authentication / user accounts
- cloud sync / collaboration / backend services
- Supabase / Firebase / server database

The app **must:**

- work well on a mobile phone
- be installable as a PWA
- be data-driven: faction rules live as versioned JSON files; the UI is generated from those rule files

**Data-driven rule:**

- Faction-specific rules must not be hardcoded inside React components.
- Adding a normal new faction should require adding JSON data only, not changing UI logic.

---

# 2. Product Scope

## 2.1 MVP Scope

The MVP must allow the user to:

- Create campaigns.
- Create heroes.
- Select faction, hero type, archetype, origin, flaw.
- Select battle skills gained through progression.
- Calculate destiny points spent.
- Derive the hero destiny budget from rules.
- Validate that the hero does not exceed the available destiny budget.
- Show a mobile-friendly hero summary sheet.
- Save data locally on the device/browser.
- Export user data as a JSON backup.
- Import user data from a JSON backup.
- Show warnings for rules that require manual review.

## 2.2 Out of Scope for MVP

Do not implement:

- login / backend / cloud sync / Supabase / Firebase / multiplayer
- shadcn/ui
- code-splitting by faction
- server APIs / payment features
- army roster building outside Path to Glory hero/campaign management
- artifacts / spells / mount traits / advanced campaign systems
- complex visual polish before the domain model works
- AI-generated rule ingestion inside the app

## 2.3 Proof of Concept Faction

Use **Idoneth Deepkin** as the first faction.

The architecture must allow adding more factions later without touching React components or domain logic, unless the new faction introduces a genuinely new mechanic.

---

# 3. Final Stack

**Use:**

| Concern | Library / Tool |
|---|---|
| UI framework | React 19 |
| Build tool | Vite |
| Language | TypeScript strict mode |
| Styling | Tailwind CSS |
| UI primitives | Custom, in `src/ui/primitives` |
| Application state | Zustand |
| Local persistence | Dexie over IndexedDB |
| JSON validation | Zod |
| Testing | Vitest |
| PWA | vite-plugin-pwa / Workbox |
| Deployment | Cloudflare Pages |

**Do not use in the MVP:**

shadcn/ui · Supabase · Firebase · backend APIs · authentication · Redux · Next.js · React Native · code-splitting by faction · unnecessary component libraries

## 3.1 Why This Stack

**React + TypeScript:** data-driven app benefits from strong typing; reliable tooling; static PWA deployment.

**Dexie/IndexedDB:** survives app redeploys; larger capacity than localStorage; async API; schema versioning for migrations.

**No backend:** single-user; no sync required; local-first behaviour is more important for the MVP.

---

# 4. Development Environment

- **Node:** use the version specified in `.nvmrc` if present, otherwise Node 20 LTS.
- **Package manager:** npm.
- **Scripts that must always pass before ending a phase:**

```json
{
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "build": "vite build"
}
```

---

# 5. UI Policy

## 5.1 Component Primitives

Do not use shadcn/ui in the MVP. Use Tailwind CSS and simple custom primitives.

Required primitives in `src/ui/primitives/`:

- `Button`
- `Input`
- `Textarea`
- `Card`
- `Badge`
- `Dialog`
- `RadioCard` / `SelectCard`
- `PageContainer`
- `SectionHeader`

Use native HTML elements where possible. A native `<dialog>` is acceptable for simple confirmations.

Only reconsider shadcn/ui if the project later needs genuinely complex accessible components such as: searchable combobox, command palette, complex modal system, date picker, advanced dropdown system.

## 5.2 Mobile-First Rules

The app must be designed mobile-first.

Prioritise:

- single-column layouts
- large tap targets (minimum 44px height for interactive elements)
- readable text
- sticky bottom actions where useful
- minimal typing
- card-based selections
- clear validation messages
- no dense desktop tables in MVP

---

# 6. Architecture

Use a layered architecture:

```text
UI Layer
↓
Application Layer
↓
Domain Layer
↓
Data Layer
```

---

## 6.1 UI Layer

**Location:** `src/ui/` · `src/features/`

**Responsibilities:** React components, layout, mobile-first screens, forms, visual states, displaying validation messages, displaying rule warnings, displaying manual review badges.

**Rules:**

- Must not contain faction-specific logic.
- Must not hardcode Idoneth, Stormcast, Tzeentch, or any other faction rule.
- Must not calculate destiny costs directly.
- Must not evaluate rule restrictions directly.
- Receives derived data from application/domain services only.

---

## 6.2 Application Layer

**Location:** `src/features/`

**Responsibilities:** wizard flow, page orchestration, Zustand stores, calling repositories, calling domain services, navigation between steps, converting user actions into domain calls.

**Example features:**

```text
src/features/campaigns/
src/features/heroes/
src/features/backup/
```

**Rules:**

- May depend on domain and data repositories and React/Zustand.
- Must not implement business calculations itself.

---

## 6.3 Domain Layer

**Location:** `src/domain/`

**Responsibilities:** pure TypeScript types, rules types, hero types, campaign/user data types, rules engine, restriction evaluation, hero validation, destiny cost calculation, destiny budget derivation, migrations.

**Hard rules:**

- Must not import React, React DOM, Dexie, or any browser DOM API.
- Must be testable with Vitest in Node mode.
- All validation and calculation logic lives here.
- If `src/domain/` cannot be copied into a Node project and tested independently, the architecture is wrong.

---

## 6.4 Data Layer

**Location:** `src/data/`

**Responsibilities:** static rule JSON files, rule loading, Zod validation of rules data, Dexie database setup, user repositories, backup export/import.

**Rules:**

- May use Dexie and browser APIs.
- May import domain types.
- Must not contain UI components.
- Must not contain business rules that belong in the domain.

---

# 7. Folder Structure

```text
src/
├─ app/
│  ├─ App.tsx
│  ├─ router.tsx
│  └─ pwa.ts
│
├─ ui/
│  ├─ primitives/
│  │  ├─ Button.tsx
│  │  ├─ Input.tsx
│  │  ├─ Textarea.tsx
│  │  ├─ Card.tsx
│  │  ├─ Badge.tsx
│  │  ├─ Dialog.tsx
│  │  └─ RadioCard.tsx
│  │
│  └─ layout/
│     ├─ PageContainer.tsx
│     └─ SectionHeader.tsx
│
├─ features/
│  ├─ campaigns/
│  │  ├─ CampaignListPage.tsx
│  │  ├─ CampaignDetailPage.tsx
│  │  └─ campaignStore.ts
│  │
│  ├─ heroes/
│  │  ├─ HeroWizard/
│  │  │  ├─ HeroWizardPage.tsx
│  │  │  ├─ steps/
│  │  │  └─ heroWizardStore.ts
│  │  ├─ HeroSheet.tsx
│  │  └─ heroStore.ts
│  │
│  └─ backup/
│     ├─ BackupPage.tsx
│     └─ backupStore.ts
│
├─ domain/
│  ├─ rules/
│  │  ├─ types.ts
│  │  ├─ rulesEngine.ts
│  │  ├─ restrictions.ts
│  │  └─ destinyCost.ts
│  │
│  ├─ hero/
│  │  ├─ types.ts
│  │  ├─ heroValidator.ts
│  │  └─ heroFactory.ts
│  │
│  └─ migrations/
│     ├─ index.ts
│     └─ v1_to_v2.ts
│
├─ data/
│  ├─ rules/
│  │  ├─ _meta.json
│  │  ├─ index.ts
│  │  ├─ schemas.ts
│  │  ├─ shared/
│  │  │  ├─ archetypes.json
│  │  │  ├─ origins.json
│  │  │  └─ flaws.json
│  │  └─ factions/
│  │     └─ idoneth-deepkin/
│  │        ├─ meta.json
│  │        ├─ faction.json
│  │        ├─ heroes.json
│  │        └─ battle-skills.json
│  │
│  └─ persistence/
│     ├─ db.ts
│     ├─ userRepository.ts
│     └─ backup.ts
│
├─ test/
│
└─ main.tsx
```

Do not create additional top-level folders unless needed and justified.

---

# 8. Versioning Model

There are three independent versioning systems.

## 8.1 Global Rules Data Format Version

Stored in `src/data/rules/_meta.json`.

```json
{
  "appDataFormatVersion": 1,
  "generatedAt": "2026-05-10T00:00:00Z",
  "notes": "Initial MVP rules data contract."
}
```

Increment when the shape of rule JSON files changes (e.g. adding a new restriction type).

## 8.2 Faction Rules Version

Stored per faction in `src/data/rules/factions/<factionId>/meta.json`.

```json
{
  "factionId": "idoneth-deepkin",
  "factionRulesVersion": "2026-05-idoneth-v1",
  "factionRulesUpdatedAt": "2026-05-10",
  "factionRulesNotes": "Initial proof of concept version."
}
```

Each faction can update independently. Each hero stores the faction rules version used when created. If the current faction version differs from the hero creation version, the UI shows a warning badge: **"Rules updated — review"**.

Do not automatically migrate heroes to new faction rules.

## 8.3 User Data Schema Version

Stored in the `UserDataEnvelope` saved in IndexedDB.

```ts
export interface UserDataEnvelope {
  userDataSchemaVersion: number;
  exportedAt?: string;
  campaigns: Campaign[];
}
```

Increment when the shape of campaigns/heroes changes. Use migration functions `v1_to_v2`, `v2_to_v3`, etc. Run migrations on app startup and when importing old backups.

## 8.4 Versioning Reference Table

| Change | appDataFormatVersion | factionRulesVersion | userDataSchemaVersion |
|---|:---:|:---:|:---:|
| Add new restriction type | ✓ | — | — |
| Fix cost of an Idoneth skill | — | ✓ Idoneth only | — |
| Add Stormcast faction | — | ✓ Stormcast initial | — |
| Add `experiencePoints` to Hero | — | — | ✓ |
| Rename `battleSkillIds` to `progressionSkillIds` | — | — | ✓ |

---

# 9. Core TypeScript Model

The exact implementation may evolve, but start from this conceptual model.

## 9.1 Versioning Types

```ts
export const APP_DATA_FORMAT_VERSION = 1;
export const USER_DATA_SCHEMA_VERSION = 1;

export interface RulesMeta {
  appDataFormatVersion: number;
  generatedAt: string;
  notes?: string;
}

export interface FactionMeta {
  factionId: string;
  factionRulesVersion: string;
  factionRulesUpdatedAt: string;
  factionRulesNotes?: string;
}
```

## 9.2 Restrictions

```ts
export type Restriction =
  | { type: "minLevel"; value: number }
  | { type: "requiresSkillIds"; ids: string[] }
  | { type: "excludesSkillIds"; ids: string[] }
  | { type: "requiresArchetypeId"; id: string }
  | { type: "requiresHeroOptionIds"; ids: string[] }
  | { type: "maxPerHero"; value: number }
  | { type: "custom"; description: string };
```

Known restriction types are evaluated by the domain engine. `custom` restrictions are not automatically enforced — they must trigger a manual review warning.

## 9.3 RuleEntry

All relevant rule entities should extend this:

```ts
export interface RuleEntry {
  id: string;
  name: string;
  description: string;   // short readable summary
  ruleText: string;      // curated text; do not invent
  tags: string[];        // classification/filtering
  restrictions: Restriction[];
  needsManualReview: boolean;
}
```

Do not attempt to make every rule 100% computable in the MVP.

## 9.4 Rules Types

```ts
export type GrandAlliance = "order" | "chaos" | "death" | "destruction";

export interface Faction extends FactionMeta {
  name: string;
  grandAlliance: GrandAlliance;
  lore?: string;
}

export interface HeroOption extends RuleEntry {
  baseDestinyCost: number;
  allowedArchetypeIds: string[];
  allowedBattleSkillTableIds: string[];
  destinyBudgetByLevel?: Record<number, number>;
}

export interface Archetype extends RuleEntry {}
export interface Origin extends RuleEntry {}
export interface Flaw extends RuleEntry {}

export interface BattleSkill extends RuleEntry {
  destinyCost: number;
}

export interface BattleSkillTable {
  id: string;
  name: string;
  skills: BattleSkill[];
}

export interface LoadedRuleset {
  meta: RulesMeta;
  factions: Faction[];
  archetypes: Archetype[];
  origins: Origin[];
  flaws: Flaw[];
  heroOptionsByFactionId: Record<string, HeroOption[]>;
  battleSkillTablesByFactionId: Record<string, BattleSkillTable[]>;
}
```

## 9.5 User Data Types

```ts
export type Uuid = string;

export interface UserDataEnvelope {
  userDataSchemaVersion: number;
  exportedAt?: string;
  campaigns: Campaign[];
}

export interface Campaign {
  id: Uuid;
  name: string;
  createdAt: string;
  updatedAt: string;
  destinyBudgetOverride?: number;
  heroes: Hero[];
}

export interface Hero {
  id: Uuid;
  name: string;
  factionId: string;
  factionRulesVersionAtCreation: string;
  heroOptionId: string;
  archetypeId: string;
  originId: string;
  flawId: string;
  level: number;
  battleSkillIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

## 9.6 Validation Types

```ts
export interface HeroCostBreakdown {
  base: number;
  battleSkills: number;
  total: number;
  budget: number;
  isValid: boolean;
  violations: ValidationIssue[];
}

export interface ValidationIssue {
  code:
    | "DESTINY_BUDGET_EXCEEDED"
    | "RESTRICTION_FAILED"
    | "MANUAL_REVIEW_PENDING"
    | "MISSING_RULE_DATA"
    | "UNKNOWN_HERO_OPTION"
    | "UNKNOWN_BATTLE_SKILL"
    | "UNKNOWN_ARCHETYPE"
    | "UNKNOWN_ORIGIN"
    | "UNKNOWN_FLAW"
    | "UNKNOWN_FACTION";
  message: string;
  ruleEntryId?: string;
  fieldPath?: string;
}
```

---

# 10. Destiny Budget

Do not store the destiny point limit directly on the hero.

**Resolution order for `deriveDestinyBudget(hero, rules, campaign)`:**

1. If `campaign.destinyBudgetOverride` exists, use it.
2. Otherwise, find the selected `HeroOption`.
3. Use `HeroOption.destinyBudgetByLevel[hero.level]`.
4. If the exact level is not present, use the last defined level ≤ the current hero level.
5. If no budget can be derived, return a `MISSING_RULE_DATA` validation issue.

`Campaign.destinyBudgetOverride` exists only as an optional house rule override.

`Hero` stores only the user's choices, not duplicated derived values.

---

# 11. Rules JSON Format

## 11.1 Global Rules Meta

`src/data/rules/_meta.json`:

```json
{
  "appDataFormatVersion": 1,
  "generatedAt": "2026-05-10T00:00:00Z",
  "notes": "Initial MVP rules data contract."
}
```

## 11.2 Faction Meta

`src/data/rules/factions/idoneth-deepkin/meta.json`:

```json
{
  "factionId": "idoneth-deepkin",
  "factionRulesVersion": "2026-05-idoneth-v1",
  "factionRulesUpdatedAt": "2026-05-10",
  "factionRulesNotes": "Initial proof of concept version."
}
```

## 11.3 Faction

`src/data/rules/factions/idoneth-deepkin/faction.json`:

```json
{
  "id": "idoneth-deepkin",
  "name": "Idoneth Deepkin",
  "grandAlliance": "order",
  "lore": "Short curated faction summary."
}
```

## 11.4 Hero Options

`src/data/rules/factions/idoneth-deepkin/heroes.json`:

```json
[
  {
    "id": "akhelian-king",
    "name": "Akhelian King",
    "description": "Martial Akhelian leader mounted on a Deepmare.",
    "ruleText": "Rule text or curated summary entered by the user.",
    "tags": ["melee", "akhelian", "mounted"],
    "restrictions": [],
    "needsManualReview": false,
    "baseDestinyCost": 6,
    "allowedArchetypeIds": ["champion", "conqueror", "slayer"],
    "allowedBattleSkillTableIds": ["idoneth-akhelian-skills"],
    "destinyBudgetByLevel": {
      "1": 4,
      "2": 6,
      "3": 8
    }
  }
]
```

If a value is uncertain, mark it clearly with a comment or TODO. Do not invent rules.

## 11.5 Battle Skills

`src/data/rules/factions/idoneth-deepkin/battle-skills.json`:

```json
{
  "tables": [
    {
      "id": "idoneth-akhelian-skills",
      "name": "Akhelian Battle Skills",
      "skills": [
        {
          "id": "tide-rider",
          "name": "Tide Rider",
          "description": "Short summary of the rule.",
          "ruleText": "Rule text or curated summary entered by the user.",
          "tags": ["movement", "charge"],
          "restrictions": [
            { "type": "minLevel", "value": 2 }
          ],
          "needsManualReview": false,
          "destinyCost": 1
        },
        {
          "id": "tide-of-souls",
          "name": "Tide of Souls",
          "description": "Narrative ability with special campaign timing.",
          "ruleText": "Rule text or curated summary entered by the user.",
          "tags": ["narrative", "campaign"],
          "restrictions": [
            {
              "type": "custom",
              "description": "Only applies during a special narrative step; user must validate manually."
            }
          ],
          "needsManualReview": true,
          "destinyCost": 2
        }
      ]
    }
  ]
}
```

## 11.6 Shared Rules

`src/data/rules/shared/archetypes.json`, `origins.json`, `flaws.json` — each is an array of `RuleEntry`:

```json
[
  {
    "id": "champion",
    "name": "Champion",
    "description": "Archetype focused on direct combat.",
    "ruleText": "Rule text or curated summary entered by the user.",
    "tags": ["melee", "starter"],
    "restrictions": [],
    "needsManualReview": false
  }
]
```

---

# 12. Rule Text Policy

Do not invent exact rule text.

If real rule text is not provided, use the placeholder:

```text
"Rule text or curated summary entered by the user."
```

For copyrighted source material:
- Do not generate long verbatim passages.
- Prefer user-entered text, short summaries, or curated paraphrases.
- Preserve exact names of units/options when needed.
- Mark uncertain rule data as needing review.

Use `needsManualReview: true` when:
- the rule cannot be fully automated
- the source is uncertain
- a restriction is narrative or contextual
- manual interpretation is required

---

# 13. Persistence

Use Dexie over IndexedDB.

Data must survive app updates as long as the app remains on the same domain/origin.

**At app startup:**

1. Open the Dexie database.
2. Read user data.
3. Check `userDataSchemaVersion`.
4. Run migrations if needed.
5. Create an automatic pre-migration backup before destructive changes.

Use `navigator.storage.persist()` where available to reduce the risk of browser storage eviction.

**Show the user:**

- persistent storage status
- last backup date
- reminder if no backup has been exported for more than a configured number of days

---

# 14. Backup

Backup is mandatory in the MVP.

**Export:**

- generate a single JSON file containing `UserDataEnvelope`
- include `userDataSchemaVersion` and `exportedAt`
- download filename: `path-to-glory-backup-YYYY-MM-DD.json`
- use Web Share API on mobile if available

**Import:**

- accept a JSON file
- validate with Zod before touching IndexedDB
- reject invalid files with a clear error message
- if backup has an older schema version, run migrations
- MVP: replace all current data after explicit user confirmation
- future: support merging by IDs

---

# 15. PWA

Use: `vite-plugin-pwa`, web app manifest, app icons, offline shell cache, update prompt on new version.

**Minimum PWA goals:**

- app opens from mobile home screen
- app shell loads even with poor connection
- static rules are precached
- user data remains local in IndexedDB

Do not overcomplicate offline behaviour in the MVP.

---

# 16. Testing Strategy

**Minimum domain test coverage for the MVP:**

- `destinyCost.calculate`
- `deriveDestinyBudget`
- known restriction evaluation
- custom restriction handling
- `needsManualReview` handling
- `heroValidator`
- unknown IDs produce validation issues
- migration pipeline
- backup import validation

Domain tests must run in **Node mode** (no browser APIs).

React/UI testing is not required until the domain layer is stable.

---

# 17. Error Protocol

If any of the three gate scripts fail:

- **typecheck fails:** fix all TypeScript errors before adding new code. Do not suppress with `// @ts-ignore` without a written justification.
- **test fails:** fix the failing tests before advancing. Do not delete tests to make them pass.
- **build fails:** fix the build before advancing. Report the exact error to the user.

If a phase cannot be completed cleanly, stop, report the blocker, and wait for instructions.

---

# 18. Adding New Factions

Adding a normal new faction should require only adding files in:

```text
src/data/rules/factions/<new-faction>/
```

plus registration in the rule loader/index if needed.

It should **not** require changes to React components, hero wizard logic, calculation logic, or validation logic.

**Exception:** if the new faction introduces a genuinely new mechanic that the current rule model cannot represent, pause, report this to the user, and update the domain model intentionally. Do not hack faction-specific logic into the UI.

---

# 19. Implementation Phases

Implement the project in phases. Do not jump ahead.

**After every phase, report:**

- files created/changed
- scripts run and their results
- whether typecheck passes
- whether tests pass
- whether build passes
- assumptions made
- TODOs remaining
- app runnable: yes/no

---

## Phase 0 — Scaffolding

**Status: Done**

**Goal:** Create the project skeleton.

**Tasks:**

- Create Vite + React + TypeScript project.
- Enable strict TypeScript.
- Add Tailwind, Dexie, Zustand, Zod, Vitest, vite-plugin-pwa.
- Create agreed folder structure.
- Add minimal App screen.
- Add `typecheck`, `test`, `build` scripts.
- Ensure all three scripts pass.

Do not implement business logic.

**Acceptance criteria:**

- app starts locally
- folder structure exists
- `npm run typecheck` passes
- `npm run test` passes
- `npm run build` passes
- no shadcn/ui, no backend, no Supabase

---

## Phase 1 — Domain Layer

**Status: Done**

**Goal:** Create the pure TypeScript business logic.

**Tasks:**

- Add core domain types (rules types, user data types).
- Add `destinyCost.calculate`.
- Add `deriveDestinyBudget`.
- Add restriction evaluator.
- Add `heroValidator`.
- Add migration pipeline skeleton.
- Add Vitest tests.

No React. No Dexie. No DOM APIs.

**Acceptance criteria:**

- domain has no React or Dexie imports
- tests cover valid and invalid heroes
- tests cover budget derivation, restriction failures, manual review warnings
- typecheck/test/build pass

---

## Phase 2 — Idoneth Rules Data

**Status: Done**

**Goal:** Create the first complete proof-of-concept faction.

**Tasks:**

- Add `meta.json`, `faction.json`, `heroes.json`, `battle-skills.json` for Idoneth.
- Add shared `archetypes.json`, `origins.json`, `flaws.json`.
- Add Zod validation for rules data.
- Include at least one `needsManualReview: true` rule.

Use placeholders when real rule values are not yet validated. Mark uncertain data clearly.

**Acceptance criteria:**

- rules load successfully
- invalid rules fail clearly in dev/test
- Idoneth can be retrieved through the rules repository
- no hardcoded Idoneth logic in components
- typecheck/test/build pass

---

## Phase 3 — Persistence and Backup

**Status: Done**

**Goal:** Save, load, export, and import user data.

**Tasks:**

- Create Dexie schema and `userRepository`.
- Add CRUD for campaigns/heroes.
- Add JSON export and import with Zod validation.
- Add migration execution on import.
- Add persistent storage status and last backup tracking.

**Acceptance criteria:**

- campaigns and heroes can be saved and loaded
- backup export creates valid JSON
- backup import validates before saving
- invalid backup is rejected safely
- typecheck/test/build pass

---

## Phase 4 — Campaign UI

**Status: Not started**

**Goal:** Allow the user to create and view campaigns.

**Tasks:**

- Campaign list page.
- Create campaign form.
- Campaign detail page.
- Optional `destinyBudgetOverride` with clear explanation that it is a house rule.

**Acceptance criteria:**

- user can create campaign and open campaign detail
- campaign persists after reload
- UI works well on mobile width
- typecheck/test/build pass

---

## Phase 5 — Hero Wizard

**Status: Not started**

**Goal:** Create heroes through a mobile-first step-by-step flow.

**Steps:** Faction → Hero type → Archetype → Origin → Flaw → Battle skills → Review.

**Behaviour:**

- options generated from rule JSON
- known restrictions applied automatically
- custom restrictions and `needsManualReview` entries shown as warnings, not hard blocks
- cost and budget calculated live
- validation issues shown clearly

**Acceptance criteria:**

- user can create a hero through the wizard
- no faction-specific code in UI
- invalid choices show validation messages
- manual review rules show warning badges
- hero persists after reload
- typecheck/test/build pass

---

## Phase 6 — Hero Sheet

**Status: Not started**

**Goal:** Show a mobile-friendly read-only hero summary.

**Must show:** name, faction, hero type, level, archetype, origin, flaw, battle skills, destiny cost breakdown, budget, validation warnings, rule text/details, tags, version drift badge.

**Acceptance criteria:**

- hero sheet readable on mobile
- cost breakdown is clear
- version drift warning works
- typecheck/test/build pass

---

## Phase 7 — PWA Polish

**Status: Not started**

**Goal:** Make the app feel installable and safe on mobile.

**Tasks:** manifest, icons, install prompt, service worker update prompt, backup reminder, offline shell check.

**Acceptance criteria:**

- app can be installed on mobile
- update prompt works
- backup reminder visible when needed
- build passes

---

## Phase 8 — Second Faction

**Status: Not started**

**Goal:** Validate the architecture with a second faction.

**Tasks:**

- Add another faction using JSON only.
- If UI/domain changes are needed for normal rules, stop and refactor first.
- If a truly new mechanic appears, update the model intentionally.

**Acceptance criteria:**

- second faction appears in wizard
- no React components changed for normal faction addition
- no domain changes unless justified by new mechanics
- build/test/typecheck pass

---

# 20. Working Style

When implementing:

- Work in small phases. Do not jump ahead.
- Keep the app runnable after every phase.
- Before each phase, summarize the plan and list the files/commands expected.
- After each phase, report all items in the post-phase checklist (section 19).
- Do not introduce libraries not listed in section 3 without asking first.
- Do not implement features outside the current phase.
- Prefer simple, explicit code over clever abstractions.
- Keep domain logic pure and tested.
- Avoid premature abstractions and premature performance optimisations.

---

# 21. Current Project Status

> **Update this section manually after each phase is complete.**
> Do not rely on chat history as project state.

| Phase | Status | Notes |
|---|---|---|
| Phase 0 — Scaffolding | **Done** | typecheck / test / build all pass |
| Phase 1 — Domain Layer | **Done** | 57 tests pass; domain has no React/Dexie imports |
| Phase 2 — Idoneth Rules Data | **Done** | 83 tests pass; Zod schemas + loader + placeholder Idoneth data |
| Phase 3 — Persistence and Backup | **Done** | 101 tests pass; Dexie schema + userRepository + backup import/export |
| Phase 4 — Campaign UI | **Done** | 101 tests pass; hash router + campaign list/detail + UI primitives |
| Phase 5 — Hero Wizard | **Done** | 101 tests pass; 7-step wizard + validation + battle skills live cost |
| Phase 6 — Hero Sheet | **Done** | 101 tests pass; read-only hero sheet at #/campaigns/:id/heroes/:heroId |
| Phase 7 — PWA Polish | **Done** | 101 tests pass; icons, manifest, SW update banner, install prompt, backup page, backup reminder |
| Phase 8 — Second Faction | **Done** | 101 tests pass; Stormcast Eternals added via JSON only — zero React/domain changes |

**Active phase:** All MVP phases complete. Post-MVP: real Idoneth data pass in progress.

**Last known good state:** Real Idoneth rules data written. Domain model extended: `Archetype`/`Origin`/`Flaw` now have optional `destinyCost`; `LoadedRuleset` has `archetypesByFactionId`, `originsByFactionId`, `flawsByFactionId`; `HeroCostBreakdown` has `archetypeOriginFlaw`. Faction-specific archetypes/origins/flaws override shared pools. UI steps and HeroSheet use faction-aware helpers. 101 tests pass; typecheck/test/build all pass.

**Open decisions / blockers:** Idoneth data is still `needsManualReview: true` — exact rule text, costs, and skill names need verification against the source book before play.

---

# 22. Starting a New Session

Paste this as the first message when starting a new Claude Code session:

```text
Read CLAUDE.md completely before doing anything.

Check section 21 (Current Project Status) and confirm:
1. Which phase is currently active.
2. What has been completed.
3. What the next task is.

Then wait for my confirmation before writing any code.
```

When starting Phase 0 from scratch for the first time:

```text
Read CLAUDE.md completely before doing anything.

We are starting with Phase 0 only.

Before writing code:
1. Summarize the Phase 0 plan.
2. List the commands you will run.
3. List the files/folders you expect to create.

Then implement Phase 0.

Do not implement business logic, campaign screens, hero screens, shadcn/ui, backend, or Supabase.
Do not advance to Phase 1.

After implementation:
1. List files created/changed.
2. List scripts run.
3. Confirm whether typecheck, test, and build pass.
4. Mention any assumptions or TODOs.
```
