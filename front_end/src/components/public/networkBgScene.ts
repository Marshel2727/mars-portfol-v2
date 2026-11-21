import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineSegments,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";

import type { Theme } from "@/lib/theme";

export interface NetworkBgController {
  setTheme: (theme: Theme) => void;
  dispose: () => void;
}

interface ThemePalette {
  primary: Color;
  secondary: Color;
  lineOpacity: number;
  dotOpacity: number;
  glowStrength: number;
}

interface LatticeNode {
  normX: number;
  normY: number;
  baseZ: number;
  x: number;
  y: number;
  z: number;
  phaseX: number;
  phaseY: number;
  phaseZ: number;
  speedX: number;
  speedY: number;
  speedZ: number;
  driftX: number;
  driftY: number;
  driftZ: number;
  size: number;
  isPrimary: boolean;
}

const DESKTOP_COLS = 10;
const DESKTOP_ROWS = 10;
const MOBILE_COLS = 7;
const MOBILE_ROWS = 8;
const MAX_NODES = DESKTOP_COLS * DESKTOP_ROWS;
const MAX_SEGMENTS = (MAX_NODES * (MAX_NODES - 1)) / 2;
const MOBILE_BREAKPOINT = 768;
const THEME_TRANSITION_SECONDS = 0.3;

const PALETTES: Record<Theme, ThemePalette> = {
  light: {
    primary: new Color("#c85233"),
    secondary: new Color("#0e5655"),
    lineOpacity: 0.26,
    dotOpacity: 0.62,
    glowStrength: 0.12,
  },
  dark: {
    primary: new Color("#f07852"),
    secondary: new Color("#71c9c2"),
    lineOpacity: 0.38,
    dotOpacity: 0.82,
    glowStrength: 0.32,
  },
};

const NOOP_CONTROLLER: NetworkBgController = {
  setTheme: () => undefined,
  dispose: () => undefined,
};

function createSeededRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildLattice(cols: number, rows: number): LatticeNode[] {
  const rng = createSeededRng(0x4d415253); // "MARS"
  const nodes: LatticeNode[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cellX = cols > 1 ? col / (cols - 1) - 0.5 : 0;
      const cellY = rows > 1 ? row / (rows - 1) - 0.5 : 0;
      const jitterX = (rng() - 0.5) * (0.85 / cols);
      const jitterY = (rng() - 0.5) * (0.85 / rows);

      nodes.push({
        normX: cellX + jitterX,
        normY: cellY + jitterY,
        baseZ: (rng() - 0.5) * 72,
        x: 0,
        y: 0,
        z: 0,
        phaseX: rng() * Math.PI * 2,
        phaseY: rng() * Math.PI * 2,
        phaseZ: rng() * Math.PI * 2,
        speedX: 0.22 + rng() * 0.24,
        speedY: 0.2 + rng() * 0.24,
        speedZ: 0.16 + rng() * 0.2,
        driftX: 2.8 + rng() * 3.2,
        driftY: 2.6 + rng() * 3.0,
        driftZ: 3.4 + rng() * 4.0,
        size: 2.35 + rng() * 1.45,
        isPrimary: rng() < 0.72,
      });
    }
  }

  return nodes;
}

const DOT_VERTEX_SHADER = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  uniform float uPixelRatio;
  varying vec3 vColor;

  void main() {
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float dist = max(-mvPosition.z, 1.0);
    float pointSize = aSize * uPixelRatio * (260.0 / dist);
    gl_PointSize = clamp(pointSize, 2.5, 13.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const DOT_FRAGMENT_SHADER = /* glsl */ `
  uniform float uDotOpacity;
  uniform float uGlow;
  varying vec3 vColor;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = length(centered) * 2.0;
    if (dist > 1.0) discard;

    float core = 1.0 - smoothstep(0.32, 0.56, dist);
    float halo = (1.0 - smoothstep(0.2, 1.0, dist)) * uGlow;
    float alpha = clamp(core * uDotOpacity + halo, 0.0, 1.0);

    gl_FragColor = vec4(vColor, alpha);
    #include <colorspace_fragment>
  }
`;

const LINE_VERTEX_SHADER = /* glsl */ `
  attribute vec3 aColor;
  attribute float aAlpha;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LINE_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    if (vAlpha <= 0.001) discard;
    gl_FragColor = vec4(vColor, vAlpha);
    #include <colorspace_fragment>
  }
`;

export function createNetworkBgScene(
  container: HTMLDivElement,
  initialTheme: Theme,
): NetworkBgController {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    return NOOP_CONTROLLER;
  }

  let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  const rootGroup = new Group();
  scene.add(rootGroup);

  const camera = new PerspectiveCamera(48, 1, 1, 600);
  camera.position.set(0, 0, 125);
  camera.lookAt(0, 0, 0);

  const desktopLattice = buildLattice(DESKTOP_COLS, DESKTOP_ROWS);
  const mobileLattice = buildLattice(MOBILE_COLS, MOBILE_ROWS);

  // Pre-allocate dot buffers up to MAX_NODES so breakpoint switches allocate nothing.
  const dotPositions = new Float32Array(MAX_NODES * 3);
  const dotColors = new Float32Array(MAX_NODES * 3);
  const dotSizes = new Float32Array(MAX_NODES);

  const dotPositionAttr = new BufferAttribute(dotPositions, 3);
  const dotColorAttr = new BufferAttribute(dotColors, 3);
  const dotSizeAttr = new BufferAttribute(dotSizes, 1);

  const dotGeometry = new BufferGeometry();
  dotGeometry.setAttribute("position", dotPositionAttr);
  dotGeometry.setAttribute("aColor", dotColorAttr);
  dotGeometry.setAttribute("aSize", dotSizeAttr);

  const initialPalette = PALETTES[initialTheme];
  const currentPrimary = initialPalette.primary.clone();
  const currentSecondary = initialPalette.secondary.clone();
  let targetPrimary = initialPalette.primary;
  let targetSecondary = initialPalette.secondary;

  let currentLineOpacity = initialPalette.lineOpacity;
  let targetLineOpacity = initialPalette.lineOpacity;
  let currentDotOpacity = initialPalette.dotOpacity;
  let targetDotOpacity = initialPalette.dotOpacity;
  let currentGlowStrength = initialPalette.glowStrength;
  let targetGlowStrength = initialPalette.glowStrength;

  const dotMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uPixelRatio: { value: pixelRatio },
      uDotOpacity: { value: currentDotOpacity },
      uGlow: { value: currentGlowStrength },
    },
    vertexShader: DOT_VERTEX_SHADER,
    fragmentShader: DOT_FRAGMENT_SHADER,
  });

  const points = new Points(dotGeometry, dotMaterial);
  points.frustumCulled = false;
  rootGroup.add(points);

  // Pre-allocate segment buffers up to MAX_SEGMENTS for zero per-frame GC.
  const linePositions = new Float32Array(MAX_SEGMENTS * 2 * 3);
  const lineColors = new Float32Array(MAX_SEGMENTS * 2 * 3);
  const lineAlphas = new Float32Array(MAX_SEGMENTS * 2);

  const linePositionAttr = new BufferAttribute(linePositions, 3);
  const lineColorAttr = new BufferAttribute(lineColors, 3);
  const lineAlphaAttr = new BufferAttribute(lineAlphas, 1);

  const lineGeometry = new BufferGeometry();
  lineGeometry.setAttribute("position", linePositionAttr);
  lineGeometry.setAttribute("aColor", lineColorAttr);
  lineGeometry.setAttribute("aAlpha", lineAlphaAttr);
  lineGeometry.setDrawRange(0, 0);

  const lineMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: LINE_VERTEX_SHADER,
    fragmentShader: LINE_FRAGMENT_SHADER,
  });

  const lineSegments = new LineSegments(lineGeometry, lineMaterial);
  lineSegments.frustumCulled = false;
  rootGroup.add(lineSegments);

  let viewportWidth = Math.max(container.clientWidth || window.innerWidth, 1);
  let viewportHeight = Math.max(container.clientHeight || window.innerHeight, 1);
  let activeNodes: LatticeNode[] =
    viewportWidth >= MOBILE_BREAKPOINT ? desktopLattice : mobileLattice;
  let spanX = 180;
  let spanY = 120;
  let maxDist = 29;

  let targetPointerX = 0;
  let targetPointerY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetScrollY = Math.min(window.scrollY || 0, 2400);
  let dampedScrollY = targetScrollY;

  let disposed = false;
  let contextLost = false;
  let frameId = 0;
  let elapsed = 0;
  let lastTimestamp = performance.now();

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;

  const updateViewportMetrics = () => {
    const rect = container.getBoundingClientRect();
    viewportWidth = Math.max(rect.width || window.innerWidth, 1);
    viewportHeight = Math.max(rect.height || window.innerHeight, 1);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(viewportWidth, viewportHeight, false);
    dotMaterial.uniforms.uPixelRatio.value = pixelRatio;

    const aspect = viewportWidth / viewportHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    // Scale lattice span to camera frustum at z = 0 so nodes cover corners cleanly.
    const visibleHeight = 2 * 125 * Math.tan((48 * Math.PI) / 360);
    const visibleWidth = visibleHeight * aspect;
    spanY = visibleHeight * 1.12;
    spanX = Math.max(visibleWidth * 1.14, 90);

    const isMobile = viewportWidth < MOBILE_BREAKPOINT;
    activeNodes = isMobile ? mobileLattice : desktopLattice;
    maxDist = isMobile ? 25.5 : 29.5;
  };

  const syncDotSizes = () => {
    for (let i = 0; i < activeNodes.length; i += 1) {
      dotSizes[i] = activeNodes[i].size;
    }
    dotSizeAttr.needsUpdate = true;
    dotGeometry.setDrawRange(0, activeNodes.length);
  };

  const snapThemeToTargets = () => {
    currentPrimary.copy(targetPrimary);
    currentSecondary.copy(targetSecondary);
    currentLineOpacity = targetLineOpacity;
    currentDotOpacity = targetDotOpacity;
    currentGlowStrength = targetGlowStrength;
    dotMaterial.uniforms.uDotOpacity.value = currentDotOpacity;
    dotMaterial.uniforms.uGlow.value = currentGlowStrength;
  };

  const stepScene = (dt: number, advanceTime: boolean) => {
    if (advanceTime) {
      elapsed += dt;
    }

    // Smooth ~300ms theme interpolation
    const themeAlpha = Math.min(1, dt / THEME_TRANSITION_SECONDS);
    currentPrimary.lerp(targetPrimary, themeAlpha);
    currentSecondary.lerp(targetSecondary, themeAlpha);
    currentLineOpacity += (targetLineOpacity - currentLineOpacity) * themeAlpha;
    currentDotOpacity += (targetDotOpacity - currentDotOpacity) * themeAlpha;
    currentGlowStrength += (targetGlowStrength - currentGlowStrength) * themeAlpha;

    dotMaterial.uniforms.uDotOpacity.value = currentDotOpacity;
    dotMaterial.uniforms.uGlow.value = currentGlowStrength;

    // Smooth pointer and scroll parallax
    const pointerDamp = 1 - Math.exp(-5.5 * Math.max(dt, 0.016));
    pointerX += (targetPointerX - pointerX) * pointerDamp;
    pointerY += (targetPointerY - pointerY) * pointerDamp;
    dampedScrollY += (targetScrollY - dampedScrollY) * pointerDamp;

    const scrollParallax = dampedScrollY * 0.008;
    camera.position.x = pointerX * 9.5;
    camera.position.y = -pointerY * 6.5 - scrollParallax;
    camera.lookAt(0, -scrollParallax * 0.35, 0);

    rootGroup.rotation.y = pointerX * 0.14;
    rootGroup.rotation.x = pointerY * 0.09;

    const nodeCount = activeNodes.length;
    const pR = currentPrimary.r;
    const pG = currentPrimary.g;
    const pB = currentPrimary.b;
    const sR = currentSecondary.r;
    const sG = currentSecondary.g;
    const sB = currentSecondary.b;

    for (let i = 0; i < nodeCount; i += 1) {
      const node = activeNodes[i];
      const baseX = node.normX * spanX;
      const baseY = node.normY * spanY;

      const x = baseX + Math.sin(elapsed * node.speedX + node.phaseX) * node.driftX;
      const y = baseY + Math.cos(elapsed * node.speedY + node.phaseY) * node.driftY;
      const z = node.baseZ + Math.sin(elapsed * node.speedZ + node.phaseZ) * node.driftZ;

      node.x = x;
      node.y = y;
      node.z = z;

      const posIdx = i * 3;
      dotPositions[posIdx] = x;
      dotPositions[posIdx + 1] = y;
      dotPositions[posIdx + 2] = z;

      dotColors[posIdx] = node.isPrimary ? pR : sR;
      dotColors[posIdx + 1] = node.isPrimary ? pG : sG;
      dotColors[posIdx + 2] = node.isPrimary ? pB : sB;
    }

    dotPositionAttr.needsUpdate = true;
    dotColorAttr.needsUpdate = true;

    // Connect nearby nodes with distance-faded segments
    const maxDistSq = maxDist * maxDist;
    let vertexCount = 0;
    let posOffset = 0;
    let colorOffset = 0;
    let alphaOffset = 0;

    for (let i = 0; i < nodeCount; i += 1) {
      const a = activeNodes[i];
      const rA = a.isPrimary ? pR : sR;
      const gA = a.isPrimary ? pG : sG;
      const bA = a.isPrimary ? pB : sB;

      for (let j = i + 1; j < nodeCount; j += 1) {
        const b = activeNodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq >= maxDistSq) continue;

        const dist = Math.sqrt(distSq);
        const alpha = Math.pow(1 - dist / maxDist, 1.35) * currentLineOpacity;
        if (alpha <= 0.004) continue;

        const rB = b.isPrimary ? pR : sR;
        const gB = b.isPrimary ? pG : sG;
        const bB = b.isPrimary ? pB : sB;
        const mixR = (rA + rB) * 0.5;
        const mixG = (gA + gB) * 0.5;
        const mixB = (bA + bB) * 0.5;

        linePositions[posOffset] = a.x;
        linePositions[posOffset + 1] = a.y;
        linePositions[posOffset + 2] = a.z;
        linePositions[posOffset + 3] = b.x;
        linePositions[posOffset + 4] = b.y;
        linePositions[posOffset + 5] = b.z;
        posOffset += 6;

        lineColors[colorOffset] = mixR;
        lineColors[colorOffset + 1] = mixG;
        lineColors[colorOffset + 2] = mixB;
        lineColors[colorOffset + 3] = mixR;
        lineColors[colorOffset + 4] = mixG;
        lineColors[colorOffset + 5] = mixB;
        colorOffset += 6;

        lineAlphas[alphaOffset] = alpha;
        lineAlphas[alphaOffset + 1] = alpha;
        alphaOffset += 2;

        vertexCount += 2;
      }
    }

    lineGeometry.setDrawRange(0, vertexCount);
    linePositionAttr.needsUpdate = true;
    lineColorAttr.needsUpdate = true;
    lineAlphaAttr.needsUpdate = true;

    renderer.render(scene, camera);
  };

  const renderStaticFrame = () => {
    if (disposed || contextLost) return;
    snapThemeToTargets();
    stepScene(0, false);
  };

  const stopLoop = () => {
    if (frameId !== 0) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  };

  const loop = (now: number) => {
    if (disposed || contextLost || reducedMotion || document.visibilityState === "hidden") {
      frameId = 0;
      return;
    }

    const dt = Math.min(Math.max((now - lastTimestamp) / 1000, 0.001), 0.05);
    lastTimestamp = now;
    stepScene(dt, true);
    frameId = requestAnimationFrame(loop);
  };

  const startLoop = () => {
    if (disposed || contextLost || reducedMotion || document.visibilityState === "hidden") {
      return;
    }
    if (frameId === 0) {
      lastTimestamp = performance.now();
      frameId = requestAnimationFrame(loop);
    }
  };

  const updatePointerFromClient = (clientX: number, clientY: number) => {
    const normX = (clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
    const normY = (clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
    targetPointerX = Math.max(-1, Math.min(1, normX));
    targetPointerY = Math.max(-1, Math.min(1, normY));
  };

  const onPointerMove = (event: PointerEvent) => {
    updatePointerFromClient(event.clientX, event.clientY);
  };

  const onTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (touch) {
      updatePointerFromClient(touch.clientX, touch.clientY);
    }
  };

  const resetPointer = () => {
    targetPointerX = 0;
    targetPointerY = 0;
  };

  const onScroll = () => {
    targetScrollY = Math.min(window.scrollY || 0, 2400);
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      stopLoop();
    } else {
      startLoop();
    }
  };

  const onReducedMotionChange = () => {
    reducedMotion = motionQuery.matches;
    if (reducedMotion) {
      stopLoop();
      renderStaticFrame();
    } else {
      startLoop();
    }
  };

  const onContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    stopLoop();
  };

  const onContextRestored = () => {
    contextLost = false;
    if (reducedMotion) {
      renderStaticFrame();
    } else {
      startLoop();
    }
  };

  const resizeObserver = new ResizeObserver(() => {
    if (disposed) return;
    const prevCount = activeNodes.length;
    updateViewportMetrics();
    if (activeNodes.length !== prevCount) {
      syncDotSizes();
    }
    if (reducedMotion) {
      renderStaticFrame();
    }
  });

  updateViewportMetrics();
  syncDotSizes();

  resizeObserver.observe(container);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("touchend", resetPointer, { passive: true });
  window.addEventListener("blur", resetPointer);
  document.addEventListener("mouseleave", resetPointer);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  motionQuery.addEventListener("change", onReducedMotionChange);
  renderer.domElement.addEventListener("webglcontextlost", onContextLost);
  renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);

  if (reducedMotion) {
    renderStaticFrame();
  } else {
    stepScene(0, false);
    startLoop();
  }

  return {
    setTheme: (theme: Theme) => {
      if (disposed) return;
      const next = PALETTES[theme];
      targetPrimary = next.primary;
      targetSecondary = next.secondary;
      targetLineOpacity = next.lineOpacity;
      targetDotOpacity = next.dotOpacity;
      targetGlowStrength = next.glowStrength;

      if (reducedMotion) {
        renderStaticFrame();
      }
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      stopLoop();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", resetPointer);
      window.removeEventListener("blur", resetPointer);
      document.removeEventListener("mouseleave", resetPointer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", onReducedMotionChange);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);

      dotGeometry.dispose();
      dotMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
