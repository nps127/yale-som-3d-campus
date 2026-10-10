import { useSyncExternalStore } from 'react'

// Tiny shared store between the 3D scene (avatars) and the DOM (chat window, hints).
// Avatars read `chat` directly inside useFrame; React components subscribe with useChat().
//   open   professor id whose chat window is open, or null
//   aimed  professor id under the crosshair (close enough to talk to), or null
//   busy   true while waiting for a reply (avatars can look thoughtful)

// professors with a 3D avatar you can talk to; ids match the backend (/api/professors)
export const TALKERS = {
  'tauhid-zaman': {
    name: 'Tauhid Zaman',
    title: 'MGT 409 · AI Foundations for Managers',
    room: 'Evans 2200',
    greeting: "Yo! Welcome to 2200. Ask me anything: MGT 409, stats, regression, the central limit theorem, AI, or any other class at SOM. I'll look it up, no cap.",
  },
  'peter-schott': {
    name: 'Peter Schott',
    title: 'MGT 407 · Statistics (EMBA)',
    room: 'Evans 2210',
    greeting: "Hey hey, welcome to 2210! Totoro and I were just talking about standard errors. Ask me about stats, regression, trade, or any class here. And tell me how I'm doing, I love feedback!",
  },
}

export const chat = { open: null, aimed: null, busy: false }
let snapshot = { ...chat }
const subs = new Set()

function set(patch) {
  if (Object.keys(patch).every((k) => chat[k] === patch[k])) return
  Object.assign(chat, patch)
  snapshot = { ...chat }
  subs.forEach((f) => f())
}

export const openChat = (id) => set({ open: id, aimed: null })
export const closeChat = () => set({ open: null, busy: false })
export const setAimed = (id) => set({ aimed: id })
export const setBusy = (busy) => set({ busy })

const subscribe = (f) => {
  subs.add(f)
  return () => subs.delete(f)
}
export const useChat = () => useSyncExternalStore(subscribe, () => snapshot)

// true while the user is typing in a text field (so game hotkeys stay out of the way)
export const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName ?? '')
