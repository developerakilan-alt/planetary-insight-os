import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { textureUrl } from "@/data/planets/configs";
import type {
  PlanetVisualConfig,
  Quality,
  RotationMode,
  TextureTier,
  VisualizationMode,
} from "@/data/planets/types";
import { usePlanetTextures, type PlanetTextureKey } from "@/hooks/use-planet-textures";

export interface ScientificOptions {
  quality?: Quality;
  mode?: VisualizationMode;
  rotation?: RotationMode;
  atmosphere?: boolean;
  clouds?: boolean;
  /** vertical exaggeration multiplier applied to displacement */
  exaggeration?: number;
}

const TIER: Record<Quality, TextureTier> = {
  low: "L",
  medium: "M",
  high: "M",
  ultra: "H",
  auto: "M",
};

const SEG = { L: 96, M: 128, H: 224 } as const;
const LINEAR_KEYS: PlanetTextureKey[] = ["normal", "specular", "ring"];

const SUN_DIR = new THREE.Vector3(5, 3, 8).normalize();

export function ScientificPlanet({
  config,
  tiltDeg = 0,
  radiusKm = 6371,
  options = {},
  children,
}: {
  config: PlanetVisualConfig;
  tiltDeg?: number;
  radiusKm?: number;
  options?: ScientificOptions;
  children?: React.ReactNode;
}) {
  const {
    quality = "high",
    mode = "natural",
    rotation = "fast",
    atmosphere = true,
    clouds = true,
    exaggeration = 1,
  } = options;

  const group = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const cloudRot = useRef(0);
  const spinPhase = useRef(0);

  const tier = TIER[quality];

  const urls = useMemo<Partial<Record<PlanetTextureKey, string>>>(() => {
    const u: Partial<Record<PlanetTextureKey, string>> = {};
    if (config.surfaceColor)
      u.color = textureUrl(config, config.surfaceColor.stem, tier, config.surfaceColor);
    if (config.surfaceNormal)
      u.normal = textureUrl(config, config.surfaceNormal.stem, tier, config.surfaceNormal);
    if (config.surfaceSpecular)
      u.specular = textureUrl(config, config.surfaceSpecular.stem, tier, config.surfaceSpecular);
    if (config.surfaceElevation)
      u.elev = textureUrl(config, config.surfaceElevation.stem, tier, config.surfaceElevation);
    if (config.surfaceTerrain)
      u.terrain = textureUrl(config, config.surfaceTerrain.stem, tier, config.surfaceTerrain);
    if (config.surfaceScientific)
      u.scientific = textureUrl(
        config,
        config.surfaceScientific.stem,
        tier,
        config.surfaceScientific,
      );
    if (config.nightLights)
      u.night = textureUrl(config, config.nightLights.stem, tier, config.nightLights);
    if (config.clouds)
      u.clouds = textureUrl(config, config.clouds.source.stem, tier, config.clouds.source);
    if (config.rings)
      u.ring = textureUrl(config, config.rings.source.stem, "", config.rings.source);
    return u;
  }, [config, tier]);

  const { textures } = usePlanetTextures(urls, LINEAR_KEYS);

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      roughness: config.roughness,
      metalness: config.metalness,
      specularIntensity: 0.6,
    });
    return m;
  }, [config]);

  useEffect(() => {
    const showElevation = mode !== "natural";
    const showNight = mode === "night";
    let map: THREE.Texture | null = null;
    if (mode === "night") {
      map = null;
    } else if (mode === "elevation") {
      map = textures.elev ?? textures.terrain ?? textures.color ?? null;
    } else if (mode === "terrain" || mode === "scientific" || mode === "infrared") {
      map = textures.terrain ?? textures.scientific ?? textures.color ?? null;
    } else {
      map = textures.color ?? null;
    }

    material.map = map;
    material.normalMap = textures.normal ?? null;
    material.normalScale = new THREE.Vector2(config.normalStrength, config.normalStrength);
    material.specularColorMap = textures.specular ?? null;
    material.specularIntensity = textures.specular ? 0.9 : 0;

    const nightTex = textures.night ?? null;
    material.emissiveMap = showNight ? nightTex : null;
    material.emissive = showNight ? new THREE.Color(1, 1, 1) : new THREE.Color(0, 0, 0);
    material.emissiveIntensity = showNight ? 1.25 : 0;
    material.color = showNight ? new THREE.Color(0.02, 0.02, 0.04) : new THREE.Color(1, 1, 1);

    if (showElevation && config.elevation && textures.elev) {
      const rangeKm = (config.elevation.maxM - config.elevation.minM) / 1000;
      material.displacementMap = textures.elev;
      material.displacementScale = (rangeKm / radiusKm) * exaggeration;
      material.displacementBias = -(config.elevation.minM / 1000 / radiusKm) * exaggeration;
    } else {
      material.displacementMap = null;
      material.displacementScale = 0;
      material.displacementBias = 0;
    }
    material.needsUpdate = true;
  }, [material, textures, mode, exaggeration, config, radiusKm]);

  useFrame((_, dt) => {
    const t = Math.min(dt, 0.05);
    const speed = config.rotation.realisticSeconds;
    const dir = config.rotation.retrograde ? -1 : 1;
    if (rotation === "realistic") {
      spinPhase.current += (t * Math.PI * 2 * dir) / speed;
    } else if (rotation === "fast") {
      spinPhase.current += (t * Math.PI * 2 * dir) / config.rotation.fastSeconds;
    } else if (rotation === "reverse") {
      spinPhase.current -= (t * Math.PI * 2) / speed;
    }

    if (group.current) {
      group.current.rotation.set(0, spinPhase.current, (tiltDeg * Math.PI) / 180);
    }

    if (cloudRef.current && config.clouds) {
      cloudRot.current += t * config.clouds.speed;
      cloudRef.current.rotation.y = cloudRot.current;
    }
  });

  const seg = SEG[tier];

  const irBase = textures.elev ?? textures.terrain ?? textures.color ?? null;
  const showInfrared = mode === "infrared" && !!irBase;

  return (
    <group>
      <group ref={group}>
        {showInfrared ? (
          <mesh>
            <sphereGeometry args={[1, seg, seg / 2]} />
            <shaderMaterial
              vertexShader={IR_VERT}
              fragmentShader={IR_FRAG}
              uniforms={{
                uMap: { value: irBase },
                uSunDir: { value: SUN_DIR },
              }}
            />
          </mesh>
        ) : (
          <mesh material={material}>
            <sphereGeometry args={[1, seg, seg / 2]} />
          </mesh>
        )}

        {config.clouds && clouds && (
          <mesh ref={cloudRef} scale={config.clouds.scale}>
            <sphereGeometry args={[1, seg, seg / 2]} />
            <meshBasicMaterial
              map={textures.clouds ?? null}
              transparent
              opacity={config.clouds.opacity}
              depthWrite={false}
            />
          </mesh>
        )}

        {config.rings && <Rings config={config} ringTexture={textures.ring ?? null} />}
        {children}
      </group>

      {atmosphere && config.atmosphere && (
        <mesh scale={config.atmosphere.scale}>
          <sphereGeometry args={[1, 64, 32]} />
          <shaderMaterial
            vertexShader={ATMO_VERT}
            fragmentShader={ATMO_FRAG}
            uniforms={{
              uColor: { value: new THREE.Color(config.atmosphere.color) },
              uIntensity: { value: config.atmosphere.intensity },
              uSunDir: { value: SUN_DIR },
            }}
            transparent
            side={THREE.BackSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {atmosphere && config.atmosphere?.hazeOpacity ? (
        <mesh scale={config.atmosphere.scale * 0.99}>
          <sphereGeometry args={[1, 64, 32]} />
          <meshBasicMaterial
            color={config.atmosphere.color}
            transparent
            opacity={config.atmosphere.hazeOpacity}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}

function Rings({
  config,
  ringTexture,
}: {
  config: PlanetVisualConfig;
  ringTexture: THREE.Texture | null;
}) {
  const ring = config.rings;
  const geometry = useMemo(() => {
    if (!ring) return null;
    const geo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 160, 1);
    const uv = geo.attributes["uv"];
    if (uv) {
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, uv.getY(i), uv.getX(i));
      }
    }
    return geo;
  }, [ring?.innerRadius, ring?.outerRadius]);

  if (!ring || !geometry) return null;

  return (
    <mesh geometry={geometry} rotation={[THREE.MathUtils.degToRad(ring.tiltDeg), 0, 0]}>
      <meshBasicMaterial
        map={ringTexture}
        transparent
        opacity={ring.opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        alphaTest={0.02}
      />
    </mesh>
  );
}

const ATMO_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const ATMO_FRAG = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform vec3 uSunDir;
  void main() {
    vec3 viewDir = normalize(-vPos);
    vec3 n = normalize(vNormal);
    float rim = pow(1.0 - abs(dot(viewDir, n)), 2.5);
    float lit = max(dot(n, normalize(uSunDir)), 0.0);
    vec3 col = uColor * rim * uIntensity * (0.55 + 0.45 * lit);
    gl_FragColor = vec4(col, col.x * 0.9);
  }
`;

const IR_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const IR_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPos;

  vec3 thermal(float l) {
    float t = clamp(l, 0.0, 1.0);
    if (t < 0.2) return mix(vec3(0.02, 0.02, 0.16), vec3(0.45, 0.05, 0.2), t / 0.2);
    if (t < 0.45) return mix(vec3(0.45, 0.05, 0.2), vec3(0.9, 0.25, 0.05), (t - 0.2) / 0.25);
    if (t < 0.7) return mix(vec3(0.9, 0.25, 0.05), vec3(1.0, 0.72, 0.2), (t - 0.45) / 0.25);
    if (t < 0.9) return mix(vec3(1.0, 0.72, 0.2), vec3(1.0, 0.95, 0.6), (t - 0.7) / 0.2);
    return mix(vec3(1.0, 0.95, 0.6), vec3(1.0, 1.0, 1.0), (t - 0.9) / 0.1);
  }

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    vec3 col = thermal(lum);
    vec3 n = normalize(vNormal);
    float lit = max(dot(n, normalize(uSunDir)), 0.0);
    col *= 0.35 + 0.65 * lit;
    gl_FragColor = vec4(col, 1.0);
  }
`;
