// src/constants/data.ts — Zero hardcoded subjects, zero fake data

export type Priority = 'high' | 'medium' | 'low'
export type KanbanColumn = 'todo' | 'inprogress' | 'done'
export type PageId =
  | 'dashboard' | 'tasks' | 'ai' | 'notes'
  | 'habits' | 'planner' | 'analytics' | 'settings'

// ─── Subject model ────────────────────────────────────────────
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
  subjectId: string
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

export interface NavItem { id: PageId; icon: string; label: string }
export interface PomodoroPreset { label: string; work: number; rest: number }
export interface StudyDataPoint { day: string; h: number }

// ─── Nav ─────────────────────────────────────────────────────
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
  { value: '#7C3AED', name: 'Violet'  },
  { value: '#06B6D4', name: 'Cyan'    },
  { value: '#F59E0B', name: 'Amber'   },
  { value: '#10B981', name: 'Emerald' },
  { value: '#EC4899', name: 'Pink'    },
  { value: '#EF4444', name: 'Red'     },
]

export const SUBJECT_ICONS = ['📚','🔬','🧮','🌍','💼','⚛️','🎨','🎵','💻','🏛️','📐','🧬','🌱','🤖','✍️','🎯','🧠','📊','⚗️','🏆']

export const SUBJECT_PALETTE = [
  '#7C3AED','#06B6D4','#F59E0B','#10B981',
  '#EF4444','#EC4899','#8B5CF6','#14B8A6',
  '#F97316','#84CC16','#6366F1','#0EA5E9',
]

// Suggested subject names for autocomplete — user can type anything freely
export const SUBJECT_SUGGESTIONS = [
  'Mathematics','Physics','Chemistry','Biology','Computer Science',
  'History','Geography','Economics','Business Studies','Accountancy',
  'English Literature','Hindi','Political Science','Sociology','Psychology',
  'Machine Learning','Data Science','Web Development','DSA','Algorithms',
  'UPSC History','UPSC Geography','UPSC Economy','UPSC Polity','UPSC Science',
  'JEE Physics','JEE Chemistry','JEE Mathematics','NEET Biology',
  'Graphic Design','UI/UX Design','Photography','Music Theory',
  'Japanese','French','Spanish','German','Sanskrit',
  'Fitness','Nutrition','Yoga','Sports Science',
  'Startup Research','Entrepreneurship','Marketing','Finance','Investing',
  'Quantum Physics','Organic Chemistry','Linear Algebra','Calculus',
  'AI Agents','Deep Learning','NLP','Computer Vision','DevOps',
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

// ─── NO fake/seeded data — app starts empty ──────────────────
// Empty arrays = clean user-first experience
export const INIT_TASKS: Task[] = []
export const INIT_HABITS: Habit[] = []
export const INIT_NOTES: Note[] = []
export const DEFAULT_SUBJECTS: Subject[] = []
