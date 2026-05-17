// AIPage.tsx — Fixed AI integration with direct Gemini fallback
// If backend is down/sleeping, calls Gemini directly (key exposed is ok for Gemini)
// Backend call attempted first; fallback to direct API if it fails

import { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/Button'
import { SafeMarkdown } from '@/components/ui/SafeMarkdown'
import { useAppStore, useChat } from '@/store/useAppStore'
import { AI_SUGGESTIONS, AI_SYSTEM_PROMPT } from '@/constants/data'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? ''

async function callGeminiDirect(
  messages: { role: string; content: string }[],
  system: string
): Promise<string> {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Gemini error ${res.status}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!text) throw new Error('Empty response from AI')
  return text
}

async function callBackendAI(
  messages: { role: string; content: string }[],
  system: string
): Promise<string> {
  const BASE = import.meta.env.VITE_API_URL ?? '/api'
  const res = await fetch(`${BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, system }),
    signal: AbortSignal.timeout(15000), // 15s timeout
  })
  if (!res.ok) throw new Error(`Backend error ${res.status}`)
  const data = await res.json()
  return data?.data?.text ?? data?.text ?? ''
}

export function AIPage() {
  const { messages, loading, error } = useChat()
  const { addChatMsg, setChatLoading, setChatError, clearChat } = useAppStore(s => ({
    addChatMsg: s.addChatMsg,
    setChatLoading: s.setChatLoading,
    setChatError: s.setChatError,
    clearChat: s.clearChat,
  }))

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isSendingRef = useRef(false)
  const hasUser = messages.some(m => m.role === 'user')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading || isSendingRef.current) return

    isSendingRef.current = true
    setInput('')
    setChatError(null)
    addChatMsg({ role: 'user', content: msg })
    setChatLoading(true)

    try {
      const history = [
        ...messages.slice(-10),
        { role: 'user' as const, content: msg },
      ].map(m => ({ role: m.role, content: m.content }))

      let reply = ''

      // Try backend first, then direct Gemini fallback
      try {
        reply = await callBackendAI(history, AI_SYSTEM_PROMPT)
      } catch (backendErr) {
        console.warn('Backend AI failed, trying Gemini direct:', backendErr)
        if (!GEMINI_KEY) {
          throw new Error('AI service unavailable. Please check your connection and try again.')
        }
        reply = await callGeminiDirect(history, AI_SYSTEM_PROMPT)
      }

      if (!reply) throw new Error('Received empty response. Please try again.')
      addChatMsg({ role: 'assistant', content: reply })
    } catch (e) {
      const err = e as Error
      setChatError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setChatLoading(false)
      isSendingRef.current = false
      // Refocus input after response
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, messages, addChatMsg, setChatLoading, setChatError])

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <PageShell>
      <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 shrink-0">
          <div>
            <h1 className="font-display font-black text-[22px]">AI Study Assistant</h1>
            <p className="text-os-text2 text-[13px] mt-1">Your personal academic coach</p>
          </div>
          {hasUser && (
            <Button variant="ghost" size="sm" onClick={clearChat}>Clear</Button>
          )}
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-[13px] shrink-0"
              role="alert"
            >
              ⚠ {error}
              <button className="ml-2 underline text-red-300 hover:text-red-200" onClick={() => setChatError(null)}>
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions */}
        {!hasUser && (
          <div className="flex flex-wrap gap-2 mb-4 shrink-0">
            {AI_SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s)}
                className="text-[12px] px-3 py-1.5 rounded-full border border-os-border bg-os-bg4 text-os-text2 hover:border-[var(--accent)] hover:text-[#A78BFA] hover:bg-[var(--accent)]/8 transition-all font-display"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 min-h-0"
          role="log"
          aria-live="polite"
          aria-label="Conversation"
        >
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)' }}
                  aria-hidden
                >✦</div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[var(--accent)] text-white rounded-br-sm'
                    : 'bg-os-bg3 border border-os-border rounded-bl-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <SafeMarkdown content={msg.content} />
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex gap-2.5"
            >
              <div
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)' }}
                aria-hidden
              >✦</div>
              <div className="bg-os-bg3 border border-os-border rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center" aria-label="AI is typing">
                  {[0, 150, 300].map(d => (
                    <div
                      key={d}
                      className="w-2 h-2 rounded-full bg-[var(--accent)]"
                      style={{ animation: `pulse 1.2s ${d}ms ease-in-out infinite` }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} aria-hidden />
        </div>

        {/* Input bar */}
        <div className="mt-4 flex gap-2.5 p-3 rounded-xl bg-os-bg2 border border-os-border shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask me anything about studying, concepts, career paths…"
            aria-label="Message input"
            rows={1}
            style={{ resize: 'none', height: 36, lineHeight: '1.6' }}
            className="flex-1 bg-transparent text-[14px] text-os-text placeholder:text-os-text3 outline-none"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{ minWidth: 72 }}
          >
            {loading ? '…' : 'Send ↑'}
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
