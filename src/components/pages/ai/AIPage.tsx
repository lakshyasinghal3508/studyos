import { useState, useRef, useEffect, KeyboardEvent, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/Button'
import { SafeMarkdown } from '@/components/ui/SafeMarkdown'
import { useAppStore, useChat, useSubjects } from '@/store/useAppStore'
import { AI_SUGGESTIONS, AI_SYSTEM_PROMPT } from '@/constants/data'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

async function callGemini(messages: {role:string;content:string}[], system: string, apiKey: string): Promise<string> {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: { maxOutputTokens: 1200, temperature: 0.7 },
    }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Gemini error ${res.status}`)
  }
  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

async function callBackend(messages: {role:string;content:string}[], system: string): Promise<string> {
  const BASE = import.meta.env.VITE_API_URL ?? '/api'
  const res = await fetch(`${BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, system }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Backend error ${res.status}`)
  const data = await res.json()
  return data?.data?.text ?? data?.text ?? ''
}

function NoKeyBanner() {
  return (
    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/6 mb-4 shrink-0">
      <div className="font-display font-semibold text-amber-400 text-[13px] mb-2">⚙️ AI Setup Required</div>
      <ol className="text-[12px] text-os-text2 space-y-1 list-decimal list-inside mb-2">
        <li>Get free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">aistudio.google.com/apikey</a></li>
        <li>Vercel → project → Settings → Environment Variables</li>
        <li>Add: <code className="bg-os-bg5 px-1 rounded text-[11px]">VITE_GEMINI_API_KEY</code> = your key</li>
        <li>Redeploy from Vercel Deployments tab</li>
      </ol>
      <p className="text-[11px] text-os-text3">Completely free with generous limits.</p>
    </div>
  )
}

export function AIPage() {
  const { messages, loading, error } = useChat()
  const { addChatMsg, setChatLoading, setChatError, clearChat } = useAppStore(s => ({
    addChatMsg: s.addChatMsg, setChatLoading: s.setChatLoading,
    setChatError: s.setChatError, clearChat: s.clearChat,
  }))
  const subjects = useSubjects()

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isSendingRef = useRef(false)
  const hasUser = messages.some(m => m.role === 'user')
  const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? ''
  const hasKey = GEMINI_KEY.length > 10

  const systemPrompt = useMemo(() => {
    const subjectList = subjects.map(s => s.name).join(', ')
    return AI_SYSTEM_PROMPT + (subjectList
      ? `\n\nStudent's subjects: ${subjectList}. Personalize responses accordingly.`
      : '')
  }, [subjects])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading || isSendingRef.current) return
    if (!hasKey) {
      setChatError('Add your VITE_GEMINI_API_KEY in Vercel environment variables (see instructions above).')
      return
    }
    isSendingRef.current = true
    setInput('')
    setChatError(null)
    addChatMsg({ role: 'user', content: msg })
    setChatLoading(true)
    try {
      const history = [...messages.slice(-10), { role: 'user' as const, content: msg }]
        .map(m => ({ role: m.role, content: m.content }))
      let reply = ''
      try { reply = await callBackend(history, systemPrompt) }
      catch { reply = await callGemini(history, systemPrompt, GEMINI_KEY) }
      if (!reply) throw new Error('Empty response. Please try again.')
      addChatMsg({ role: 'assistant', content: reply })
    } catch (e) {
      setChatError((e as Error).message ?? 'Something went wrong.')
    } finally {
      setChatLoading(false)
      isSendingRef.current = false
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, messages, hasKey, addChatMsg, setChatLoading, setChatError, systemPrompt, GEMINI_KEY])

  return (
    <PageShell>
      <div className="flex flex-col h-[calc(100vh-80px)]">
        <div className="flex items-start justify-between mb-4 shrink-0">
          <div>
            <h1 className="font-display font-black text-[22px]">AI Study Assistant</h1>
            <p className="text-os-text2 text-[13px] mt-1">
              {subjects.length > 0
                ? `Personalized for: ${subjects.slice(0,3).map(s=>s.name).join(', ')}${subjects.length>3?'...':''}`
                : 'Your personal academic coach'}
            </p>
          </div>
          {hasUser && <Button variant="ghost" size="sm" onClick={clearChat}>Clear</Button>}
        </div>

        {!hasKey && <NoKeyBanner />}

        <AnimatePresence>
          {error && (
            <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-[13px] shrink-0" role="alert">
              ⚠ {error}
              <button className="ml-2 underline text-red-300" onClick={()=>setChatError(null)}>×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {!hasUser && hasKey && (
          <div className="flex flex-wrap gap-2 mb-4 shrink-0">
            {AI_SUGGESTIONS.map((s,i) => (
              <button key={i} onClick={()=>send(s)}
                className="text-[12px] px-3 py-1.5 rounded-full border border-os-border bg-os-bg4 text-os-text2 hover:border-[var(--accent)] hover:text-[#A78BFA] transition-all font-display">
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 min-h-0" role="log" aria-live="polite">
          {messages.length === 0 && hasKey && (
            <div className="flex flex-col items-center justify-center h-full text-center text-os-text3">
              <div className="text-4xl mb-4">✦</div>
              <p className="font-display font-semibold text-[14px]">Ask me anything</p>
              <p className="text-[12px] mt-1">Concepts, study plans, exam tips, career advice...</p>
            </div>
          )}
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
              className={`flex gap-2.5 ${msg.role==='user'?'justify-end':''}`}>
              {msg.role==='assistant' && (
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm"
                  style={{background:'linear-gradient(135deg,#7C3AED,#06B6D4)'}}>✦</div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
                msg.role==='user'
                  ?'bg-[var(--accent)] text-white rounded-br-sm'
                  :'bg-os-bg3 border border-os-border rounded-bl-sm'}`}>
                {msg.role==='assistant' ? <SafeMarkdown content={msg.content}/> : msg.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm"
                style={{background:'linear-gradient(135deg,#7C3AED,#06B6D4)'}}>✦</div>
              <div className="bg-os-bg3 border border-os-border rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  {[0,150,300].map(d=>(
                    <div key={d} className="w-2 h-2 rounded-full bg-[var(--accent)]"
                      style={{animation:`pulse 1.2s ${d}ms ease-in-out infinite`}}/>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        <div className="mt-4 flex gap-2.5 p-3 rounded-xl bg-os-bg2 border border-os-border shrink-0">
          <textarea ref={inputRef} value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
            placeholder={hasKey?"Ask anything...":"Add VITE_GEMINI_API_KEY in Vercel first"}
            disabled={!hasKey}
            rows={1} style={{resize:'none',height:36,lineHeight:'1.6'}}
            className="flex-1 bg-transparent text-[14px] text-os-text placeholder:text-os-text3 outline-none disabled:cursor-not-allowed"/>
          <Button variant="primary" size="sm" onClick={()=>send()}
            disabled={!input.trim()||loading||!hasKey} style={{minWidth:72}}>
            {loading?'…':'Send ↑'}
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
