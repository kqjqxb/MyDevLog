# DevLog

A task tracker for engineers that wraps a standard CRUD backlog with a layer of AI agents that handle the planning and reporting work most developers quietly dread: deciding what to work on today, breaking vague tickets into executable steps, writing standup updates, and spotting dependency problems before they stall the team. All four agents talk directly to the Anthropic API from the device — there is no backend — and every call is structured output with a typed schema, not free-form text parsing.

---

## Core App Flow

The app has three tabs: **Tasks**, **AI**, and **Settings**.

**Creating a task.** Tap the floating action button on the Tasks tab to open the task form. Fill in a title (required), description, initial status (`todo` / `in-progress` / `done`), priority (`low` / `medium` / `high`), and optional notes. The form uses `react-hook-form` with a `zod` schema for validation. On submit the task is written to state and persisted to AsyncStorage before the screen closes.

**Viewing and managing the list.** The task list shows all tasks with per-status counts across four filter tabs (All, Todo, In Progress, Done) and a sort toggle that switches between **priority sort** (high priority → in-progress status → most recently updated as tie-breakers) and **date sort** (newest first). Tasks can be deleted from the list via a swipe action with a confirmation alert. During the initial load the list shows animated skeleton cards while hydration is in progress.

**Task detail.** Tapping a card opens the detail screen. Status and priority can be changed inline via selectable pill buttons — changes persist immediately. Subtasks can be added through a text field, checked off individually, or removed. The notes field saves on blur. The detail screen also surfaces all four AI agents in a panel at the bottom of the scroll view.

**Editing.** The pencil icon in the detail header re-opens the task form pre-filled for editing. Deleting from the detail screen confirms before deleting and navigates back to the list.

---

## Tech Stack & Architecture

| Concern | Choice |
|---|---|
| Framework | React Native 0.83.1 CLI (not Expo) |
| Language | TypeScript 5 |
| Navigation | React Navigation (`native-stack` for root, custom `TabNavigator` for tabs) |
| State | Zustand 5 (`taskStore`, `settingsStore`, `notificationStore`) |
| Persistence | `@react-native-async-storage/async-storage` |
| AI | Anthropic REST API via `axios` (no SDK, no backend) |
| Animation | `react-native-reanimated` 3, `moti` |
| Forms | `react-hook-form` + `zod` |
| Node | 20 |

**Navigation.** The root is a native stack with a single `TabNavigator` screen plus `TaskDetail` and `TaskForm` pushed as stack modals. The tab bar is a custom component — not `@react-navigation/bottom-tabs` — that handles animated index switching with spring transitions and platform-appropriate blur.

**State and storage.** The Zustand task store holds the full task array in memory and writes through to AsyncStorage on every mutation (create, update, delete, subtask changes). At boot the store calls `hydrate()` once, which reads from AsyncStorage and flips a `hydrated` flag that the list screen uses to decide whether to render skeletons or real content. Because AsyncStorage is backed by SQLite on Android and a flat file store on iOS, data survives app restarts and device reboots without any additional setup. The API key and agent history live in a separate `settingsStore` that persists on the same path.

**Anthropic API.** All calls go from the device directly to `https://api.anthropic.com/v1/messages` via `axios`. There is no server-side proxy. The model is fixed to `claude-sonnet-4-6`. Structured output is requested through the `output_config.format` field with an explicit JSON schema per agent, which constrains the response shape. This was preferred over the tool-use approach (`tools` + `tool_choice: {type: "tool"}`) because it produces a direct text response rather than a tool-call content block, which keeps the request shape simpler and avoids threading `tool_result` turns into subsequent conversation history. The client also defensively extracts the first JSON object from the response in case of edge-case wrapping by the model.

**API key.** The user enters their own Anthropic API key on the Settings tab. It is stored in AsyncStorage and read from there at call time. No key is baked into environment variables or bundled with the app. The `.env.example` documents an alternative wiring path for build-time injection if a team prefers it.

### Why Claude Sonnet 4.6

All four agents use the same model. The `config.ts` comment notes this was fixed per the assignment spec, but it is also a reasonable default: Sonnet 4.6 handles both the light formatting work (Status Update's write step) and the heavier reasoning work (Detect Blockers' cross-task dependency inference) without needing separate model configurations per agent. The obvious revisit point would be splitting by task complexity — Haiku for pure formatting steps like `writeMessage`, a stronger model for multi-pass inference like `DETECT_SYSTEM_PROMPT` — but that would require per-agent model config and adds complexity for a gain that only matters at scale or tight cost budgets. Using one model also makes latency and cost behaviour predictable across the app.

---

## AI Agents

All agents run from two surfaces: the **AI tab** exposes the two backlog-wide agents (Prioritize My Day, Detect Blockers), and the **task detail panel** exposes all four — the two single-task agents plus the same backlog-wide ones for convenience.

### Prioritize My Day

**What it does.** Takes the full task backlog and produces a ranked list of what to work on today, with per-task one-sentence reasoning and an overall summary.

**Why it's useful.** Prioritization is not sorting by a `priority` field. A stale `high` task sitting at `todo` for two weeks may need attention before it rots into a blocker. An `in-progress` `medium` task might deserve the top slot because context is already loaded. The agent is prompted to reason like a pragmatic tech lead — balancing urgency (priority), momentum (status), and risk (age in days) — and to surface only tasks worth doing today, skipping `done` items entirely.

**Multi-step structure.** The first call (`runPrioritization`) sends the serialized backlog and asks for a ranked plan. The system prompt instructs the model to set `needsClarification: true` and ask a single focused question if the backlog is genuinely ambiguous — for example, several tasks at identical priority with no tie-breaker signal. If clarification is needed the UI renders a text input; the user's answer is appended to the conversation history as a `user` turn and a second call (`continuePrioritization`) resolves to a final ranking. If the backlog is unambiguous on the first call, no second call is made.

### Break Down Task

**What it does.** Takes a single task and breaks it into 3–7 ordered, independently-verifiable subtasks in imperative phrasing.

**Why it's useful.** Vague tickets stall engineers because there is no clear first step. The agent forces scope definition before generating subtasks: if the task is too broad to decompose well, it asks one clarifying question rather than inventing plausible-sounding but wrong subtasks.

**Multi-step structure.** The first call (`runDecomposition`) evaluates the task. If the task is specific enough it returns subtasks immediately. If not, it returns `needsClarification: true` and a question; the user's answer triggers a second call (`continueDecomposition`).

The agent also checks existing subtasks before generating new ones. If the task already has subtasks (completed or pending), the prompt instructs it to skip anything substantially overlapping with an existing item, never re-suggest completed work, and return an empty `subtasks: []` array if the pending subtasks already cover the remaining scope completely. This prevents the common failure mode where re-running the agent duplicates suggestions the user already has.

### Status Update

**What it does.** Generates a Slack-style standup message for a single task, with tone matched to the task's true state.

**Why it's useful.** Writing standup updates is a low-value but daily recurring cost. The harder part is honest diagnosis first: a task marked `in-progress` may actually be blocked, or it may be on track but the developer hasn't updated the description. Conflating classification and message-writing into one prompt produces generic output. Separating them into two sequential calls produces messages whose tone reflects a genuine prior classification decision.

**Multi-step structure — two real API calls.**

- **Call 1** (`classifyState`) uses a dedicated `CLASSIFY_SYSTEM_PROMPT` and the `status_classification` JSON schema. It reads the task's status, subtask progress, notes, and age and classifies the true state as exactly one of: `on-track`, `blocked`, `completed`, or `needs-review`. It also checks content quality (see Content Quality Guard below) and can return `needsClarification: true` if there is genuinely not enough context to classify.

- **Call 2** (`writeMessage`) uses a separate `WRITE_SYSTEM_PROMPT` and the `status_message` schema. It receives the full conversation history including the classification result from call 1 appended as an `assistant` turn, then writes a 2–4 sentence first-person message whose tone is explicitly mapped to the classified state: confident for `on-track`, candid and help-seeking for `blocked`, wrapping-up for `completed`, flagging for review for `needs-review`.

If call 1 returns a clarification request, the user's answer is threaded into conversation history and call 1 runs again before call 2 is triggered.

### Detect Blockers

**What it does.** Analyses the entire backlog for two things: inferred dependency links between tasks (where one task likely blocks another based on semantic relationships in their titles and descriptions) and stale in-progress work, with a concrete unblocking recommendation for each stalled task.

**Why it's useful.** Most teams do not explicitly model task dependencies — they discover them at standup when someone says "I'm waiting on X." This agent surfaces implicit dependency chains before they cause a surprise, and flags tasks that are technically `in-progress` but show signs of being stuck. The output is a standup-ready summary a lead can read aloud, not a raw data dump.

**Multi-step structure — two real API calls.**

- **Call 1** (`DETECT_SYSTEM_PROMPT`) receives all tasks and runs two reasoning passes: dependency inference (semantic reasoning over titles/descriptions/notes to identify plausible blocker→blocked links) and stale-work detection. For stale work, `ageDays` is computed in code from `task.createdAt` by `daysSince()` and serialized into the task context as a numeric field; the "≥ 3 days in-progress" staleness threshold is defined in the system prompt text as a heuristic instruction, not a code constant — the model receives the computed number and applies the threshold itself. It also flags candidate tasks with placeholder or gibberish content in a `candidateWarnings` array — but deliberately defers the skip-vs-advisory decision to call 2. Schema fields: `links`, `stale`, `candidateWarnings`.

- **Call 2** (`RESOLVE_SYSTEM_PROMPT`) receives the full conversation history with the detection output appended as an `assistant` turn. It resolves the `skipped: true/false` decision for each candidate warning (see Content Quality Guard) and writes a 2–4 sentence standup-ready summary incorporating the blocker and stale-work findings. Tasks flagged as skipped are excluded from the summary.

This separation keeps the detection reasoning focused on finding signal, and lets the resolution step apply consistent content quality logic without the detection prompt needing to embed it.

---

## Content Quality Guard

The content quality guard is a system-level policy shared across all four agents, not a one-off fix per screen. The problem it solves: an agent that receives a task titled `"asdf"` will either hallucinate a plausible-but-useless result or fail confusingly. The guard injects a content evaluation instruction into each agent's system prompt via a shared `contentQualityGuard.ts` module, and specifies exactly which fields count as meaningful context for that agent's purpose.

**Per-agent scope (`ContextScope`).** Each agent has a declared scope in `AGENT_CONTEXT_SCOPE` that lists which fields the model should treat as sufficient context:

| Agent | title | description | subtasks | notes |
|---|---|---|---|---|
| Prioritize My Day | ✓ | ✓ | ✓ | ✓ |
| Break Down Task | ✓ | ✓ | ✓ | ✓ |
| Status Update | ✓ | ✓ | ✓ | ✓ |
| Detect Blockers | ✓ | ✓ | — | — |

Detect Blockers intentionally excludes subtasks and notes. Subtask completion state is not relevant signal for inferring cross-task dependencies or stale-work detection — those patterns live in titles, descriptions, and age.

**Blocking mode (Break Down Task, Status Update).** These operate on a single task. If all fields in the agent's scope are absent or clearly placeholder/gibberish, the model is instructed to set `needsClarification: true` and ask what the task is actually about, rather than generating content from meaningless input. If meaningful subtasks exist even when the title/description look like placeholders, the guard instructs the model to infer context from the subtasks and proceed without blocking.

**Advisory mode (Prioritize My Day, Detect Blockers).** These operate on the whole backlog and cannot block on a single bad task. The guard instructs the model to still produce a full result for all tasks, but populate a `contentWarnings` array for any task with placeholder-like content. Each warning carries a `reason` and a `skipped` boolean: `true` when there is genuinely no content to work with, `false` when title/description are poor but real context was still available (e.g. the title is placeholder but the description contains real detail). The UI renders these as a lightweight warning below the main result — informational, not blocking.

The guard instructions are built from shared `buildSingleTaskGuard` / `buildAggregateGuard` functions that take the agent's `ContextScope` as input, so adding a new agent requires only a scope declaration and a one-line export — not a copy-pasted prompt block.

---

## Error Handling & Resilience

API errors surface through a shared `ApiKeyErrorBanner` component that slides in from the top of the screen with a spring animation and a glassmorphism background (iOS blur / opaque fallback on Android). Three variants:

| Variant | Triggers | Accent |
|---|---|---|
| `invalid_key` | 401/403 response, or no key configured | Red |
| `rate_limit` | 429 response | Amber |
| `network` | Network timeout, connection failure, empty or unparseable response | Blue |

The banner auto-dismisses after 3.6 seconds, supports swipe-up-to-dismiss, and tapping the body navigates directly to Settings so the user can fix an invalid key without hunting for the right screen. It is backed by `notificationStore` (Zustand) and rendered once at the root level, so any agent on any screen can trigger it without each screen needing its own error UI.

All error classification happens in `anthropicClient.ts`. Every call flows through `sendMessage`, which maps Axios errors to a typed `AnthropicError` with a `kind` string (`missing-key`, `auth`, `rate-limit`, `network`, `parse`, `unknown`). The client retries transient failures (429 and 5xx) up to twice with exponential backoff (600ms base). Only after retries are exhausted does the error surface to the banner and re-throw to the calling hook.

---

## Known Limitations & Deliberate Trade-offs

**AsyncStorage size limits.** AsyncStorage stores data per-key in SQLite (Android) or a flat file (iOS). Individual values can hit a practical ceiling around 6MB on Android. For the intended scope — a single developer's personal backlog — this is not a real constraint, but it would become one for a team-shared or large-backlog use case.

**No cross-task duplicate detection at backlog level.** The Break Down Task agent checks existing subtasks within the single task being decomposed and avoids regenerating them. It does not compare against subtasks on other tasks in the backlog. If two tasks genuinely share implementation work, the agent will not surface that overlap.

**No auth — intentional single-user scope.** There is no login, no account, no sync. The app is designed for one developer managing their own backlog. Multi-user support would require a backend and auth infrastructure that is orthogonal to what this project demonstrates.

**API key in AsyncStorage, not a secure enclave.** AsyncStorage is not the iOS Keychain or Android Keystore. For a production app handling a key with billing implications, the key should live in a secure store or be held server-side. For a demo app where the user controls their own key, the trade-off is acceptable.

**All AI calls from the client.** There is no server-side proxy. The API key travels in the request headers from the device directly to Anthropic's endpoint. This is by design (no backend to maintain) but is worth noting if the app were to move beyond personal use.

**No pagination.** All tasks load into memory at startup via a single `getTasks()` call. The `FlatList` virtualizes rendering, but the data array is unbounded.

---

## Setup & Running Locally

**Prerequisites**

- Node 20 (`nvm use` will pick up `.nvmrc`)
- Ruby (CocoaPods, for iOS)
- Xcode with a simulator (iOS) or Android Studio with an emulator (Android)
- An Anthropic API key — entered in the app after launch, not required to build

**Install**

```bash
npm install
```

```bash
# iOS only — install CocoaPods dependencies
cd ios && pod install && cd ..
```

**Start Metro**

```bash
npm start
```

**Run on simulator or device**

```bash
# iOS
npm run ios

# Android
npm run android
```

**Add your API key**

No `.env` setup is required to run the app. Once it launches, open the **Settings** tab, paste your Anthropic API key into the field, and tap **Save**. The key is stored locally on the device. All four AI agents will be enabled immediately.

**Tests**

```bash
npm test
```

Unit tests cover the Anthropic client (error classification, JSON extraction, retry logic) and task helper utilities (filter, sort, subtask progress).
