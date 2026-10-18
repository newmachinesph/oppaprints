import convert from "heic-convert";
import sharp from "sharp";

// Normalize any uploaded image to a web-friendly, resized WebP.
// HEIC (iPhone) isn't browser-viewable → decode to JPEG first, then resize.
export async function toWebp(input: Buffer, mime: string): Promise<Buffer> {
  let base: Buffer = input;
  if (/hei[cf]/i.test(mime)) {
    const jpeg = await convert({ buffer: input, format: "JPEG", quality: 0.9 });
    base = Buffer.from(jpeg);
  }
  return sharp(base)
    .rotate() // honor EXIF orientation
    .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

export function isImageMime(mime: string): boolean {
  return /^image\/|hei[cf]/i.test(mime);
}
