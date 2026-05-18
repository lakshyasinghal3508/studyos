// src/store/useAppStore.ts — clean slate, dynamic subjects, no fake data
import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import {
  Task, Habit, Note, Subject, PageId, KanbanColumn, Priority,
  INIT_TASKS, INIT_HABITS, INIT_NOTES, DEFAULT_SUBJECTS,
} from '@/constants/data'
import { generateId } from '@/utils'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface UserProfile {
  name: string
  email: string
  gpa: string
  year: string
  university: string
  accentColor: string
  aiStyle: string
  notifications: { tasks: boolean; pomodoro: boolean; habits: boolean; exams: boolean }
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  gpa: '',
  year: 'Freshman',
  university: '',
  accentColor: '#7C3AED',
  aiStyle: 'Encouraging & Motivating',
  notifications: { tasks: true, pomodoro: true, habits: true, exams: true },
}

type State = {
  activePage: PageId
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  theme: 'dark' | 'light'
  onboardingComplete: boolean
  profile: UserProfile
  subjects: Subject[]
  tasks: Task[]
  habits: Habit[]
  notes: Note[]
  selectedNoteId: string | null
  chatMessages: ChatMessage[]
  chatLoading: boolean
  chatError: string | null
}

type Actions = {
  setActivePage: (p: PageId) => void
  toggleSidebar: () => void
  setMobileSidebar: (v: boolean) => void
  setTheme: (t: 'dark' | 'light') => void
  toggleTheme: () => void
  completeOnboarding: (profileData: Partial<UserProfile>, subjects: Subject[]) => void
  updateProfile: (u: Partial<UserProfile>) => void
  setAccentColor: (c: string) => void

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
        theme: 'dark',
        onboardingComplete: false,
        profile: DEFAULT_PROFILE,
        subjects: DEFAULT_SUBJECTS,  // starts empty
        tasks: INIT_TASKS,           // starts empty
        habits: INIT_HABITS,         // starts empty
        notes: INIT_NOTES,           // starts empty
        selectedNoteId: null,
        chatMessages: [],            // starts empty
        chatLoading: false,
        chatError: null,

        setActivePage: p => set({ activePage: p, mobileSidebarOpen: false }),
        toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
        setMobileSidebar: v => set({ mobileSidebarOpen: v }),
        setTheme: t => set({ theme: t }),
        toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

        // Onboarding completes with user-provided profile + subjects
        completeOnboarding: (profileData, subjects) => {
          const name = profileData.name || 'Scholar'
          set({
            onboardingComplete: true,
            profile: { ...DEFAULT_PROFILE, ...profileData },
            subjects,
            chatMessages: [{
              id: 'welcome',
              role: 'assistant',
              timestamp: Date.now(),
              content: `Hey ${name}! 👋 I'm your AI study assistant. I can help you understand concepts, create study plans, explain difficult topics, or give productivity advice.\n\nWhat would you like to work on today?`,
            }],
          })
        },

        updateProfile: u => set(s => ({ profile: { ...s.profile, ...u } })),
        setAccentColor: c => set(s => ({ profile: { ...s.profile, accentColor: c } })),

        // ── Subjects ──────────────────────────────────────────
        addSubject: ({ name, color, icon }) => {
          const trimmed = name.trim()
          const existing = get().subjects.find(
            s => s.name.toLowerCase() === trimmed.toLowerCase()
          )
          if (existing) return existing
          const subject: Subject = {
            id: `sub_${generateId()}`,
            name: trimmed,
            color,
            icon,
            createdAt: Date.now(),
          }
          set(s => ({ subjects: [...s.subjects, subject] }))
          return subject
        },
        updateSubject: (id, u) => set(s => ({
          subjects: s.subjects.map(sub => sub.id === id ? { ...sub, ...u } : sub),
        })),
        deleteSubject: id => set(s => {
          const remaining = s.subjects.filter(sub => sub.id !== id)
          const fallbackId = remaining[0]?.id ?? ''
          return {
            subjects: remaining,
            tasks: s.tasks.map(t => t.subjectId === id ? { ...t, subjectId: fallbackId } : t),
            notes: s.notes.map(n => n.subjectId === id ? { ...n, subjectId: fallbackId } : n),
          }
        }),

        // ── Tasks ─────────────────────────────────────────────
        addTask: t => set(s => ({ tasks: [...s.tasks, { ...t, id: generateId() }] })),
        updateTask: (id, u) => set(s => ({
          tasks: s.tasks.map(t => t.id === id ? { ...t, ...u } : t),
        })),
        deleteTask: id => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
        moveTask: (id, col) => set(s => ({
          tasks: s.tasks.map(t => t.id === id ? { ...t, col, done: col === 'done' } : t),
        })),
        toggleTask: id => set(s => ({
          tasks: s.tasks.map(t =>
            t.id === id ? { ...t, done: !t.done, col: t.done ? 'todo' : 'done' } : t
          ),
        })),

        // ── Habits ────────────────────────────────────────────
        addHabit: name => set(s => ({
          habits: [
            ...s.habits,
            { id: generateId(), name, streak: 0, target: 14, log: Array(14).fill(0) as number[] },
          ],
        })),
        deleteHabit: id => set(s => ({ habits: s.habits.filter(h => h.id !== id) })),
        toggleHabitDay: (hId, day) => set(s => ({
          habits: s.habits.map(h => {
            if (h.id !== hId) return h
            const log = [...h.log]
            log[day] = log[day] ? 0 : 1
            const rev = [...log].reverse()
            const miss = rev.findIndex(v => !v)
            return { ...h, log, streak: miss === -1 ? log.length : miss }
          }),
        })),

        // ── Notes ─────────────────────────────────────────────
        newNote: () => {
          const firstSub = get().subjects[0]
          const note: Note = {
            id: generateId(),
            title: 'Untitled Note',
            content: '',
            subjectId: firstSub?.id ?? '',
            pinned: false,
            updated: new Date().toISOString().slice(0, 10),
          }
          set(s => ({ notes: [note, ...s.notes], selectedNoteId: note.id }))
          return note
        },
        updateNote: (id, u) => set(s => ({
          notes: s.notes.map(n =>
            n.id === id ? { ...n, ...u, updated: new Date().toISOString().slice(0, 10) } : n
          ),
        })),
        deleteNote: id => set(s => {
          const remaining = s.notes.filter(n => n.id !== id)
          return { notes: remaining, selectedNoteId: remaining[0]?.id ?? null }
        }),
        pinNote: id => set(s => ({
          notes: s.notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n),
        })),
        setSelectedNote: id => set({ selectedNoteId: id }),

        // ── Chat ──────────────────────────────────────────────
        addChatMsg: msg => set(s => ({
          chatMessages: [
            ...s.chatMessages,
            { ...msg, id: generateId(), timestamp: Date.now() },
          ],
        })),
        setChatLoading: v => set({ chatLoading: v }),
        setChatError: e => set({ chatError: e }),
        clearChat: () => {
          const name = get().profile.name || 'Scholar'
          set({
            chatMessages: [{
              id: generateId(),
              role: 'assistant',
              timestamp: Date.now(),
              content: `Chat cleared! Ready for a fresh start, ${name}. What's on your mind? 🎯`,
            }],
            chatError: null,
          })
        },
      }),
      {
        name: 'studyos-v4',
        partialize: s => ({
          subjects: s.subjects,
          tasks: s.tasks,
          habits: s.habits,
          notes: s.notes,
          selectedNoteId: s.selectedNoteId,
          profile: s.profile,
          theme: s.theme,
          sidebarCollapsed: s.sidebarCollapsed,
          onboardingComplete: s.onboardingComplete,
          chatMessages: s.chatMessages,
        }),
      }
    ),
    { name: 'StudyOS' }
  )
)

// ─── Selectors ────────────────────────────────────────────────
export const useSubjects  = () => useAppStore(s => s.subjects)
export const useTasks     = () => useAppStore(s => s.tasks)
export const useHabits    = () => useAppStore(s => s.habits)
export const useNotes     = () => useAppStore(s => s.notes)
export const useProfile   = () => useAppStore(s => s.profile)
export const useTheme     = () => useAppStore(s => s.theme)
export const useChat      = () => useAppStore(s => ({
  messages: s.chatMessages, loading: s.chatLoading, error: s.chatError,
}))
export const useSubjectById = (id: string) =>
  useAppStore(s => s.subjects.find(sub => sub.id === id))
export const useSubjectMap = () =>
  useAppStore(s => Object.fromEntries(s.subjects.map(s => [s.id, s])))
