# DevLog

A production-quality engineering task tracker for React Native, built around four
real, multi-step **Claude AI agents**. Dark, premium UI (Holywater / MyDrama
inspired) with motion on essentially every surface.

> Built with **React Native CLI** (not Expo), **TypeScript (strict)**, React
> Navigation v7, Reanimated 3 + Moti, Zustand, React Hook Form + Zod, and the
> Anthropic Claude API (`claude-sonnet-4-6`).

---

## Setup

```bash
# 1. Install JS dependencies
npm install

# 2. iOS native deps (CocoaPods)
cd ios && pod install && cd ..

# 3. Run
npx react-native run-ios
# or
npx react-native run-android
```

> **Fonts**: SF Pro Text `.ttf` files in `/fonts` are linked via
> `react-native.config.js`. If you change them, re-run `npx react-native-asset`.

### Anthropic API key

The AI agents need a Claude API key. Open the app → **Settings** tab → paste your
`sk-ant-...` key → **Save**. It is stored locally in AsyncStorage and only ever
leaves the device to call the Claude API. See [`.env.example`](./.env.example)
for the canonical variable name.

---

## Architecture

Feature-based, scalable layout with path aliases (`@/...`):

```
src/
  app/                 # Entry, providers, navigation root, bootstrap/splash
    navigation/        # Root native stack + bottom tabs + dark theme
  features/
    tasks/             # Task list / detail / create-edit form + components
    ai/                # 4 AI agents: hooks, result views, panels, AI tab
    settings/          # API key + storage + about
  shared/
    components/        # Reusable animated UI (design-system primitives)
    hooks/             # useTasks, agent-error mapping
    utils/             # id, date, haptics, task sort/filter helpers
    constants/         # colors, gradients, typography, spacing, motion, strings
    types/             # Task / Subtask / AI result types
  store/               # Zustand stores (tasks, settings) with write-through persistence
  services/
    storage/           # Typed AsyncStorage abstraction (task + settings storage)
    ai/                # Anthropic REST client + agent logic
      agents/          # prioritization | decomposition | statusUpdate | blockerDetector
```

**Data flow**: screens → custom hooks → Zustand stores → storage service →
AsyncStorage. AI: screens → agent hooks → agent modules → `anthropicClient` →
Claude REST API. Stores hydrate once on launch (gated by a splash screen) and
write through to disk on every mutation.

**State management**: Zustand. Two small stores (`taskStore`, `settingsStore`)
hold the source of truth in memory and persist asynchronously. Components select
narrow slices so re-renders stay tight.

**Navigation**: a root **native stack** (`Tabs` → `TaskDetail` → `TaskForm`
modal) wrapping a **bottom tab** navigator (Tasks / AI / Settings). The detail
screen slides in; the create/edit form presents as a bottom-sheet modal. Per-
screen entrance choreography is layered on with Moti spring transitions.

---

## Storage choice & limitations

This app uses **AsyncStorage** behind a typed service layer
(`services/storage/`). It was chosen because:

- **Single user, no backend.** The assignment is a local, single-device tracker
  — there is no auth, sharing, or server, so a key/value store is the simplest
  correct fit.
- **Aligns with the "local storage" intent** and keeps the dependency surface
  small and offline-first.
- **Abstracted** so the rest of the app never touches AsyncStorage directly —
  swapping in SQLite / MMKV / WatermelonDB later means changing one folder.

**Limitations** (honest trade-offs):

- **No cross-device sync** — data lives only on this device.
- **~6 MB practical limit on Android** (default), so it suits hundreds–thousands
  of tasks, not a large dataset.
- **Whole-collection writes** — the store serialises the full task array on each
  mutation. Fine at this scale; for very large datasets a row-oriented store
  (SQLite/MMKV) would be more efficient.
- **Not encrypted** — fine for task data; the API key is device-local but not in
  the secure keychain (a production app would use Keychain/Keystore).

---

## AI features (all four implemented as real multi-step agents)

Each agent has its own system prompt, returns **typed structured output**
(via the Messages API `output_config.format` JSON schema), and exposes
loading / error / empty states through a dedicated hook.

### A — Prioritization Agent  (`prioritizationAgent.ts`)
Sends the whole backlog (priority, age in days, status, subtask progress) and
asks Claude what to do **today** and why. **Multi-step**: if the backlog is
ambiguous it returns a single clarifying question first; the user answers and the
conversation continues to a final ranked plan. UI: animated ranked list with
per-item reasoning.

### B — Task Decomposition Agent  (`decompositionAgent.ts`)
Takes a task title + description. **Step 1** evaluates whether it's clear enough
— if vague, it asks a clarifying question. **Step 2** generates an ordered
subtask list. **Step 3** offers to auto-create the subtasks in the app; on
confirm they animate into the task one-by-one.

### C — Status Update Generator  (`statusUpdateAgent.ts`)
Takes a task + subtasks + notes. **Step 1** classifies state
(`on-track | blocked | completed | needs-review`); **Step 2** writes a concise,
tone-matched Slack-style update. UI: typewriter reveal + copy-to-clipboard with
haptic feedback + success shimmer.

### D — Smart Blocker Detector  (`blockerDetectorAgent.ts`) — custom feature
Analyses the **entire backlog** to (1) infer likely dependency links between
tasks from semantic similarity of titles/descriptions, and (2) flag stale
in-progress work, with a recommended unblocking action for each. **Why useful:**
silent blockers and stale tasks kill team velocity; this surfaces them before
standup. UI: dependency cards (blocker → blocked) + a stale-work list.

The AI client (`anthropicClient.ts`) handles timeouts, exponential-backoff
retries on 429/5xx, typed errors (`auth | rate-limit | network | parse | ...`),
and defensive JSON parsing.

---

## Animations

Reanimated 3 + Moti throughout: staggered list entrances, swipe-to-delete with
spring physics (Gesture Handler), press-scale feedback, a pulsing gradient glow
ring on the FAB, animated gradient priority badges, focus-animated inputs, the
3-dot AI typing indicator, word-by-word streamed AI text, shimmer skeletons, an
SVG checkmark "draw" animation, a sliding filter-tab indicator, and a living
gradient backdrop on the AI panel.

---

## Quality

```bash
npx tsc --noEmit   # strict typecheck — clean
npm run lint       # eslint — clean
npm test           # jest unit tests (helpers + AI JSON parser)
```

- Strict TypeScript, **no `any`**, no inline styles (all `StyleSheet` / design
  constants), no hardcoded strings (centralised in `constants/strings.ts`).
- Custom hooks for all business logic; `React.memo` / `useMemo` / `useCallback`
  where it matters; error boundaries on every screen + at the root.
