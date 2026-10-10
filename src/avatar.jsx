import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { chat, openChat, setAimed, typing } from './chat.js'
import { DRUMS } from './layout.js'

// Shared pieces for the real-faculty avatars you can talk to (Zaman.jsx, Schott.jsx).
// Figures are built at the 1.9 m scale of Professor.jsx: head at y = 1.7, facing +z, own right hand at -x.

const mats = new Map()
export const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o }))
  return mats.get(k)
}
export const SPH = new THREE.SphereGeometry(1, 24, 16)
export const CYL = new THREE.CylinderGeometry(1, 1, 1, 20)
export const BOX = new THREE.BoxGeometry(1, 1, 1)
export const RING = new THREE.TorusGeometry(1, 0.12, 8, 24)
export const CAP = new THREE.CapsuleGeometry(1, 1, 6, 12)
export const CONE = new THREE.ConeGeometry(1, 1, 20)
export const SMILE = new THREE.TorusGeometry(0.03, 0.006, 6, 14, Math.PI)

export const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o }) => <mesh geometry={g} material={m(c, o)} position={p} scale={s} rotation={r} />

const TALK_RANGE = 5 // meters
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a))
const ray = new THREE.Vector3()
const toP = new THREE.Vector3()

// inside classroom `room`: within the drum's ellipse and in front of its front (screen) wall
function inRoom(room, x, z) {
  const d = DRUMS.find((r) => r.id === room)
  if (!d) return true
  const { fc, back } = d.front
  return ((x - d.c[0]) / d.rx) ** 2 + ((z - d.c[1]) / d.rz) ** 2 < 1 && (x - fc[0]) * back[0] + (z - fc[1]) * back[1] > 0
}

// Makes an avatar talkable: aim the crosshair at it (same room, within range) and click / press E /
// tap "Talk" to open its chat. While chatting, `root` turns to face the player and `head` tilts to
// meet their eyes; otherwise the body slowly scans the room. Returns nothing; read chat.open / chat.busy
// in your own useFrame for gestures.
export function useTalker({ id, position, rotation, room, phase = 0, root, head }) {
  const { camera } = useThree()

  useEffect(() => {
    const talk = () => chat.aimed === id && !chat.open && openChat(id)
    const click = (e) => e.button === 0 && document.pointerLockElement && talk()
    const key = (e) => e.code === 'KeyE' && !typing(e) && talk()
    window.addEventListener('mousedown', click)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('mousedown', click)
      window.removeEventListener('keydown', key)
      if (chat.aimed === id) setAimed(null)
    }
  }, [id])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + phase
    const [x, , z] = position
    const talking = chat.open === id

    // is the crosshair on them? (ray from the camera vs. a few points down the body)
    if (!chat.open) {
      camera.getWorldDirection(ray)
      let hit = false
      const near = Math.hypot(camera.position.x - x, camera.position.z - z) < TALK_RANGE && inRoom(room, camera.position.x, camera.position.z)
      for (const y of near ? [0.5, 1.0, 1.5] : []) {
        toP.set(x - camera.position.x, y - camera.position.y, z - camera.position.z)
        const along = toP.dot(ray)
        if (along > 0 && along < TALK_RANGE && toP.addScaledVector(ray, -along).length() < 0.35) hit = true
      }
      if (hit !== (chat.aimed === id)) setAimed(hit ? id : null)
    }

    // body: face the player while chatting, otherwise scan the room
    const dx = camera.position.x - x
    const dz = camera.position.z - z
    const target = talking ? Math.atan2(dx, dz) : rotation + Math.sin(t * 0.4) * 0.35
    const r = root.current
    r.userData.yaw ??= rotation
    r.userData.yaw += wrap(target - r.userData.yaw) * Math.min(1, dt * (talking ? 5 : 2))
    r.rotation.y = r.userData.yaw

    // head: tilt toward the player's eyes while chatting, small nods otherwise; cock it while thinking
    const pitch = talking ? -Math.atan2(camera.position.y - 1.6, Math.hypot(dx, dz)) : 0
    const h = head.current.rotation
    h.x += (Math.max(-0.4, Math.min(0.4, pitch)) + Math.sin(t * 3) * 0.03 - h.x) * Math.min(1, dt * 6)
    h.z = talking && chat.busy ? 0.15 : Math.sin(t * 0.7) * 0.04
  })
}
