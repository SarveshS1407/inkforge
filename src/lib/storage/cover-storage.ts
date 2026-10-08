import fs from "fs/promises";
import path from "path";

export interface StoredAsset {
  url: string;
  filename: string;
  bytes: number;
}

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "covers");

/**
 * Persists an image from either a remote URL or base64 data string to public/uploads/covers/
 * Falls back gracefully to original URL or data URL if filesystem is unwritable.
 */
export async function persistCoverAsset(
  sourceUrlOrBase64: string,
  preferredName?: string
): Promise<string> {
  const filename = `${preferredName || `cover-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`}.png`;

  try {
    // Ensure storage directory exists
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const targetFilePath = path.join(UPLOADS_DIR, filename);

    let buffer: Buffer;

    if (sourceUrlOrBase64.startsWith("data:")) {
      // Base64 data URL
      const base64Data = sourceUrlOrBase64.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    } else if (sourceUrlOrBase64.startsWith("http://") || sourceUrlOrBase64.startsWith("https://")) {
      // Remote image URL (e.g. from OpenAI DALL-E 3 CDN)
      const res = await fetch(sourceUrlOrBase64);
      if (!res.ok) {
        throw new Error(`Failed to download remote asset: ${res.statusText}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // Treat as raw base64
      buffer = Buffer.from(sourceUrlOrBase64, "base64");
    }

    await fs.writeFile(targetFilePath, buffer);
    return `/uploads/covers/${filename}`;
  } catch (err) {
    console.warn("Storage writing fallback triggered, using direct source URL:", err);
    // If running in an environment where public/ is not directly writable, return source as is
    return sourceUrlOrBase64;
  }
}
