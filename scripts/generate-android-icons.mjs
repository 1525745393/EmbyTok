import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

async function generateAndroidIcons() {
  const baseDir = process.cwd();

  // Input files
  const mainSvg = path.join(baseDir, 'icon.svg');
  const tvPng = path.join(baseDir, 'WechatIMG557.png');

  // Check if input files exist
  try {
    await fs.access(mainSvg);
    await fs.access(tvPng);
  } catch (error) {
    console.error('Input files not found:', error.message);
    return;
  }

  // Define output directories
  const androidResDir = path.join(baseDir, 'android', 'app', 'src', 'main', 'res');
  const publicIconsDir = path.join(baseDir, 'public', 'icons');

  // Ensure output directories exist
  await fs.mkdir(publicIconsDir, { recursive: true });

  console.log('Generating Android icons...');

  // 1. Generate basic PNG icons for web (existing functionality)
  console.log('\n1. Generating web icons...');
  const webSizes = [72, 96, 128, 144, 152, 192, 384, 512];
  for (const size of webSizes) {
    const outputPath = path.join(publicIconsDir, `icon-${size}x${size}.png`);
    await sharp(mainSvg).resize(size, size).png().toFile(outputPath);
    console.log(`Generated ${outputPath}`);
  }

  // Copy the original SVG to public icons
  await fs.copyFile(mainSvg, path.join(publicIconsDir, 'icon-192x192.svg'));
  console.log(`Copied SVG to ${path.join(publicIconsDir, 'icon-192x192.svg')}`);

  // 2. Generate Android launcher icons (mipmap)
  console.log('\n2. Generating Android launcher icons...');
  const mipmapSizes = {
    mdpi: 48,
    hdpi: 72,
    xhdpi: 96,
    xxhdpi: 144,
    xxxhdpi: 192,
  };

  for (const [density, size] of Object.entries(mipmapSizes)) {
    const outputDir = path.join(androidResDir, `mipmap-${density}`);
    await fs.mkdir(outputDir, { recursive: true });

    // Generate icon.png
    const iconPath = path.join(outputDir, 'icon.png');
    await sharp(mainSvg).resize(size, size).png().toFile(iconPath);
    console.log(`Generated ${iconPath}`);

    // Generate ic_launcher.png, ic_launcher_round.png, and ic_launcher_foreground.png
    // For simplicity, we'll use the same icon for all launcher variants
    const launcherPath = path.join(outputDir, 'ic_launcher.png');
    const launcherRoundPath = path.join(outputDir, 'ic_launcher_round.png');
    const launcherForegroundPath = path.join(outputDir, 'ic_launcher_foreground.png');

    await sharp(mainSvg).resize(size, size).png().toFile(launcherPath);
    console.log(`Generated ${launcherPath}`);

    await sharp(mainSvg).resize(size, size).png().toFile(launcherRoundPath);
    console.log(`Generated ${launcherRoundPath}`);

    await sharp(mainSvg).resize(size, size).png().toFile(launcherForegroundPath);
    console.log(`Generated ${launcherForegroundPath}`);
  }

  // 3. Generate Android TV icons
  console.log('\n3. Generating Android TV icons...');

  // Android TV launcher icon sizes
  const tvLauncherSizes = {
    mdpi: 360,
    hdpi: 540,
    xhdpi: 720,
    xxhdpi: 1080,
    xxxhdpi: 1440,
  };

  for (const [density, size] of Object.entries(tvLauncherSizes)) {
    const outputDir = path.join(androidResDir, `mipmap-${density}`);

    // Generate TV launcher icon (ic_launcher_banner.png)
    const tvIconPath = path.join(outputDir, 'ic_launcher_banner.png');
    await sharp(tvPng)
      .resize(size, Math.round(size / 2)) // TV banners are 2:1 aspect ratio
      .png()
      .toFile(tvIconPath);
    console.log(`Generated ${tvIconPath}`);
  }

  // 4. Generate Android TV banners
  console.log('\n4. Generating Android TV banners...');

  // Android TV banner sizes (drawable directories)
  const bannerSizes = {
    mdpi: 320,
    hdpi: 480,
    xhdpi: 640,
    xxhdpi: 960,
    xxxhdpi: 1280,
  };

  for (const [density, size] of Object.entries(bannerSizes)) {
    const outputDir = path.join(androidResDir, `drawable-${density}`);
    await fs.mkdir(outputDir, { recursive: true });

    // Generate banner.png
    const bannerPath = path.join(outputDir, 'banner.png');
    await sharp(tvPng)
      .resize(size, Math.round(size / 4)) // Banner aspect ratio 4:1
      .png()
      .toFile(bannerPath);
    console.log(`Generated ${bannerPath}`);
  }

  // Also generate banner.png in the base drawable directory
  const baseBannerPath = path.join(androidResDir, 'drawable', 'banner.png');
  await sharp(tvPng)
    .resize(640, 160) // Default banner size
    .png()
    .toFile(baseBannerPath);
  console.log(`Generated ${baseBannerPath}`);

  // 5. Generate splash screen icons
  console.log('\n5. Generating splash screen icons...');

  // Splash screen sizes for different densities and orientations
  const splashConfigs = [
    { prefix: 'land', aspect: '16:9' },
    { prefix: 'port', aspect: '9:16' },
  ];

  for (const config of splashConfigs) {
    for (const [density, size] of Object.entries(mipmapSizes)) {
      // Calculate splash screen dimensions based on aspect ratio
      let width, height;
      if (config.aspect === '16:9') {
        width = size * 2;
        height = size;
      } else {
        // 9:16
        width = size;
        height = size * 2;
      }

      const outputDir = path.join(androidResDir, `drawable-${config.prefix}-${density}`);
      await fs.mkdir(outputDir, { recursive: true });

      const splashPath = path.join(outputDir, 'splash.png');
      await sharp(mainSvg)
        .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .png()
        .toFile(splashPath);
      console.log(`Generated ${splashPath}`);
    }
  }

  // Generate base splash.png in drawable directory
  const baseSplashPath = path.join(androidResDir, 'drawable', 'splash.png');
  await sharp(mainSvg)
    .resize(1280, 720, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(baseSplashPath);
  console.log(`Generated ${baseSplashPath}`);

  console.log('\nAll icons generated successfully!');
}

generateAndroidIcons().catch(console.error);
