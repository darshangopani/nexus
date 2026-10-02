'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause, 
  Download, 
  X, 
  Sparkles,
  Info,
  Volume2,
  VolumeX,
  Video,
  Camera,
  Crosshair,
  Calculator,
  Keyboard,
  Clock,
  Zap,
  Check,
  Ruler,
  Rocket,
  Flame,
  Copy,
  Radio,
  Share2
} from 'lucide-react';
import { 
  GargantuaBlackHole, 
  BlackHoleSettings, 
  DEFAULT_BLACK_HOLE_SETTINGS, 
  CameraPreset,
  ProbeData,
  ActiveProbeTelemetry,
  CaliperData,
  BlackHoleHandle
} from '@/components/GargantuaBlackHole';
import { cosmicAudio } from '@/lib/audio';

// Astrophysical & Cinematic Curated Presets
interface AstrophysicalPreset {
  name: string;
  tag: string;
  description: string;
  targetKey: string;
  settings: Partial<BlackHoleSettings>;
  cameraPreset: CameraPreset;
}

const PRESETS: AstrophysicalPreset[] = [
  {
    name: "Interstellar Gargantua",
    tag: "KERR METRIC",
    description: "The iconic gold and amber dual-arch visualization with intense Doppler boosting and Keplerian dust streams, inspired by Kip Thorne's equations.",
    targetKey: "gargantua",
    settings: {
      lensingStrength: 1.5,
      diskBrightness: 2.8,
      dopplerStrength: 1.3,
      rotationSpeed: 0.6,
      diskInner: 2.2,
      diskOuter: 7.2,
      fov: 0.95,
      dustOrbitSpeed: 1.0,
      dustBrightness: 1.4,
      qualityMode: 'ultra',
      colorTheme: 'gargantua',
      showJets: false,
    },
    cameraPreset: 'oblique'
  },
  {
    name: "M87* Event Horizon",
    tag: "EHT RADIO + JET",
    description: "Broad crescent with high gravitational bending and warm fiery orange plasma, inspired by the Event Horizon Telescope observations of Messier 87*, featuring a relativistic polar synchrotron jet.",
    targetKey: "m87",
    settings: {
      lensingStrength: 1.85,
      diskBrightness: 3.2,
      dopplerStrength: 1.6,
      rotationSpeed: 0.85,
      diskInner: 2.0,
      diskOuter: 6.5,
      fov: 0.92,
      dustOrbitSpeed: 1.25,
      dustBrightness: 1.6,
      qualityMode: 'ultra',
      colorTheme: 'm87',
      showJets: true,
      jetIntensity: 1.4,
    },
    cameraPreset: 'oblique'
  },
  {
    name: "Cygnus X-1 Microquasar",
    tag: "STELLAR MASS X-RAY",
    description: "Rapidly spinning stellar-mass black hole with a tight, incandescent relativistic accretion disk, high orbital velocities, and collimated synchrotron jets.",
    targetKey: "cygnus",
    settings: {
      lensingStrength: 1.6,
      diskBrightness: 3.6,
      dopplerStrength: 1.9,
      rotationSpeed: 1.2,
      diskInner: 1.8,
      diskOuter: 5.5,
      fov: 1.05,
      dustOrbitSpeed: 1.6,
      dustBrightness: 1.7,
      qualityMode: 'ultra',
      colorTheme: 'cygnus',
      showJets: true,
      jetIntensity: 1.6,
    },
    cameraPreset: 'equatorial'
  },
  {
    name: "Sagittarius A*",
    tag: "MILKY WAY CORE",
    description: "Dynamic turbulent accretion disk in EHT sub-millimeter fiery orange and deep amber, anchoring the center of our galaxy.",
    targetKey: "sgra",
    settings: {
      lensingStrength: 1.45,
      diskBrightness: 2.6,
      dopplerStrength: 1.25,
      rotationSpeed: 0.9,
      diskInner: 2.1,
      diskOuter: 6.8,
      fov: 0.95,
      dustOrbitSpeed: 1.1,
      dustBrightness: 1.3,
      qualityMode: 'ultra',
      colorTheme: 'sgra',
      showJets: false,
    },
    cameraPreset: 'oblique'
  }
];

// Real Celestial Black Hole Targets for Practical Astrophysics
export interface CelestialTarget {
  key: string;
  name: string;
  category: string;
  massSolar: number;
  distanceLy: string;
  constellation: string;
  description: string;
  defaultOrbitalR: number; // in Rs
  theme: 'gargantua' | 'sgra' | 'm87' | 'cygnus';
}

export const CELESTIAL_TARGETS: CelestialTarget[] = [
  {
    key: "gargantua",
    name: "Gargantua",
    category: "Interstellar Supermassive",
    massSolar: 100000000, // 100M M_sun
    distanceLy: "10 Billion ly (Gargantua System)",
    constellation: "Fictional Kerr Black Hole",
    description: "The supermassive rotating black hole around which Miller's, Mann's, and Edmunds' planets orbit in Interstellar.",
    defaultOrbitalR: 1.00002, // Miller's planet extreme orbit
    theme: 'gargantua'
  },
  {
    key: "sgra",
    name: "Sagittarius A*",
    category: "Milky Way Galactic Center",
    massSolar: 4297000, // 4.3M M_sun
    distanceLy: "26,670 ly",
    constellation: "Sagittarius",
    description: "The supermassive black hole anchoring the center of our Milky Way galaxy, directly imaged by the EHT.",
    defaultOrbitalR: 3.5,
    theme: 'sgra'
  },
  {
    key: "m87",
    name: "M87* (Messier 87)",
    category: "Supermassive Giant Elliptical",
    massSolar: 6500000000, // 6.5B M_sun
    distanceLy: "53.5 Million ly",
    constellation: "Virgo",
    description: "First directly photographed black hole in human history (EHT 2019), powering a 5,000 light-year relativistic jet.",
    defaultOrbitalR: 4.2,
    theme: 'm87'
  },
  {
    key: "cygnus",
    name: "Cygnus X-1",
    category: "Stellar-Mass Microquasar",
    massSolar: 21.2, // 21.2 M_sun
    distanceLy: "7,300 ly",
    constellation: "Cygnus",
    description: "First confirmed black hole discovery in history (1964). Fed by blue supergiant companion HDE 226868.",
    defaultOrbitalR: 2.8,
    theme: 'cygnus'
  },
  {
    key: "micro",
    name: "Earth-Mass Micro Singularity",
    category: "Hypothetical Primordial",
    massSolar: 0.000003003, // 1 Earth mass (5.972e24 kg)
    distanceLy: "Hypothetical",
    constellation: "Primordial",
    description: "Hypothetical micro black hole with the mass of planet Earth; its Schwarzschild radius is roughly 8.87 millimeters!",
    defaultOrbitalR: 2.0,
    theme: 'gargantua'
  }
];

export default function App() {
  const blackHoleRef = useRef<BlackHoleHandle>(null);
  const [settings, setSettings] = useState<BlackHoleSettings>(DEFAULT_BLACK_HOLE_SETTINGS);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('oblique');
  const [autoOrbit, setAutoOrbit] = useState<boolean>(true);
  const [controlsOpen, setControlsOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [ignited, setIgnited] = useState<boolean>(false);
  const [infoModalOpen, setInfoModalOpen] = useState<boolean>(false);
  const [calculatorOpen, setCalculatorOpen] = useState<boolean>(false);
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [probeLauncherOpen, setProbeLauncherOpen] = useState<boolean>(false);
  const [audioActive, setAudioActive] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(0.45);
  const [selectedPresetName, setSelectedPresetName] = useState<string>("Interstellar Gargantua");

  // Practical Features: Probe Reticle, Active Relativistic Probe, Caliper, FPS, Clocks
  const [probeActive, setProbeActive] = useState<boolean>(false);
  const [probeData, setProbeData] = useState<ProbeData | null>(null);
  const [activeProbeTelemetry, setActiveProbeTelemetry] = useState<ActiveProbeTelemetry | null>(null);
  const [caliperActive, setCaliperActive] = useState<boolean>(false);
  const [caliperData, setCaliperData] = useState<CaliperData | null>(null);
  const [fps, setFps] = useState<number>(60);
  const [screenshotToast, setScreenshotToast] = useState<boolean>(false);
  const [copyToast, setCopyToast] = useState<boolean>(false);

  // Celestial Target & Physics calculations
  const [selectedTarget, setSelectedTarget] = useState<CelestialTarget>(CELESTIAL_TARGETS[0]);
  const [customMassInput, setCustomMassInput] = useState<number>(selectedTarget.massSolar);
  const [timeDilationHours, setTimeDilationHours] = useState<number>(1.0);
  const [orbitalRadiusProbe, setOrbitalRadiusProbe] = useState<number>(selectedTarget.defaultOrbitalR);

  // Live dual time dilation clocks
  const [earthTimeElapsed, setEarthTimeElapsed] = useState<number>(0);
  const [probeTimeElapsed, setProbeTimeElapsed] = useState<number>(0);

  // Running live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setEarthTimeElapsed(prev => prev + 1);

      // Probe clock ticks at local dilated rate
      const currentR = activeProbeTelemetry ? activeProbeTelemetry.radiusRs : (probeData ? probeData.estimatedRadius : orbitalRadiusProbe);
      const safeR = Math.max(1.0001, currentR);
      const dilation = Math.sqrt(Math.max(0.00001, 1 - 1 / safeR));
      setProbeTimeElapsed(prev => prev + dilation);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeProbeTelemetry, probeData, orbitalRadiusProbe]);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setAutoOrbit(prev => !prev);
      } else if (e.key === '1') {
        setCameraPreset('oblique');
      } else if (e.key === '2') {
        setCameraPreset('equatorial');
      } else if (e.key === '3') {
        setCameraPreset('polar');
      } else if (e.key === '4') {
        setCameraPreset('flyby');
      } else if (e.key.toLowerCase() === 'p') {
        setControlsOpen(prev => !prev);
      } else if (e.key.toLowerCase() === 'm') {
        toggleAudio();
      } else if (e.key.toLowerCase() === 'c') {
        setCalculatorOpen(prev => !prev);
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 's') {
        handleCaptureWallpaper();
      } else if (e.key.toLowerCase() === 'x') {
        toggleCaliper();
      } else if (e.key.toLowerCase() === 'o') {
        setProbeLauncherOpen(prev => !prev);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setProbeActive(prev => !prev);
      } else if (e.key === '?') {
        setShortcutsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleAudio = () => {
    const isNowActive = cosmicAudio.toggle(audioVolume);
    setAudioActive(isNowActive);
  };

  const handleVolumeChange = (newVol: number) => {
    setAudioVolume(newVol);
    cosmicAudio.setVolume(newVol);
  };

  const toggleCaliper = () => {
    const next = !caliperActive;
    setCaliperActive(next);
    if (!next) setCaliperData(null);
    if (next) {
      cosmicAudio.playSonarPing(880);
      setProbeActive(false);
    }
  };

  const handleApplyPreset = (preset: AstrophysicalPreset) => {
    setSelectedPresetName(preset.name);
    setSettings((prev) => ({ ...prev, ...preset.settings }));
    setCameraPreset(preset.cameraPreset);

    const target = CELESTIAL_TARGETS.find(t => t.key === preset.targetKey) || CELESTIAL_TARGETS[0];
    setSelectedTarget(target);
    setCustomMassInput(target.massSolar);
    setOrbitalRadiusProbe(target.defaultOrbitalR);
  };

  const handleTargetChange = (target: CelestialTarget) => {
    setSelectedTarget(target);
    setCustomMassInput(target.massSolar);
    setOrbitalRadiusProbe(target.defaultOrbitalR);
    setSettings(prev => ({
      ...prev,
      colorTheme: target.theme,
      showJets: target.key === 'm87' || target.key === 'cygnus'
    }));
  };

  const handleResetSettings = () => {
    handleApplyPreset(PRESETS[0]);
    setAutoOrbit(true);
    if (blackHoleRef.current) {
      blackHoleRef.current.resetProbe();
    }
    setActiveProbeTelemetry(null);
    setCaliperData(null);
  };

  // Launch test probe with orbital trajectory
  const handleLaunchProbe = (orbitType: 'isco' | 'millers' | 'plunge' | 'eccentric') => {
    if (blackHoleRef.current) {
      blackHoleRef.current.launchProbe(orbitType, customMassInput);
    }
    setProbeLauncherOpen(false);
  };

  // Thruster burn on test probe
  const handleThrusterBurn = (deltaV: number) => {
    if (blackHoleRef.current) {
      blackHoleRef.current.burnProbeThruster(deltaV);
    }
  };

  const handleResetProbe = () => {
    if (blackHoleRef.current) {
      blackHoleRef.current.resetProbe();
    }
    setActiveProbeTelemetry(null);
  };

  // High-Resolution Screenshot / Wallpaper Capture
  const handleCaptureWallpaper = () => {
    if (!blackHoleRef.current) return;
    const dataUrl = blackHoleRef.current.captureScreenshot();
    if (!dataUrl) return;

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `gargantua_${selectedTarget.name.toLowerCase().replace(/\s+/g, '_')}_wallpaper.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setScreenshotToast(true);
    setTimeout(() => setScreenshotToast(false), 2600);
  };

  // Quick Zoom to Gravitational Thresholds
  const handleFocusThreshold = (radius: number, preset?: CameraPreset) => {
    if (preset) setCameraPreset(preset);
    if (blackHoleRef.current) {
      blackHoleRef.current.zoomToRadius(radius);
    }
  };

  // Real physical computations derived from General Relativity
  const M_kg = customMassInput * 1.9885e30;
  const G = 6.6743e-11;
  const c = 299792458;
  const Rs_meters = (2 * G * M_kg) / (c * c);
  const Rs_km = Rs_meters / 1000;
  const Rs_AU = Rs_km / 1.496e8;
  const R_photon_km = Rs_km * 1.5;
  const R_isco_km = Rs_km * 3.0;
  const surfaceGravity = (Math.pow(c, 4)) / (4 * G * M_kg);
  const hawkingTempK = 6.17e-8 / Math.max(1e-12, customMassInput);
  const evaporationYears = 2.1e67 * Math.pow(Math.max(1e-10, customMassInput), 3);

  // Time Dilation calculation for given orbital radius
  const safeOrbitalR = Math.max(1.000001, orbitalRadiusProbe);
  const timeDilationFactor = 1 / Math.sqrt(Math.max(0.000001, 1 - 1 / safeOrbitalR));
  const timeAtInfinityHours = timeDilationHours * timeDilationFactor;
  const timeAtInfinityDays = timeAtInfinityHours / 24;
  const timeAtInfinityYears = timeAtInfinityDays / 365.25;

  // Copy Astrophysical Data Sheet to Clipboard
  const handleCopyDataSheet = () => {
    const report = `# ASTROPHYSICAL DATA SHEET: ${selectedTarget.name.toUpperCase()}
Category: ${selectedTarget.category}
Constellation: ${selectedTarget.constellation}
Distance: ${selectedTarget.distanceLy}
Mass: ${customMassInput.toLocaleString()} Solar Masses (${M_kg.toExponential(3)} kg)

## GENERAL RELATIVISTIC METRICS
- Schwarzschild Radius (Rs = 2GM/c²): ${Rs_km >= 1e6 ? `${(Rs_km / 1e6).toFixed(3)} Million km` : `${Rs_km.toFixed(1)} km`} (${Rs_AU.toFixed(4)} AU)
- Photon Sphere Radius (r = 1.5 Rs): ${R_photon_km >= 1e6 ? `${(R_photon_km / 1e6).toFixed(3)} Million km` : `${R_photon_km.toFixed(1)} km`}
- ISCO Radius (r = 3.0 Rs): ${R_isco_km >= 1e6 ? `${(R_isco_km / 1e6).toFixed(3)} Million km` : `${R_isco_km.toFixed(1)} km`}
- Surface Gravity at Horizon: ${surfaceGravity.toExponential(2)} m/s²
- Hawking Temperature: ${hawkingTempK.toExponential(2)} K
- Evaporation Lifetime: ${evaporationYears.toExponential(2)} years

## GRAVITATIONAL TIME DILATION
- At Miller's Orbit (r = 1.00002 Rs): Factor = 158.1x (1 hr = 6.6 days)
- At ISCO (r = 3.0 Rs): Factor = 1.225x (v = 0.408c)
- At Current Orbital Radius (r = ${safeOrbitalR.toFixed(3)} Rs): Factor = ${timeDilationFactor.toFixed(2)}x
`;
    navigator.clipboard.writeText(report).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2400);
    });
  };

  // Standalone HTML file generator
  const handleDownloadStandalone = () => {
    const standaloneHtml = generateStandaloneHtml(settings);
    const blob = new Blob([standaloneHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gargantua_black_hole.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format clock time MM:SS
  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans select-none">
      
      {/* 1. THREE.JS GLSL SCHWARZSCHILD BLACK HOLE HERO */}
      <GargantuaBlackHole
        ref={blackHoleRef}
        settings={settings}
        cameraPreset={cameraPreset}
        autoOrbit={autoOrbit}
        probeActive={probeActive}
        caliperActive={caliperActive}
        selectedMassSolar={customMassInput}
        onProbeUpdate={setProbeData}
        onActiveProbeUpdate={setActiveProbeTelemetry}
        onCaliperUpdate={setCaliperData}
        onFpsUpdate={setFps}
        onIgnited={() => setIgnited(true)}
      />

      {/* 2. ON-SCREEN CALIPER MEASUREMENT LASER LINE OVERLAY */}
      {caliperData && (
        <svg className="fixed inset-0 w-full h-full pointer-events-none z-30">
          <line
            x1={caliperData.screenA.x}
            y1={caliperData.screenA.y}
            x2={caliperData.screenB.x}
            y2={caliperData.screenB.y}
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="4 3"
            className="animate-pulse"
          />
          <circle cx={caliperData.screenA.x} cy={caliperData.screenA.y} r="5" fill="#38bdf8" />
          <circle cx={caliperData.screenB.x} cy={caliperData.screenB.y} r="5" fill="#38bdf8" />
        </svg>
      )}

      {/* 3. MINIMAL, LUXURY TOP NAVIGATION BAR */}
      <header 
        className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-8 h-20 transition-all duration-1000 ${
          ignited ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        {/* Brand & Target Switcher */}
        <div className="flex items-center gap-3">
          <span className="font-display font-light text-sm sm:text-base tracking-[0.32em] uppercase text-white/90">
            GARGANTUA
          </span>

          {/* Quick Target Pill Dropdown */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-white/60">TARGET:</span>
            <select
              value={selectedTarget.key}
              onChange={(e) => {
                const t = CELESTIAL_TARGETS.find(target => target.key === e.target.value);
                if (t) handleTargetChange(t);
              }}
              className="bg-transparent text-amber-300 font-semibold focus:outline-none cursor-pointer"
            >
              {CELESTIAL_TARGETS.map(t => (
                <option key={t.key} value={t.key} className="bg-slate-900 text-white">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <nav className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Quick Perspective Presets */}
          <div className="hidden lg:flex items-center p-1 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-xs">
            <button
              onClick={() => setCameraPreset('oblique')}
              className={`px-2.5 py-1 rounded-full transition-all tracking-wider ${
                cameraPreset === 'oblique'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Classic Interstellar Oblique View (18°) [Key: 1]"
            >
              Oblique
            </button>
            <button
              onClick={() => setCameraPreset('equatorial')}
              className={`px-2.5 py-1 rounded-full transition-all tracking-wider ${
                cameraPreset === 'equatorial'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Razor Edge-On View (84°) [Key: 2]"
            >
              Equatorial
            </button>
            <button
              onClick={() => setCameraPreset('polar')}
              className={`px-2.5 py-1 rounded-full transition-all tracking-wider ${
                cameraPreset === 'polar'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Top-Down Singularity Polar View (10°) [Key: 3]"
            >
              Polar
            </button>
            <button
              onClick={() => setCameraPreset('flyby')}
              className={`px-2.5 py-1 rounded-full transition-all tracking-wider flex items-center gap-1 ${
                cameraPreset === 'flyby'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Cinematic Ranger Flyby Trajectory [Key: 4]"
            >
              <Video className="w-3 h-3 text-amber-400" />
              <span>Flyby</span>
            </button>
          </div>

          {/* Deploy Test Probe Launcher Button */}
          <button
            onClick={() => setProbeLauncherOpen(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-400 text-cyan-200 hover:bg-cyan-500/15 transition-all text-xs flex items-center gap-1.5 shadow-sm"
            title="Deploy Scientific Test Probe [Key: O]"
          >
            <Rocket className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline text-[11px] tracking-wider uppercase font-mono">
              {activeProbeTelemetry ? "Probe Active" : "Launch Probe"}
            </span>
          </button>

          {/* Interactive Spacetime Caliper Tool */}
          <button
            onClick={toggleCaliper}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-xl border transition-all text-xs flex items-center gap-1.5 ${
              caliperActive
                ? 'bg-sky-500/25 border-sky-400 text-sky-200 shadow-md shadow-sky-500/20 ring-1 ring-sky-400/40'
                : 'bg-black/40 border-white/10 hover:border-sky-400/40 text-white/70 hover:text-white'
            }`}
            title="Measure Spacetime Distance & Light Deflection [Key: X]"
          >
            <Ruler className="w-3.5 h-3.5 text-sky-300" />
            <span className="hidden sm:inline text-[11px] tracking-wider uppercase font-mono">
              {caliperActive ? "Caliper On" : "Measure"}
            </span>
          </button>

          {/* Reticle Metric Inspector Toggle */}
          <button
            onClick={() => {
              setProbeActive(!probeActive);
              if (caliperActive) setCaliperActive(false);
            }}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-xl border transition-all text-xs flex items-center gap-1.5 ${
              probeActive
                ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40'
                : 'bg-black/40 border-white/10 hover:border-amber-400/40 text-white/70 hover:text-white'
            }`}
            title="Inspect Spacetime Metrics with Cursor Reticle [Key: Tab]"
          >
            <Crosshair className={`w-3.5 h-3.5 ${probeActive ? 'text-amber-300 animate-spin' : 'text-white/60'}`} />
            <span className="hidden sm:inline text-[11px] tracking-wider uppercase font-mono">
              {probeActive ? "Inspect On" : "Inspect"}
            </span>
          </button>

          {/* Polar Jets Toggle */}
          <button
            onClick={() => setSettings(prev => ({ ...prev, showJets: !prev.showJets }))}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-xl border transition-all text-xs flex items-center gap-1.5 ${
              settings.showJets
                ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-md shadow-purple-500/20'
                : 'bg-black/40 border-white/10 hover:border-purple-400/40 text-white/70 hover:text-white'
            }`}
            title="Toggle Relativistic Polar Synchrotron Jets"
          >
            <Flame className={`w-3.5 h-3.5 ${settings.showJets ? 'text-purple-300 animate-pulse' : 'text-white/60'}`} />
            <span className="hidden xl:inline text-[11px] tracking-wider uppercase font-mono">
              Jets
            </span>
          </button>

          {/* Calculator Modal Toggle */}
          <button
            onClick={() => setCalculatorOpen(!calculatorOpen)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:border-amber-400/40 text-white/70 hover:text-white transition-all text-xs flex items-center gap-1.5"
            title="Open Astrophysical Calculator & Time Dilation [Key: C]"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline text-[11px] tracking-wider uppercase font-mono">
              Specs
            </span>
          </button>

          {/* Wallpaper Snapshot Capture */}
          <button
            onClick={handleCaptureWallpaper}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:border-amber-400/40 text-white/70 hover:text-amber-200 transition-all text-xs flex items-center gap-1.5"
            title="Capture Clean Wallpaper Snapshot [Key: S]"
          >
            <Camera className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden xl:inline text-[11px] tracking-wider uppercase font-mono">
              Snapshot
            </span>
          </button>

          {/* Cosmic Soundscape Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-xl border transition-all text-xs flex items-center gap-1.5 ${
              audioActive
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 shadow-md shadow-amber-500/10'
                : 'bg-black/40 border-white/10 hover:border-amber-400/40 text-white/70 hover:text-white'
            }`}
            title={audioActive ? "Mute Cosmic Soundscape [Key: M]" : "Play Ambient Cosmic Audio [Key: M]"}
          >
            {audioActive ? <Volume2 className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 text-white/50" />}
          </button>

          {/* Auto-Orbit Drift Toggle */}
          <button
            onClick={() => setAutoOrbit(!autoOrbit)}
            className="p-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:border-amber-400/40 text-white/70 hover:text-white transition-all text-xs"
            title={autoOrbit ? "Pause Camera Orbit [Key: Space]" : "Resume Camera Orbit [Key: Space]"}
          >
            {autoOrbit ? <Pause className="w-3.5 h-3.5 text-amber-300" /> : <Play className="w-3.5 h-3.5 text-amber-300" />}
          </button>

          {/* Physics Parameters Drawer Toggle */}
          <button
            onClick={() => setControlsOpen(!controlsOpen)}
            className={`px-3 py-1.5 rounded-full backdrop-blur-xl border transition-all text-xs flex items-center gap-1.5 ${
              controlsOpen
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 shadow-md shadow-amber-500/10'
                : 'bg-black/40 border-white/10 hover:border-amber-400/40 text-white/80 hover:text-white'
            }`}
            title="Adjust Shader & Physics Parameters [Key: P]"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline text-[11px] tracking-widest uppercase font-medium">Controls</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:border-amber-400/40 text-white/70 hover:text-white transition-all"
            title={isFullscreen ? "Exit Fullscreen [Key: F]" : "Enter Fullscreen [Key: F]"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </nav>
      </header>

      {/* 4. DUAL TIME DILATION CLOCK HUD WIDGET (TOP LEFT BELOW NAV) */}
      <div 
        className={`fixed top-24 left-6 sm:left-10 z-20 transition-all duration-1000 ${
          ignited ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="glass-panel p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl border border-white/15 bg-black/70 backdrop-blur-2xl shadow-xl flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <div>
              <span className="text-[9px] text-white/50 block">EARTH CLOCK (t)</span>
              <span className="text-emerald-300 font-bold">{formatTime(earthTimeElapsed)}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-white/15" />

          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <div>
              <span className="text-[9px] text-white/50 block">PROPER TIME (τ)</span>
              <span className="text-amber-300 font-bold">{formatTime(probeTimeElapsed)}</span>
            </div>
          </div>

          <div className="hidden sm:block pl-2 border-l border-white/15">
            <span className="text-[9px] text-white/40 block">DILATION RATIO</span>
            <span className="text-[11px] text-white/80 font-bold">
              {timeDilationFactor > 20 ? "∞ (Near Horizon)" : `${timeDilationFactor.toFixed(2)}x`}
            </span>
          </div>
        </div>
      </div>

      {/* 5. MINIMAL HERO OVERLAY (CENTER-LEFT) */}
      <div 
        className={`absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-24 z-20 pointer-events-none transition-all duration-1000 delay-300 ${
          ignited && !probeActive && !caliperActive && !activeProbeTelemetry ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="max-w-xl lg:max-w-2xl">
          {/* Category Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-white/70 font-mono">
              General Relativity Laboratory · {selectedTarget.name}
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display font-light text-4xl sm:text-6xl lg:text-7xl tracking-[0.16em] uppercase text-white/95 leading-[1.08] mb-6">
            Beyond the <br />
            <span className="font-normal bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              Event Horizon
            </span>
          </h1>

          {/* Subline */}
          <p className="text-sm sm:text-base text-white/80 font-sans font-light leading-relaxed max-w-lg mb-8">
            A real-time null geodesic simulation of gravitational lensing, Doppler-beamed Keplerian accretion, and rotating cosmic dust particles in curved spacetime.
          </p>

          {/* Glassmorphic Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pointer-events-auto">
            <button
              onClick={() => setProbeLauncherOpen(true)}
              className="glass-button px-6 py-3 rounded-full text-xs font-medium tracking-[0.18em] uppercase text-cyan-200 flex items-center gap-2 group shadow-lg shadow-cyan-950/40"
            >
              <Rocket className="w-4 h-4 text-cyan-300 transition-transform group-hover:scale-110" />
              <span>Launch Probe</span>
            </button>

            <button
              onClick={toggleCaliper}
              className="px-5 py-3 rounded-full bg-black/40 backdrop-blur-xl border border-sky-400/30 hover:border-sky-400 text-sky-200 hover:text-white transition-all text-xs font-mono uppercase tracking-wider flex items-center gap-2"
            >
              <Ruler className="w-3.5 h-3.5 text-sky-300" />
              <span>Measure Scale</span>
            </button>

            <button
              onClick={() => setCalculatorOpen(true)}
              className="px-5 py-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:border-amber-400/40 text-white/80 hover:text-white transition-all text-xs font-mono uppercase tracking-wider flex items-center gap-2"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-300" />
              <span>Physical Specs</span>
            </button>

            <button
              onClick={() => setShortcutsOpen(true)}
              className="p-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:border-amber-400/40 text-white/70 hover:text-white transition-all"
              title="Keyboard Shortcuts [Key: ?]"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            <button
              onClick={() => setInfoModalOpen(true)}
              className="p-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:border-amber-400/40 text-white/70 hover:text-white transition-all"
              title="Astrophysical Theory"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. ACTIVE RELATIVISTIC TEST PROBE TELEMETRY HUD (LEFT FLOATING CARD) */}
      {activeProbeTelemetry && (
        <div className="fixed top-36 left-6 sm:left-10 z-30 max-w-xs w-full glass-panel p-4 rounded-2xl border border-cyan-500/40 bg-slate-950/85 backdrop-blur-2xl shadow-2xl font-mono text-xs animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">
                MISSION: RELATIVISTIC PROBE
              </span>
            </div>
            <button
              onClick={handleResetProbe}
              className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white text-[10px]"
              title="Eject / Abort Probe"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Status Badge */}
          <div className="mb-3">
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
              activeProbeTelemetry.status === 'frozen_at_horizon' 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
            }`}>
              {activeProbeTelemetry.status === 'frozen_at_horizon' ? 'HORIZON FREEZE (REDSHIFT -> INF)' : 'ORBITING / INERTIAL GEODESIC'}
            </span>
          </div>

          {/* Key Metrics */}
          <div className="space-y-2 mb-4 text-[11px]">
            <div className="flex justify-between items-center text-white/70">
              <span>Coordinate Radius (r):</span>
              <span className="text-amber-300 font-bold">
                {activeProbeTelemetry.radiusRs.toFixed(3)} Rs
              </span>
            </div>

            <div className="flex justify-between items-center text-white/70">
              <span>Physical Altitude:</span>
              <span className="text-white font-bold">
                {activeProbeTelemetry.radiusKm >= 1e6 
                  ? `${(activeProbeTelemetry.radiusKm / 1e6).toFixed(2)}M km` 
                  : `${activeProbeTelemetry.radiusKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km`}
              </span>
            </div>

            <div className="flex justify-between items-center text-white/70">
              <span>Orbital Speed (β = v/c):</span>
              <span className="text-cyan-300 font-bold">
                {(activeProbeTelemetry.velocityFraction * 100).toFixed(1)}% c
              </span>
            </div>

            <div className="flex justify-between items-center text-white/70">
              <span>Proper Time (Probe Clock):</span>
              <span className="text-emerald-300 font-bold">
                {activeProbeTelemetry.properTimeSeconds.toFixed(1)}s
              </span>
            </div>

            <div className="flex justify-between items-center text-white/70">
              <span>Earth Observer Time:</span>
              <span className="text-purple-300 font-bold">
                {activeProbeTelemetry.earthTimeSeconds.toFixed(1)}s
              </span>
            </div>

            <div className="flex justify-between items-center text-white/70">
              <span>Time Dilation Factor:</span>
              <span className="text-orange-300 font-bold">
                {activeProbeTelemetry.timeDilationRatio > 50 ? "∞ (Singularity Trapped)" : `${activeProbeTelemetry.timeDilationRatio.toFixed(2)}x`}
              </span>
            </div>

            <div className="flex justify-between items-center text-white/70">
              <span>Gravitational Redshift (z):</span>
              <span className="text-rose-300 font-bold">
                {activeProbeTelemetry.redshift > 50 ? "Infinite (Blackout)" : `+${activeProbeTelemetry.redshift.toFixed(2)}`}
              </span>
            </div>

            <div className="flex justify-between items-center text-white/70">
              <span>Tidal Acceleration:</span>
              <span className="text-white/90 font-bold">
                {activeProbeTelemetry.gForceEarth.toExponential(1)} g
              </span>
            </div>
          </div>

          {/* Probe Thruster Controls */}
          {activeProbeTelemetry.status !== 'frozen_at_horizon' && (
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/10">
              <button
                onClick={() => handleThrusterBurn(0.08)}
                className="py-1.5 px-2 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-[10px] tracking-wider uppercase transition-all"
              >
                +Δv Boost Orbit
              </button>
              <button
                onClick={() => handleThrusterBurn(-0.08)}
                className="py-1.5 px-2 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[10px] tracking-wider uppercase transition-all"
              >
                -Δv Retro Plunge
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. SPACETIME CALIPER MEASUREMENT READOUT CARD */}
      {caliperActive && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4 pointer-events-none">
          <div className="glass-panel p-4 rounded-2xl border border-sky-400/40 bg-black/85 backdrop-blur-2xl shadow-2xl font-mono text-xs pointer-events-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-sky-200 uppercase tracking-wider text-[11px]">
                  Spacetime Holographic Caliper
                </span>
              </div>
              <button
                onClick={toggleCaliper}
                className="p-1 rounded text-white/50 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {caliperData ? (
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between items-center text-white/80">
                  <span className="text-white/50">Measured Span:</span>
                  <span className="text-sky-300 font-bold">{caliperData.distanceRs.toFixed(2)} Rs</span>
                </div>
                <div className="flex justify-between items-center text-white/80">
                  <span className="text-white/50">Physical Distance:</span>
                  <span className="text-amber-300 font-bold">
                    {caliperData.distanceKm >= 1e6 
                      ? `${(caliperData.distanceKm / 1e6).toFixed(2)} Million km (${caliperData.distanceAU.toFixed(3)} AU)` 
                      : `${caliperData.distanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-white/80">
                  <span className="text-white/50">Light Transit Time:</span>
                  <span className="text-emerald-300 font-bold">
                    {caliperData.lightTravelTimeSeconds < 60 
                      ? `${caliperData.lightTravelTimeSeconds.toFixed(2)} light-seconds` 
                      : `${(caliperData.lightTravelTimeSeconds / 60).toFixed(2)} light-minutes`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-white/80">
                  <span className="text-white/50">Gravitational Deflection Angle (α):</span>
                  <span className="text-purple-300 font-bold">
                    {caliperData.deflectionArcsec.toFixed(2)} arcsec
                  </span>
                </div>
                <p className="text-[10px] text-white/50 pt-1 border-t border-white/10">
                  Click two new points anywhere on screen to measure a different chord across spacetime.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-sky-200/90 text-center py-2 animate-pulse">
                Click two points on the black hole or accretion disk to measure physical scale & deflection.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 8. QUICK-FOCUS GRAVITATIONAL THRESHOLDS BAR (BOTTOM-CENTER) */}
      <div 
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-20 transition-all duration-700 ${
          ignited ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-black/60 backdrop-blur-2xl border border-white/15 text-xs shadow-2xl">
          <span className="px-2.5 py-1 text-[10px] font-mono tracking-wider text-amber-400/80 uppercase hidden md:inline">
            Focus:
          </span>
          <button
            onClick={() => handleFocusThreshold(6.2, 'oblique')}
            className="px-3 py-1 rounded-full bg-white/5 hover:bg-amber-500/20 text-white/70 hover:text-amber-200 transition-all font-mono text-[11px]"
            title="Zoom to Event Horizon Shadow Boundary (r = 1.1 Rs)"
          >
            Horizon
          </button>
          <button
            onClick={() => handleFocusThreshold(7.8, 'oblique')}
            className="px-3 py-1 rounded-full bg-white/5 hover:bg-amber-500/20 text-white/70 hover:text-amber-200 transition-all font-mono text-[11px]"
            title="Zoom to Photon Sphere Light Trapping Ring (r = 1.5 Rs)"
          >
            Photon Sphere
          </button>
          <button
            onClick={() => handleFocusThreshold(9.5, 'equatorial')}
            className="px-3 py-1 rounded-full bg-white/5 hover:bg-amber-500/20 text-white/70 hover:text-amber-200 transition-all font-mono text-[11px]"
            title="Zoom to Innermost Stable Circular Orbit ISCO (r = 3.0 Rs)"
          >
            ISCO Disk
          </button>
          <button
            onClick={() => handleFocusThreshold(10.5, 'equatorial')}
            className="px-3 py-1 rounded-full bg-white/5 hover:bg-amber-500/20 text-white/70 hover:text-amber-200 transition-all font-mono text-[11px]"
            title="Inspect Relativistic Doppler Crest (Approaching Blue-Shifted Gas)"
          >
            Doppler Crest
          </button>
          <button
            onClick={() => handleFocusThreshold(16.0, 'oblique')}
            className="px-3 py-1 rounded-full bg-white/5 hover:bg-amber-500/20 text-white/70 hover:text-amber-200 transition-all font-mono text-[11px]"
            title="Wide Deep-Space Orbit View"
          >
            Wide Orbit
          </button>
        </div>
      </div>

      {/* 9. INTERACTIVE RETICLE METRICS HUD */}
      {probeActive && probeData && (
        <div 
          className="fixed z-40 pointer-events-none transition-transform duration-75"
          style={{ 
            left: `${probeData.screenX}px`, 
            top: `${probeData.screenY}px`,
            transform: 'translate(18px, -50%)'
          }}
        >
          <div className="glass-panel p-3.5 rounded-xl border border-amber-400/40 bg-black/85 backdrop-blur-2xl shadow-2xl min-w-[210px] space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                {probeData.region.replace('_', ' ')}
              </span>
              <span className="text-[9px] text-white/50">RETICLE PROBE</span>
            </div>

            <div className="flex justify-between items-center text-white/80">
              <span className="text-white/50">Radius (r):</span>
              <span className="text-amber-300 font-bold">{probeData.estimatedRadius.toFixed(2)} Rs</span>
            </div>

            <div className="flex justify-between items-center text-white/80">
              <span className="text-white/50">Orbital Speed:</span>
              <span className="text-cyan-300 font-bold">
                {probeData.orbitalVelocityFraction >= 1.0 ? "c (Light Speed)" : `${(probeData.orbitalVelocityFraction * 100).toFixed(1)}% c`}
              </span>
            </div>

            <div className="flex justify-between items-center text-white/80">
              <span className="text-white/50">Time Dilation:</span>
              <span className="text-emerald-300 font-bold">
                {probeData.timeDilationRatio > 50 ? "∞ (Trapped)" : `${probeData.timeDilationRatio.toFixed(2)}x`}
              </span>
            </div>

            <div className="flex justify-between items-center text-white/80">
              <span className="text-white/50">Temperature:</span>
              <span className="text-orange-300 font-bold">
                {(probeData.temperatureKelvin / 1e6).toFixed(2)}M K
              </span>
            </div>

            <div className="flex justify-between items-center text-white/80">
              <span className="text-white/50">Redshift (z):</span>
              <span className="text-purple-300 font-bold">
                {probeData.redshift > 50 ? "Infinite" : `+${probeData.redshift.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 10. SCREENSHOT & COPY TOAST CONFIRMATIONS */}
      {screenshotToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 glass-panel px-4 py-2.5 rounded-full border border-emerald-500/50 bg-slate-950/90 text-emerald-300 text-xs font-mono flex items-center gap-2 shadow-2xl animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Wallpaper screenshot captured & downloaded!</span>
        </div>
      )}

      {copyToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 glass-panel px-4 py-2.5 rounded-full border border-cyan-500/50 bg-slate-950/90 text-cyan-300 text-xs font-mono flex items-center gap-2 shadow-2xl animate-fade-in">
          <Check className="w-4 h-4 text-cyan-400" />
          <span>Astrophysical Data Sheet copied to clipboard!</span>
        </div>
      )}

      {/* 11. SUBTLE DIAGNOSTICS FOOTER (BOTTOM LEFT) */}
      <footer 
        className={`fixed bottom-6 left-6 sm:left-12 z-20 pointer-events-none transition-all duration-1000 delay-500 text-xs font-mono text-white/50 tracking-wider flex items-center gap-3 ${
          ignited ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
        <span>{fps} FPS</span>
        <span className="text-white/20">|</span>
        <span>Drag to orbit · Scroll to zoom</span>
        <span className="text-white/20 hidden md:inline">|</span>
        <span className="hidden md:inline">Keys: [O] Probe · [X] Caliper · [Tab] Reticle</span>
      </footer>

      {/* 12. DEPLOY TEST PROBE MODAL */}
      {probeLauncherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="max-w-lg w-full bg-slate-950 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setProbeLauncherOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-4">
              <Rocket className="w-3.5 h-3.5" />
              RELATIVISTIC ORBITAL INSERTION
            </div>

            <h3 className="font-display text-2xl font-light tracking-wide text-white mb-2">
              Deploy Scientific Test Probe
            </h3>
            <p className="text-xs text-white/60 mb-6">
              Launch an instrumented probe into curved Schwarzschild spacetime to monitor real-time orbital precession, time dilation divergence, and gravitational horizon redshift.
            </p>

            {/* Orbit Options */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleLaunchProbe('isco')}
                className="w-full p-3.5 rounded-xl border border-white/10 hover:border-cyan-400/60 bg-white/5 hover:bg-cyan-500/10 text-left transition-all group"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-white group-hover:text-cyan-200">
                    Stable ISCO Orbit (r = 3.0 Rs)
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/20">
                    v = 0.41c
                  </span>
                </div>
                <p className="text-[11px] text-white/60">
                  Innermost Stable Circular Orbit. Particles inside this radius lose circular orbital stability and spiral inward.
                </p>
              </button>

              <button
                onClick={() => handleLaunchProbe('millers')}
                className="w-full p-3.5 rounded-xl border border-white/10 hover:border-amber-400/60 bg-white/5 hover:bg-amber-500/10 text-left transition-all group"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-white group-hover:text-amber-200">
                    Miller's Extreme Time Dilation (r = 1.002 Rs)
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 px-2 py-0.5 rounded bg-amber-500/20">
                    1 hr = 7 yrs
                  </span>
                </div>
                <p className="text-[11px] text-white/60">
                  Skimming right outside the event horizon with severe gravitational redshift and extreme time dilation.
                </p>
              </button>

              <button
                onClick={() => handleLaunchProbe('plunge')}
                className="w-full p-3.5 rounded-xl border border-white/10 hover:border-rose-400/60 bg-white/5 hover:bg-rose-500/10 text-left transition-all group"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-white group-hover:text-rose-200">
                    Infall Death Plunge (r0 = 5.5 Rs -&gt; Horizon)
                  </span>
                  <span className="text-[10px] font-mono text-rose-400 px-2 py-0.5 rounded bg-rose-500/20">
                    Horizon Freeze
                  </span>
                </div>
                <p className="text-[11px] text-white/60">
                  Radial infall trajectory. Watch the probe clock slow to a crawl and redshift into radio darkness as it freezes at the event horizon from Earth's view!
                </p>
              </button>

              <button
                onClick={() => handleLaunchProbe('eccentric')}
                className="w-full p-3.5 rounded-xl border border-white/10 hover:border-purple-400/60 bg-white/5 hover:bg-purple-500/10 text-left transition-all group"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-white group-hover:text-purple-200">
                    Relativistic Precessing Rosette (e = 0.5)
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 px-2 py-0.5 rounded bg-purple-500/20">
                    Perihelion Advance
                  </span>
                </div>
                <p className="text-[11px] text-white/60">
                  Eccentric orbital trajectory demonstrating Schwarzschild perihelion advance and spacetime curvature.
                </p>
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setProbeLauncherOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. PARAMETER TUNING DRAWER (RIGHT PANEL) */}
      <aside 
        className={`settings-drawer fixed top-0 right-0 h-full w-80 sm:w-96 z-40 bg-black/85 backdrop-blur-2xl border-l border-white/10 p-6 flex flex-col justify-between transition-transform duration-500 ease-out overflow-y-auto ${
          controlsOpen ? 'translate-x-0 shadow-2xl shadow-black' : 'translate-x-full'
        }`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h2 className="font-display font-medium text-sm tracking-[0.18em] uppercase text-white/90">
                Astrophysical Controls
              </h2>
            </div>
            <button
              onClick={() => setControlsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Target Spectrum Preset */}
          <div className="mb-6">
            <div className="text-[11px] font-mono uppercase tracking-wider text-white/60 mb-2.5 flex items-center justify-between">
              <span>Scientific Target</span>
              <span className="text-amber-400">{selectedTarget.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CELESTIAL_TARGETS.slice(0, 4).map((t) => (
                <button
                  key={t.name}
                  onClick={() => handleTargetChange(t)}
                  className={`p-2 rounded-lg text-left border transition-all ${
                    selectedTarget.key === t.key
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                      : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <div className="text-[10px] font-mono tracking-wider text-amber-400/80 uppercase">{t.theme}</div>
                  <div className="text-xs font-medium truncate mt-0.5">{t.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Relativistic Jets Control */}
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 mb-6 font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-purple-300" />
                <span className="text-white/90 font-semibold">Relativistic Polar Jets</span>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, showJets: !prev.showJets }))}
                className={`w-9 h-4.5 rounded-full transition-colors relative ${
                  settings.showJets ? 'bg-purple-500' : 'bg-white/20'
                }`}
              >
                <span 
                  className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                    settings.showJets ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {settings.showJets && (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-white/60 mb-1">
                  <span>Jet Synchrotron Power:</span>
                  <span className="text-purple-300">{(settings.jetIntensity ?? 1.2).toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={settings.jetIntensity ?? 1.2}
                  onChange={(e) => setSettings({ ...settings, jetIntensity: parseFloat(e.target.value) })}
                  className="w-full accent-purple-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Sliders Container */}
          <div className="space-y-5 text-xs">
            {/* Lensing Strength */}
            <div>
              <div className="flex justify-between items-center mb-1.5 font-mono">
                <span className="text-white/80">Lensing Strength</span>
                <span className="text-amber-400 font-semibold">{settings.lensingStrength.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.05"
                value={settings.lensingStrength}
                onChange={(e) => setSettings({ ...settings, lensingStrength: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            {/* Doppler Beaming */}
            <div>
              <div className="flex justify-between items-center mb-1.5 font-mono">
                <span className="text-white/80">Doppler Asymmetry</span>
                <span className="text-amber-400 font-semibold">{settings.dopplerStrength.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.05"
                value={settings.dopplerStrength}
                onChange={(e) => setSettings({ ...settings, dopplerStrength: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            {/* Accretion Disk Brightness */}
            <div>
              <div className="flex justify-between items-center mb-1.5 font-mono">
                <span className="text-white/80">Accretion Disk Brightness</span>
                <span className="text-amber-400 font-semibold">{settings.diskBrightness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={settings.diskBrightness}
                onChange={(e) => setSettings({ ...settings, diskBrightness: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            {/* Disk Rotation Speed */}
            <div>
              <div className="flex justify-between items-center mb-1.5 font-mono">
                <span className="text-white/80">Disk Rotation Speed</span>
                <span className="text-amber-400 font-semibold">{settings.rotationSpeed.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={settings.rotationSpeed}
                onChange={(e) => setSettings({ ...settings, rotationSpeed: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            {/* Soundscape Volume */}
            <div>
              <div className="flex justify-between items-center mb-1.5 font-mono">
                <span className="text-white/80">Cosmic Audio Volume</span>
                <span className="text-amber-400 font-semibold">{Math.round(audioVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={audioVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-6 border-t border-white/10 space-y-2.5">
          <button
            onClick={handleCopyDataSheet}
            className="w-full py-2.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 hover:border-cyan-400 text-cyan-200 transition-all text-xs font-mono flex items-center justify-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-300" />
            <span>Copy Astrophysical Data Sheet</span>
          </button>

          <button
            onClick={handleCaptureWallpaper}
            className="w-full py-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-400 text-amber-200 transition-all text-xs font-mono flex items-center justify-center gap-2"
          >
            <Camera className="w-3.5 h-3.5 text-amber-300" />
            <span>Capture Wallpaper Snapshot</span>
          </button>

          <button
            onClick={handleResetSettings}
            className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all text-xs font-mono flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleDownloadStandalone}
            className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all text-xs font-mono flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-white/60" />
            <span>Download Standalone HTML</span>
          </button>
        </div>
      </aside>

      {/* 14. ASTROPHYSICS & TIME DILATION CALCULATOR MODAL */}
      {calculatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="max-w-2xl w-full bg-slate-950 border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCalculatorOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono mb-4">
              <Calculator className="w-3.5 h-3.5" />
              ASTROPHYSICAL METRIC CALCULATOR
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-2xl font-light tracking-wide text-white">
                Physical Metric Computations
              </h3>
              <button
                onClick={handleCopyDataSheet}
                className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-mono flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Data Sheet</span>
              </button>
            </div>

            {/* Target Selector */}
            <div className="mb-6">
              <label className="text-[11px] font-mono text-white/50 uppercase tracking-wider block mb-2">
                Select Real Black Hole Target:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CELESTIAL_TARGETS.map(t => (
                  <button
                    key={t.name}
                    onClick={() => handleTargetChange(t)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedTarget.key === t.key
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="text-[9px] font-mono text-amber-400 uppercase truncate">{t.category}</div>
                    <div className="text-xs font-semibold truncate mt-0.5">{t.name}</div>
                    <div className="text-[10px] text-white/50 mt-1 font-mono">
                      {t.massSolar >= 1e6 ? `${(t.massSolar / 1e6).toFixed(1)}M M☉` : `${t.massSolar} M☉`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Physical Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-xs mb-6">
              <div>
                <span className="text-[10px] text-white/50 block">Schwarzschild Radius (Rs)</span>
                <span className="text-amber-300 font-bold text-sm">
                  {Rs_km >= 1e6 ? `${(Rs_km / 1e6).toFixed(2)}M km` : `${Rs_km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`}
                </span>
                <span className="text-[9px] text-white/40 block">({Rs_AU >= 0.01 ? `${Rs_AU.toFixed(2)} AU` : `${(Rs_meters).toFixed(1)} m`})</span>
              </div>

              <div>
                <span className="text-[10px] text-white/50 block">Photon Sphere Radius</span>
                <span className="text-amber-300 font-bold text-sm">
                  {R_photon_km >= 1e6 ? `${(R_photon_km / 1e6).toFixed(2)}M km` : `${R_photon_km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`}
                </span>
                <span className="text-[9px] text-white/40 block">r = 1.5 Rs (3M)</span>
              </div>

              <div>
                <span className="text-[10px] text-white/50 block">ISCO Radius</span>
                <span className="text-amber-300 font-bold text-sm">
                  {R_isco_km >= 1e6 ? `${(R_isco_km / 1e6).toFixed(2)}M km` : `${R_isco_km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`}
                </span>
                <span className="text-[9px] text-white/40 block">r = 3.0 Rs (6M)</span>
              </div>

              <div>
                <span className="text-[10px] text-white/50 block">Hawking Temp</span>
                <span className="text-cyan-300 font-bold text-sm">
                  {hawkingTempK.toExponential(2)} K
                </span>
                <span className="text-[9px] text-white/40 block">T_H = ℏc³ / 8πGMk</span>
              </div>

              <div>
                <span className="text-[10px] text-white/50 block">Surface Gravity (g)</span>
                <span className="text-emerald-300 font-bold text-sm">
                  {surfaceGravity.toExponential(2)} m/s²
                </span>
                <span className="text-[9px] text-white/40 block">At Event Horizon</span>
              </div>

              <div>
                <span className="text-[10px] text-white/50 block">Evaporation Time</span>
                <span className="text-purple-300 font-bold text-sm">
                  {evaporationYears.toExponential(1)} yrs
                </span>
                <span className="text-[9px] text-white/40 block">τ ∝ M³</span>
              </div>
            </div>

            {/* Miller's Planet Time Dilation Calculator */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-400" />
                <h4 className="font-semibold text-xs uppercase tracking-wider text-amber-200">
                  Gravitational Time Dilation Solver
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs font-mono">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white/70">Observer Distance (r / Rs):</span>
                    <span className="text-amber-300 font-bold">{orbitalRadiusProbe.toFixed(5)} Rs</span>
                  </div>
                  <input
                    type="range"
                    min="1.00001"
                    max="5.0"
                    step="0.00005"
                    value={orbitalRadiusProbe}
                    onChange={(e) => setOrbitalRadiusProbe(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] text-white/50 block mt-1">1.00002 Rs = Interstellar Miller's planet orbit</span>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white/70">Time Spent Near Horizon:</span>
                    <span className="text-amber-300 font-bold">{timeDilationHours} hour{timeDilationHours > 1 ? 's' : ''}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={timeDilationHours}
                    onChange={(e) => setTimeDilationHours(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Result Readout */}
              <div className="p-3 rounded-lg bg-black/60 border border-white/10 font-mono text-center">
                <span className="text-[10px] text-white/50 uppercase tracking-widest block mb-1">
                  Time Passed on Earth / At Flat Spacetime (Infinity):
                </span>
                <span className="text-base sm:text-lg text-amber-300 font-bold">
                  {timeAtInfinityYears >= 1 
                    ? `${timeAtInfinityYears.toFixed(2)} Earth Years` 
                    : timeAtInfinityDays >= 1 
                      ? `${timeAtInfinityDays.toFixed(1)} Earth Days` 
                      : `${timeAtInfinityHours.toFixed(1)} Earth Hours`}
                </span>
                <p className="text-[10px] text-white/60 mt-1">
                  Time Dilation Ratio: <strong className="text-white">{timeDilationFactor.toFixed(1)}x</strong> (1 second here = {timeDilationFactor.toFixed(1)} seconds on Earth)
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setCalculatorOpen(false)}
                className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono tracking-wider transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15. KEYBOARD SHORTCUTS MODAL */}
      {shortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="max-w-md w-full bg-slate-950 border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShortcutsOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono mb-4">
              <Keyboard className="w-3.5 h-3.5" />
              PRODUCTIVITY KEYS
            </div>

            <h3 className="font-display text-xl font-light tracking-wide text-white mb-4">
              Keyboard Shortcuts
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-white/60">Deploy Scientific Test Probe</span>
                <kbd className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">O</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-white/60">Measure Spacetime Caliper</span>
                <kbd className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">X</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-white/60">Toggle Inspection Reticle</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10">Tab</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-white/60">Pause / Resume Camera Orbit</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10">Space</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-white/60">Perspective Angles</span>
                <div className="flex gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10">1</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10">2</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10">3</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10">4</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-white/60">Astrophysics Specs & Calculator</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10">C</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-white/60">Capture Wallpaper Snapshot</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10">S</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-white/60">Toggle Shader Controls</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10">P</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-white/60">Toggle Cosmic Audio</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10">M</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-white/60">Toggle Fullscreen</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10">F</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 16. ASTROPHYSICAL THEORY INFO MODAL */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="max-w-2xl w-full bg-slate-950 border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setInfoModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              ASTROPHYSICAL FOUNDATIONS
            </div>

            <h3 className="font-display text-2xl font-light tracking-wide text-white mb-4">
              General Relativistic Ray Tracing
            </h3>

            <div className="space-y-4 text-xs text-white/80 leading-relaxed font-sans font-light">
              <p>
                In 1915, Albert Einstein published the field equations of General Relativity:
                <code className="block my-2 p-2 rounded bg-black/60 font-mono text-amber-300 text-center border border-white/10">
                  G_{'{μν}'} = (8πG / c⁴) T_{'{μν}'}
                </code>
                Karl Schwarzschild immediately derived the exact exterior vacuum solution for a static, non-rotating spherical mass. Light traversing this spacetime follows curved null geodesics.
              </p>

              <h4 className="font-display font-normal text-sm text-white pt-2">
                1. Dual-Arch Gravitational Lensing
              </h4>
              <p>
                Because photons are deflected toward the mass by an effective force <span className="font-mono text-amber-300">d(dir)/ds ∝ -1.5 Rs / r²</span>, rays traveling above and below the horizon bend over the top and under the bottom. An observer sees the back rim of the accretion disk simultaneously projected as a top halo and bottom sub-arc.
              </p>

              <h4 className="font-display font-normal text-sm text-white pt-2">
                2. Relativistic Doppler Beaming
              </h4>
              <p>
                Plasma orbiting at Keplerian velocity <span className="font-mono text-amber-300">v ∝ r^-0.5</span> travels at up to 50% the speed of light. Relativistic beaming concentrates radiation into a forward cone along the velocity vector, causing the approaching (left) side to appear dazzlingly brighter and blue-shifted, while the receding (right) side drops into deep smoke-red darkness.
              </p>

              <h4 className="font-display font-normal text-sm text-white pt-2">
                3. The Photon Sphere Ring (r = 1.5 Rs)
              </h4>
              <p>
                At exactly <span className="font-mono text-amber-300">r = 1.5 Rs = 3M</span>, circular photon orbits exist. Photons grazing this critical impact parameter orbit the black hole multiple times before escaping to the observer, forming an infinitely thin, incandescent ring right along the shadow boundary.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInfoModalOpen(false)}
                className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono tracking-wider transition-all"
              >
                Return to Simulation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Standalone HTML Generator Function
function generateStandaloneHtml(s: BlackHoleSettings): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gargantua | Beyond the Event Horizon</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #canvas-container { position: absolute; inset: 0; width: 100%; height: 100%; cursor: grab; }
    #canvas-container:active { cursor: grabbing; }
    .nav { position: fixed; top: 0; left: 0; right: 0; height: 80px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; z-index: 20; }
    .brand { font-family: "Space Grotesk", sans-serif; font-size: 14px; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.9); }
    .badge { margin-left: 12px; padding: 2px 8px; border-radius: 9999px; font-size: 9px; font-family: monospace; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); color: #fcd34d; }
    .hero { position: absolute; top: 50%; left: 80px; transform: translateY(-50%); max-width: 600px; z-index: 10; pointer-events: none; }
    .hero h1 { font-family: "Space Grotesk", sans-serif; font-weight: 300; font-size: 56px; line-height: 1.1; letter-spacing: 0.16em; text-transform: uppercase; color: #fff; margin-bottom: 24px; }
    .hero h1 span { background: linear-gradient(to right, #fde68a, #fbbf24, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero p { font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.8); margin-bottom: 32px; }
    .btn { pointer-events: auto; display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; border-radius: 9999px; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 600; color: #fde68a; background: rgba(0,0,0,0.5); backdrop-filter: blur(16px); border: 1px solid rgba(245,158,11,0.4); box-shadow: 0 0 25px rgba(245,158,11,0.2); cursor: pointer; }
    .btn:hover { background: rgba(245,158,11,0.2); }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
  <div id="canvas-container"></div>
  <header class="nav">
    <div style="display:flex; align-items:center;">
      <span class="brand">GARGANTUA</span>
      <span class="badge">SCHWARZSCHILD LABORATORY</span>
    </div>
  </header>
  <div class="hero">
    <h1>Beyond the<br><span>Event Horizon</span></h1>
    <p>A real-time null geodesic simulation of gravitational lensing, Doppler-beamed Keplerian accretion, and rotating cosmic dust particles in curved spacetime.</p>
    <button class="btn" onclick="toggleAutoOrbit()">Toggle Orbit</button>
  </div>
  <script>
    let autoOrbit = true;
    function toggleAutoOrbit() { autoOrbit = !autoOrbit; }

    const container = document.getElementById('canvas-container');
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uTime: { value: 0.0 },
      uCameraPos: { value: new THREE.Vector3(0, 2.2, 10.5) },
      uCameraTarget: { value: new THREE.Vector3(0, 0, 0) },
      uCameraUp: { value: new THREE.Vector3(0, 1, 0) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uFov: { value: ${s.fov} },
      uLensingStrength: { value: ${s.lensingStrength} },
      uDiskBrightness: { value: ${s.diskBrightness} },
      uDopplerStrength: { value: ${s.dopplerStrength} },
      uRotationSpeed: { value: ${s.rotationSpeed} },
      uDiskInner: { value: ${s.diskInner} },
      uDiskOuter: { value: ${s.diskOuter} },
      uIgnition: { value: 1.0 },
      uReducedMotion: { value: 0.0 }
    };

    const vs = \`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }\`;
    const fs = \`
      uniform vec2 uResolution; uniform float uTime; uniform vec3 uCameraPos; uniform vec3 uCameraTarget; uniform vec3 uCameraUp;
      uniform float uFov; uniform float uLensingStrength; uniform float uDiskBrightness; uniform float uDopplerStrength; uniform float uRotationSpeed;
      uniform float uDiskInner; uniform float uDiskOuter; uniform float uIgnition;
      varying vec2 vUv;
      #define RS 1.0
      #define R_PHOTON (1.5 * RS)
      #define MAX_STEPS 96
      #define ESCAPE_RADIUS 26.0

      float hash21(vec2 p) { p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
      float hash31(vec3 p) { p = fract(p * vec3(443.897, 441.423, 437.195)); p += dot(p, p.yzx + 19.19); return fract((p.x + p.y) * p.z); }
      float noise2d(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash21(i), hash21(i + vec2(1,0)), u.x), mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0; float a = 0.55; mat2 rot = mat2(cos(0.52), sin(0.52), -sin(0.52), cos(0.52));
        for(int i = 0; i < 4; i++) { v += a * noise2d(p); p = rot * p * 2.12 + vec2(1.7, 9.2); a *= 0.48; }
        return v;
      }
      vec3 sampleStarfield(vec3 dir) {
        vec3 c = vec3(0.0); vec3 p = normalize(dir) * 280.0; vec3 id = floor(p);
        if (hash31(id) > 0.987) c += mix(vec3(0.85, 0.92, 1.0), vec3(1.0, 0.85, 0.65), hash31(id + 2.0)) * pow(hash31(id + 1.0), 15.0) * 2.2;
        return c;
      }
      vec3 blackbodyColor(float t) {
        vec3 c1 = vec3(0.38, 0.04, 0.01); vec3 c2 = vec3(0.96, 0.40, 0.06); vec3 c3 = vec3(1.00, 0.78, 0.28); vec3 c4 = vec3(1.00, 0.98, 0.92);
        if (t < 0.25) return mix(c1, c2, t / 0.25); else if (t < 0.65) return mix(c2, c3, (t - 0.25) / 0.40); else return mix(c3, c4, (t - 0.65) / 0.35);
      }
      vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
        vec3 fwd = normalize(uCameraTarget - uCameraPos); vec3 rgt = normalize(cross(fwd, uCameraUp)); vec3 up = cross(rgt, fwd);
        vec3 dir = normalize(fwd * uFov + rgt * uv.x + up * uv.y);
        vec3 pos = uCameraPos; vec3 col = vec3(0.0); float trans = 1.0; float minDist = 1000.0; bool inH = false;

        for(int i = 0; i < MAX_STEPS; i++) {
          float r = length(pos); minDist = min(minDist, r);
          if (r <= RS) { inH = true; break; }
          if (r > ESCAPE_RADIUS) break;
          float dt = max(0.045, min(0.38, 0.082 * (r - RS)));
          vec3 nextPos = pos + dir * dt;
          if (pos.y * nextPos.y <= 0.0) {
            float tP = -pos.y / (nextPos.y - pos.y); vec3 hit = mix(pos, nextPos, tP); float hitR = length(hit.xz);
            if (hitR >= uDiskInner && hitR <= uDiskOuter) {
              float rNorm = (hitR - uDiskInner) / (uDiskOuter - uDiskInner); float phi = atan(hit.z, hit.x);
              float rot = phi - uTime * (uRotationSpeed * 1.85 / pow(hitR / uDiskInner, 1.5));
              float dust = smoothstep(0.32, 0.65, fbm(vec2(hitR * 2.2, rot * 3.6)));
              float radP = pow(1.0 - rNorm, 1.8) * smoothstep(0.0, 0.09, rNorm);
              vec3 vel = normalize(vec3(-hit.z, 0.0, hit.x)); float vDot = dot(vel, normalize(uCameraPos - hit));
              float dop = sqrt((1.0 + 0.5 * vDot) / max(0.01, 1.0 - 0.5 * vDot));
              vec3 c = blackbodyColor(clamp(pow(1.0 - rNorm, 0.75) * dop, 0.0, 1.0));
              if (vDot > 0.0) c = mix(c, vec3(0.92, 0.96, 1.0), vDot * 0.45);
              float opt = dust * radP * 1.85;
              col += c * opt * pow(dop, 3.0 * uDopplerStrength) * uDiskBrightness * trans;
              trans *= max(0.0, 1.0 - opt * 0.72);
              if (trans < 0.02) break;
            }
          }
          dir = normalize(dir - (1.5 * RS * uLensingStrength / (r * r * r)) * pos * dt);
          pos = nextPos;
        }
        if (inH) { col = mix(col, vec3(0.0), trans); trans = 0.0; }
        if (trans > 0.005) col += sampleStarfield(dir) * trans;
        float pDist = abs(minDist - R_PHOTON);
        col += vec3(1.0, 0.88, 0.62) * (exp(-pDist * 52.0) * 1.85 + exp(-abs(minDist - 1.485) * 92.0) * 0.95) * uDiskBrightness;
        col += vec3(1.0, 0.65, 0.22) * exp(-length(uv) * 3.2) * 0.28 * uDiskBrightness;
        gl_FragColor = vec4(pow(aces(col), vec3(1.0 / 2.2)) * uIgnition, 1.0);
      }
    \`;

    const material = new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    const cameraState = { spherical: { radius: 10.8, theta: 0.22, phi: 1.38 }, target: { radius: 10.8, theta: 0.22, phi: 1.38 } };
    let isDragging = false, prevM = { x: 0, y: 0 };
    window.addEventListener('mousedown', e => { isDragging = true; prevM = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('mousemove', e => {
      if (isDragging) {
        cameraState.target.theta -= (e.clientX - prevM.x) * 0.005;
        cameraState.target.phi = Math.max(0.3, Math.min(Math.PI - 0.3, cameraState.target.phi + (e.clientY - prevM.y) * 0.005));
        prevM = { x: e.clientX, y: e.clientY };
      }
    });
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('wheel', e => {
      cameraState.target.radius = Math.max(5.8, Math.min(18.0, cameraState.target.radius + e.deltaY * 0.005));
    });
    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    });

    let clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      if (autoOrbit && !isDragging) cameraState.target.theta += dt * 0.04;
      const c = cameraState.spherical; const t = cameraState.target;
      c.radius += (t.radius - c.radius) * 0.07; c.theta += (t.theta - c.theta) * 0.07; c.phi += (t.phi - c.phi) * 0.07;
      uniforms.uTime.value = elapsed;
      uniforms.uCameraPos.value.set(
        c.radius * Math.sin(c.phi) * Math.sin(c.theta),
        c.radius * Math.cos(c.phi),
        c.radius * Math.sin(c.phi) * Math.cos(c.theta)
      );
      renderer.render(scene, camera);
    }
    animate();
  </script>
</body>
</html>`;
}
