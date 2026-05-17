import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { SafeMarkdown } from '@/components/ui/SafeMarkdown'
import { SubjectBadge } from '@/components/ui/Badge'
import { useAppStore, useNotes, useSubjects, useSubjectById } from '@/store/useAppStore'
import { Note } from '@/constants/data'
import { stripMarkdown, cn } from '@/utils'
import toast from 'react-hot-toast'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

async function summarizeWithAI(content: string): Promise<string> {
  const key = import.meta.env.VITE_GEMINI_API_KEY ?? ''
  if (!key) throw new Error('No AI key configured')
  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `Summarize this student note concisely with a 2-sentence overview and key bullet points:\n\n${content}` }] }],
      generationConfig: { maxOutputTokens: 600 },
    }),
  })
  if (!res.ok) throw new Error(`AI error ${res.status}`)
  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

function NoteListItem({ note, isSelected, onClick }: { note: Note; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded-[8px] border transition-all mb-1',
        isSelected ? 'bg-[var(--accent)]/10 border-[var(--accent)]/25' : 'border-transparent hover:bg-os-bg4'
      )}
    >
      <div className={cn('font-display font-medium text-[13px] mb-0.5 truncate', isSelected && 'text-[#A78BFA]')}>
        {note.title}
      </div>
      <div className="text-[11px] text-os-text3 truncate">{stripMarkdown(note.content, 50)}</div>
    </button>
  )
}

export function NotesPage() {
  const notes = useNotes()
  const subjects = useSubjects()
  const selectedId = useAppStore(s => s.selectedNoteId)
  const { newNote, updateNote, deleteNote, pinNote, setSelectedNote } = useAppStore(s => ({
    newNote: s.newNote, updateNote: s.updateNote, deleteNote: s.deleteNote,
    pinNote: s.pinNote, setSelectedNote: s.setSelectedNote,
  }))

  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [search, setSearch] = useState('')
  const [summarizing, setSummarizing] = useState(false)

  const selected = notes.find(n => n.id === selectedId) ?? null

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  )
  const pinned = filtered.filter(n => n.pinned)
  const unpinned = filtered.filter(n => !n.pinned)

  const selectNote = useCallback((note: Note) => {
    setSelectedNote(note.id)
    setDraftTitle(note.title)
    setDraftContent(note.content)
    setEditing(false)
  }, [setSelectedNote])

  const save = useCallback(() => {
    if (!selected) return
    updateNote(selected.id, { title: draftTitle, content: draftContent })
    setEditing(false)
    toast.success('Note saved')
  }, [selected, draftTitle, draftContent, updateNote])

  const handleNew = () => {
    const note = newNote()
    setDraftTitle(note.title)
    setDraftContent(note.content)
    setEditing(true)
  }

  const handleSummarize = async () => {
    if (!selected?.content) return
    setSummarizing(true)
    try {
      const BASE = import.meta.env.VITE_API_URL ?? '/api'
      let text = ''
      try {
        const res = await fetch(`${BASE}/ai/summarize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: selected.content }),
          signal: AbortSignal.timeout(15000),
        })
        if (res.ok) { const d = await res.json(); text = d?.data?.text ?? d?.text ?? '' }
        else throw new Error('backend')
      } catch {
        text = await summarizeWithAI(selected.content)
      }
      if (!text) throw new Error('Empty summary')
      const n = newNote()
      updateNote(n.id, { title: `📋 Summary: ${selected.title}`, content: text, subjectId: selected.subjectId })
      toast.success('AI summary created!')
    } catch {
      toast.error('Could not summarize. Try again.')
    }
    setSummarizing(false)
  }

  return (
    <PageShell>
      <div className="flex gap-0 h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-[240px] shrink-0 border-r border-os-border overflow-y-auto flex flex-col">
          <div className="pb-3 sticky top-0 bg-os-bg z-10 pt-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-black text-[18px]">Notes</h2>
              <Button variant="primary" size="xs" onClick={handleNew}>+</Button>
            </div>
            <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="text-[12px]" />
          </div>
          {pinned.length > 0 && (
            <>
              <div className="text-[10px] text-os-text3 font-display tracking-widest uppercase mb-2 mt-1">📌 Pinned</div>
              {pinned.map(n => <NoteListItem key={n.id} note={n} isSelected={selectedId === n.id} onClick={() => selectNote(n)} />)}
              <div className="h-px bg-os-border my-2" />
            </>
          )}
          <div className="text-[10px] text-os-text3 font-display tracking-widest uppercase mb-2 mt-1">All Notes</div>
          {unpinned.map(n => <NoteListItem key={n.id} note={n} isSelected={selectedId === n.id} onClick={() => selectNote(n)} />)}
          {notes.length === 0 && <p className="text-[12px] text-os-text3 text-center pt-6">No notes yet</p>}
        </div>

        {/* Editor */}
        <div className="flex-1 pl-5 overflow-y-auto min-w-0">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-os-text3">
                <div className="text-5xl mb-4" aria-hidden>📝</div>
                <p>Select a note or create a new one</p>
                <Button variant="primary" size="sm" className="mt-4" onClick={handleNew}>+ New Note</Button>
              </motion.div>
            ) : (
              <motion.div key={selected.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
                {/* Header */}
                <div className="flex items-start gap-3 mb-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    {editing ? (
                      <input
                        value={draftTitle}
                        onChange={e => setDraftTitle(e.target.value)}
                        className="text-[18px] font-display font-black bg-transparent text-os-text border-none outline-none w-full mb-2"
                        aria-label="Note title"
                      />
                    ) : (
                      <h2 className="font-display font-black text-[18px] mb-2">{selected.title}</h2>
                    )}
                    <div className="flex items-center gap-2">
                      {editing ? (
                        <Select
                          value={selected.subjectId}
                          onChange={e => updateNote(selected.id, { subjectId: e.target.value })}
                          className="w-auto text-[11px] py-1 px-2"
                        >
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                        </Select>
                      ) : (
                        <SubjectBadge subjectId={selected.subjectId} />
                      )}
                      <span className="text-[11px] text-os-text3">Updated {selected.updated}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap shrink-0">
                    <Button variant="ghost" size="xs" onClick={() => pinNote(selected.id)}>
                      {selected.pinned ? 'Unpin' : '📌 Pin'}
                    </Button>
                    <Button size="xs" onClick={handleSummarize} loading={summarizing} disabled={!selected.content}>
                      ✦ AI
                    </Button>
                    {editing ? (
                      <Button variant="primary" size="xs" onClick={save}>Save</Button>
                    ) : (
                      <Button size="xs" onClick={() => {
                        setDraftTitle(selected.title)
                        setDraftContent(selected.content)
                        setEditing(true)
                      }}>Edit</Button>
                    )}
                    <Button variant="ghost" size="xs" onClick={() => {
                      deleteNote(selected.id)
                      toast.success('Note deleted')
                    }}>Delete</Button>
                  </div>
                </div>

                {editing ? (
                  <textarea
                    value={draftContent}
                    onChange={e => setDraftContent(e.target.value)}
                    placeholder="Write your notes here… Supports **Markdown**"
                    className="w-full min-h-[400px] resize-y bg-os-bg4 border border-os-border rounded-xl p-4 text-[14px] text-os-text leading-relaxed outline-none focus:border-[var(--accent)] font-body"
                    aria-label="Note content"
                  />
                ) : (
                  <SafeMarkdown content={selected.content} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageShell>
  )
}
