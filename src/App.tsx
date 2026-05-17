import { Suspense, lazy, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/layout/Sidebar'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { OnboardingPage } from '@/components/onboarding/OnboardingPage'
import { useAppStore } from '@/store/useAppStore'

// ── Lazy-loaded pages ────────────────────────────────────────
const DashboardPage  = lazy(() => import('@/components/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const TasksPage      = lazy(() => import('@/components/pages/tasks/TasksPage').then(m => ({ default: m.TasksPage })))
const AIPage         = lazy(() => import('@/components/pages/ai/AIPage').then(m => ({ default: m.AIPage })))
const NotesPage      = lazy(() => import('@/components/pages/notes/NotesPage').then(m => ({ default: m.NotesPage })))
const HabitsPage     = lazy(() => import('@/components/pages/habits/HabitsPage').then(m => ({ default: m.HabitsPage })))
const PlannerPage    = lazy(() => import('@/components/pages/planner/PlannerPage').then(m => ({ default: m.PlannerPage })))
const AnalyticsPage  = lazy(() => import('@/components/pages/analytics/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))
const SettingsPage   = lazy(() => import('@/components/pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))

const PAGES = {
  dashboard:  DashboardPage,
  tasks:      TasksPage,
  ai:         AIPage,
  notes:      NotesPage,
  habits:     HabitsPage,
  planner:    PlannerPage,
  analytics:  AnalyticsPage,
  settings:   SettingsPage,
} as const

function Fallback() {
  return (
    <div className="flex flex-col gap-3 pt-2">
      <CardSkeleton /><CardSkeleton />
    </div>
  )
}

export default function App() {
  const { activePage, onboardingComplete, theme, profile } = useAppStore(s => ({
    activePage:         s.activePage,
    onboardingComplete: s.onboardingComplete,
    theme:              s.theme,
    profile:            s.profile,
  }))

  // Sync theme class on html
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Sync accent color CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', profile.accentColor)
  }, [profile.accentColor])

  if (!onboardingComplete) {
    return <OnboardingPage />
  }

  const ActivePage = PAGES[activePage]

  return (
    <div className="flex h-screen overflow-hidden bg-os-bg mesh-bg noise-overlay">
      <Sidebar />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 overflow-y-auto p-7 min-w-0 md:pt-7 pt-16"
        aria-label="Main content"
      >
        {/* Skip to content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-[var(--accent)] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:no-underline text-[13px] font-medium"
        >
          Skip to content
        </a>

        <AnimatePresence mode="wait">
          <Suspense fallback={<Fallback />}>
            <ActivePage key={activePage} />
          </Suspense>
        </AnimatePresence>
      </main>
    </div>
  )
}
