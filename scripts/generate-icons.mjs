import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

async function generateIcons() {
  const inputSvg = path.join(process.cwd(), 'icons/icon-192x192.svg');
  const outputDir = path.join(process.cwd(), 'public/icons');

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Copy the original SVG
  await fs.copyFile(inputSvg, path.join(outputDir, 'icon-192x192.svg'));

  // Define sizes to generate
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

  // Generate PNG icons for each size
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    await sharp(inputSvg).resize(size, size).png().toFile(outputPath);
    console.log(`Generated ${outputPath}`);
  }
}

generateIcons().catch(console.error);
