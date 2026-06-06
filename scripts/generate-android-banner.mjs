import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

async function generateAndroidBanner() {
  const inputSvg = path.join(process.cwd(), 'icons/banner-template.svg');
  const androidResDir = path.join(process.cwd(), 'android/app/src/main/res');

  // Define banner sizes for different densities (320x180dp base)
  const bannerSizes = [
    { density: 'mdpi', width: 320, height: 180 },
    { density: 'hdpi', width: 480, height: 270 },
    { density: 'xhdpi', width: 640, height: 360 },
    { density: 'xxhdpi', width: 960, height: 540 },
    { density: 'xxxhdpi', width: 1280, height: 720 },
  ];

  // Generate banner for each density
  for (const { density, width, height } of bannerSizes) {
    const drawableDir = path.join(androidResDir, `drawable-${density}`);
    await fs.mkdir(drawableDir, { recursive: true });

    const outputPath = path.join(drawableDir, 'banner.png');
    await sharp(inputSvg).resize(width, height).png().toFile(outputPath);
    console.log(`Generated ${outputPath}`);
  }

  // Also generate a default banner for drawable directory
  const defaultDrawableDir = path.join(androidResDir, 'drawable');
  await fs.mkdir(defaultDrawableDir, { recursive: true });

  const defaultOutputPath = path.join(defaultDrawableDir, 'banner.png');
  await sharp(inputSvg)
    .resize(640, 360) // Use xhdpi as default
    .png()
    .toFile(defaultOutputPath);
  console.log(`Generated ${defaultOutputPath}`);
}

generateAndroidBanner().catch(console.error);
