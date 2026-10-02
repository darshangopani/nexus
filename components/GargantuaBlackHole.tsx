'use client';

import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { cosmicAudio } from '@/lib/audio';

// =============================================================================
// GARGANTUA: PRACTICAL ASTROPHYSICAL SCHWARZSCHILD BLACK HOLE SIMULATION
// GENERAL RELATIVISTIC RAY MARCHER + 3D KEPLERIAN ACCRETION DUST & RELATIVISTIC JETS
// -----------------------------------------------------------------------------
// Features:
// 1. Pure black event horizon (r <= R_s) with zero light escaping
// 2. Razor-sharp incandescent photon ring with chromatic dispersion
// 3. Flat accretion disk with Keplerian differential rotation and turbulent dust lanes
// 4. Kip Thorne gravitational lensing: disk visibly bends over top & bottom
// 5. Relativistic Doppler beaming: approaching side is dazzlingly bright & blue-white
// 6. 4,800+ 3D Keplerian Dust Particles with gravitational light bending & spiral infall
// 7. Relativistic Polar Synchrotron Jets (for M87* and Cygnus X-1)
// 8. Real-time Relativistic Test Probe Infall & Orbit Simulator with horizon freezing!
// 9. Interactive Spacetime Caliper tool for physical distance & deflection measurement
// 10. Multi-target astrophysical color spectrums (Gargantua, Sgr A*, M87*, Cygnus X-1)
// =============================================================================

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uCameraPos;
uniform vec3 uCameraTarget;
uniform vec3 uCameraUp;
uniform vec2 uMouse;
uniform float uFov;
uniform float uLensingStrength;
uniform float uDiskBrightness;
uniform float uDopplerStrength;
uniform float uRotationSpeed;
uniform float uDiskInner;
uniform float uDiskOuter;
uniform float uIgnition;
uniform float uReducedMotion;
  uniform vec2 uOffset;
  uniform float uZoom;


uniform int uColorTheme; // 0 = Gargantua (Gold), 1 = Sgr A* (Fire Orange), 2 = M87* (Radio Amber), 3 = Cygnus X-1 (X-ray Cyan/Blue)

varying vec2 vUv;

#define RS 1.0                    // Schwarzschild radius R_s = 2GM/c^2
#define R_PHOTON (1.5 * RS)       // Photon sphere radius r = 1.5 R_s = 3M
#define MAX_STEPS 96              // Geodesic integration steps
#define ESCAPE_RADIUS 26.0        // Flat space boundary

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float hash31(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float noise2d(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.55;
  mat2 rot = mat2(cos(0.52), sin(0.52), -sin(0.52), cos(0.52));
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise2d(p);
    p = rot * p * 2.12 + vec2(1.7, 9.2);
    amplitude *= 0.48;
  }
  return value;
}

vec3 sampleStarfield(vec3 rayDir) {
  vec3 dir = normalize(rayDir);
  vec3 starColor = vec3(0.0);
  
  vec3 p1 = dir * 280.0;
  vec3 id1 = floor(p1);
  float n1 = hash31(id1);
  if (n1 > 0.987) {
    float b = pow(hash31(id1 + 1.0), 15.0) * 2.2;
    vec3 c = mix(vec3(0.85, 0.92, 1.0), vec3(1.0, 0.85, 0.65), hash31(id1 + 2.0));
    starColor += c * b;
  }

  vec3 p2 = dir * 95.0;
  vec3 id2 = floor(p2);
  float n2 = hash31(id2);
  if (n2 > 0.993) {
    float b = pow(hash31(id2 + 3.0), 9.0) * 3.0;
    vec3 c = mix(vec3(0.65, 0.82, 1.0), vec3(1.0, 0.92, 0.7), hash31(id2 + 4.0));
    starColor += c * b;
  }

  float neb1 = fbm(dir.xy * 2.2 + vec2(dir.z * 1.4, 0.0));
  float neb2 = fbm(dir.yz * 1.9 + vec2(0.0, dir.x * 1.3));
  vec3 nebulaColor = vec3(0.009, 0.013, 0.028) * neb1 + vec3(0.016, 0.007, 0.024) * neb2;

  return starColor + nebulaColor;
}

// Multi-spectral blackbody color mapping
vec3 blackbodyColor(float tempNorm, int theme) {
  if (theme == 1) {
    // Sagittarius A* (EHT Fiery Orange & Red Ember)
    vec3 c1 = vec3(0.35, 0.02, 0.01);
    vec3 c2 = vec3(0.95, 0.28, 0.03);
    vec3 c3 = vec3(1.00, 0.65, 0.15);
    vec3 c4 = vec3(1.00, 0.92, 0.75);
    if (tempNorm < 0.25) return mix(c1, c2, tempNorm / 0.25);
    else if (tempNorm < 0.65) return mix(c2, c3, (tempNorm - 0.25) / 0.40);
    else return mix(c3, c4, (tempNorm - 0.65) / 0.35);
  } else if (theme == 2) {
    // M87* (Deep Radio Amber & Copper)
    vec3 c1 = vec3(0.28, 0.04, 0.01);
    vec3 c2 = vec3(0.85, 0.35, 0.05);
    vec3 c3 = vec3(1.00, 0.60, 0.18);
    vec3 c4 = vec3(1.00, 0.85, 0.60);
    if (tempNorm < 0.25) return mix(c1, c2, tempNorm / 0.25);
    else if (tempNorm < 0.65) return mix(c2, c3, (tempNorm - 0.25) / 0.40);
    else return mix(c3, c4, (tempNorm - 0.65) / 0.35);
  } else if (theme == 3) {
    // Cygnus X-1 (Ultra-hot X-ray Microquasar: Electric Cyan / Blue / Violet)
    vec3 c1 = vec3(0.08, 0.02, 0.28);
    vec3 c2 = vec3(0.12, 0.42, 0.95);
    vec3 c3 = vec3(0.35, 0.85, 1.00);
    vec3 c4 = vec3(0.92, 0.98, 1.00);
    if (tempNorm < 0.25) return mix(c1, c2, tempNorm / 0.25);
    else if (tempNorm < 0.65) return mix(c2, c3, (tempNorm - 0.25) / 0.40);
    else return mix(c3, c4, (tempNorm - 0.65) / 0.35);
  } else {
    // Interstellar Gargantua (Warm Solar Gold / Amber / Incandescent White)
    vec3 c1 = vec3(0.38, 0.04, 0.01);
    vec3 c2 = vec3(0.96, 0.40, 0.06);
    vec3 c3 = vec3(1.00, 0.78, 0.28);
    vec3 c4 = vec3(1.00, 0.98, 0.92);
    if (tempNorm < 0.25) return mix(c1, c2, tempNorm / 0.25);
    else if (tempNorm < 0.65) return mix(c2, c3, (tempNorm - 0.25) / 0.40);
    else return mix(c3, c4, (tempNorm - 0.65) / 0.35);
  }
}

vec3 acesFilm(vec3 x) {
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec2 screenUv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  vec2 uv = (screenUv - uOffset) / uZoom;

  vec3 forward = normalize(uCameraTarget - uCameraPos);
  vec3 right = normalize(cross(forward, uCameraUp));
  vec3 up = cross(right, forward);

  vec3 rayOrigin = uCameraPos;
  vec3 rayDir = normalize(forward * uFov + right * uv.x + up * uv.y);

  // Spacetime cursor deflection
  float mouseDist = length(uv - uMouse);
  if (mouseDist < 0.45) {
    float mouseRipple = (1.0 - smoothstep(0.0, 0.45, mouseDist)) * 0.008;
    vec2 toMouse = normalize(uv - uMouse + 0.0001);
    rayDir = normalize(rayDir + (right * toMouse.x + up * toMouse.y) * mouseRipple);
  }

  vec3 pos = rayOrigin;
  vec3 dir = rayDir;
  vec3 accumulatedColor = vec3(0.0);
  float transmission = 1.0;
  float minDistance = 1000.0;
  bool enteredHorizon = false;

  float effectiveTime = uTime * (uReducedMotion > 0.5 ? 0.2 : 1.0);

  // ===========================================================================
  // GEODESIC RAY MARCHING IN CURVED SCHWARZSCHILD SPACETIME
  // ===========================================================================
  for (int step = 0; step < MAX_STEPS; step++) {
    float r = length(pos);
    minDistance = min(minDistance, r);

    if (r <= RS) {
      enteredHorizon = true;
      break;
    }

    if (r > ESCAPE_RADIUS) {
      break;
    }

    float stepSize = max(0.045, min(0.38, 0.082 * (r - RS)));
    vec3 nextPos = pos + dir * stepSize;

    // Check equatorial accretion disk intersection (y = 0 plane)
    if (pos.y * nextPos.y <= 0.0) {
      float tPlane = -pos.y / (nextPos.y - pos.y);
      vec3 hitPos = mix(pos, nextPos, tPlane);
      float hitRadius = length(hitPos.xz);

      if (hitRadius >= uDiskInner && hitRadius <= uDiskOuter) {
        float rNorm = (hitRadius - uDiskInner) / (uDiskOuter - uDiskInner);

        // Keplerian-sheared filaments: inner gas laps the outer gas, stretching
        // turbulence into thin, wispy streamers
        float phi = atan(hitPos.z, hitPos.x);
        float kepler = uRotationSpeed * 0.9 / pow(hitRadius, 1.5);
        float rotPhi = phi + effectiveTime * kepler;
        vec2 ringCoord = vec2(cos(rotPhi), sin(rotPhi)) * 1.4;
        float turbulence = fbm(vec2(hitRadius * 7.5, 0.0) + ringCoord);
        float fineLanes = fbm(vec2(hitRadius * 22.0, 3.1) + ringCoord * 2.3);
        float ringlets = 0.5 + 0.5 * sin(hitRadius * 34.0 + turbulence * 7.0);
        float filament = pow(clamp(turbulence * 0.55 + fineLanes * 0.45, 0.0, 1.0), 2.4);
        float diskDensity = clamp(0.12 + filament * 1.35 * mix(0.55, 1.0, ringlets), 0.0, 1.0);

        // Radial brightness falloff: peak near ISCO, fading outward with feathered edges
        float radialProfile = pow(1.0 - rNorm, 2.2) * smoothstep(0.0, 0.05, rNorm) * smoothstep(1.0, 0.75, rNorm);

        // Gravitational redshift dims and cools light climbing out of the well
        float gravShift = sqrt(max(0.0, 1.0 - RS / hitRadius));

        // Relativistic Doppler beaming
        vec3 orbitalVelocity = normalize(vec3(-hitPos.z, 0.0, hitPos.x));
        vec3 toCamera = normalize(uCameraPos - hitPos);
        float vDotN = dot(orbitalVelocity, toCamera);

        float vOverC = min(0.55, 0.50 / sqrt(max(1.0, hitRadius)));
        float dopplerFactor = sqrt((1.0 + vOverC * vDotN) / max(0.01, 1.0 - vOverC * vDotN));
        float dopplerMultiplier = pow(dopplerFactor, 3.0 * uDopplerStrength);

        float tempNorm = clamp(pow(1.0 - rNorm, 0.75) * dopplerFactor * gravShift, 0.0, 1.0);
        vec3 emissionColor = blackbodyColor(tempNorm, uColorTheme);

        if (vDotN > 0.0) {
          emissionColor = mix(emissionColor, vec3(0.92, 0.96, 1.0), clamp(vDotN * 0.3 * uDopplerStrength, 0.0, 0.6));
        } else {
          emissionColor = mix(emissionColor, vec3(0.45, 0.04, 0.01), clamp(-vDotN * 0.4 * uDopplerStrength, 0.0, 0.7));
        }

        float diskOpticalDepth = diskDensity * radialProfile * 1.6;
        vec3 diskColor = emissionColor * diskOpticalDepth * dopplerMultiplier * pow(gravShift, 3.0) * uDiskBrightness;

        accumulatedColor += diskColor * transmission;
        // Optically thin gas: the lensed far side of the disk glimmers through
        transmission *= max(0.0, 1.0 - diskOpticalDepth * 0.45);

        if (transmission < 0.02) break;
      }
    }

    // Einstein General Relativistic light deflection
    vec3 deflectionForce = -(1.5 * RS * uLensingStrength / (r * r * r)) * pos;
    dir = normalize(dir + deflectionForce * stepSize);
    pos = nextPos;
  }

  // Pure black event horizon
  if (enteredHorizon) {
    accumulatedColor = mix(accumulatedColor, vec3(0.0), transmission);
    transmission = 0.0;
  }

  // Spread, feathered shadow: rays grazing the photon sphere arrive heavily
  // redshifted, so the horizon fades into space instead of ending at a hard edge
  float shadowFeather = smoothstep(RS * 0.9, RS * 3.2, minDistance);
  transmission *= pow(shadowFeather, 1.8);

  // Background starfield if ray escaped
  if (transmission > 0.005) {
    vec3 backgroundStars = sampleStarfield(dir);
    accumulatedColor += backgroundStars * transmission;
  }

  // Razor-sharp incandescent photon sphere ring (r = 1.5 Rs)
  float photonDist = abs(minDistance - R_PHOTON);
  // Hairline photon ring with faint higher-order subrings (n=1, n=2 images)
  float photonRingSharp = exp(-photonDist * 150.0) * 1.1 * uIgnition;
  float photonSubRing = exp(-abs(minDistance - 1.49 * RS) * 320.0) * 0.45 * uIgnition;
  float photonHalo = exp(-photonDist * 28.0) * 0.08 * uIgnition
    + (enteredHorizon ? 0.0 : exp(-max(0.0, minDistance - R_PHOTON) * 2.6) * 0.035 * shadowFeather * uIgnition);
  float totalPhotonGlow = photonRingSharp + photonSubRing + photonHalo;

  vec3 ringColor = uColorTheme == 3 ? vec3(0.55, 0.85, 1.0) : vec3(1.0, 0.88, 0.62);
  accumulatedColor += ringColor * totalPhotonGlow * uDiskBrightness * 0.6;

  // Restrained lens bloom & film grain
  float bloomDist = length(uv);
  float shadowMask = enteredHorizon ? 0.0 : shadowFeather;
  float bloom = exp(-bloomDist * 4.5) * 0.06 * uDiskBrightness * uIgnition * shadowMask;
  accumulatedColor += (uColorTheme == 3 ? vec3(0.4, 0.7, 1.0) : vec3(1.0, 0.65, 0.22)) * bloom;

  float anamorphicFlare = exp(-abs(uv.y) * 90.0) * exp(-abs(uv.x + 0.25) * 2.0) * 0.035 * uIgnition * shadowMask;
  accumulatedColor += vec3(0.92, 0.84, 1.0) * anamorphicFlare;

  float grain = (hash21(uv * uResolution + fract(effectiveTime * 17.0)) - 0.5) * 0.012;
  accumulatedColor += vec3(grain);

  float vignette = smoothstep(1.85, 0.42, length(screenUv));
  accumulatedColor *= vignette;

  vec3 finalColor = acesFilm(accumulatedColor);
  finalColor = pow(finalColor, vec3(1.0 / 2.2));

  gl_FragColor = vec4(finalColor * uIgnition, 1.0);
}
`;

// =============================================================================
// 3D ROTATING DUST PARTICLES SHADER
// =============================================================================
const DUST_VERTEX_SHADER = /* glsl */ `
attribute float aRadius;
attribute float aAngle;
attribute float aHeight;
attribute float aSize;
attribute float aSpeedMult;
attribute vec3 aColor;

uniform float uTime;
uniform float uRotationSpeed;
uniform float uIgnition;
uniform float uBrightness;
uniform vec3 uCameraPos;

varying vec3 vColor;
varying float vAlpha;

void main() {
  float rEff = max(1.6, aRadius);
  float omega = (uRotationSpeed * 1.85 / pow(rEff / 2.2, 1.5)) * aSpeedMult;

  float infallDrift = fract((uTime * 0.04 * aSpeedMult) / 10.0) * 1.2;
  float dynamicR = max(1.8, rEff - infallDrift);

  float currentAngle = aAngle - uTime * omega;

  float y = aHeight + sin(currentAngle * 2.0 + aAngle * 3.0) * 0.035 * dynamicR;
  vec3 worldPos = vec3(dynamicR * cos(currentAngle), y, dynamicR * sin(currentAngle));

  vec3 velDir = normalize(vec3(-sin(currentAngle), 0.0, cos(currentAngle)));
  vec3 toCam = normalize(uCameraPos - worldPos);
  float vLos = dot(velDir, toCam);

  vec3 col = aColor;
  if (vLos > 0.0) {
    col = mix(col, vec3(1.0, 0.98, 0.92), clamp(vLos * 0.65, 0.0, 0.85));
    col *= (1.0 + vLos * 0.85);
  } else {
    col = mix(col, vec3(0.65, 0.12, 0.02), clamp(-vLos * 0.6, 0.0, 0.85));
    col *= max(0.32, 1.0 + vLos * 0.45);
  }

  float camDist = length(uCameraPos);
  vec3 camDir = -uCameraPos / camDist;
  vec3 camToP = worldPos - uCameraPos;
  float proj = dot(camToP, camDir);

  float shadowOcclusion = 1.0;
  if (proj > camDist) {
    float perp = length(camToP - proj * camDir);
    shadowOcclusion = smoothstep(1.2, 2.6, perp);

    if (perp < 3.8 && perp > 0.1) {
      vec3 perpDir = normalize(camToP - proj * camDir);
      float bendFactor = (3.8 - perp) * 0.22;
      worldPos += perpDir * bendFactor;
    }
  }

  float twinkle = 0.72 + 0.28 * sin(uTime * 4.5 + aAngle * 19.0 + aRadius * 2.0);
  vColor = col * uBrightness;
  vAlpha = uIgnition * shadowOcclusion * twinkle;

  vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  gl_PointSize = (aSize * (450.0 / -mvPosition.z)) * uIgnition;
  gl_PointSize = clamp(gl_PointSize, 1.5, 36.0);
}
`;

const DUST_FRAGMENT_SHADER = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float glow = exp(-dist * dist * 14.0);
  float core = exp(-dist * 28.0) * 1.8;
  float crossGlint = max(0.0, 1.0 - abs(coord.x) * 16.0) * max(0.0, 1.0 - abs(coord.y) * 4.0) +
                     max(0.0, 1.0 - abs(coord.y) * 16.0) * max(0.0, 1.0 - abs(coord.x) * 4.0);

  vec3 rgb = vColor * glow + vec3(1.0, 0.96, 0.9) * (core + crossGlint * 0.4);
  gl_FragColor = vec4(rgb, vAlpha * (glow + crossGlint * 0.2));
}
`;

// =============================================================================
// RELATIVISTIC POLAR SYNCHROTRON JETS SHADER
// =============================================================================
const JET_VERTEX_SHADER = /* glsl */ `
attribute float aDistance;
attribute float aAngle;
attribute float aSpeed;
attribute float aRadiusOffset;
attribute float aPolarSign; // +1.0 for North jet, -1.0 for South jet

uniform float uTime;
uniform float uIgnition;
uniform float uJetIntensity;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Particles accelerate outward along the rotational axis (+Y / -Y)
  float progress = fract(aDistance + uTime * aSpeed * 0.45);
  float yDist = 1.2 + progress * 24.0;
  float y = yDist * aPolarSign;

  // Helical magnetic twist with relativistic conical collimation
  float coneRadius = 0.12 * pow(yDist, 0.65) + aRadiusOffset;
  float twist = yDist * 0.85 + aAngle + uTime * 2.2 * aPolarSign;
  float x = coneRadius * cos(twist);
  float z = coneRadius * sin(twist);

  vec3 worldPos = vec3(x, y, z);

  // Internal relativistic shock diamond brightening at characteristic nodes
  float shockNode1 = exp(-pow(yDist - 3.8, 2.0) * 0.8) * 1.6;
  float shockNode2 = exp(-pow(yDist - 8.2, 2.0) * 0.5) * 1.3;
  float shockNode3 = exp(-pow(yDist - 14.5, 2.0) * 0.3) * 1.1;
  float shockBoost = 1.0 + shockNode1 + shockNode2 + shockNode3;

  // Synchrotron spectrum: ultra-hot electric cyan core, transitioning to violet
  vec3 coreColor = vec3(0.35, 0.85, 1.0);
  vec3 edgeColor = vec3(0.65, 0.25, 0.98);
  vColor = mix(coreColor, edgeColor, clamp(aRadiusOffset * 2.5, 0.0, 1.0)) * shockBoost * uJetIntensity;

  // Falloff towards jet tip
  float taper = smoothstep(0.0, 0.1, progress) * smoothstep(1.0, 0.7, progress);
  vAlpha = taper * uIgnition * (0.45 + shockBoost * 0.35);

  vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  gl_PointSize = (18.0 / -mvPosition.z) * shockBoost * (1.2 + aRadiusOffset * 4.0);
  gl_PointSize = clamp(gl_PointSize, 2.0, 32.0);
}
`;

const JET_FRAGMENT_SHADER = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float glow = exp(-dist * dist * 12.0);
  float core = exp(-dist * 24.0) * 1.5;
  vec3 rgb = vColor * (glow + core);
  gl_FragColor = vec4(rgb, vAlpha * glow);
}
`;

// =============================================================================
// INTERFACES & EXPORT TYPES
// =============================================================================
export interface ProbeData {
  impactParameter: number; // b in Rs
  estimatedRadius: number; // r in Rs
  orbitalVelocityFraction: number; // v/c
  timeDilationRatio: number; // 1 / sqrt(1 - 1/r)
  temperatureKelvin: number; // K
  redshift: number;
  region: 'singularity' | 'photon_sphere' | 'isco' | 'accretion_disk' | 'outer_halo' | 'deep_space';
  screenX: number;
  screenY: number;
}

export interface ActiveProbeTelemetry {
  radiusRs: number;
  radiusKm: number;
  velocityFraction: number; // v/c
  earthTimeSeconds: number;
  properTimeSeconds: number;
  timeDilationRatio: number;
  redshift: number;
  gForceEarth: number;
  status: 'orbiting' | 'plunging' | 'frozen_at_horizon' | 'escaped';
  x: number;
  y: number;
  z: number;
}

export interface CaliperData {
  screenA: { x: number; y: number };
  screenB: { x: number; y: number };
  distanceRs: number;
  distanceKm: number;
  distanceAU: number;
  lightTravelTimeSeconds: number;
  deflectionArcsec: number;
}

export interface BlackHoleSettings {
  lensingStrength: number;
  diskBrightness: number;
  dopplerStrength: number;
  rotationSpeed: number;
  diskInner: number;
  diskOuter: number;
  fov: number;
  reducedMotion: boolean;
  dustParticleCount?: number;
  dustOrbitSpeed?: number;
  dustBrightness?: number;
  qualityMode?: 'ultra' | 'high' | 'saver';
  colorTheme?: 'gargantua' | 'sgra' | 'm87' | 'cygnus';
  showJets?: boolean;
  jetIntensity?: number;
}

export const DEFAULT_BLACK_HOLE_SETTINGS: BlackHoleSettings = {
  lensingStrength: 1.5,
  diskBrightness: 2.8,
  dopplerStrength: 1.3,
  rotationSpeed: 0.6,
  diskInner: 2.2,
  diskOuter: 7.2,
  fov: 0.95,
  reducedMotion: false,
  dustParticleCount: 4800,
  dustOrbitSpeed: 1.0,
  dustBrightness: 1.4,
  qualityMode: 'ultra',
  colorTheme: 'gargantua',
  showJets: false,
  jetIntensity: 1.2,
};

export type CameraPreset = 'oblique' | 'equatorial' | 'polar' | 'flyby';

export interface BlackHoleHandle {
  captureScreenshot: () => string;
  zoomToRadius: (r: number) => void;
  setSpherical: (theta: number, phi: number, radius: number) => void;
  getCameraDistance: () => number;
  launchProbe: (orbitType: 'isco' | 'millers' | 'plunge' | 'eccentric', massSolar: number) => void;
  burnProbeThruster: (deltaVFraction: number) => void;
  resetProbe: () => void;
}

interface GargantuaProps {
  settings?: Partial<BlackHoleSettings>;
  cameraPreset?: CameraPreset;
  autoOrbit?: boolean;
  probeActive?: boolean;
  caliperActive?: boolean;
  selectedMassSolar?: number;
  onProbeUpdate?: (data: ProbeData | null) => void;
  onActiveProbeUpdate?: (telemetry: ActiveProbeTelemetry | null) => void;
  onCaliperUpdate?: (caliper: CaliperData | null) => void;
  onFpsUpdate?: (fps: number) => void;
  onReady?: () => void;
  onIgnited?: () => void;
}

export const GargantuaBlackHole = forwardRef<BlackHoleHandle, GargantuaProps>(({
  settings,
  cameraPreset = 'oblique',
  autoOrbit = true,
  probeActive = false,
  caliperActive = false,
  selectedMassSolar = 100000000,
  onProbeUpdate,
  onActiveProbeUpdate,
  onCaliperUpdate,
  onFpsUpdate,
  onReady,
  onIgnited,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const orthoCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const dustSceneRef = useRef<THREE.Scene | null>(null);
  const perspectiveCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const dustMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const jetMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const jetMeshRef = useRef<THREE.Points | null>(null);

  // Active Relativistic Probe 3D objects
  const probeMeshRef = useRef<THREE.Mesh | null>(null);
  const probeTrailLineRef = useRef<THREE.Line | null>(null);
  const probeTrailPointsRef = useRef<THREE.Vector3[]>([]);

  // Active Probe Dynamics State
  const probeSimStateRef = useRef<{
    active: boolean;
    r: number;
    phi: number;
    vr: number; // dr/dtau in c
    L: number;  // Specific angular momentum L = r^2 dphi/dtau
    earthTime: number;
    properTime: number;
    status: 'orbiting' | 'plunging' | 'frozen_at_horizon' | 'escaped';
    massSolar: number;
    hasChirped: boolean;
  }>({
    active: false,
    r: 3.0,
    phi: 0.0,
    vr: 0.0,
    L: Math.sqrt(3.0 * 0.5),
    earthTime: 0.0,
    properTime: 0.0,
    status: 'orbiting',
    massSolar: selectedMassSolar,
    hasChirped: false,
  });

  // Caliper Points
  const caliperPointsRef = useRef<{ p1: { x: number; y: number } | null; p2: { x: number; y: number } | null }>({
    p1: null,
    p2: null,
  });

  const flybyActiveRef = useRef<boolean>(false);
  const flybyProgressRef = useRef<number>(0);

  const cameraRef = useRef<{
    pos: THREE.Vector3;
    target: THREE.Vector3;
    up: THREE.Vector3;
    spherical: { radius: number; theta: number; phi: number };
    targetSpherical: { radius: number; theta: number; phi: number };
  }>({
    pos: new THREE.Vector3(0, 2.2, 10.5),
    target: new THREE.Vector3(0, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
    spherical: { radius: 15.5, theta: 0.22, phi: 1.38 },
    targetSpherical: { radius: 15.5, theta: 0.22, phi: 1.38 },
  });

  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const mouseNormRef = useRef({ x: 0, y: 0 });
  const autoOrbitRef = useRef(autoOrbit);
  autoOrbitRef.current = autoOrbit;

  const probeActiveRef = useRef(probeActive);
  probeActiveRef.current = probeActive;

  const caliperActiveRef = useRef(caliperActive);
  caliperActiveRef.current = caliperActive;

  const selectedMassSolarRef = useRef(selectedMassSolar);
  selectedMassSolarRef.current = selectedMassSolar;

  const onProbeUpdateRef = useRef(onProbeUpdate);
  onProbeUpdateRef.current = onProbeUpdate;

  const onActiveProbeUpdateRef = useRef(onActiveProbeUpdate);
  onActiveProbeUpdateRef.current = onActiveProbeUpdate;

  const onCaliperUpdateRef = useRef(onCaliperUpdate);
  onCaliperUpdateRef.current = onCaliperUpdate;

  const onFpsUpdateRef = useRef(onFpsUpdate);
  onFpsUpdateRef.current = onFpsUpdate;

  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const onIgnitedRef = useRef(onIgnited);
  onIgnitedRef.current = onIgnited;

  // Imperative handle for screenshots, probe missions, & controls
  useImperativeHandle(ref, () => ({
    captureScreenshot: () => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const orthoCam = orthoCameraRef.current;
      const dustScene = dustSceneRef.current;
      const perspCam = perspectiveCameraRef.current;
      if (!renderer || !scene || !orthoCam || !dustScene || !perspCam) return '';

      renderer.clear();
      renderer.render(scene, orthoCam);
      renderer.render(dustScene, perspCam);
      return renderer.domElement.toDataURL('image/png');
    },
    zoomToRadius: (r: number) => {
      cameraRef.current.targetSpherical.radius = r;
    },
    setSpherical: (theta: number, phi: number, radius: number) => {
      cameraRef.current.targetSpherical.theta = theta;
      cameraRef.current.targetSpherical.phi = phi;
      cameraRef.current.targetSpherical.radius = radius;
    },
    getCameraDistance: () => cameraRef.current.spherical.radius,

    // Launch Relativistic Test Probe
    launchProbe: (orbitType: 'isco' | 'millers' | 'plunge' | 'eccentric', massSolar: number) => {
      cosmicAudio.playSonarPing(1100);
      probeTrailPointsRef.current = [];

      let r0 = 3.0;
      let vr0 = 0.0;
      let L0 = Math.sqrt(3.0 * 0.5); // Circular orbit at r = 3 Rs

      if (orbitType === 'millers') {
        r0 = 1.002;
        vr0 = 0.0;
        L0 = Math.sqrt(r0 * 0.5);
      } else if (orbitType === 'plunge') {
        r0 = 5.5;
        vr0 = -0.32; // Inward radial plunge
        L0 = 0.72;
      } else if (orbitType === 'eccentric') {
        r0 = 6.2;
        vr0 = 0.0;
        L0 = 1.45; // Relativistic precessing rosette
      }

      probeSimStateRef.current = {
        active: true,
        r: r0,
        phi: 0.0,
        vr: vr0,
        L: L0,
        earthTime: 0.0,
        properTime: 0.0,
        status: 'orbiting',
        massSolar: massSolar || selectedMassSolar,
        hasChirped: false,
      };

      if (probeMeshRef.current) {
        probeMeshRef.current.visible = true;
      }
      if (probeTrailLineRef.current) {
        probeTrailLineRef.current.visible = true;
      }
    },

    burnProbeThruster: (deltaV: number) => {
      const p = probeSimStateRef.current;
      if (!p.active || p.status === 'frozen_at_horizon') return;
      p.L += deltaV * p.r;
      p.vr += deltaV * 0.25;
      cosmicAudio.playSonarPing(1400);
    },

    resetProbe: () => {
      probeSimStateRef.current.active = false;
      if (probeMeshRef.current) probeMeshRef.current.visible = false;
      if (probeTrailLineRef.current) probeTrailLineRef.current.visible = false;
      probeTrailPointsRef.current = [];
      if (onActiveProbeUpdate) onActiveProbeUpdate(null);
    }
  }));

  // Preset camera angles
  const applyPreset = useCallback((preset: CameraPreset) => {
    const c = cameraRef.current;
    if (preset === 'flyby') {
      flybyActiveRef.current = true;
      flybyProgressRef.current = 0;
    } else {
      flybyActiveRef.current = false;
      if (preset === 'oblique') {
        c.targetSpherical.theta = 0.22;
        c.targetSpherical.phi = 1.38;
        c.targetSpherical.radius = 15.5;
      } else if (preset === 'equatorial') {
        c.targetSpherical.theta = 0.0;
        c.targetSpherical.phi = 1.52;
        c.targetSpherical.radius = 16.0;
      } else if (preset === 'polar') {
        c.targetSpherical.theta = 0.0;
        c.targetSpherical.phi = 0.36;
        c.targetSpherical.radius = 16.5;
      }
    }
  }, []);

  useEffect(() => {
    applyPreset(cameraPreset);
  }, [cameraPreset, applyPreset]);

  // Update uniforms in real-time when settings change without re-creating WebGL renderer
  useEffect(() => {
    if (materialRef.current) {
      const u = materialRef.current.uniforms;
      if (settings?.lensingStrength !== undefined) u.uLensingStrength.value = settings.lensingStrength;
      if (settings?.diskBrightness !== undefined) u.uDiskBrightness.value = settings.diskBrightness;
      if (settings?.dopplerStrength !== undefined) u.uDopplerStrength.value = settings.dopplerStrength;
      if (settings?.rotationSpeed !== undefined) u.uRotationSpeed.value = settings.rotationSpeed;
      if (settings?.diskInner !== undefined) u.uDiskInner.value = settings.diskInner;
      if (settings?.diskOuter !== undefined) u.uDiskOuter.value = settings.diskOuter;
      if (settings?.fov !== undefined) u.uFov.value = settings.fov;
      if (settings?.reducedMotion !== undefined) u.uReducedMotion.value = settings.reducedMotion ? 1.0 : 0.0;

      // Color Theme
      if (settings?.colorTheme) {
        const themeMap: Record<string, number> = {
          gargantua: 0,
          sgra: 1,
          m87: 2,
          cygnus: 3,
        };
        u.uColorTheme.value = themeMap[settings.colorTheme] ?? 0;
      }
    }

    if (dustMaterialRef.current) {
      const du = dustMaterialRef.current.uniforms;
      const rot = (settings?.rotationSpeed ?? DEFAULT_BLACK_HOLE_SETTINGS.rotationSpeed) * 
                  (settings?.dustOrbitSpeed ?? DEFAULT_BLACK_HOLE_SETTINGS.dustOrbitSpeed ?? 1.0);
      du.uRotationSpeed.value = rot;
      if (settings?.dustBrightness !== undefined) {
        du.uBrightness.value = settings.dustBrightness;
      }
    }

    if (jetMaterialRef.current) {
      jetMaterialRef.current.uniforms.uJetIntensity.value = settings?.jetIntensity ?? 1.2;
    }
    if (jetMeshRef.current) {
      jetMeshRef.current.visible = !!settings?.showJets;
    }
  }, [settings]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const maxPixelRatio = isMobile ? 1.5 : 2.0;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.autoClear = false;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new THREE.Scene();
    orthoCameraRef.current = orthoCamera;
    sceneRef.current = scene;

    const mergedSettings = { ...DEFAULT_BLACK_HOLE_SETTINGS, ...settings };

    const themeMap: Record<string, number> = {
      gargantua: 0,
      sgra: 1,
      m87: 2,
      cygnus: 3,
    };

    const uniforms = {
      uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      uTime: { value: 0.0 },
      uCameraPos: { value: new THREE.Vector3() },
      uCameraTarget: { value: new THREE.Vector3(0, 0, 0) },
      uCameraUp: { value: new THREE.Vector3(0, 1, 0) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uFov: { value: mergedSettings.fov },
      uLensingStrength: { value: mergedSettings.lensingStrength },
      uDiskBrightness: { value: mergedSettings.diskBrightness },
      uDopplerStrength: { value: mergedSettings.dopplerStrength },
      uRotationSpeed: { value: mergedSettings.rotationSpeed },
      uDiskInner: { value: mergedSettings.diskInner },
      uDiskOuter: { value: mergedSettings.diskOuter },
      uIgnition: { value: 0.0 },
      uReducedMotion: { value: mergedSettings.reducedMotion ? 1.0 : 0.0 },
      uOffset: { value: new THREE.Vector2(0, 0) },
  uZoom: { value: 1.0 },

      uColorTheme: { value: themeMap[mergedSettings.colorTheme || 'gargantua'] ?? 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });
    materialRef.current = material;

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    // 4. 3D Perspective Scene for Dust Particles, Relativistic Jets & Scientific Probes
    const dustScene = new THREE.Scene();
    dustSceneRef.current = dustScene;

    const verticalFov = 2 * Math.atan(0.5 / mergedSettings.fov) * (180 / Math.PI);
    const perspectiveCamera = new THREE.PerspectiveCamera(
      verticalFov,
      container.clientWidth / container.clientHeight,
      0.1,
      100.0
    );
    perspectiveCameraRef.current = perspectiveCamera;

    // 5. Relativistic Polar Jets System (along +/- Y axes)
    const jetCount = 1400;
    const jetGeometry = new THREE.BufferGeometry();
    const jetDistance = new Float32Array(jetCount);
    const jetAngle = new Float32Array(jetCount);
    const jetSpeed = new Float32Array(jetCount);
    const jetRadiusOffset = new Float32Array(jetCount);
    const jetPolarSign = new Float32Array(jetCount);
    const jetPos = new Float32Array(jetCount * 3);

    for (let j = 0; j < jetCount; j++) {
      jetDistance[j] = Math.random();
      jetAngle[j] = Math.random() * Math.PI * 2;
      jetSpeed[j] = 0.8 + Math.random() * 0.8;
      jetRadiusOffset[j] = Math.pow(Math.random(), 2.0) * 0.45;
      jetPolarSign[j] = j % 2 === 0 ? 1.0 : -1.0;
      jetPos[j * 3] = 0;
      jetPos[j * 3 + 1] = 0;
      jetPos[j * 3 + 2] = 0;
    }

    jetGeometry.setAttribute('position', new THREE.BufferAttribute(jetPos, 3));
    jetGeometry.setAttribute('aDistance', new THREE.BufferAttribute(jetDistance, 1));
    jetGeometry.setAttribute('aAngle', new THREE.BufferAttribute(jetAngle, 1));
    jetGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(jetSpeed, 1));
    jetGeometry.setAttribute('aRadiusOffset', new THREE.BufferAttribute(jetRadiusOffset, 1));
    jetGeometry.setAttribute('aPolarSign', new THREE.BufferAttribute(jetPolarSign, 1));

    const jetUniforms = {
      uTime: { value: 0.0 },
      uIgnition: { value: 0.0 },
      uJetIntensity: { value: mergedSettings.jetIntensity ?? 1.2 },
    };

    const jetMaterial = new THREE.ShaderMaterial({
      vertexShader: JET_VERTEX_SHADER,
      fragmentShader: JET_FRAGMENT_SHADER,
      uniforms: jetUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    jetMaterialRef.current = jetMaterial;

    const jetPoints = new THREE.Points(jetGeometry, jetMaterial);
    jetPoints.visible = !!mergedSettings.showJets;
    jetMeshRef.current = jetPoints;
    dustScene.add(jetPoints);

    // 6. Active Test Probe 3D Mesh and Orbital Trail
    const probeGroup = new THREE.Group();
    const probeBodyGeom = new THREE.OctahedronGeometry(0.12, 1);
    const probeBodyMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
    });
    const probeCoreGeom = new THREE.SphereGeometry(0.06, 8, 8);
    const probeCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const probeBody = new THREE.Mesh(probeBodyGeom, probeBodyMat);
    const probeCore = new THREE.Mesh(probeCoreGeom, probeCoreMat);
    probeGroup.add(probeBody);
    probeGroup.add(probeCore);
    probeGroup.visible = false;
    probeMeshRef.current = probeGroup as unknown as THREE.Mesh;
    dustScene.add(probeGroup);

    // Trajectory Line
    const trailMaxPoints = 200;
    const trailPositions = new Float32Array(trailMaxPoints * 3);
    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMaterial = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.85,
    });
    const trailLine = new THREE.Line(trailGeometry, trailMaterial);
    trailLine.visible = false;
    probeTrailLineRef.current = trailLine;
    dustScene.add(trailLine);

    // 7. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      uniforms.uResolution.value.set(width, height);
      perspectiveCamera.aspect = width / height;
      perspectiveCamera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // 8. Interactive Mouse & Drag Controls + Probe / Caliper calculation
    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest('button, input, select, a, aside, .settings-drawer, .probe-hud, .modal-panel')) return;

      // Handle Caliper Clicks
      if (caliperActiveRef.current) {
        cosmicAudio.playSonarPing(980);
        if (!caliperPointsRef.current.p1 || caliperPointsRef.current.p2) {
          caliperPointsRef.current.p1 = { x: e.clientX, y: e.clientY };
          caliperPointsRef.current.p2 = null;
          if (onCaliperUpdateRef.current) onCaliperUpdateRef.current(null);
        } else {
          caliperPointsRef.current.p2 = { x: e.clientX, y: e.clientY };
          const p1 = caliperPointsRef.current.p1;
          const p2 = caliperPointsRef.current.p2;

          const dxPx = p2.x - p1.x;
          const dyPx = p2.y - p1.y;
          const screenPixelDist = Math.sqrt(dxPx * dxPx + dyPx * dyPx);

          const camDist = cameraRef.current.spherical.radius;
          const currentFov = mergedSettings.fov;
          const distRs = screenPixelDist * (camDist / (window.innerHeight * currentFov * 1.8));

          // Physical conversions based on selected mass
          const M_kg = selectedMassSolarRef.current * 1.9885e30;
          const G = 6.6743e-11;
          const c = 299792458;
          const Rs_meters = (2 * G * M_kg) / (c * c);
          const Rs_km = Rs_meters / 1000;
          const distKm = distRs * Rs_km;
          const distAU = distKm / 1.496e8;
          const lightSec = (distKm * 1000) / c;
          const deflArcsec = (4 * G * M_kg / (c * c * Math.max(1000, distKm * 1000))) * (180 / Math.PI) * 3600;

          if (onCaliperUpdateRef.current) {
            onCaliperUpdateRef.current({
              screenA: p1,
              screenB: p2,
              distanceRs: distRs,
              distanceKm: distKm,
              distanceAU: distAU,
              lightTravelTimeSeconds: lightSec,
              deflectionArcsec: deflArcsec,
            });
          }
        }
        return;
      }

      isDraggingRef.current = true;
      flybyActiveRef.current = false;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2.0;
      const normY = -(e.clientY / window.innerHeight - 0.5) * 2.0 * (window.innerHeight / window.innerWidth);
      mouseNormRef.current = { x: normX, y: normY };
      uniforms.uMouse.value.set(normX, normY);

      if (probeActiveRef.current && onProbeUpdateRef.current) {
        const screenDist = Math.sqrt(normX * normX + normY * normY);
        const camDist = cameraRef.current.spherical.radius;
        const currentFov = mergedSettings.fov;

        const b = screenDist * (camDist / (currentFov * 2.0));

        let region: ProbeData['region'] = 'deep_space';
        let estRadius = Math.max(1.0, b * 0.9);
        let velFrac = 0.0;
        let timeDilation = 1.0;
        let tempK = 2.7;
        let z = 0.0;

        if (b < 2.58) {
          region = 'singularity';
          estRadius = 1.0;
          timeDilation = Infinity;
          velFrac = 1.0;
          tempK = 1e8;
          z = Infinity;
        } else if (b < 2.95) {
          region = 'photon_sphere';
          estRadius = 1.5;
          timeDilation = 1.732;
          velFrac = 0.577;
          tempK = 4.8e7;
          z = 0.732;
        } else if (b < 3.8) {
          region = 'isco';
          estRadius = 2.2;
          timeDilation = 1.348;
          velFrac = 0.476;
          tempK = 2.4e7;
          z = 0.348;
        } else if (b < 8.5) {
          region = 'accretion_disk';
          estRadius = Math.max(2.2, b * 0.85);
          timeDilation = 1.0 / Math.sqrt(Math.max(0.01, 1.0 - 1.0 / estRadius));
          velFrac = Math.sqrt(1.0 / (2.0 * estRadius));
          tempK = 1.2e7 * Math.pow(2.2 / estRadius, 0.75);
          z = timeDilation - 1.0;
        } else if (b < 15.0) {
          region = 'outer_halo';
          estRadius = b * 0.95;
          timeDilation = 1.0 / Math.sqrt(Math.max(0.01, 1.0 - 1.0 / estRadius));
          velFrac = Math.sqrt(1.0 / (2.0 * estRadius));
          tempK = 3.5e5 * Math.pow(8.0 / estRadius, 0.75);
          z = timeDilation - 1.0;
        }

        onProbeUpdateRef.current({
          impactParameter: b,
          estimatedRadius: estRadius,
          orbitalVelocityFraction: velFrac,
          timeDilationRatio: timeDilation,
          temperatureKelvin: tempK,
          redshift: z,
          region,
          screenX: e.clientX,
          screenY: e.clientY,
        });
      }

      if (isDraggingRef.current) {
        const dx = e.clientX - prevMouseRef.current.x;
        const dy = e.clientY - prevMouseRef.current.y;
        prevMouseRef.current = { x: e.clientX, y: e.clientY };

        cameraRef.current.targetSpherical.theta -= dx * 0.005;
        cameraRef.current.targetSpherical.phi = Math.max(
          0.30,
          Math.min(Math.PI - 0.30, cameraRef.current.targetSpherical.phi + dy * 0.005)
        );
      } else {
        cameraRef.current.targetSpherical.theta += normX * 0.0004;
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement)?.closest('button, input, select, a, aside, .settings-drawer, .probe-hud, .modal-panel')) return;
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        flybyActiveRef.current = false;
        prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && e.touches.length === 1) {
        const dx = e.touches[0].clientX - prevMouseRef.current.x;
        const dy = e.touches[0].clientY - prevMouseRef.current.y;
        prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        cameraRef.current.targetSpherical.theta -= dx * 0.006;
        cameraRef.current.targetSpherical.phi = Math.max(
          0.30,
          Math.min(Math.PI - 0.30, cameraRef.current.targetSpherical.phi + dy * 0.006)
        );
      }
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

  const scrollState = { target: 0, current: 0 };
  
  const handleWheel = (e: WheelEvent) => {
  if ((e.target as HTMLElement)?.closest('.settings-drawer, .modal-panel')) return;
  scrollState.target = Math.max(-1, Math.min(1, scrollState.target + e.deltaY * 0.0012));
  };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('wheel', handleWheel, { passive: true });

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotion = (e: MediaQueryListEvent | MediaQueryList) => {
      uniforms.uReducedMotion.value = e.matches ? 1.0 : 0.0;
    };
    handleReducedMotion(mediaQuery);
    mediaQuery.addEventListener('change', handleReducedMotion);

    // 9. Render Loop with Relativistic Probe Integration
    let clock = new THREE.Clock();
    let animationId: number;
    let ignitionProgress = 0.0;
    let hasNotifiedIgnited = false;
    let frameCount = 0;
    let lastFpsTime = performance.now();

    const render = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // FPS tracking
      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 500) {
        const currentFps = Math.round((frameCount * 1000) / (now - lastFpsTime));
        if (onFpsUpdateRef.current) onFpsUpdateRef.current(currentFps);
        frameCount = 0;
        lastFpsTime = now;
      }

      // Smooth ignition
      if (ignitionProgress < 1.0) {
        ignitionProgress = Math.min(1.0, ignitionProgress + delta * 0.65);
        const ignVal = Math.sin(ignitionProgress * Math.PI * 0.5);
        uniforms.uIgnition.value = ignVal;
        jetUniforms.uIgnition.value = ignVal;
        if (ignitionProgress >= 0.6 && !hasNotifiedIgnited) {
          hasNotifiedIgnited = true;
          if (onIgnitedRef.current) onIgnitedRef.current();
        }
      }

      // Active Relativistic Probe Geodesic Simulation
      const p = probeSimStateRef.current;
      if (p.active && p.status !== 'frozen_at_horizon') {
        const safeR = Math.max(1.0001, p.r);
        // Time dilation factor gamma = 1 / sqrt(1 - 1/r)
        const timeDilation = 1.0 / Math.sqrt(Math.max(0.0001, 1.0 - 1.0 / safeR));

        // Sub-step numerical integration for high physical precision
        const subSteps = 6;
        const subDtProper = (delta * 0.85) / subSteps;

        for (let s = 0; s < subSteps; s++) {
          if (p.r <= 1.02) {
            p.status = 'frozen_at_horizon';
            if (!p.hasChirped) {
              p.hasChirped = true;
              cosmicAudio.chirpGravitationalWave();
            }
            break;
          }

          // Relativistic radial acceleration d^2r/dtau^2 = -0.5/r^2 + L^2/r^3 - 1.5*L^2/r^4
          const rInv = 1.0 / p.r;
          const rInv2 = rInv * rInv;
          const rInv3 = rInv2 * rInv;
          const rInv4 = rInv3 * rInv;
          const accRadial = -0.5 * rInv2 + (p.L * p.L) * rInv3 - 1.5 * (p.L * p.L) * rInv4;

          p.vr += accRadial * subDtProper;
          p.r += p.vr * subDtProper;

          // Angular advance dphi/dtau = L / r^2
          p.phi += (p.L * rInv2) * subDtProper;

          p.properTime += subDtProper;
          p.earthTime += subDtProper * timeDilation;
        }

        // 3D position in equatorial plane with slight oscillation
        const probeX = p.r * Math.cos(p.phi);
        const probeY = Math.sin(p.phi * 2.0) * 0.04;
        const probeZ = p.r * Math.sin(p.phi);

        if (probeMeshRef.current) {
          probeMeshRef.current.position.set(probeX, probeY, probeZ);
          probeMeshRef.current.rotation.y += delta * 1.5;
          probeMeshRef.current.rotation.x += delta * 0.8;

          // Redshift color shift: Cyan -> Yellow -> Deep Red -> Black
          const meshMat = (probeMeshRef.current.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
          if (p.r > 2.5) {
            meshMat.color.setRGB(0.0, 0.9, 1.0);
          } else if (p.r > 1.5) {
            meshMat.color.setRGB(1.0, 0.85, 0.2);
          } else if (p.r > 1.05) {
            meshMat.color.setRGB(0.9, 0.15, 0.05);
          } else {
            meshMat.color.setRGB(0.1, 0.01, 0.01);
          }
        }

        // Add point to orbital trail
        probeTrailPointsRef.current.push(new THREE.Vector3(probeX, probeY, probeZ));
        if (probeTrailPointsRef.current.length > trailMaxPoints) {
          probeTrailPointsRef.current.shift();
        }

        if (probeTrailLineRef.current) {
          const positions = probeTrailLineRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < probeTrailPointsRef.current.length; i++) {
            const pt = probeTrailPointsRef.current[i];
            positions[i * 3] = pt.x;
            positions[i * 3 + 1] = pt.y;
            positions[i * 3 + 2] = pt.z;
          }
          probeTrailLineRef.current.geometry.setDrawRange(0, probeTrailPointsRef.current.length);
          probeTrailLineRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // Real units telemetry
        const M_kg = p.massSolar * 1.9885e30;
        const G = 6.6743e-11;
        const c = 299792458;
        const Rs_meters = (2 * G * M_kg) / (c * c);
        const radiusKm = (p.r * Rs_meters) / 1000;
        const velFrac = Math.min(1.0, Math.sqrt(p.vr * p.vr + Math.pow(p.L / p.r, 2)));
        const redshift = timeDilation - 1.0;
        const localG = (G * M_kg) / Math.pow(Math.max(1000, radiusKm * 1000), 2) / 9.80665;

        if (onActiveProbeUpdateRef.current) {
          onActiveProbeUpdateRef.current({
            radiusRs: p.r,
            radiusKm,
            velocityFraction: velFrac,
            earthTimeSeconds: p.earthTime,
            properTimeSeconds: p.properTime,
            timeDilationRatio: timeDilation,
            redshift,
            gForceEarth: localG,
            status: p.status,
            x: probeX,
            y: probeY,
            z: probeZ,
          });
        }
      }

      // Flyby & Auto Orbit
      if (flybyActiveRef.current && uniforms.uReducedMotion.value < 0.5) {
        flybyProgressRef.current += delta * 0.08;
        const prog = flybyProgressRef.current;
        cameraRef.current.targetSpherical.theta = prog * 1.5;
        cameraRef.current.targetSpherical.phi = 1.35 + Math.sin(prog * 2.0) * 0.32;
        cameraRef.current.targetSpherical.radius = 12.5 + Math.cos(prog * 1.5) * 3.5;
      } else if (!isDraggingRef.current && autoOrbitRef.current && uniforms.uReducedMotion.value < 0.5) {
        cameraRef.current.targetSpherical.theta += delta * 0.04;
      }

      // Smooth camera spring easing
      const cam = cameraRef.current;
      cam.spherical.radius += (cam.targetSpherical.radius - cam.spherical.radius) * 0.07;
      cam.spherical.theta += (cam.targetSpherical.theta - cam.spherical.theta) * 0.07;
      cam.spherical.phi += (cam.targetSpherical.phi - cam.spherical.phi) * 0.07;

      const r = cam.spherical.radius;
      const th = cam.spherical.theta;
      const ph = cam.spherical.phi;

      cam.pos.set(
        r * Math.sin(ph) * Math.sin(th),
        r * Math.cos(ph),
        r * Math.sin(ph) * Math.cos(th)
      );

      uniforms.uTime.value = elapsedTime;
      uniforms.uCameraPos.value.copy(cam.pos);

      jetUniforms.uTime.value = elapsedTime;

      perspectiveCamera.position.copy(cam.pos);
      perspectiveCamera.lookAt(cam.target);
      perspectiveCamera.up.copy(cam.up);

      const scrollVelocity = scrollState.target - scrollState.current;
      scrollState.current += scrollVelocity * 0.08;
      const s = scrollState.current;
      const offsetX = Math.sin(s * 1.6) * 0.3;
      const offsetY = s * 0.32;
      uniforms.uOffset.value.set(offsetX, offsetY);

      const zoom = 1 + Math.max(s, 0) * 1.1 + Math.max(-s, 0) * 0.35;
      uniforms.uZoom.value = zoom;

      // Shift and scale the 3D overlay (jets, probes) so it stays locked to the singularity
      const viewW = container.clientWidth;
      const viewH = container.clientHeight;
      const subW = viewW / zoom;
      const subH = viewH / zoom;
      perspectiveCamera.setViewOffset(
        viewW,
        viewH,
        (viewW - subW) / 2 - (offsetX * viewH) / zoom,
        (viewH - subH) / 2 + (offsetY * viewH) / zoom,
        subW,
        subH,
      );

      renderer.clear();
      renderer.render(scene, orthoCamera);
      renderer.render(dustScene, perspectiveCamera);

      animationId = requestAnimationFrame(render);
    };

    render();
    if (onReadyRef.current) onReadyRef.current();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleWheel);
      mediaQuery.removeEventListener('change', handleReducedMotion);

      if (container && domElement.parentElement === container) {
        container.removeChild(domElement);
      }
      renderer.dispose();
      material.dispose();
      quad.geometry.dispose();
      jetMaterial.dispose();
      jetGeometry.dispose();
      dustScene.clear();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full select-none overflow-hidden bg-black ${
        caliperActive ? 'cursor-cell' : probeActive ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
      }`}
      style={{ touchAction: 'none' }}
    />
  );
});
