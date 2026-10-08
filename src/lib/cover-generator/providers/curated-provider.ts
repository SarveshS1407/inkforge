import { CoverProviderAdapter, CoverGenerationContext, CoverGenerationResult } from "../types";
import { CoverPalette, CoverTypography } from "@/types/book";
import { buildCoverPrompt } from "../prompt-builder";

// Color harmonies keyed by genre & direction
const DIRECTION_PALETTES: Record<
  string,
  { cloth: string; accent: string; foil: string; paperTone: "cotton" | "vellum" | "inkwell"; text: string }[]
> = {
  editorial: [
    { cloth: "#23262b", accent: "#d8a14b", foil: "#dfb76c", paperTone: "cotton", text: "#f8f5ee" }, // Obsidian & Warm Gold
    { cloth: "#3d424b", accent: "#831e26", foil: "#d9a343", paperTone: "cotton", text: "#ffffff" }, // Slate & Oxblood
    { cloth: "#1e2824", accent: "#4e876a", foil: "#d4af37", paperTone: "vellum", text: "#f4f1ea" }, // Deep Forest & Gold
  ],
  cinematic: [
    { cloth: "#14151a", accent: "#99292d", foil: "#f6e3a1", paperTone: "inkwell", text: "#ffffff" }, // Midnight & Crimson
    { cloth: "#192231", accent: "#d97736", foil: "#e6c587", paperTone: "cotton", text: "#f6f8fa" }, // Deep Indigo & Ember
    { cloth: "#2a1b24", accent: "#c45c78", foil: "#f2d399", paperTone: "vellum", text: "#fcf4f7" }, // Plum Chiaroscuro
  ],
  experimental: [
    { cloth: "#202022", accent: "#c94a29", foil: "#ffffff", paperTone: "vellum", text: "#ffffff" }, // Stark Noir & Vermilion
    { cloth: "#1c262b", accent: "#38938a", foil: "#e2b868", paperTone: "cotton", text: "#f0f7f6" }, // Petrol & Sea Glass
    { cloth: "#332d29", accent: "#bf7b3f", foil: "#f4e4b8", paperTone: "cotton", text: "#faf6f0" }, // Raw Umber & Ochre
  ],
  classic: [
    { cloth: "#5a131b", accent: "#dfb76c", foil: "#fae6a6", paperTone: "cotton", text: "#fff8f0" }, // Imperial Oxblood Cloth
    { cloth: "#16281e", accent: "#c5973b", foil: "#ffd700", paperTone: "vellum", text: "#f7f9f6" }, // Library Buckram Green
    { cloth: "#1a1e2d", accent: "#d4af37", foil: "#f7e7b4", paperTone: "cotton", text: "#fbfbfd" }, // Cambridge Blue Cloth
  ],
};

function generateCuratedSvgArtwork(
  title: string,
  genre: string,
  direction: string,
  palette: CoverPalette
): string {
  // Generate a distinct artistic composition based on direction and seed from title
  const hash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const { clothColor, accentColor } = palette;

  if (direction === "editorial") {
    // Minimal geometric Horizon & Solar Sphere
    const sphereRadius = 60 + (hash % 40);
    const lineY = 380 + (hash % 60);

    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%">
      <defs>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${encodeURIComponent(accentColor)}" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="${encodeURIComponent(accentColor)}" stop-opacity="0.1"/>
        </radialGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="600" height="800" fill="${encodeURIComponent(clothColor)}"/>
      <rect width="600" height="800" fill="url(%23grid)"/>
      <circle cx="300" cy="${lineY - 70}" r="${sphereRadius}" fill="url(%23sun)"/>
      <line x1="80" y1="${lineY}" x2="520" y2="${lineY}" stroke="${encodeURIComponent(accentColor)}" stroke-width="1.5" stroke-opacity="0.7"/>
      <circle cx="300" cy="${lineY}" r="4" fill="${encodeURIComponent(accentColor)}"/>
      <line x1="300" y1="${lineY}" x2="300" y2="${lineY + 140}" stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="4,4"/>
    </svg>`;
  }

  if (direction === "cinematic") {
    // Atmospheric Chiaroscuro Mountain & Mist Wave
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${encodeURIComponent(clothColor)}"/>
          <stop offset="70%" stop-color="#090a0d"/>
          <stop offset="100%" stop-color="#020304"/>
        </linearGradient>
        <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${encodeURIComponent(accentColor)}" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="transparent"/>
        </linearGradient>
      </defs>
      <rect width="600" height="800" fill="url(%23sky)"/>
      <ellipse cx="300" cy="520" rx="260" ry="120" fill="url(%23glow)"/>
      <path d="M 0 560 Q 150 480 300 520 T 600 560 L 600 800 L 0 800 Z" fill="rgba(0,0,0,0.6)"/>
      <path d="M 0 620 Q 200 550 400 590 T 600 640 L 600 800 L 0 800 Z" fill="rgba(0,0,0,0.9)"/>
      <circle cx="300" cy="380" r="1.5" fill="#fff" opacity="0.8"/>
      <circle cx="210" cy="340" r="1" fill="#fff" opacity="0.5"/>
      <circle cx="390" cy="320" r="1.2" fill="#fff" opacity="0.6"/>
    </svg>`;
  }

  if (direction === "experimental") {
    // Risograph Abstract Geometric Tension
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%">
      <defs>
        <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="${encodeURIComponent(accentColor)}" opacity="0.25"/>
        </pattern>
      </defs>
      <rect width="600" height="800" fill="${encodeURIComponent(clothColor)}"/>
      <rect x="80" y="320" width="440" height="380" fill="url(%23dots)"/>
      <polygon points="120,420 480,360 420,680 180,620" fill="none" stroke="${encodeURIComponent(accentColor)}" stroke-width="2"/>
      <circle cx="300" cy="500" r="90" fill="${encodeURIComponent(accentColor)}" opacity="0.18"/>
      <line x1="60" y1="280" x2="540" y2="280" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    </svg>`;
  }

  // Classic Literary Framing & Architectural Roundel
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%">
    <rect width="600" height="800" fill="${encodeURIComponent(clothColor)}"/>
    <rect x="40" y="40" width="520" height="720" rx="8" fill="none" stroke="${encodeURIComponent(accentColor)}" stroke-width="2" stroke-opacity="0.6"/>
    <rect x="52" y="52" width="496" height="696" rx="6" fill="none" stroke="${encodeURIComponent(accentColor)}" stroke-width="1" stroke-opacity="0.3"/>
    <circle cx="300" cy="460" r="75" fill="none" stroke="${encodeURIComponent(accentColor)}" stroke-width="1.5" stroke-opacity="0.7"/>
    <circle cx="300" cy="460" r="68" fill="none" stroke="${encodeURIComponent(accentColor)}" stroke-width="0.75" stroke-opacity="0.4" stroke-dasharray="3,3"/>
    <text x="300" y="472" font-family="serif" font-size="34" fill="${encodeURIComponent(accentColor)}" text-anchor="middle" opacity="0.85">❦</text>
  </svg>`;
}

export class CuratedEditorialProvider implements CoverProviderAdapter {
  name = "Curated Editorial Art Engine";

  isAvailable(): boolean {
    return true; // Always available, zero external dependency
  }

  async generate(context: CoverGenerationContext): Promise<CoverGenerationResult> {
    const { title, genre, direction } = context;
    const palettes = DIRECTION_PALETTES[direction] || DIRECTION_PALETTES.editorial;
    const selectedPaletteData = palettes[Math.abs(title.length) % palettes.length];

    const palette: CoverPalette = {
      clothColor: selectedPaletteData.cloth,
      accentColor: selectedPaletteData.accent,
      foilColor: selectedPaletteData.foil,
      paperTone: selectedPaletteData.paperTone,
      textColor: selectedPaletteData.text,
    };

    const typography: CoverTypography = {
      titleFont: direction === "classic" || direction === "editorial" ? "serif" : direction === "experimental" ? "mono" : "sans",
      style: direction === "classic" ? "debossed-gold" : direction === "editorial" ? "blind-embossed" : "modern-clean",
    };

    const imageUrl = generateCuratedSvgArtwork(title, genre, direction, palette);
    const generatedPrompt = buildCoverPrompt(context);

    return {
      imageUrl,
      generatedPrompt,
      palette,
      typography,
      direction,
      providerName: this.name,
      artworkSource: "curated",
    };
  }
}
