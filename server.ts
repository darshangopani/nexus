import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production' || fs.existsSync(path.resolve(__dirname, 'dist'));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || 'dummy-key-for-linting-if-not-present',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Gemini API Route
app.post('/api/gemini/generate', async (req: any, res: any) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Graceful fallback to rich static variations if API key is not configured yet
      console.warn("GEMINI_API_KEY not found in environment, triggering smart fallback.");
      return res.json(getFallbackTheme(prompt));
    }

    const systemInstruction = `You are a professional Creative Technologist and Lead UI Designer at an elite digital agency.
Analyze the user's prompt describing a visual mood, atmosphere, brand, or organic feeling.
Generate high-fidelity physics parameters and color schemes to configure a real-time web fluidity simulation (interactive black hole gravitational lens, fluid particles, modern mesh gradient, or organic animated waves).
Choose the rendering mode ('blackhole', 'fluid', 'mesh', or 'wave') that best matches the description.
Ensure colors are highly sophisticated, using curated palettes (avoid amateurish neon combinations unless explicitly requested).
Provide values exactly aligned to the requested schema. Ensure the explanation is single-line, highly editorial, and poetic yet professional.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Generate a fluid theme configuration for: "${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            colors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of 3 to 5 hex colors representing the visual mood."
            },
            viscosity: {
              type: Type.NUMBER,
              description: "Fluid viscosity from 0.01 to 0.99. Low means watery, high means molasses-like."
            },
            density: {
              type: Type.NUMBER,
              description: "Particle density from 0.1 to 10.0."
            },
            gravity: {
              type: Type.NUMBER,
              description: "Gravity from -5.0 to 5.0."
            },
            speed: {
              type: Type.NUMBER,
              description: "Animation speed multiplier from 0.1 to 5.0."
            },
            interactionStrength: {
              type: Type.NUMBER,
              description: "How strongly the mouse cursor pushes/pulls the fluid from 1.0 to 10.0."
            },
            fluidMode: {
              type: Type.STRING,
              description: "The rendering style: 'blackhole', 'fluid', 'mesh', or 'wave'."
            },
            explanation: {
              type: Type.STRING,
              description: "A single-sentence elegant explanation of the selected palette and parameters."
            }
          },
          required: ["colors", "viscosity", "density", "gravity", "speed", "interactionStrength", "fluidMode", "explanation"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini API");
    }

    const parsedData = JSON.parse(text.trim());
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error generating fluid theme:', error);
    // If API fails or rate limited, fallback gracefully to a theme matching keywords
    return res.json(getFallbackTheme(req.body.prompt || ''));
  }
});

// Fallback algorithm matching keyword moods to high-fidelity design palettes
function getFallbackTheme(prompt: string) {
  const p = prompt.toLowerCase();
  
  if (p.includes('hole') || p.includes('space') || p.includes('cosmic') || p.includes('blackhole') || p.includes('gravity') || p.includes('star') || p.includes('quasar') || p.includes('nebula')) {
    return {
      colors: ["#f97316", "#ea580c", "#dc2626", "#818cf8", "#3b82f6", "#ffffff"],
      viscosity: 0.65,
      density: 1.8,
      gravity: 1.4,
      speed: 1.1,
      interactionStrength: 6.5,
      fluidMode: "blackhole",
      explanation: "A supermassive singularity warping space-time coordinates. Molten orange plasma flows in lensed Keplerian rings while twin polar gamma-ray bursts emit cosmic energy."
    };
  }
  
  if (p.includes('dark') || p.includes('noir') || p.includes('cyber') || p.includes('night')) {
    return {
      colors: ["#020617", "#1e1b4b", "#311042", "#0f172a", "#3b82f6"],
      viscosity: 0.15,
      density: 1.2,
      gravity: -0.2,
      speed: 1.5,
      interactionStrength: 5.0,
      fluidMode: "fluid",
      explanation: "A shadowy digital neon current blending deep slate, midnight purple, and intense cobalt for a sleek cyberpunk night sky."
    };
  } else if (p.includes('sunset') || p.includes('warm') || p.includes('gold') || p.includes('fire') || p.includes('orange')) {
    return {
      colors: ["#7c2d12", "#9a3412", "#ea580c", "#f97316", "#facc15"],
      viscosity: 0.35,
      density: 2.5,
      gravity: -0.5,
      speed: 1.0,
      interactionStrength: 4.5,
      fluidMode: "mesh",
      explanation: "A rich, slow-flowing caldera sunset mixing scorched amber, burning gold, and terracotta tones to create natural heat radiates."
    };
  } else if (p.includes('sea') || p.includes('ocean') || p.includes('water') || p.includes('blue') || p.includes('ice')) {
    return {
      colors: ["#0c4a6e", "#0369a1", "#0284c7", "#38bdf8", "#e0f2fe"],
      viscosity: 0.1,
      density: 1.0,
      gravity: 0.4,
      speed: 1.8,
      interactionStrength: 7.0,
      fluidMode: "fluid",
      explanation: "Crisp, dynamic glacial depths capturing arctic sky blue, turquoise undertones, and frothy sea-spray crests."
    };
  } else if (p.includes('forest') || p.includes('nature') || p.includes('green') || p.includes('emerald') || p.includes('moss')) {
    return {
      colors: ["#14532d", "#166534", "#15803d", "#22c55e", "#86efac"],
      viscosity: 0.5,
      density: 3.0,
      gravity: 0.1,
      speed: 0.8,
      interactionStrength: 3.5,
      fluidMode: "wave",
      explanation: "A layering of deep mossy shadows, emerald canopies, and gentle mint wind waves breathing life into an organic woodland."
    };
  } else if (p.includes('minimal') || p.includes('light') || p.includes('white') || p.includes('silver') || p.includes('neutral')) {
    return {
      colors: ["#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8"],
      viscosity: 0.65,
      density: 4.0,
      gravity: 0.0,
      speed: 0.5,
      interactionStrength: 2.0,
      fluidMode: "mesh",
      explanation: "An ethereal and pristine silk mist utilizing cool slate highlights and soft neutral bone tones for surgical minimalism."
    };
  }
  
  // Default stunning cosmic theme
  return {
    colors: ["#1e1b4b", "#4c1d95", "#2563eb", "#db2777", "#f43f5e"],
    viscosity: 0.25,
    density: 1.5,
    gravity: -0.1,
    speed: 1.2,
    interactionStrength: 5.5,
    fluidMode: "fluid",
    explanation: "A majestic, swirling aurora borealis blending cosmic indigo, royal violet, electric hot pink, and starburst magenta."
  };
}

// Vite Middleware Integration or Static Assets
if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);
  
  app.use('*', async (req: any, res: any, next: any) => {
    const url = req.originalUrl;
    try {
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  // Production static files serving
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req: any, res: any) => {
    res.sendFile(path.resolve(__dirname, 'dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
