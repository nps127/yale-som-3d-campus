import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { chat } from './chat.js'
import { B, BOX, CAP, CONE, CYL, SMILE, SPH, m, useTalker } from './avatar.jsx'

// Prof. Peter Schott: light-blue open-collar button-down with a chest pocket, navy chinos, brown
// belt and shoes, dark brown swept hair going a little grey at the temples, blue eyes, easy smile.
// His Totoro plush stands next to him. Built at the 1.9 m scale (see avatar.jsx), then scaled.

export const SCHOTT = { id: 'peter-schott', name: 'Peter Schott' }

const HEIGHT = 1.83
const SKIN = '#ebc1a2'
const HAIR = '#3a2a1e'
const GREY = '#8b8279'
const SHIRT = '#a9c4e6'
const SHIRT_2 = '#97b3da'
const CHINOS = '#2b3347'
const LEATHER = '#4a3020'
const TORSO = new THREE.CylinderGeometry(0.2, 0.215, 0.58, 28)

// Totoro plush, ~0.5 m tall, faces +z
function Totoro({ position }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const happy = chat.open === SCHOTT.id
    ref.current.rotation.z = Math.sin(t * 1.3) * (happy ? 0.12 : 0.05)
    ref.current.position.y = happy ? Math.abs(Math.sin(t * 4)) * 0.04 : 0
  })
  const fur = '#7c7f88'
  const belly = '#efe6cf'
  return (
    <group position={position}>
      <group ref={ref}>
        <B c={fur} p={[0, 0.24, 0]} s={[0.2, 0.24, 0.18]} />
        <B c={belly} p={[0, 0.2, 0.1]} s={[0.15, 0.17, 0.1]} />
        {/* the chevrons on his belly */}
        {[
          [0, 0.3, 0.19],
          [-0.05, 0.27, 0.185],
          [0.05, 0.27, 0.185],
        ].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            {[-1, 1].map((sx) => (
              <B key={sx} g={BOX} c="#6d6f77" p={[0.013 * sx, 0, 0]} r={[0, 0, -0.55 * sx]} s={[0.032, 0.008, 0.006]} />
            ))}
          </group>
        ))}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <B g={CONE} c={fur} p={[0.08 * sx, 0.5, -0.01]} r={[0, 0, -0.15 * sx]} s={[0.035, 0.12, 0.03]} />
            <B c="#ffffff" p={[0.07 * sx, 0.38, 0.13]} s={[0.032, 0.032, 0.012]} />
            <B c="#111111" p={[0.07 * sx, 0.38, 0.14]} s={[0.014, 0.014, 0.008]} />
            {[-1, 0, 1].map((k) => (
              <B key={k} g={BOX} c="#2a2a2a" p={[0.12 * sx, 0.35 + k * 0.018, 0.115]} r={[0, 0, k * 0.15 * sx]} s={[0.07, 0.003, 0.003]} />
            ))}
            <B c={fur} p={[0.18 * sx, 0.25, 0.03]} r={[0, 0, 0.2 * sx]} s={[0.05, 0.12, 0.05]} />
            <B c={fur} p={[0.08 * sx, 0.02, 0.06]} s={[0.06, 0.03, 0.07]} />
          </group>
        ))}
        <B c="#2a2a2a" p={[0, 0.39, 0.143]} s={[0.02, 0.01, 0.01]} />
        {/* leaf on his head */}
        <B c="#4f9a3c" p={[0, 0.49, 0.02]} r={[0.2, 0, 0.3]} s={[0.07, 0.008, 0.035]} />
      </group>
    </group>
  )
}

export default function Schott({ position = [0, 0, 0], rotation = 0, phase = 0, room }) {
  const root = useRef()
  const head = useRef()
  const armR = useRef()
  const armL = useRef()
  const s = HEIGHT / 1.9
  useTalker({ id: SCHOTT.id, position, rotation, room, phase, root, head })

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase
    const talking = chat.open === SCHOTT.id
    // upbeat: a little bounce in his step while he talks
    root.current.position.y = talking && !chat.busy ? Math.abs(Math.sin(t * 3)) * 0.015 : 0

    const ra = armR.current.rotation
    const la = armL.current.rotation
    if (talking && chat.busy) {
      // hand on chin, other arm folded across
      ra.set(-2.1, 0, 0.55)
      la.set(-1.1, 0, -0.9)
    } else if (talking) {
      // both hands out, explaining with enthusiasm
      ra.set(-0.8 - Math.sin(t * 3) * 0.3, 0, -0.35 - Math.sin(t * 2.2) * 0.12)
      la.set(-0.8 - Math.sin(t * 3 + 1.5) * 0.3, 0, 0.35 + Math.sin(t * 2.2 + 1) * 0.12)
    } else {
      ra.set(Math.sin(t * 1.1) * 0.08, 0, -0.1)
      la.set(-Math.sin(t * 1.1) * 0.08, 0, 0.1)
    }
  })

  const shirt = m(SHIRT)
  const skin = m(SKIN)
  return (
    <group position={position}>
      {/* Totoro stands at his left, facing the class */}
      <group rotation={[0, rotation, 0]}>
        <Totoro position={[0.62, 0, 0.25]} />
      </group>
      <group ref={root} scale={s}>
        {/* brown shoes */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[0.1 * sx, 0, 0.04]}>
            <B g={BOX} c={LEATHER} p={[0, 0.05, 0]} s={[0.1, 0.07, 0.26]} />
            <B g={BOX} c="#24170e" p={[0, 0.01, 0]} s={[0.106, 0.02, 0.265]} />
          </group>
        ))}
        {/* navy chinos + belt */}
        {[-1, 1].map((sx) => (
          <B key={sx} g={CYL} c={CHINOS} p={[0.1 * sx, 0.5, 0]} s={[0.085, 0.84, 0.085]} />
        ))}
        <B g={CYL} c={CHINOS} p={[0, 0.87, 0]} s={[0.2, 0.14, 0.17]} />
        <B g={CYL} c="#3d2a1c" p={[0, 0.94, 0]} s={[0.206, 0.04, 0.176]} />
        <B g={BOX} c="#c9c9cf" o={{ metalness: 0.8, roughness: 0.3 }} p={[0, 0.94, 0.176]} s={[0.04, 0.03, 0.01]} />

        {/* light-blue dress shirt, tucked in */}
        <mesh geometry={TORSO} material={shirt} position={[0, 1.24, 0]} scale={[1, 1, 0.82]} />
        <B c={SHIRT} p={[0, 1.48, 0]} s={[0.27, 0.1, 0.18]} />
        <B g={BOX} c={SHIRT_2} p={[0, 1.2, 0.172]} s={[0.026, 0.48, 0.008]} />
        {[1.37, 1.25, 1.13, 1.01].map((y) => (
          <B key={y} c="#f4f4f4" p={[0, y, 0.178]} s={[0.009, 0.009, 0.005]} />
        ))}
        {/* chest pocket on his left */}
        <B g={BOX} c={SHIRT_2} p={[0.095, 1.28, 0.172]} s={[0.085, 0.095, 0.008]} />
        <B g={BOX} c={SHIRT} p={[0.095, 1.283, 0.177]} s={[0.078, 0.085, 0.004]} />
        {/* open spread collar showing a bit of neck */}
        <B g={CYL} c={SHIRT} p={[0, 1.54, 0]} s={[0.075, 0.05, 0.07]} />
        <B g={BOX} c={SKIN} p={[0, 1.49, 0.135]} r={[0.2, 0, Math.PI / 4]} s={[0.06, 0.06, 0.01]} />
        {[-1, 1].map((sx) => (
          <B key={sx} g={BOX} c={SHIRT} p={[0.055 * sx, 1.53, 0.1]} r={[-0.5, 0.3 * sx, 0.7 * sx]} s={[0.085, 0.04, 0.012]} />
        ))}

        {/* arms: long sleeves with cuffs */}
        <group ref={armL} position={[0.26, 1.46, 0]}>
          <mesh geometry={CAP} material={shirt} position={[0, -0.24, 0]} scale={[0.066, 0.2, 0.066]} />
          <B g={CYL} c={SHIRT_2} p={[0, -0.47, 0]} s={[0.057, 0.045, 0.057]} />
          <mesh geometry={SPH} material={skin} position={[0, -0.52, 0.01]} scale={[0.045, 0.055, 0.04]} />
        </group>
        <group ref={armR} position={[-0.26, 1.46, 0]}>
          <mesh geometry={CAP} material={shirt} position={[0, -0.24, 0]} scale={[0.066, 0.2, 0.066]} />
          <B g={CYL} c={SHIRT_2} p={[0, -0.47, 0]} s={[0.057, 0.045, 0.057]} />
          <mesh geometry={SPH} material={skin} position={[0, -0.52, 0.01]} scale={[0.045, 0.055, 0.04]} />
        </group>

        {/* neck + head */}
        <B g={CYL} c={SKIN} p={[0, 1.57, 0]} s={[0.05, 0.08, 0.05]} />
        <group ref={head} position={[0, 1.6, 0]}>
          <group position={[0, -1.6, 0]}>
            <B c={SKIN} p={[0, 1.7, 0]} s={[0.12, 0.145, 0.13]} />
            {[-1, 1].map((sx) => (
              <B key={sx} c={SKIN} p={[0.122 * sx, 1.7, 0]} s={[0.02, 0.035, 0.02]} />
            ))}
            {/* dark brown hair swept up and to the side, grey at the temples */}
            <B c={HAIR} p={[0, 1.815, -0.005]} s={[0.13, 0.075, 0.138]} />
            <B c={HAIR} p={[0.02, 1.845, 0.07]} r={[0.3, 0, -0.25]} s={[0.1, 0.04, 0.06]} />
            <B c={HAIR} p={[0, 1.73, -0.055]} s={[0.126, 0.11, 0.095]} />
            {[-1, 1].map((sx) => (
              <B key={sx} g={BOX} c={GREY} p={[0.119 * sx, 1.735, 0.035]} s={[0.012, 0.055, 0.04]} />
            ))}
            {/* blue eyes, brows, nose, easy smile */}
            {[-1, 1].map((sx) => (
              <group key={sx}>
                <B c="#ffffff" p={[0.045 * sx, 1.725, 0.112]} s={[0.022, 0.016, 0.012]} />
                <B c="#4d7299" p={[0.045 * sx, 1.725, 0.122]} s={[0.011, 0.011, 0.008]} />
                <B g={BOX} c={HAIR} p={[0.047 * sx, 1.758, 0.115]} r={[0, 0, -0.08 * sx]} s={[0.046, 0.01, 0.01]} />
              </group>
            ))}
            <B c="#dfa98a" p={[0, 1.69, 0.13]} s={[0.022, 0.032, 0.025]} />
            <mesh geometry={SMILE} material={m('#9a4d45')} position={[0, 1.655, 0.118]} rotation={[0, 0, Math.PI]} scale={[1.1, 0.7, 1]} />
          </group>
        </group>
      </group>
    </group>
  )
}
