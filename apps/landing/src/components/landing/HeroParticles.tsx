import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// IMPORTANT: this module is loaded ONLY via React.lazy (see HeroVisual),
// so three/@react-three/* stay out of the initial bundle.

const COUNT = 800; // low point count — cheap on a mid-range phone if it ever loads

// Generated once at module load (a static field), so render stays pure.
const POSITIONS = (() => {
  const arr = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 11;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
  return arr;
})();

function ParticleField({
  dark,
  pointer,
}: {
  dark: boolean;
  pointer: React.RefObject<{ x: number; y: number }>;
}) {
  const points = useRef<THREE.Points>(null);
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    // Continuous slow drift on the points.
    if (points.current) points.current.rotation.y += delta * 0.04;
    // Group eases toward the pointer for a subtle depth tilt.
    if (group.current) {
      const { x, y } = pointer.current;
      group.current.rotation.y += (x * 0.18 - group.current.rotation.y) * 0.04;
      group.current.rotation.x += (-y * 0.14 - group.current.rotation.x) * 0.04;
    }
  });

  return (
    <group ref={group}>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[POSITIONS, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color={dark ? "#d4d4d8" : "#71717a"}
          transparent
          opacity={dark ? 0.7 : 0.55}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export default function HeroParticles({ dark }: { dark: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState(true);

  // Pause rendering when offscreen or the tab is hidden; track pointer.
  useEffect(() => {
    const update = (visible: boolean) => setActive(visible && !document.hidden);
    const io = new IntersectionObserver(
      ([entry]) => update(entry.isIntersecting),
      { threshold: 0 }
    );
    if (wrap.current) io.observe(wrap.current);
    const onVis = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", onVis);

    const onMove = (e: MouseEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div ref={wrap} className="size-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        frameloop={active ? "always" : "never"}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
      >
        <ParticleField dark={dark} pointer={pointer} />
      </Canvas>
    </div>
  );
}
