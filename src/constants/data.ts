// src/constants/data.ts — fully dynamic, no hardcoded subject arrays

export type Priority = 'high' | 'medium' | 'low'
export type KanbanColumn = 'todo' | 'inprogress' | 'done'
export type PageId =
  | 'dashboard' | 'tasks' | 'ai' | 'notes'
  | 'habits' | 'planner' | 'analytics' | 'settings'

// ─── Dynamic Subject Model ───────────────────────────────────
export interface Subject {
  id: string
  name: string
  color: string
  icon: string
  createdAt: number
}

export interface Task {
  id: string
  title: string
  subjectId: string   // references Subject.id
  priority: Priority
  due: string
  done: boolean
  col: KanbanColumn
}

export interface Habit {
  id: string
  name: string
  streak: number
  target: number
  log: number[]
}

export interface Note {
  id: string
  title: string
  content: string
  subjectId: string
  pinned: boolean
  updated: string
}

export interface NavItem {
  id: PageId
  icon: string
  label: string
}

export interface PomodoroPreset {
  label: string
  work: number
  rest: number
}

export interface StudyDataPoint { day: string; h: number }

// ─── Navigation ─────────────────────────────────────────────
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
  { id: 'tasks',     icon: '✓', label: 'Tasks' },
  { id: 'ai',        icon: '✦', label: 'AI Assistant' },
  { id: 'notes',     icon: '▦', label: 'Notes' },
  { id: 'habits',    icon: '◈', label: 'Habits' },
  { id: 'planner',   icon: '◷', label: 'Planner' },
  { id: 'analytics', icon: '▲', label: 'Analytics' },
  { id: 'settings',  icon: '⚙', label: 'Settings' },
]

export const KANBAN_COLS = [
  { id: 'todo'       as KanbanColumn, label: 'To Do',       color: '#7C3AED' },
  { id: 'inprogress' as KanbanColumn, label: 'In Progress', color: '#F59E0B' },
  { id: 'done'       as KanbanColumn, label: 'Done',        color: '#10B981' },
]

export const PRIORITY_CONFIG: Record<Priority, { icon: string; color: string; label: string }> = {
  high:   { icon: '●', color: '#EF4444', label: 'High' },
  medium: { icon: '◐', color: '#F59E0B', label: 'Medium' },
  low:    { icon: '○', color: '#10B981', label: 'Low' },
}

export const POMODORO_PRESETS: PomodoroPreset[] = [
  { label: '25 / 5',  work: 25, rest: 5  },
  { label: '50 / 10', work: 50, rest: 10 },
  { label: '90 / 20', work: 90, rest: 20 },
]

export const ACCENT_COLORS = [
  { value: '#7C3AED', name: 'Violet' },
  { value: '#06B6D4', name: 'Cyan'   },
  { value: '#F59E0B', name: 'Amber'  },
  { value: '#10B981', name: 'Emerald'},
  { value: '#EC4899', name: 'Pink'   },
  { value: '#EF4444', name: 'Red'    },
]

// Subject icon options for picker
export const SUBJECT_ICONS = ['📚','🔬','🧮','🌍','💼','⚛️','🎨','🎵','💻','🏛️','📐','🧬','🌱','🤖','✍️']

// Palette for new subject color picker
export const SUBJECT_PALETTE = [
  '#7C3AED','#06B6D4','#F59E0B','#10B981',
  '#EF4444','#EC4899','#8B5CF6','#14B8A6',
  '#F97316','#84CC16','#6366F1','#0EA5E9',
]

// ─── Default subjects (used on first run) ───────────────────
export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub_cs',       name: 'CS',       color: '#7C3AED', icon: '💻', createdAt: 1 },
  { id: 'sub_math',     name: 'Math',     color: '#06B6D4', icon: '🧮', createdAt: 2 },
  { id: 'sub_chem',     name: 'Chemistry',color: '#F59E0B', icon: '🔬', createdAt: 3 },
  { id: 'sub_history',  name: 'History',  color: '#10B981', icon: '🌍', createdAt: 4 },
  { id: 'sub_business', name: 'Business', color: '#EF4444', icon: '💼', createdAt: 5 },
  { id: 'sub_physics',  name: 'Physics',  color: '#EC4899', icon: '⚛️', createdAt: 6 },
]

// ─── Initial data ────────────────────────────────────────────
export const INIT_TASKS: Task[] = [
  { id: '1', title: 'Complete Algorithms Assignment', subjectId: 'sub_cs',       priority: 'high',   due: '2026-05-20', done: false, col: 'todo'      },
  { id: '2', title: 'Read Chapter 7 — Organic Chem', subjectId: 'sub_chem',     priority: 'medium', due: '2026-05-18', done: false, col: 'inprogress' },
  { id: '3', title: 'Prepare presentation slides',   subjectId: 'sub_business', priority: 'high',   due: '2026-05-19', done: false, col: 'inprogress' },
  { id: '4', title: 'Calculus problem set',          subjectId: 'sub_math',     priority: 'low',    due: '2026-05-22', done: true,  col: 'done'       },
  { id: '5', title: 'Physics lab report',            subjectId: 'sub_physics',  priority: 'medium', due: '2026-05-21', done: false, col: 'todo'       },
  { id: '6', title: 'History essay draft',           subjectId: 'sub_history',  priority: 'low',    due: '2026-05-25', done: true,  col: 'done'       },
]

export const INIT_HABITS: Habit[] = [
  { id: '1', name: 'Morning study session', streak: 12, target: 14, log: [1,1,1,1,1,1,1,1,1,1,1,1,0,0] },
  { id: '2', name: 'Review flashcards',     streak: 7,  target: 14, log: [1,1,1,1,1,1,1,0,0,0,0,0,0,0] },
  { id: '3', name: 'Read for 30 mins',      streak: 20, target: 14, log: [1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
  { id: '4', name: 'Exercise',              streak: 5,  target: 14, log: [1,1,1,1,1,0,0,0,0,0,0,0,0,0] },
  { id: '5', name: 'No social media 9–5',   streak: 3,  target: 7,  log: [1,1,1,0,0,0,0,0,0,0,0,0,0,0] },
]

export const INIT_NOTES: Note[] = [
  {
    id: '1', subjectId: 'sub_cs', pinned: true, updated: '2026-05-16',
    title: 'Algorithms — Big-O Summary',
    content: `## Complexity Cheatsheet\n\n**O(1)** — Constant: hash map lookups\n**O(log n)** — Logarithmic: binary search\n**O(n)** — Linear: single array scan\n**O(n log n)** — Merge sort, Timsort\n**O(n²)** — Bubble sort, naive nested loops\n\n> Always analyze worst-case. Average-case matters too.\n\n## Space Complexity\n- Consider auxiliary space separately\n- In-place algorithms use O(1) extra space`,
  },
  {
    id: '2', subjectId: 'sub_chem', pinned: false, updated: '2026-05-15',
    title: 'Organic Chemistry — Reactions',
    content: `## Substitution\n- **SN1**: first-order, racemization\n- **SN2**: second-order, inversion\n\n## Elimination\n- Zaitsev's rule: more substituted alkene preferred\n\n## Addition\n- Markovnikov's rule: H adds to less substituted carbon`,
  },
  {
    id: '3', subjectId: 'sub_math', pinned: true, updated: '2026-05-14',
    title: 'Calculus — Integration Methods',
    content: `## Techniques\n\n1. **u-substitution** — reverse chain rule\n2. **Integration by parts**: \`∫udv = uv − ∫vdu\`\n3. **Partial fractions** — rational functions\n\n## Key Formulas\n\`\`\`\n∫sin(x)dx = −cos(x) + C\n∫eˣ dx    =  eˣ + C\n\`\`\``,
  },
]

export const STUDY_DATA: StudyDataPoint[] = [
  { day: 'Mon', h: 4.5 }, { day: 'Tue', h: 3   }, { day: 'Wed', h: 6   },
  { day: 'Thu', h: 2.5 }, { day: 'Fri', h: 5   }, { day: 'Sat', h: 7   }, { day: 'Sun', h: 3.5 },
]

export const AI_SUGGESTIONS = [
  'Create a 7-day study plan for finals',
  'Explain Big-O notation simply',
  'Best techniques for memorizing formulas',
  'Give me a Pomodoro schedule for today',
  'How to avoid procrastination effectively?',
  'Explain the Feynman technique',
]

export const AI_SYSTEM_PROMPT = `You are an expert AI study assistant for StudyOS — a premium student productivity platform.

Your role: Help students with concept explanations, personalized study plans, exam prep, productivity science, time management, and career guidance.

Style: Use rich markdown — headers (##), **bold** key terms, bullet lists, \`inline code\`, code blocks. Be encouraging, precise, actionable.

Persona: A brilliant mentor combining professor wisdom with coach energy.`
