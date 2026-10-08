import { CoverPalette, CoverTypography, CoverVersion } from "@/types/book";

export interface EditorialTemplate {
  id: string;
  name: string;
  description: string;
  palette: CoverPalette;
  typography: CoverTypography;
  patternType: "linen" | "buckram" | "vellum" | "oxblood";
}

export const EDITORIAL_TEMPLATES: EditorialTemplate[] = [
  {
    id: "template-oxford-buckram",
    name: "Oxford Navy Buckram",
    description: "Classic deep navy archival library cloth with gilded gold foil framing.",
    palette: {
      clothColor: "#131b2e",
      accentColor: "#d4af37",
      foilColor: "#fae6a6",
      paperTone: "cotton",
      textColor: "#ffffff",
    },
    typography: {
      titleFont: "serif",
      style: "debossed-gold",
    },
    patternType: "buckram",
  },
  {
    id: "template-bordeaux-gilt",
    name: "Bordeaux Heritage Cloth",
    description: "Rich oxblood red woven binding with antique copper and gold leaf lettering.",
    palette: {
      clothColor: "#3d1419",
      accentColor: "#e6c387",
      foilColor: "#fad79b",
      paperTone: "vellum",
      textColor: "#fef8f0",
    },
    typography: {
      titleFont: "serif",
      style: "debossed-gold",
    },
    patternType: "oxblood",
  },
  {
    id: "template-nordic-linen",
    name: "Nordic Slate Linen",
    description: "Understated minimalist charcoal woven linen with silver foil and generous margins.",
    palette: {
      clothColor: "#22252a",
      accentColor: "#c2cad0",
      foilColor: "#e8eff5",
      paperTone: "cotton",
      textColor: "#f1f5f9",
    },
    typography: {
      titleFont: "sans",
      style: "modern-clean",
    },
    patternType: "linen",
  },
  {
    id: "template-vellum-ivory",
    name: "Bookshop Vellum",
    description: "Natural warm ivory parchment finish with blind-debossed framing and dark walnut ink.",
    palette: {
      clothColor: "#ede4d3",
      accentColor: "#8b5e34",
      foilColor: "#422e1b",
      paperTone: "vellum",
      textColor: "#1f1d1a",
    },
    typography: {
      titleFont: "serif",
      style: "blind-embossed",
    },
    patternType: "vellum",
  },
];

export function createTemplateVersion(
  template: EditorialTemplate,
  versionNumber: number
): CoverVersion {
  return {
    id: `cov-template-${template.id}-${Date.now()}`,
    versionNumber,
    directionId: "classic",
    palette: template.palette,
    typography: template.typography,
    artworkSource: "template",
    createdAt: new Date().toISOString(),
    notes: `Bound in ${template.name}`,
    conceptName: template.name,
  };
}
