import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="75%">
      <stop offset="0%" stop-color="#131c33"/>
      <stop offset="55%" stop-color="#0a0f1e"/>
      <stop offset="100%" stop-color="#05070f"/>
    </radialGradient>
    <radialGradient id="planet" cx="34%" cy="28%" r="80%">
      <stop offset="0%" stop-color="#9fe3ff"/>
      <stop offset="45%" stop-color="#2f6bff"/>
      <stop offset="100%" stop-color="#0b1f5e"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <ellipse cx="256" cy="256" rx="232" ry="96" fill="none" stroke="#3aa7ff" stroke-width="26" transform="rotate(-20 256 256)" opacity="0.9"/>
  <ellipse cx="256" cy="256" rx="232" ry="96" fill="none" stroke="#7dd7ff" stroke-width="7" transform="rotate(-20 256 256)" opacity="0.35"/>
  <circle cx="256" cy="262" r="128" fill="url(#planet)"/>
  <circle cx="222" cy="228" r="34" fill="#ffffff" opacity="0.85"/>
  <circle cx="222" cy="228" r="48" fill="#ffffff" opacity="0.18"/>
</svg>`;

const ICONS = [
  { name: "icon-192", size: 192, maskable: false },
  { name: "icon-512", size: 512, maskable: false },
  { name: "icon-maskable-512", size: 512, maskable: true },
  { name: "apple-touch-icon", size: 180, maskable: false },
];

await mkdir("public/icons", { recursive: true });

for (const icon of ICONS) {
  let svg = SVG;
  if (icon.maskable) {
    const pad = 512 * 0.18;
    svg = SVG.replace(
      '<circle cx="256" cy="262" r="128"',
      `<circle cx="256" cy="262" r="${128 - pad}"`,
    );
  }
  await sharp(Buffer.from(svg))
    .resize(icon.size, icon.size)
    .png()
    .toFile(`public/icons/${icon.name}.png`);
  console.log(`wrote public/icons/${icon.name}.png`);
}
