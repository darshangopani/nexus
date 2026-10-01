import React, { useEffect, useRef } from 'react';

export interface CosmicTelemetryData {
  expansion: number;
  horizonRadius: number;
  grbLuminosity: number;
  curvature: number;
  scrollProgress: number;
}

export interface FluidCanvasProps {
  colors?: string[];
  viscosity?: number; // Relativistic Jet power & collimation factor (0.01 to 0.99)
  density?: number; // Accretion disk matter density & optical depth (0.1 to 10)
  gravity?: number; // Singularity mass / Schwarzschild scale (-5.0 to 5.0)
  speed?: number; // Keplerian orbital velocity multiplier (0.1 to 5.0)
  interactionStrength?: number; // Gravitational lensing force (1.0 to 10.0)
  mode?: 'blackhole' | 'fluid' | 'mesh' | 'wave';
  cameraAngle?: 'oblique' | 'polar' | 'equatorial';
  expansionFactor?: number; // Manual expansion multiplier (1.0 to 4.0)
  onTelemetryUpdate?: (data: CosmicTelemetryData) => void;
}

interface BackgroundStar {
  baseX: number;
  baseY: number;
  size: number;
  baseBrightness: number;
  color: string;
  twinklePhase: number;
  twinkleSpeed: number;
}

interface AccretionStream {
  radiusRatio: number; // 0.0 (ISCO) to 1.0 (outer disk)
  baseAngle: number;
  orbitSpeed: number;
  arcLength: number;
  thickness: number;
  opacity: number;
  heat: number; // 1.0 (blinding inner white-gold) to 0.0 (smoky outer amber)
  shearedAngleOffset: number;
}

interface StandardParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface MeshOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  radius: number;
  color: string;
  phase: number;
}

export const FluidCanvas: React.FC<FluidCanvasProps> = ({
  colors = ["#ffedd5", "#fde047", "#f97316", "#ea580c", "#dc2626", "#818cf8", "#ffffff"],
  viscosity = 0.65,
  density = 1.9,
  gravity = 1.4,
  speed = 0.9,
  interactionStrength = 6.0,
  mode = 'blackhole',
  cameraAngle = 'oblique',
  expansionFactor = 1.0,
  onTelemetryUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, px: 0, py: 0, active: false, vx: 0, vy: 0 });
  const scrollRef = useRef({ current: 0, target: 0, lastY: 0 });
  const telemetryThrottle = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Simulation states
    let backgroundStars: BackgroundStar[] = [];
    let accretionStreams: AccretionStream[] = [];
    let standardParticles: StandardParticle[] = [];
    let orbs: MeshOrb[] = [];

    const gridCols = 40;
    const gridRows = 30;
    const forceGrid: { vx: number; vy: number }[][] = Array.from({ length: gridCols }, () =>
      Array.from({ length: gridRows }, () => ({ vx: 0, vy: 0 }))
    );

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      initSimulation();
    };

    const handleScroll = () => {
      const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const progress = Math.min(1.0, Math.max(0, scrollY / docHeight));
      scrollRef.current.target = progress;
      scrollRef.current.lastY = scrollY;
    };

    const initSimulation = () => {
      time = 0;
      backgroundStars = [];
      accretionStreams = [];
      standardParticles = [];
      orbs = [];

      const activeColors = colors.length > 0 ? colors : [
        "#ffedd5", "#fde047", "#f97316", "#ea580c", "#dc2626", "#818cf8", "#ffffff"
      ];

      // 1. Deep Space Starfield (Subtle, authentic astronomical pinpricks)
      const starCount = 480;
      const spectralColors = ["#ffffff", "#e0f2fe", "#fef08a", "#fed7aa", "#cbd5e1"];
      for (let i = 0; i < starCount; i++) {
        backgroundStars.push({
          baseX: (Math.random() - 0.5) * canvas.width * 2.2,
          baseY: (Math.random() - 0.5) * canvas.height * 2.2,
          size: Math.random() * 1.2 + 0.4,
          baseBrightness: Math.random() * 0.65 + 0.35,
          color: spectralColors[Math.floor(Math.random() * spectralColors.length)],
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
        });
      }

      // 2. Continuous Photorealistic Accretion Gas Streams (Keplerian differential shear)
      // 360 delicate, luminous gas streaks flowing in gravitational orbits
      const streamCount = Math.min(420, Math.floor(280 * density));
      for (let i = 0; i < streamCount; i++) {
        const rRatio = Math.pow(Math.random(), 1.6); // Concentrated toward the inner photon sphere
        // Keplerian angular velocity: omega proportional to r^(-1.5)
        const keplerSpeed = 0.038 / Math.pow(0.35 + rRatio * 0.65, 1.5);
        const heat = 1.0 - rRatio; // 1.0 (blinding inner white-gold) to 0.0 (smoky amber)

        accretionStreams.push({
          radiusRatio: rRatio,
          baseAngle: Math.random() * Math.PI * 2,
          orbitSpeed: keplerSpeed * (0.96 + Math.random() * 0.08),
          arcLength: 0.18 + Math.random() * 0.32,
          thickness: Math.random() * 2.4 + 0.6,
          opacity: Math.random() * 0.50 + 0.35,
          heat,
          shearedAngleOffset: 0,
        });
      }

      // Standard particle fallback setup
      const pCount = Math.min(400, Math.floor(250 * density));
      for (let i = 0; i < pCount; i++) {
        standardParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1.0,
          vy: (Math.random() - 0.5) * 1.0,
          size: Math.random() * 3 + 1.5,
          color: activeColors[Math.floor(Math.random() * activeColors.length)],
          alpha: Math.random() * 0.6 + 0.2,
          life: Math.random() * 100,
          maxLife: 100 + Math.random() * 100,
        });
      }

      // Mesh Orbs setup
      const orbCount = Math.max(3, Math.min(6, activeColors.length));
      for (let i = 0; i < orbCount; i++) {
        orbs.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          targetX: Math.random() * canvas.width,
          targetY: Math.random() * canvas.height,
          radius: (Math.random() * 0.2 + 0.3) * Math.max(canvas.width, canvas.height),
          color: activeColors[i % activeColors.length],
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    // Pointer events
    const handlePointerMove = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      mouseRef.current.px = mouseRef.current.x;
      mouseRef.current.py = mouseRef.current.y;
      mouseRef.current.x = x;
      mouseRef.current.y = y;
      mouseRef.current.active = true;

      mouseRef.current.vx = (mouseRef.current.x - mouseRef.current.px) * 0.45;
      mouseRef.current.vy = (mouseRef.current.y - mouseRef.current.py) * 0.45;
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleWindowMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    resizeCanvas();
    handleScroll();

    // =========================================================================
    // PHOTOREALISTIC ASTROPHYSICAL BLACK HOLE RENDERER
    // Quiet, majestic, physically authentic (General Relativity ray-tracing)
    // =========================================================================
    const animate = () => {
      time += 0.0055 * speed;

      // Smooth inertia lerp for scroll expansion
      const scrollDiff = scrollRef.current.target - scrollRef.current.current;
      scrollRef.current.current += scrollDiff * 0.085;
      const scrollExpansionVal = scrollRef.current.current; // 0.0 to 1.0

      // DYNAMIC BLACK HOLE EXPANSION MULTIPLIER:
      // The black hole expands majestically up to 3.4x as you descend into the gravitational well!
      const dynamicExpansion = (1.0 + scrollExpansionVal * 2.4) * Math.max(0.5, expansionFactor);

      // Subtle, realistic gravitational parallax from cursor position
      const mouseOffsetX = mouseRef.current.active 
        ? (mouseRef.current.x - canvas.width * 0.5) * 0.022 * (interactionStrength / 6.0)
        : 0;
      const mouseOffsetY = mouseRef.current.active 
        ? (mouseRef.current.y - canvas.height * 0.5) * 0.022 * (interactionStrength / 6.0)
        : 0;
      const centerX = canvas.width / 2 + mouseOffsetX;
      const centerY = canvas.height / 2 + mouseOffsetY;

      // -----------------------------------------------------------------------
      // MODE: REALISTIC GENERAL RELATIVITY BLACK HOLE (KERR / SCHWARZSCHILD)
      // -----------------------------------------------------------------------
      if (mode === 'blackhole') {
        // Pure deep space cosmic vacuum (No loud flashing fills)
        ctx.fillStyle = 'rgba(1, 2, 6, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Physics Radii (Kip Thorne General Relativity Geometry)
        const baseHorizonRadius = 50 + Math.max(0.1, Math.abs(gravity)) * 26;
        const horizonRadius = baseHorizonRadius * dynamicExpansion;
        // In General Relativity, the photon sphere is at r = 1.5 R_s = 2.6 M
        const photonRingRadius = horizonRadius * 1.30;
        // ISCO (Innermost Stable Circular Orbit) is at r = 3 R_s
        const iscoRadius = horizonRadius * 1.42;
        // Outer accretion disk boundary
        const outerDiskRadius = (baseHorizonRadius + (270 * density)) * dynamicExpansion;
        // Einstein deflection radius
        const einsteinRingRadius = horizonRadius * 1.48;

        // Telemetry update callback
        telemetryThrottle.current++;
        if (telemetryThrottle.current % 6 === 0 && onTelemetryUpdate) {
          const estimatedLuminosity = Math.round(18 + Math.sin(time * 4) * 3 + viscosity * 28);
          const curvatureMetric = parseFloat(((gravity * 2.5) * dynamicExpansion).toFixed(2));
          onTelemetryUpdate({
            expansion: parseFloat(dynamicExpansion.toFixed(2)),
            horizonRadius: Math.round(horizonRadius),
            grbLuminosity: estimatedLuminosity,
            curvature: curvatureMetric,
            scrollProgress: parseFloat((scrollExpansionVal * 100).toFixed(1)),
          });
        }

        // Camera Perspective Angles:
        // 'oblique': 17° Interstellar inclination
        // 'polar': 0° looking down jet axis
        // 'equatorial': 84° razor-edge view
        let inclination = Math.PI * 17 / 180;
        if (cameraAngle === 'polar') {
          inclination = Math.PI * 0.5;
        } else if (cameraAngle === 'equatorial') {
          inclination = Math.PI * 84 / 180;
        }

        const cosInc = Math.cos(inclination);
        const sinInc = Math.sin(inclination);

        // ---------------------------------------------------------------------
        // STEP 1: BACKGROUND STARFIELD WITH REAL EINSTEIN GRAVITATIONAL LENSING
        // Clean, delicate, authentic astronomical deflection
        // ---------------------------------------------------------------------
        ctx.globalCompositeOperation = 'screen';
        backgroundStars.forEach((star) => {
          star.twinklePhase += star.twinkleSpeed;
          const currentBrightness = star.baseBrightness * (0.85 + 0.15 * Math.sin(star.twinklePhase));

          // Unlensed coordinates relative to singularity
          const dx = star.baseX;
          const dy = star.baseY;
          const r = Math.hypot(dx, dy);

          // General Relativistic Einstein light deflection:
          // r_lensed = 0.5 * (r + sqrt(r^2 + 4 * R_E^2))
          const lensedR = 0.5 * (r + Math.sqrt(r * r + 4 * einsteinRingRadius * einsteinRingRadius));
          const scale = lensedR / (r + 0.001);

          const lensedX = centerX + dx * scale;
          const lensedY = centerY + dy * scale;

          // If star falls inside the event horizon shadow, it is eclipsed
          if (Math.hypot(lensedX - centerX, lensedY - centerY) < horizonRadius * 1.02) {
            return;
          }

          // Stars near the Einstein ring stretch into delicate tangential arcs
          const distToRing = Math.abs(lensedR - einsteinRingRadius);
          const tangentialStretch = Math.max(1, 3.8 - distToRing / 45);

          ctx.beginPath();
          ctx.arc(lensedX, lensedY, star.size * tangentialStretch * 0.65, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = Math.min(1.0, currentBrightness * (tangentialStretch > 1.5 ? 1.5 : 1.0));
          ctx.fill();
        });

        // ---------------------------------------------------------------------
        // STEP 2: ETHEREAL RELATIVISTIC POLAR GAMMA-RAY JET (QUIET & COLLIMATED)
        // Slender, elegant synchrotron light column — NO flashy explosions or blast rings
        // ---------------------------------------------------------------------
        const jetWidth = (8 + viscosity * 22) * Math.sqrt(dynamicExpansion);

        if (cameraAngle !== 'polar') {
          // North Relativistic Jet Column
          const northJet = ctx.createLinearGradient(centerX, centerY, centerX, 0);
          northJet.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
          northJet.addColorStop(0.06, 'rgba(191, 219, 254, 0.85)'); // Soft cyan-white base
          northJet.addColorStop(0.20, 'rgba(96, 165, 250, 0.45)');  // Synchrotron blue
          northJet.addColorStop(0.55, 'rgba(129, 140, 248, 0.15)'); // Faint violet sheath
          northJet.addColorStop(1.0, 'transparent');

          ctx.fillStyle = northJet;
          ctx.beginPath();
          ctx.moveTo(centerX - jetWidth * 0.45, centerY);
          ctx.quadraticCurveTo(centerX - jetWidth * 0.75, centerY - canvas.height * 0.25, centerX - jetWidth * 0.15, 0);
          ctx.lineTo(centerX + jetWidth * 0.15, 0);
          ctx.quadraticCurveTo(centerX + jetWidth * 0.75, centerY - canvas.height * 0.25, centerX + jetWidth * 0.45, centerY);
          ctx.closePath();
          ctx.fill();

          // South Relativistic Jet Column
          const southJet = ctx.createLinearGradient(centerX, centerY, centerX, canvas.height);
          southJet.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
          southJet.addColorStop(0.06, 'rgba(191, 219, 254, 0.85)');
          southJet.addColorStop(0.20, 'rgba(96, 165, 250, 0.45)');
          southJet.addColorStop(0.55, 'rgba(129, 140, 248, 0.15)');
          southJet.addColorStop(1.0, 'transparent');

          ctx.fillStyle = southJet;
          ctx.beginPath();
          ctx.moveTo(centerX - jetWidth * 0.45, centerY);
          ctx.quadraticCurveTo(centerX - jetWidth * 0.75, centerY + canvas.height * 0.25, centerX - jetWidth * 0.15, canvas.height);
          ctx.lineTo(centerX + jetWidth * 0.15, canvas.height);
          ctx.quadraticCurveTo(centerX + jetWidth * 0.75, centerY + canvas.height * 0.25, centerX + jetWidth * 0.45, centerY);
          ctx.closePath();
          ctx.fill();

          // Ultra-fine, subtle magnetic spine thread
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.lineWidth = 1.0 * Math.sqrt(dynamicExpansion);
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - canvas.height * 0.4);
          ctx.lineTo(centerX, centerY + canvas.height * 0.4);
          ctx.stroke();
        } else {
          // Polar Perspective: Looking down the relativistic jet barrel
          const barrelRadius = horizonRadius * 2.4;
          const barrelGrad = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, barrelRadius
          );
          barrelGrad.addColorStop(0.0, '#ffffff');
          barrelGrad.addColorStop(0.12, 'rgba(224, 242, 254, 0.92)');
          barrelGrad.addColorStop(0.35, 'rgba(99, 102, 241, 0.45)');
          barrelGrad.addColorStop(0.75, 'rgba(168, 85, 247, 0.12)');
          barrelGrad.addColorStop(1.0, 'transparent');

          ctx.fillStyle = barrelGrad;
          ctx.beginPath();
          ctx.arc(centerX, centerY, barrelRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // ---------------------------------------------------------------------
        // STEP 3: KIP THORNE REAR ACCRETION DISK (VOLUMETRIC LENSED HALO & CRESCENT)
        // Light from behind the black hole warped by general relativity
        // ---------------------------------------------------------------------
        if (cameraAngle !== 'polar') {
          // 3A. Smooth Upper Lensed Arch (Continuous volumetric incandescent gas)
          const archHeight = horizonRadius * 1.82;
          const archWidth = outerDiskRadius * 0.88;

          // Doppler Beaming Gradient: Approaching side (left) is white-hot/cyan; receding side (right) is dark amber
          const upperArchGrad = ctx.createLinearGradient(centerX - archWidth, centerY, centerX + archWidth, centerY);
          upperArchGrad.addColorStop(0.0, 'transparent');
          upperArchGrad.addColorStop(0.18, 'rgba(255, 255, 255, 0.95)'); // Blueshifted approaching side
          upperArchGrad.addColorStop(0.32, 'rgba(254, 240, 138, 0.90)'); // Incandescent crest
          upperArchGrad.addColorStop(0.55, 'rgba(251, 146, 60, 0.70)');  // Solar amber
          upperArchGrad.addColorStop(0.85, 'rgba(194, 65, 12, 0.35)');   // Redshifted receding side
          upperArchGrad.addColorStop(1.0, 'transparent');

          ctx.fillStyle = upperArchGrad;
          ctx.beginPath();
          ctx.moveTo(centerX - archWidth, centerY - horizonRadius * 0.18);
          ctx.quadraticCurveTo(centerX, centerY - archHeight - horizonRadius * 0.55, centerX + archWidth, centerY - horizonRadius * 0.18);
          ctx.quadraticCurveTo(centerX, centerY - photonRingRadius * 1.14, centerX - archWidth, centerY - horizonRadius * 0.18);
          ctx.closePath();
          ctx.fill();

          // 3B. Smooth Lower Lensed Crescent (Under the shadow)
          const lowerArchHeight = horizonRadius * 0.80;
          const lowerArchWidth = outerDiskRadius * 0.68;

          const lowerArchGrad = ctx.createLinearGradient(centerX - lowerArchWidth, centerY, centerX + lowerArchWidth, centerY);
          lowerArchGrad.addColorStop(0.0, 'transparent');
          lowerArchGrad.addColorStop(0.22, 'rgba(255, 255, 255, 0.80)');
          lowerArchGrad.addColorStop(0.40, 'rgba(254, 240, 138, 0.75)');
          lowerArchGrad.addColorStop(0.68, 'rgba(251, 146, 60, 0.45)');
          lowerArchGrad.addColorStop(0.90, 'rgba(194, 65, 12, 0.20)');
          lowerArchGrad.addColorStop(1.0, 'transparent');

          ctx.fillStyle = lowerArchGrad;
          ctx.beginPath();
          ctx.moveTo(centerX - lowerArchWidth, centerY + horizonRadius * 0.18);
          ctx.quadraticCurveTo(centerX, centerY + lowerArchHeight + horizonRadius * 0.45, centerX + lowerArchWidth, centerY + horizonRadius * 0.18);
          ctx.quadraticCurveTo(centerX, centerY + photonRingRadius * 1.08, centerX - lowerArchWidth, centerY + horizonRadius * 0.18);
          ctx.closePath();
          ctx.fill();
        }

        // ---------------------------------------------------------------------
        // STEP 4: PHOTOREALISTIC KEPLERIAN PLASMA GAS STREAKS
        // Continuous, glowing gas fibers orbiting in differential shear
        // ---------------------------------------------------------------------
        accretionStreams.forEach((stream) => {
          stream.shearedAngleOffset += stream.orbitSpeed * speed;

          const currentRadius = (iscoRadius + stream.radiusRatio * (outerDiskRadius - iscoRadius));
          const currentAngle = stream.baseAngle + stream.shearedAngleOffset;

          // 3D coordinates in disk plane
          const xDisk = currentRadius * Math.cos(currentAngle);
          const yDisk = currentRadius * Math.sin(currentAngle);

          // Rotate by observer tilt
          const y3d = yDisk * cosInc;
          const z3d = -yDisk * sinInc;

          // Line-of-sight velocity for relativistic Doppler amplification:
          // Left side (cos(angle) < 0) orbits toward the camera!
          const vLos = -Math.sin(currentAngle) * cosInc;
          const dopplerFactor = Math.pow(Math.max(0.18, 1.0 + vLos * 0.78), 3.4);

          // Relativistic light deflection for elements behind the hole (z3d < 0)
          let screenX = centerX + xDisk;
          let screenY = centerY + y3d;

          if (z3d < 0 && cameraAngle !== 'polar') {
            const deflection = (horizonRadius * horizonRadius * 1.82) / (currentRadius + 1.0);
            const archDirection = Math.sin(currentAngle) < 0 ? -1 : 1;
            screenY = centerY + y3d - deflection * archDirection;
          }

          // If the element is behind the front event horizon shadow, skip
          const distToHole = Math.hypot(screenX - centerX, screenY - centerY);
          if (z3d < 0 && distToHole < horizonRadius * 0.98) {
            return;
          }

          // Authentic Blackbody thermal color grading
          let streamColor: string;
          if (vLos > 0.30 || stream.heat > 0.88) {
            streamColor = '#ffffff'; // Incandescent white-gold
          } else if (vLos > 0.10 || stream.heat > 0.65) {
            streamColor = '#fef08a'; // Bright solar yellow
          } else if (vLos > -0.15 || stream.heat > 0.38) {
            streamColor = '#f97316'; // Warm amber-orange
          } else if (vLos > -0.40 || stream.heat > 0.15) {
            streamColor = '#ea580c'; // Deep rust
          } else {
            streamColor = '#991b1b'; // Redshifted dark crimson
          }

          // Draw fine, smooth glowing gas streak arc
          ctx.save();
          ctx.translate(centerX, centerY);
          if (cameraAngle !== 'polar') {
            ctx.scale(1.0, cosInc);
          }
          ctx.beginPath();
          ctx.arc(0, 0, currentRadius, currentAngle - stream.arcLength, currentAngle);
          ctx.strokeStyle = streamColor;
          ctx.lineWidth = stream.thickness * (dopplerFactor > 1.4 ? 1.35 : 1.0) * Math.sqrt(dynamicExpansion);
          ctx.globalAlpha = Math.min(0.95, stream.opacity * dopplerFactor * 0.60);
          ctx.stroke();
          ctx.restore();
        });

        // ---------------------------------------------------------------------
        // STEP 5: INCANDESCENT PHOTON RING & SECONDARY LYAPUNOV SUB-RINGS (r = 2.6 M)
        // Exquisitely delicate, razor-sharp thread of trapped light
        // ---------------------------------------------------------------------
        // 5A. Soft Warm Accretion Corona
        const coronaGrad = ctx.createRadialGradient(
          centerX, centerY, photonRingRadius - 3.0,
          centerX, centerY, photonRingRadius + 26 * dynamicExpansion
        );
        coronaGrad.addColorStop(0.0, '#ffffff');
        coronaGrad.addColorStop(0.15, 'rgba(254, 240, 138, 0.92)');
        coronaGrad.addColorStop(0.38, 'rgba(249, 115, 22, 0.50)');
        coronaGrad.addColorStop(0.70, 'rgba(194, 65, 12, 0.15)');
        coronaGrad.addColorStop(1.0, 'transparent');

        ctx.fillStyle = coronaGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, photonRingRadius + 28 * dynamicExpansion, 0, Math.PI * 2);
        ctx.fill();

        // 5B. Razor-Sharp Primary Photon Ring (n = 0)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4 * Math.sqrt(dynamicExpansion);
        ctx.globalAlpha = 0.96;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fef08a';
        ctx.beginPath();
        ctx.arc(centerX, centerY, photonRingRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 5C. Delicate Secondary Lyapunov Sub-Ring (n = 1)
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.65)';
        ctx.lineWidth = 0.8 * Math.sqrt(dynamicExpansion);
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(centerX, centerY, photonRingRadius * 0.955, 0, Math.PI * 2);
        ctx.stroke();

        // ---------------------------------------------------------------------
        // STEP 6: THE EVENT HORIZON SHADOW & GRAVITATIONAL REDSHIFT RIM
        // Absolute void where nothing escapes
        // ---------------------------------------------------------------------
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX, centerY, horizonRadius, 0, Math.PI * 2);
        ctx.fill();

        // Narrow, subtle gravitational redshift fringe right inside the shadow edge
        const redshiftFringe = ctx.createRadialGradient(
          centerX, centerY, horizonRadius - 9 * dynamicExpansion,
          centerX, centerY, horizonRadius
        );
        redshiftFringe.addColorStop(0.0, '#000000');
        redshiftFringe.addColorStop(0.72, '#140303');
        redshiftFringe.addColorStop(1.0, 'rgba(153, 27, 27, 0.45)');

        ctx.fillStyle = redshiftFringe;
        ctx.beginPath();
        ctx.arc(centerX, centerY, horizonRadius, 0, Math.PI * 2);
        ctx.fill();

        // ---------------------------------------------------------------------
        // STEP 7: FOREGROUND EQUATORIAL ACCRETION BELT (SWEEPING IN FRONT OF SHADOW)
        // ---------------------------------------------------------------------
        if (cameraAngle !== 'polar') {
          ctx.globalCompositeOperation = 'screen';

          const beltHeight = horizonRadius * 0.36;
          const beltWidth = outerDiskRadius;

          const fgBeltGrad = ctx.createLinearGradient(centerX - beltWidth, centerY, centerX + beltWidth, centerY);
          fgBeltGrad.addColorStop(0.0, 'transparent');
          fgBeltGrad.addColorStop(0.20, 'rgba(255, 255, 255, 0.90)'); // Blueshifted approaching side
          fgBeltGrad.addColorStop(0.38, 'rgba(254, 240, 138, 0.85)'); // Front highlight
          fgBeltGrad.addColorStop(0.65, 'rgba(249, 115, 22, 0.65)');  // Solar amber
          fgBeltGrad.addColorStop(0.88, 'rgba(194, 65, 12, 0.30)');   // Redshifted receding side
          fgBeltGrad.addColorStop(1.0, 'transparent');

          ctx.fillStyle = fgBeltGrad;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, beltWidth * 0.92, beltHeight, 0, 0, Math.PI);
          ctx.fill();

          // Delicate front equatorial filament thread
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.lineWidth = 1.4 * Math.sqrt(dynamicExpansion);
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, beltWidth * 0.88, beltHeight * 0.82, 0, 0, Math.PI);
          ctx.stroke();
        }

        // ---------------------------------------------------------------------
        // STEP 8: NATURAL CINEMATIC OPTICAL BLOOM ON APPROACHING ACCRETION CREST
        // ---------------------------------------------------------------------
        if (cameraAngle !== 'polar') {
          ctx.globalCompositeOperation = 'screen';
          const bloomX = centerX - horizonRadius * 1.30;
          const bloomY = centerY - horizonRadius * 0.18;
          const bloomRadius = horizonRadius * 2.0;

          const bloomGrad = ctx.createRadialGradient(bloomX, bloomY, 0, bloomX, bloomY, bloomRadius);
          bloomGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.38)');
          bloomGrad.addColorStop(0.25, 'rgba(254, 240, 138, 0.16)');
          bloomGrad.addColorStop(0.65, 'rgba(249, 115, 22, 0.04)');
          bloomGrad.addColorStop(1.0, 'transparent');

          ctx.fillStyle = bloomGrad;
          ctx.beginPath();
          ctx.arc(bloomX, bloomY, bloomRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
      }

      // -----------------------------------------------------------------------
      // MODE: STANDARD PARTICLE FLUID ENGINE
      // -----------------------------------------------------------------------
      else if (mode === 'fluid') {
        ctx.globalCompositeOperation = 'screen';

        const frictionCoefficient = 1.0 - (viscosity * 0.1);
        for (let x = 0; x < gridCols; x++) {
          for (let y = 0; y < gridRows; y++) {
            forceGrid[x][y].vx *= frictionCoefficient;
            forceGrid[x][y].vy *= frictionCoefficient;
          }
        }

        if (mouseRef.current.active) {
          const mGridX = Math.floor((mouseRef.current.x / canvas.width) * gridCols);
          const mGridY = Math.floor((mouseRef.current.y / canvas.height) * gridRows);

          if (mGridX >= 0 && mGridX < gridCols && mGridY >= 0 && mGridY < gridRows) {
            const range = 4;
            for (let dx = -range; dx <= range; dx++) {
              for (let dy = -range; dy <= range; dy++) {
                const nx = mGridX + dx;
                const ny = mGridY + dy;
                if (nx >= 0 && nx < gridCols && ny >= 0 && ny < gridRows) {
                  const dist = Math.hypot(dx, dy);
                  const falloff = Math.max(0, 1.0 - dist / range);
                  forceGrid[nx][ny].vx += mouseRef.current.vx * falloff * interactionStrength * 0.15;
                  forceGrid[nx][ny].vy += mouseRef.current.vy * falloff * interactionStrength * 0.15;
                }
              }
            }
          }
        }

        mouseRef.current.vx *= 0.85;
        mouseRef.current.vy *= 0.85;

        standardParticles.forEach((p) => {
          const gridX = Math.floor((p.x / canvas.width) * gridCols);
          const gridY = Math.floor((p.y / canvas.height) * gridRows);

          let pushX = 0;
          let pushY = 0;

          if (gridX >= 0 && gridX < gridCols && gridY >= 0 && gridY < gridRows) {
            pushX = forceGrid[gridX][gridY].vx;
            pushY = forceGrid[gridX][gridY].vy;
          }

          p.vx = p.vx * frictionCoefficient + pushX + (Math.sin(time + p.x * 0.005) * 0.01);
          p.vy = p.vy * frictionCoefficient + pushY + (gravity * 0.04) + (Math.cos(time + p.y * 0.005) * 0.01);

          p.x += p.vx * speed;
          p.y += p.vy * speed;

          if (p.x < 0) { p.x = canvas.width; p.vx *= -0.2; }
          if (p.x > canvas.width) { p.x = 0; p.vx *= -0.2; }
          if (p.y < 0) { p.y = canvas.height; p.vy *= -0.2; }
          if (p.y > canvas.height) { p.y = 0; p.vy *= -0.2; }

          p.life++;
          const fadeRatio = Math.sin((p.life / p.maxLife) * Math.PI);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.4 + fadeRatio * 0.6), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * fadeRatio;
          ctx.fill();

          if (p.life >= p.maxLife) {
            p.x = Math.random() * canvas.width;
            p.y = Math.random() * canvas.height;
            p.life = 0;
          }
        });

        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
      }

      // -----------------------------------------------------------------------
      // MODE: LIQUID MESH GRADIENT PREVIEW ENGINE
      // -----------------------------------------------------------------------
      else if (mode === 'mesh') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.globalCompositeOperation = 'screen';

        orbs.forEach((orb, i) => {
          orb.phase += 0.002 * speed;
          const driftRadius = 60 * speed;
          const driftX = Math.sin(orb.phase + i * 1.5) * driftRadius;
          const driftY = Math.cos(orb.phase + i * 2.1) * driftRadius;

          if (Math.random() < 0.005) {
            orb.targetX = Math.random() * canvas.width;
            orb.targetY = Math.random() * canvas.height;
          }

          orb.vx += (orb.targetX - orb.x) * 0.0001 * speed;
          orb.vy += (orb.targetY - orb.y) * 0.0001 * speed;

          if (mouseRef.current.active) {
            const dx = mouseRef.current.x - orb.x;
            const dy = mouseRef.current.y - orb.y;
            const dist = Math.hypot(dx, dy);
            const maxRange = Math.max(200, canvas.width * 0.35);

            if (dist < maxRange) {
              const force = (1.0 - dist / maxRange) * interactionStrength * 0.8;
              orb.vx += (dx / dist) * force * 0.02 * (gravity < 0 ? -1 : 1);
              orb.vy += (dy / dist) * force * 0.02 * (gravity < 0 ? -1 : 1);
            }
          }

          orb.vx *= 0.985;
          orb.vy *= 0.985;

          orb.x += orb.vx * speed;
          orb.y += orb.vy * speed;

          const drawX = orb.x + driftX;
          const drawY = orb.y + driftY;

          const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, orb.radius);
          grad.addColorStop(0, orb.color);
          grad.addColorStop(0.3, orb.color + 'bb');
          grad.addColorStop(0.6, orb.color + '33');
          grad.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.arc(drawX, drawY, orb.radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        });

        ctx.globalCompositeOperation = 'source-over';
      }

      // -----------------------------------------------------------------------
      // MODE: LAYERED ANIMATED ORGANIC WAVES
      // -----------------------------------------------------------------------
      else if (mode === 'wave') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const waveCount = Math.max(3, Math.min(5, colors.length));
        const segmentCount = 60;
        const step = canvas.width / (segmentCount - 1);

        for (let w = 0; w < waveCount; w++) {
          const color = colors[w % colors.length];
          const waveHeight = 60 + w * 25;
          const baseLine = canvas.height - 100 - w * (canvas.height / (waveCount + 1));

          ctx.beginPath();
          ctx.moveTo(0, canvas.height);

          for (let s = 0; s < segmentCount; s++) {
            const x = s * step;
            const wavePhase = time * 3.0 + s * 0.08 + w * Math.PI * 0.4;
            let yOffset = Math.sin(wavePhase) * waveHeight;

            if (mouseRef.current.active) {
              const mouseDx = mouseRef.current.x - x;
              const mouseDy = mouseRef.current.y - (baseLine + yOffset);
              const mouseDist = Math.hypot(mouseDx, mouseDy);
              const influenceArea = 250;

              if (mouseDist < influenceArea) {
                const bendFactor = Math.sin((1.0 - mouseDist / influenceArea) * Math.PI * 0.5);
                yOffset += bendFactor * 45 * interactionStrength * 0.15 * (mouseRef.current.vy < 0 ? -1.0 : 1.0);
              }
            }

            const y = baseLine + yOffset;

            if (s === 0) {
              ctx.lineTo(x, y);
            } else {
              const prevX = (s - 1) * step;
              const prevYOffset = Math.sin(time * 3.0 + (s - 1) * 0.08 + w * Math.PI * 0.4) * waveHeight;
              const prevY = baseLine + prevYOffset;
              const midX = (prevX + x) / 2;
              const midY = (prevY + y) / 2;
              ctx.quadraticCurveTo(prevX, prevY, midX, midY);
            }
          }

          ctx.lineTo(canvas.width, canvas.height);
          ctx.closePath();

          ctx.fillStyle = color + '22';
          ctx.fill();

          ctx.strokeStyle = color + 'aa';
          ctx.lineWidth = 1.5 + w * 0.5;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [colors, viscosity, density, gravity, speed, interactionStrength, mode, cameraAngle, expansionFactor, onTelemetryUpdate]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full cursor-crosshair transition-opacity duration-700"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};
