import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { Component, Suspense, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { BodyId } from "@/data/bodies";
import { bodyMap } from "@/data/bodies";
import { RAIL_ORDER, RAIL_START } from "@/lib/hero-sequence";
import { RingSystem } from "./SpaceEffects";

/**
 * Keeps one bad texture (or any render hiccup) from taking down the whole
 * page — the affected planet just doesn't render.
 */
class BodyErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Official NASA data imagery — the high-resolution color maps for every body. */
function textureUrl(id: BodyId): string {
  return `/textures/${id}/color_H.jpg`;
}

// Warm the texture cache at module load so scrolling never suspends or hitches.
RAIL_ORDER.forEach((id) => {
  void useLoader.preload(THREE.TextureLoader, textureUrl(id));
});

const SPACING = 7.8; // one planet on screen at a time — the next waits off-frame right
const BASE_Y = -1.45; // planets sit low in the frame
const FOCUS_BOOST = 0.16; // gentle scale pop for the focused planet
const DEPTH_STEP = 2.6; // how far back each neighbour recedes per step

function TexturedBody({ bodyId }: { bodyId: BodyId }) {
  const body = bodyMap[bodyId];
  const map = useLoader(THREE.TextureLoader, textureUrl(bodyId));

  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.anisotropy = 8;
    map.needsUpdate = true;
  }, [map]);

  return (
    <group rotation={[0, 0, (body.tilt * Math.PI) / 180]}>
      {/* plain photo-real material: no glow, no emissive — just NASA imagery */}
      <mesh>
        <sphereGeometry args={[1, 96, 48]} />
        <meshStandardMaterial map={map} roughness={0.95} metalness={0} />
      </mesh>
      {bodyId === "saturn" && <RingSystem />}
    </group>
  );
}

/**
 * Pinned, scroll-driven cinematic carousel with true 3D depth parallax.
 *
 * Every planet is mounted exactly once and positioned per-frame straight from
 * the damped scroll value. Depth comes from pushing off-focus planets BACK in
 * Z (position.z) — the perspective camera shrinks them naturally — combined
 * with a small explicit scale falloff, so the focused planet feels like it is
 * dollying toward you while the rest of the system falls away behind it.
 */
function Carousel({ spin }: { spin?: MotionValue<number> | undefined }) {
  const wrapper = useRef<THREE.Group>(null);
  const slots = useRef<(THREE.Group | null)[]>([]);
  const current = useRef(RAIL_START);
  const N = RAIL_ORDER.length;
  const maxV = N - 1 - RAIL_START;

  useFrame((state, dt) => {
    const t = Math.min(dt, 0.05);
    const targetV = RAIL_START + (spin?.get() ?? 0) * maxV;
    // critically-damped smoothing → silky scrubbing even with jumpy wheel input
    current.current = THREE.MathUtils.damp(current.current, targetV, 6, t);

    const focus = current.current;

    for (let i = 0; i < N; i++) {
      const g = slots.current[i];
      if (!g) continue;

      const d = i - focus;
      const ad = Math.abs(d);

      // lateral rail movement
      g.position.x = d * SPACING;

      // depth-based object movement: off-focus bodies fall away behind the camera plane
      g.position.z = -Math.min(ad, 3) * DEPTH_STEP;

      // arc downward as they drift away
      g.position.y = BASE_Y - Math.min(ad, 1) * 0.18 - Math.max(0, ad - 1) * 0.35;

      // scale transformation: perspective handles most of it, this adds a subtle focus pop
      const s =
        (1 + Math.max(0, 1 - ad) * FOCUS_BOOST) * Math.max(0.22, 1 - Math.max(0, ad - 1) * 0.24);
      g.scale.setScalar(Math.max(s, 0.0001));
      g.visible = s > 0.03;

      g.rotation.y += t * (0.08 + i * 0.012);
    }

    if (wrapper.current) {
      wrapper.current.rotation.y = THREE.MathUtils.lerp(
        wrapper.current.rotation.y,
        state.pointer.x * 0.06,
        t * 2,
      );
      wrapper.current.rotation.x = THREE.MathUtils.lerp(
        wrapper.current.rotation.x,
        -state.pointer.y * 0.04,
        t * 2,
      );
    }
  });

  return (
    <group ref={wrapper}>
      {RAIL_ORDER.map((id, i) => (
        <Suspense key={id} fallback={null}>
          <group
            ref={(el) => {
              slots.current[i] = el;
            }}
          >
            <BodyErrorBoundary>
              <TexturedBody bodyId={id} />
            </BodyErrorBoundary>
          </group>
        </Suspense>
      ))}
    </group>
  );
}

export default function HeroScene({ spin }: { spin?: MotionValue<number> | undefined }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 7.8], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      {/* hard sunlight look — one strong key, almost nothing else */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 2.2, 6]} intensity={2.6} color="#fff4e0" />
      <directionalLight position={[-4, -1, -3]} intensity={0.18} />
      <Carousel spin={spin} />
    </Canvas>
  );
}
