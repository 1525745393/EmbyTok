import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Script to generate Android TV banner images from a source PNG file
 * Usage: node scripts/generate-banner-from-png.mjs <source-png-path>
 */
async function generateBannersFromPng() {
  // Get source PNG path from command line arguments
  const sourcePngPath = process.argv[2];
  if (!sourcePngPath) {
    console.error('Error: Please provide a source PNG file path');
    console.error('Usage: node scripts/generate-banner-from-png.mjs <source-png-path>');
    process.exit(1);
  }

  // Verify source file exists
  try {
    await fs.access(sourcePngPath);
  } catch (error) {
    console.error(`Error: Source file not found at ${sourcePngPath}`);
    process.exit(1);
  }

  const androidResDir = path.join(process.cwd(), 'android/app/src/main/res');

  // Define banner sizes for different densities (16:9 aspect ratio)
  const bannerConfigs = [
    { density: 'mdpi', width: 320, height: 180 },
    { density: 'hdpi', width: 480, height: 270 },
    { density: 'xhdpi', width: 640, height: 360 },
    { density: 'xxhdpi', width: 960, height: 540 },
    { density: 'xxxhdpi', width: 1280, height: 720 },
    { density: '', width: 640, height: 360 }, // Default density
  ];

  console.log(`Generating banners from ${sourcePngPath}...`);

  // Generate banner for each density
  for (const config of bannerConfigs) {
    const drawableDir = config.density
      ? path.join(androidResDir, `drawable-${config.density}`)
      : path.join(androidResDir, 'drawable');

    // Ensure directory exists
    await fs.mkdir(drawableDir, { recursive: true });

    const outputPath = path.join(drawableDir, 'banner.png');

    try {
      await sharp(sourcePngPath)
        .resize({
          width: config.width,
          height: config.height,
          fit: 'cover', // Changed from 'contain' to 'cover' to fill the area
          position: 'center', // Center the image
          background: { r: 0, g: 0, b: 0, alpha: 1 }, // Black background if needed
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${outputPath}`);
    } catch (error) {
      console.error(`✗ Failed to generate ${outputPath}:`, error.message);
    }
  }

  console.log('\nBanner generation completed!');
}

generateBannersFromPng().catch(console.error);
