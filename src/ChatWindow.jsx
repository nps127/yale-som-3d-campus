import { Fragment, useEffect, useRef, useState } from 'react'
import { TALKERS, setBusy } from './chat.js'

// Chat panel for a professor avatar. Talks to the FastAPI backend (backend/main.py); in dev, Vite
// proxies /api to it. Set VITE_API_URL to point a deployed build at a hosted backend.
const API = import.meta.env.VITE_API_URL ?? ''

// conversations survive closing/reopening the window (until the page reloads)
const threads = new Map()
function thread(id) {
  if (!threads.has(id)) threads.set(id, { session: crypto.randomUUID(), messages: [{ role: 'prof', text: TALKERS[id].greeting }] })
  return threads.get(id)
}

// **bold** is the only markdown worth rendering in a chat bubble
const Rich = ({ text }) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  )

export default function ChatWindow({ profId, onClose }) {
  const prof = TALKERS[profId]
  const t = thread(profId)
  const [messages, setMessages] = useState(t.messages)
  const [draft, setDraft] = useState('')
  const [busy, setBusyState] = useState(false)
  const input = useRef()
  const log = useRef()
  const last = prof.name.split(' ').slice(-1)[0]

  useEffect(() => {
    // focus once the click that opened us is done, so it doesn't land on the canvas
    const id = setTimeout(() => input.current?.focus(), 50)
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => {
      clearTimeout(id)
      window.removeEventListener('keydown', esc)
    }
  }, [onClose])
  useEffect(() => {
    t.messages = messages
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' })
  }, [messages, t])

  const push = (msg) => setMessages((ms) => [...ms, msg])

  async function send(text) {
    text = text.trim()
    if (!text || busy) return
    setDraft('')
    setMessages((ms) => [...ms.filter((m) => m.role !== 'error'), { role: 'me', text }])
    setBusyState(true)
    setBusy(true)
    try {
      const res = await fetch(`${API}/api/professors/${profId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: t.session }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.reply) {
        throw new Error(data?.detail ?? (res.status === 404 || !data ? `Can't reach Prof. ${last}'s brain. Is the backend running?` : `Error ${res.status}`))
      }
      push({ role: 'prof', text: data.reply })
    } catch (err) {
      const offline = err instanceof TypeError // fetch itself failed: server down / no network
      push({ role: 'error', text: offline ? `Can't reach Prof. ${last}'s brain. Is the backend running?` : String(err.message ?? err), retry: text })
    } finally {
      setBusyState(false)
      setBusy(false)
      input.current?.focus()
    }
  }

  return (
    <aside className="chat" role="dialog" aria-label={`Chat with Professor ${prof.name}`}>
      <header className="chat-head">
        <div className="chat-avatar" aria-hidden="true">
          {prof.name
            .split(' ')
            .map((w) => w[0])
            .join('')}
        </div>
        <div className="chat-who">
          <div className="chat-name">Prof. {prof.name}</div>
          <div className="chat-meta">
            {prof.title} · {prof.room}
          </div>
        </div>
        <button className="chat-close" onClick={onClose} aria-label="Close chat (Esc)">
          ×
        </button>
      </header>

      <div className="chat-log" ref={log} aria-live="polite">
        {messages.map((msg, i) => (
          <div key={i} className={`bubble ${msg.role}`}>
            {msg.role === 'error' ? (
              <>
                <span>{msg.text}</span>
                <button className="retry" onClick={() => send(msg.retry)}>
                  Try again
                </button>
              </>
            ) : (
              <Rich text={msg.text} />
            )}
          </div>
        ))}
        {busy && (
          <div className="bubble prof typing" aria-label={`Prof. ${last} is typing`}>
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault()
          send(draft)
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Message Prof. {last}
        </label>
        <textarea
          id="chat-input"
          ref={input}
          rows={1}
          value={draft}
          maxLength={2000}
          placeholder={`Ask Prof. ${last} anything…`}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(draft)
            }
          }}
        />
        <button type="submit" className="chat-send" disabled={busy || !draft.trim()}>
          Send
        </button>
      </form>
      <div className="chat-foot">AI avatar built from the course catalog · can make mistakes · Esc to go back</div>
    </aside>
  )
}
