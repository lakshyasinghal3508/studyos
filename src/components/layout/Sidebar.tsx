import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils'
import { useAppStore, useProfile } from '@/store/useAppStore'
import { NAV_ITEMS, PageId } from '@/constants/data'

function NavButton({ item, active, collapsed }: { item: typeof NAV_ITEMS[0]; active: boolean; collapsed: boolean }) {
  const setPage = useAppStore(s => s.setActivePage)
  return (
    <button
      onClick={() => setPage(item.id)}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center gap-2.5 w-full rounded-[8px] border text-[13px] font-display font-medium transition-all duration-150',
        collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
        active
          ? 'bg-[var(--accent)]/12 border-[var(--accent)]/25 text-[#A78BFA]'
          : 'border-transparent text-os-text2 hover:text-os-text hover:bg-os-bg4'
      )}
    >
      <span className="text-base w-5 text-center shrink-0" aria-hidden>{item.icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
      {active && !collapsed && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" aria-hidden />
      )}
      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full ml-3 hidden group-hover:flex items-center bg-os-bg3 border border-os-border2 text-os-text text-[12px] px-3 py-1.5 rounded-lg whitespace-nowrap shadow-glass z-50 pointer-events-none">
          {item.label}
        </div>
      )}
    </button>
  )
}

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const { activePage, profile } = useAppStore(s => ({ activePage: s.activePage, profile: s.profile }))
  const toggleSidebar = useAppStore(s => s.toggleSidebar)

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-os-bg2 border-r border-os-border transition-[width] duration-300 ease-in-out overflow-hidden',
        collapsed ? 'w-16' : 'w-[220px]'
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-4 pb-5 pt-5 overflow-hidden')}>
        <div className="w-[34px] h-[34px] rounded-[9px] shrink-0 flex items-center justify-center font-display font-black text-base text-white animate-glow"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)' }}>
          A
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-display font-black text-[15px] whitespace-nowrap">StudyOS</div>
            <div className="text-[11px] text-os-text3 whitespace-nowrap">AI-Powered</div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto text-os-text3 hover:text-os-text w-6 h-6 flex items-center justify-center rounded-md hover:bg-os-bg4 transition-colors text-base shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 flex flex-col gap-0.5 overflow-y-auto" role="navigation">
        {NAV_ITEMS.map(item => (
          <NavButton key={item.id} item={item} active={activePage === item.id} collapsed={collapsed} />
        ))}
      </nav>

      {/* Profile */}
      <div className={cn('mt-auto pt-4 px-3 border-t border-os-border flex items-center gap-2.5 overflow-hidden', collapsed && 'justify-center')}>
        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-display font-bold text-[12px] text-white"
          style={{ background: 'linear-gradient(135deg,#EC4899,#7C3AED)' }}
          aria-hidden>
          {profile.name.charAt(0)}
        </div>
        {!collapsed && (
          <div className="overflow-hidden min-w-0">
            <div className="font-display font-semibold text-[13px] truncate">{profile.name}</div>
            <div className="text-[11px] text-os-text3 truncate">{profile.year} · {profile.gpa} GPA</div>
          </div>
        )}
      </div>
    </aside>
  )
}

export function Sidebar() {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebar } = useAppStore(s => ({
    sidebarCollapsed: s.sidebarCollapsed,
    mobileSidebarOpen: s.mobileSidebarOpen,
    setMobileSidebar: s.setMobileSidebar,
  }))

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex shrink-0">
        <SidebarContent collapsed={sidebarCollapsed} />
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-xl bg-os-bg3 border border-os-border2 flex items-center justify-center text-os-text text-lg shadow-glass"
        onClick={() => setMobileSidebar(true)}
        aria-label="Open navigation"
        aria-expanded={mobileSidebarOpen}
      >
        ☰
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileSidebar(false)}
              aria-hidden
            />
            <motion.div
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-[220px]"
            >
              <SidebarContent collapsed={false} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
