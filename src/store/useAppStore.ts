import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import {
  Task, Habit, Note, Subject, PageId, KanbanColumn, Priority,
  INIT_TASKS, INIT_HABITS, INIT_NOTES, DEFAULT_SUBJECTS,
} from '@/constants/data'
import { generateId } from '@/utils'

export interface ChatMessage {
  id: string; role: 'user' | 'assistant'; content: string; timestamp: number
}

export interface UserProfile {
  name: string; email: string; mobile: string; gpa: string; year: string
  aiStyle: string
  notifications: { tasks: boolean; pomodoro: boolean; habits: boolean; exams: boolean }
}

// ─── Planner types ────────────────────────────────────────────
export interface Exam {
  id: string; name: string; date: string; subject: string; notes: string; createdAt: number
}

export interface StudyBlock {
  id: string; title: string; startTime: string; endTime: string
  subjectId: string; notes: string; day: string; color: string
}

// ─── Analytics daily log ──────────────────────────────────────
export interface DailyLog {
  date: string           // YYYY-MM-DD
  studyMinutes: number
  tasksCompleted: number
  habitsCompleted: number
  focusSessions: number
}

const DEFAULT_PROFILE: UserProfile = {
  name: '', email: '', mobile: '', gpa: '', year: 'Freshman',
  aiStyle: 'Encouraging & Motivating',
  notifications: { tasks: true, pomodoro: true, habits: true, exams: true },
}

type State = {
  activePage: PageId
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  onboardingComplete: boolean
  profile: UserProfile
  subjects: Subject[]
  tasks: Task[]
  habits: Habit[]
  notes: Note[]
  selectedNoteId: string | null
  exams: Exam[]
  studyBlocks: StudyBlock[]
  dailyLogs: DailyLog[]
  chatMessages: ChatMessage[]
  chatLoading: boolean
  chatError: string | null
}

type Actions = {
  setActivePage: (p: PageId) => void
  toggleSidebar: () => void
  setMobileSidebar: (v: boolean) => void
  completeOnboarding: (profileData: Partial<UserProfile>, subjects: Subject[]) => void
  updateProfile: (u: Partial<UserProfile>) => void

  // Subjects
  addSubject: (s: Omit<Subject, 'id' | 'createdAt'>) => Subject
  updateSubject: (id: string, u: Partial<Subject>) => void
  deleteSubject: (id: string) => void

  // Tasks
  addTask: (t: Omit<Task, 'id'>) => void
  updateTask: (id: string, u: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, col: KanbanColumn) => void
  toggleTask: (id: string) => void

  // Habits
  addHabit: (name: string) => void
  deleteHabit: (id: string) => void
  toggleHabitDay: (hId: string, day: number) => void

  // Notes
  newNote: () => Note
  updateNote: (id: string, u: Partial<Note>) => void
  deleteNote: (id: string) => void
  pinNote: (id: string) => void
  setSelectedNote: (id: string | null) => void

  // Exams
  addExam: (e: Omit<Exam, 'id' | 'createdAt'>) => void
  updateExam: (id: string, u: Partial<Exam>) => void
  deleteExam: (id: string) => void

  // Study blocks
  addStudyBlock: (b: Omit<StudyBlock, 'id'>) => void
  updateStudyBlock: (id: string, u: Partial<StudyBlock>) => void
  deleteStudyBlock: (id: string) => void

  // Daily analytics
  logStudySession: (minutes: number) => void
  logTaskComplete: () => void

  // Chat
  addChatMsg: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setChatLoading: (v: boolean) => void
  setChatError: (e: string | null) => void
  clearChat: () => void
}

export const useAppStore = create<State & Actions>()(
  devtools(
    persist(
      (set, get) => ({
        activePage: 'dashboard',
        sidebarCollapsed: false,
        mobileSidebarOpen: false,
        onboardingComplete: false,
        profile: DEFAULT_PROFILE,
        subjects: DEFAULT_SUBJECTS,
        tasks: INIT_TASKS,
        habits: INIT_HABITS,
        notes: INIT_NOTES,
        selectedNoteId: null,
        exams: [],
        studyBlocks: [],
        dailyLogs: [],
        chatMessages: [],
        chatLoading: false,
        chatError: null,

        setActivePage: p => set({ activePage: p, mobileSidebarOpen: false }),
        toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
        setMobileSidebar: v => set({ mobileSidebarOpen: v }),

        completeOnboarding: (profileData, subjects) => {
          const name = profileData.name || 'Scholar'
          set({
            onboardingComplete: true,
            profile: { ...DEFAULT_PROFILE, ...profileData },
            subjects,
            chatMessages: [{
              id: 'welcome', role: 'assistant', timestamp: Date.now(),
              content: `Hey ${name}! 👋 I'm your AI study assistant. I can help you understand concepts, create study plans, explain difficult topics, or give productivity advice.\n\nWhat would you like to work on today?`,
            }],
          })
        },

        updateProfile: u => set(s => ({ profile: { ...s.profile, ...u } })),

        addSubject: ({ name, color, icon }) => {
          const trimmed = name.trim()
          const existing = get().subjects.find(s => s.name.toLowerCase() === trimmed.toLowerCase())
          if (existing) return existing
          const subject: Subject = { id: `sub_${generateId()}`, name: trimmed, color, icon, createdAt: Date.now() }
          set(s => ({ subjects: [...s.subjects, subject] }))
          return subject
        },
        updateSubject: (id, u) => set(s => ({ subjects: s.subjects.map(sub => sub.id === id ? { ...sub, ...u } : sub) })),
        deleteSubject: id => set(s => {
          const remaining = s.subjects.filter(sub => sub.id !== id)
          const fallbackId = remaining[0]?.id ?? ''
          return {
            subjects: remaining,
            tasks: s.tasks.map(t => t.subjectId === id ? { ...t, subjectId: fallbackId } : t),
            notes: s.notes.map(n => n.subjectId === id ? { ...n, subjectId: fallbackId } : n),
          }
        }),

        addTask: t => set(s => ({ tasks: [...s.tasks, { ...t, id: generateId() }] })),
        updateTask: (id, u) => set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...u } : t) })),
        deleteTask: id => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
        moveTask: (id, col) => set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, col, done: col === 'done' } : t) })),
        toggleTask: id => set(s => ({
          tasks: s.tasks.map(t => t.id === id ? { ...t, done: !t.done, col: t.done ? 'todo' : 'done' } : t)
        })),

        addHabit: name => set(s => ({
          habits: [...s.habits, { id: generateId(), name, streak: 0, target: 14, log: Array(14).fill(0) as number[] }]
        })),
        deleteHabit: id => set(s => ({ habits: s.habits.filter(h => h.id !== id) })),
        toggleHabitDay: (hId, day) => set(s => ({
          habits: s.habits.map(h => {
            if (h.id !== hId) return h
            const log = [...h.log]; log[day] = log[day] ? 0 : 1
            const rev = [...log].reverse(); const miss = rev.findIndex(v => !v)
            return { ...h, log, streak: miss === -1 ? log.length : miss }
          })
        })),

        newNote: () => {
          const firstSub = get().subjects[0]
          const note: Note = { id: generateId(), title: 'Untitled Note', content: '', subjectId: firstSub?.id ?? '', pinned: false, updated: new Date().toISOString().slice(0, 10) }
          set(s => ({ notes: [note, ...s.notes], selectedNoteId: note.id }))
          return note
        },
        updateNote: (id, u) => set(s => ({ notes: s.notes.map(n => n.id === id ? { ...n, ...u, updated: new Date().toISOString().slice(0, 10) } : n) })),
        deleteNote: id => set(s => { const r = s.notes.filter(n => n.id !== id); return { notes: r, selectedNoteId: r[0]?.id ?? null } }),
        pinNote: id => set(s => ({ notes: s.notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n) })),
        setSelectedNote: id => set({ selectedNoteId: id }),

        // ── Exams ─────────────────────────────────────────────
        addExam: e => set(s => ({ exams: [...s.exams, { ...e, id: generateId(), createdAt: Date.now() }] })),
        updateExam: (id, u) => set(s => ({ exams: s.exams.map(e => e.id === id ? { ...e, ...u } : e) })),
        deleteExam: id => set(s => ({ exams: s.exams.filter(e => e.id !== id) })),

        // ── Study blocks ──────────────────────────────────────
        addStudyBlock: b => set(s => ({ studyBlocks: [...s.studyBlocks, { ...b, id: generateId() }] })),
        updateStudyBlock: (id, u) => set(s => ({ studyBlocks: s.studyBlocks.map(b => b.id === id ? { ...b, ...u } : b) })),
        deleteStudyBlock: id => set(s => ({ studyBlocks: s.studyBlocks.filter(b => b.id !== id) })),

        // ── Daily analytics log ───────────────────────────────
        logStudySession: minutes => {
          const today = new Date().toISOString().slice(0, 10)
          set(s => {
            const logs = [...s.dailyLogs]
            const idx = logs.findIndex(l => l.date === today)
            if (idx >= 0) {
              logs[idx] = { ...logs[idx], studyMinutes: logs[idx].studyMinutes + minutes, focusSessions: logs[idx].focusSessions + 1 }
            } else {
              logs.push({ date: today, studyMinutes: minutes, tasksCompleted: 0, habitsCompleted: 0, focusSessions: 1 })
            }
            return { dailyLogs: logs }
          })
        },
        logTaskComplete: () => {
          const today = new Date().toISOString().slice(0, 10)
          set(s => {
            const logs = [...s.dailyLogs]
            const idx = logs.findIndex(l => l.date === today)
            if (idx >= 0) logs[idx] = { ...logs[idx], tasksCompleted: logs[idx].tasksCompleted + 1 }
            else logs.push({ date: today, studyMinutes: 0, tasksCompleted: 1, habitsCompleted: 0, focusSessions: 0 })
            return { dailyLogs: logs }
          })
        },

        addChatMsg: msg => set(s => ({ chatMessages: [...s.chatMessages, { ...msg, id: generateId(), timestamp: Date.now() }] })),
        setChatLoading: v => set({ chatLoading: v }),
        setChatError: e => set({ chatError: e }),
        clearChat: () => {
          const name = get().profile.name || 'Scholar'
          set({ chatMessages: [{ id: generateId(), role: 'assistant', timestamp: Date.now(), content: `Chat cleared! Ready for a fresh start, ${name}. 🎯` }], chatError: null })
        },
      }),
      {
        name: 'studyos-v5',
        partialize: s => ({
          subjects: s.subjects, tasks: s.tasks, habits: s.habits, notes: s.notes,
          selectedNoteId: s.selectedNoteId, profile: s.profile,
          sidebarCollapsed: s.sidebarCollapsed, onboardingComplete: s.onboardingComplete,
          chatMessages: s.chatMessages, exams: s.exams, studyBlocks: s.studyBlocks, dailyLogs: s.dailyLogs,
        }),
      }
    ),
    { name: 'StudyOS' }
  )
)

export const useSubjects   = () => useAppStore(s => s.subjects)
export const useTasks      = () => useAppStore(s => s.tasks)
export const useHabits     = () => useAppStore(s => s.habits)
export const useNotes      = () => useAppStore(s => s.notes)
export const useProfile    = () => useAppStore(s => s.profile)
export const useExams      = () => useAppStore(s => s.exams)
export const useStudyBlocks= () => useAppStore(s => s.studyBlocks)
export const useDailyLogs  = () => useAppStore(s => s.dailyLogs)
export const useChat       = () => useAppStore(s => ({ messages: s.chatMessages, loading: s.chatLoading, error: s.chatError }))
export const useSubjectById= (id: string) => useAppStore(s => s.subjects.find(sub => sub.id === id))
