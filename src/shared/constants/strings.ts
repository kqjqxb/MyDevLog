/**
 * Centralised user-facing copy. Avoids hardcoded strings scattered across
 * components and keeps tone consistent.
 */
export const STRINGS = {
  appName: 'DevLog',
  tagline: 'Engineering task tracker',

  tabs: {
    tasks: 'Tasks',
    ai: 'AI Agents',
    settings: 'Settings',
  },

  filters: {
    all: 'All',
    todo: 'Todo',
    inProgress: 'In Progress',
    done: 'Done',
  },

  sort: {
    byPriority: 'Priority',
    byDate: 'Date',
  },

  tasks: {
    emptyTitle: 'No tasks yet',
    emptySubtitle: 'Tap the + button to log your first task.',
    emptyFilteredTitle: 'Nothing here',
    emptyFilteredSubtitle: 'No tasks match this filter.',
    createTitle: 'New Task',
    editTitle: 'Edit Task',
    deleteConfirmTitle: 'Delete task?',
    deleteConfirmMessage: 'This action cannot be undone.',
    subtasksLabel: 'Subtasks',
    notesLabel: 'Notes',
    addSubtask: 'Add subtask',
    noNotes: 'No notes added yet.',
  },

  form: {
    titleLabel: 'Title',
    titlePlaceholder: 'What needs to be done?',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Add more detail (optional)',
    priorityLabel: 'Priority',
    statusLabel: 'Status',
    submitCreate: 'Create Task',
    submitEdit: 'Save Changes',
  },

  ai: {
    panelTitle: 'AI Agents',
    panelSubtitle: 'Multi-step agents powered by Claude',
    prioritize: 'Prioritize My Day',
    prioritizeDesc: 'Rank tasks to tackle first and why',
    decompose: 'Break Down Task',
    decomposeDesc: 'Generate structured subtasks',
    statusUpdate: 'Status Update',
    statusUpdateDesc: 'Draft a Slack-style async update',
    blockers: 'Detect Blockers',
    blockersDesc: 'Surface hidden dependencies & stale work',
    thinking: 'Claude is thinking',
    applySubtasks: 'Add these subtasks',
    copy: 'Copy',
    copied: 'Copied',
    needsKey: 'Add your Anthropic API key in Settings to use AI agents.',
    answerFollowUp: 'Answer & continue',
    noTasks: 'Add some tasks first — the agents need context to work with.',
  },

  settings: {
    title: 'Settings',
    apiKeyLabel: 'Anthropic API Key',
    apiKeyPlaceholder: 'sk-ant-...',
    apiKeyHint: 'Stored locally on this device only. Never leaves except to call the Claude API.',
    save: 'Save',
    saved: 'Saved',
    clear: 'Clear',
    modelLabel: 'Model',
    aboutTitle: 'About',
    storageTitle: 'Storage',
    clearDataLabel: 'Clear all tasks',
  },

  errors: {
    generic: 'Something went wrong. Please try again.',
    boundary: 'This screen hit an unexpected error.',
    boundaryRetry: 'Try again',
    missingKey: 'No API key configured.',
    network: 'Network request failed. Check your connection.',
    rateLimited: 'Rate limited by the API. Wait a moment and retry.',
    auth: 'Invalid API key. Update it in Settings.',
    parse: 'Claude returned an unexpected response. Try again.',
  },
} as const;
