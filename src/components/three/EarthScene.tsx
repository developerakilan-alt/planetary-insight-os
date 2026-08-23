import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { Component, Suspense, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { BodyId } from "@/data/bodies";
import { bodyMap } from "@/data/bodies";
import { HERO_ORDER } from "@/lib/hero-sequence";
import { RingSystem } from "./SpaceEffects";

/** Official NASA data imagery — the high-resolution color maps for every body. */
function textureUrl(id: BodyId): string {
  return `/textures/${id}/color_H.jpg`;
}

// Warm the texture cache at module load so switching never suspends or hitches.
HERO_ORDER.forEach((id) => {
  void useLoader.preload(THREE.TextureLoader, textureUrl(id));
});

/**
 * Pose targets.
 *  - hero:    Earth looms huge at the bottom-centre, cropped by the viewport.
 *  - dossier: focused planet sits fully visible, right-of-centre.
 */
const HERO_X = 0;
const HERO_Y = -4.35;
const HERO_SCALE = 3.95;
const DOSSIER_X = 1.85;
const DOSSIER_GAP = 7.6; // neighbours wait fully off-frame
const DOSSIER_SCALE = 2.25; // full globe comfortably inside the frame

class BodyErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

function useTexture(url: string) {
  const t = useLoader(THREE.TextureLoader, url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** Earth-only photo-real extras: drifting cloud deck + night-side city lights. */
function EarthExtras() {
  const shell = useRef<THREE.Mesh>(null);
  const clouds = useTexture("/textures/earth/clouds_H.jpg");
  const night = useTexture("/textures/earth/night_H.jpg");
  const cloudsAlpha = useMemo(() => {
    const a = clouds.clone();
    a.colorSpace = THREE.NoColorSpace;
    a.needsUpdate = true;
    return a;
  }, [clouds]);

  useFrame((_, dt) => {
    const t = Math.min(dt, 0.05);
    if (shell.current) shell.current.rotation.y += t * 0.008;
  });

  return (
    <>
      {/* city lights, added on top of the day texture */}
      <mesh scale={1.001}>
        <sphereGeometry args={[1, 96, 48]} />
        <meshStandardMaterial
          color="#000000"
          emissiveMap={night}
          emissive="#ffd9a0"
          emissiveIntensity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          roughness={1}
          metalness={0}
        />
      </mesh>
      {/* cloud deck */}
      <mesh ref={shell} scale={1.012}>
        <sphereGeometry args={[1, 96, 48]} />
        <meshStandardMaterial
          map={clouds}
          alphaMap={cloudsAlpha}
          transparent
          opacity={0.8}
          depthWrite={false}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </>
  );
}

function PlanetBody({ bodyId }: { bodyId: BodyId }) {
  const body = bodyMap[bodyId];
  const map = useTexture(textureUrl(bodyId));

  return (
    <group rotation={[0, 0, (body.tilt * Math.PI) / 180]}>
      <mesh>
        <sphereGeometry args={[1, 96, 48]} />
        <meshStandardMaterial map={map} roughness={0.95} metalness={0} />
      </mesh>
      {bodyId === "earth" && <EarthExtras />}
      {bodyId === "saturn" && <RingSystem />}
    </group>
  );
}

/**
 * One persistent canvas for the whole home experience. Every planet stays
 * mounted; poses are damped toward their mode targets each frame, so pressing
 * "Get Started" makes the very same Earth mesh glide across the screen into
 * its full right-side portrait — and cycling slides each planet in from the
 * right exactly the same way.
 */
function Cosmos({
  mode,
  focusId,
  spin,
}: {
  mode: "hero" | "dossier";
  focusId: BodyId;
  spin?: MotionValue<number> | undefined;
}) {
  const slots = useRef<(THREE.Group | null)[]>([]);
  const snapped = useRef(new Set<number>());
  const focusIndex = HERO_ORDER.indexOf(focusId);

  useFrame((state, dt) => {
    const t = Math.min(dt, 0.05);

    for (let i = 0; i < HERO_ORDER.length; i++) {
      const g = slots.current[i];
      if (!g) continue;

      let tx: number;
      let ty: number;
      let ts: number;
      if (mode === "hero") {
        const isEarth = HERO_ORDER[i] === "earth";
        tx = isEarth ? HERO_X : -999;
        ty = isEarth ? HERO_Y : -999;
        ts = isEarth ? HERO_SCALE : 0.0001;
      } else {
        const d = i - focusIndex;
        tx = DOSSIER_X + d * DOSSIER_GAP;
        ty = -0.05 - Math.min(Math.abs(d), 1) * 0.2;
        ts = DOSSIER_SCALE * Math.max(0.22, 1 - Math.max(0, Math.abs(d) - 0.15) * 0.32);
      }

      if (!snapped.current.has(i)) {
        // first frame: take the pose instantly so transitions start from reality
        g.position.set(tx, ty, 0);
        g.scale.setScalar(Math.max(ts, 0.0001));
        snapped.current.add(i);
      } else {
        g.position.x = THREE.MathUtils.damp(g.position.x, tx, 3.2, t);
        g.position.y = THREE.MathUtils.damp(g.position.y, ty, 3.2, t);
        g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, Math.max(ts, 0.0001), 3.2, t));
      }

      g.visible = g.scale.x > 0.02;
      g.rotation.y += t * (mode === "dossier" ? 0.11 : 0.02);
    }

    // gentle cinematic dolly in the hero; steady framing in dossier mode
    const p = mode === "hero" ? (spin?.get() ?? 0) : 0;
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, 8.4 - p * 1.1, 4, t);
    state.camera.lookAt(0, -0.3, 0);
  });

  return (
    <>
      {HERO_ORDER.map((id, i) => (
        <Suspense key={id} fallback={null}>
          <group
            ref={(el) => {
              slots.current[i] = el;
            }}
          >
            <BodyErrorBoundary>
              <PlanetBody bodyId={id} />
            </BodyErrorBoundary>
          </group>
        </Suspense>
      ))}
    </>
  );
}

export default function EarthScene({
  mode,
  focusId,
  spin,
}: {
  mode?: "hero" | "dossier" | undefined;
  focusId?: BodyId | undefined;
  spin?: MotionValue<number> | undefined;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 8.4], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.22} />
      <directionalLight position={[6, 3, 7]} intensity={2.4} color="#fff4e0" />
      <directionalLight position={[-5, -2, -4]} intensity={0.15} />
      <Cosmos mode={mode ?? "hero"} focusId={focusId ?? "earth"} spin={spin} />
    </Canvas>
  );
}
