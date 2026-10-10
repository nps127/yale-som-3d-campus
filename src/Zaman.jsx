import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Labubu from './Labubu.jsx'
import { chat } from './chat.js'
import { B, BOX, CAP, CYL, RING, SMILE, SPH, m, useTalker } from './avatar.jsx'

// Prof. Tauhid Zaman: black BLACKPINK hoodie, grey joggers, pink-soled kicks, nerd glasses,
// and a pink Labubu swinging from his belt loop. Built at the 1.9 m scale (see avatar.jsx), then
// scaled to his height. Talk to him by aiming at him; he turns to face you while you chat.

export const ZAMAN = { id: 'tauhid-zaman', name: 'Tauhid Zaman' }

const HEIGHT = 1.76
const SKIN = '#c58c62' // light brown
const HAIR = '#15110f'
const HOODIE = '#121215'
const HOODIE_2 = '#1d1d22'
const PINK = '#ff4fa3'
const JOGGERS = '#5a5d65'
const TORSO = new THREE.CylinderGeometry(0.21, 0.23, 0.62, 28)

function logoMat() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = HOODIE
  g.fillRect(0, 0, 512, 128)
  g.fillStyle = PINK
  g.font = '900 78px Impact, "Arial Black", sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('BLΛCKPINK', 256, 68)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 })
}

export default function Zaman({ position = [0, 0, 0], rotation = 0, phase = 0, room }) {
  const root = useRef()
  const head = useRef()
  const armR = useRef()
  const armL = useRef()
  const charm = useRef()
  const logo = useMemo(logoMat, [])
  const s = HEIGHT / 1.9
  useTalker({ id: ZAMAN.id, position, rotation, room, phase, root, head })

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase
    const talking = chat.open === ZAMAN.id
    root.current.position.y = Math.abs(Math.sin(t * 2)) * 0.01 // little bounce, he's vibing

    // right arm: hand on chin while thinking, explaining gestures while talking, relaxed sway otherwise
    const ra = armR.current.rotation
    if (talking && chat.busy) ra.set(-2.1, 0, 0.55)
    else if (talking) ra.set(-0.7 - Math.sin(t * 3.2) * 0.35, 0, -0.2 - Math.sin(t * 2.1) * 0.15)
    else ra.set(Math.sin(t * 1.1) * 0.08, 0, -0.12)
    armL.current.rotation.set(-Math.sin(t * 1.1) * 0.08, 0, 0.12)

    // the Labubu swings off the belt loop
    charm.current.rotation.z = Math.sin(t * 2.4) * 0.18
    charm.current.rotation.x = Math.sin(t * 1.7) * 0.1
  })

  const hoodie = m(HOODIE)
  const skin = m(SKIN)
  return (
    <group position={position}>
      <group ref={root} scale={s}>
        {/* sneakers with pink soles */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[0.1 * sx, 0, 0.03]}>
            <B g={BOX} c="#f2f2f2" p={[0, 0.055, 0]} s={[0.11, 0.07, 0.25]} />
            <B g={BOX} c={PINK} p={[0, 0.012, 0]} s={[0.118, 0.024, 0.258]} />
          </group>
        ))}
        {/* joggers */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <B g={CYL} c={JOGGERS} p={[0.1 * sx, 0.5, 0]} s={[0.085, 0.82, 0.085]} />
            <B g={CYL} c="#3f4148" p={[0.1 * sx, 0.11, 0]} s={[0.07, 0.05, 0.07]} />
          </group>
        ))}
        <B g={CYL} c={JOGGERS} p={[0, 0.88, 0]} s={[0.2, 0.14, 0.17]} />
        <B g={BOX} c="#3f4148" p={[0.17, 0.9, 0.1]} s={[0.012, 0.05, 0.012]} />

        {/* hoodie */}
        <mesh geometry={TORSO} material={hoodie} position={[0, 1.18, 0]} scale={[1, 1, 0.82]} />
        <B g={CYL} c={HOODIE_2} p={[0, 0.9, 0]} s={[0.235, 0.06, 0.195]} />
        <B c={HOODIE} p={[0, 1.47, 0]} s={[0.28, 0.1, 0.18]} />
        <mesh material={logo} position={[0, 1.3, 0.181]}>
          <planeGeometry args={[0.3, 0.075]} />
        </mesh>
        <B g={BOX} c={HOODIE_2} p={[0, 1.03, 0.18]} s={[0.26, 0.13, 0.025]} />
        {/* pink drawstrings + bunched hood */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <B g={CYL} c={PINK} p={[0.05 * sx, 1.4, 0.178]} s={[0.007, 0.16, 0.007]} />
            <B c="#ffffff" p={[0.05 * sx, 1.315, 0.178]} s={[0.011, 0.016, 0.011]} />
          </group>
        ))}
        <B g={RING} c={HOODIE} p={[0, 1.52, -0.01]} r={[Math.PI / 2, 0, 0]} s={[0.13, 0.13, 0.2]} />
        <B c={HOODIE_2} p={[0, 1.5, -0.13]} s={[0.17, 0.12, 0.08]} />

        {/* arms: hoodie sleeves, pivot at the shoulder */}
        <group ref={armL} position={[0.26, 1.46, 0]}>
          <mesh geometry={CAP} material={hoodie} position={[0, -0.24, 0]} scale={[0.07, 0.2, 0.07]} />
          <B g={CYL} c={HOODIE_2} p={[0, -0.47, 0]} s={[0.06, 0.04, 0.06]} />
          <mesh geometry={SPH} material={skin} position={[0, -0.52, 0.01]} scale={[0.045, 0.055, 0.04]} />
        </group>
        <group ref={armR} position={[-0.26, 1.46, 0]}>
          <mesh geometry={CAP} material={hoodie} position={[0, -0.24, 0]} scale={[0.07, 0.2, 0.07]} />
          <B g={CYL} c={HOODIE_2} p={[0, -0.47, 0]} s={[0.06, 0.04, 0.06]} />
          <mesh geometry={SPH} material={skin} position={[0, -0.52, 0.01]} scale={[0.045, 0.055, 0.04]} />
        </group>

        {/* Labubu keychain on the left belt loop */}
        <group ref={charm} position={[0.17, 0.88, 0.1]}>
          <B g={CYL} c="#c9c9cf" o={{ metalness: 0.9, roughness: 0.3 }} p={[0, -0.04, 0]} s={[0.004, 0.08, 0.004]} />
          <B g={RING} c="#c9c9cf" o={{ metalness: 0.9, roughness: 0.3 }} p={[0, 0.005, 0]} r={[0, Math.PI / 2, 0]} s={[0.015, 0.015, 0.015]} />
          <Labubu fur="#ff8fc7" expression="mischief" height={0.17} position={[0, -0.25, 0]} />
        </group>

        {/* neck + head */}
        <B g={CYL} c={SKIN} p={[0, 1.57, 0]} s={[0.05, 0.08, 0.05]} />
        <group ref={head} position={[0, 1.6, 0]}>
          <group position={[0, -1.6, 0]}>
            <B c={SKIN} p={[0, 1.7, 0]} s={[0.12, 0.14, 0.13]} />
            {[-1, 1].map((sx) => (
              <B key={sx} c={SKIN} p={[0.122 * sx, 1.7, 0]} s={[0.02, 0.035, 0.02]} />
            ))}
            {/* short black hair with a little texture on top */}
            <B c={HAIR} p={[0, 1.81, -0.005]} s={[0.128, 0.07, 0.135]} />
            <B c={HAIR} p={[0, 1.73, -0.055]} s={[0.125, 0.11, 0.095]} />
            {[-0.06, 0, 0.06].map((hx, i) => (
              <B key={i} c={HAIR} p={[hx, 1.865, 0.04 - i * 0.02]} s={[0.05, 0.03, 0.05]} />
            ))}
            {[-1, 1].map((sx) => (
              <B key={sx} g={BOX} c={HAIR} p={[0.118 * sx, 1.74, 0.03]} s={[0.012, 0.06, 0.04]} />
            ))}
            {/* eyes, brows, nose, grin */}
            {[-1, 1].map((sx) => (
              <group key={sx}>
                <B c="#ffffff" p={[0.045 * sx, 1.725, 0.112]} s={[0.022, 0.018, 0.012]} />
                <B c="#1d1410" p={[0.045 * sx, 1.725, 0.122]} s={[0.011, 0.012, 0.008]} />
                <B g={BOX} c={HAIR} p={[0.047 * sx, 1.762, 0.115]} r={[0, 0, -0.12 * sx]} s={[0.045, 0.011, 0.01]} />
              </group>
            ))}
            <B c="#b57d55" p={[0, 1.69, 0.128]} s={[0.022, 0.03, 0.025]} />
            <mesh geometry={SMILE} material={m('#6b2f2a')} position={[0, 1.66, 0.118]} rotation={[0, 0, Math.PI]} />
            {/* nerd glasses */}
            {[-1, 1].map((sx) => (
              <group key={sx}>
                <B g={RING} c="#0b0b0d" p={[0.047 * sx, 1.725, 0.13]} s={[0.032, 0.026, 0.03]} />
                <B g={BOX} c="#0b0b0d" p={[0.1 * sx, 1.73, 0.06]} s={[0.006, 0.006, 0.13]} />
              </group>
            ))}
            <B g={BOX} c="#0b0b0d" p={[0, 1.728, 0.132]} s={[0.03, 0.006, 0.006]} />
          </group>
        </group>
      </group>
    </group>
  )
}
