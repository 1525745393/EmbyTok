import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * 生成Android和iOS图标
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputDir - 输出目录
 */
async function generateMobileIcons(inputPath, outputDir) {
  // 确保输出目录存在
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`Generating mobile icons from ${inputPath}...`);

  // Android图标尺寸（mipmap密度）
  const androidSizes = {
    mdpi: 48,
    hdpi: 72,
    xhdpi: 96,
    xxhdpi: 144,
    xxxhdpi: 192,
  };

  // iOS图标尺寸
  const iosSizes = [
    20,
    29,
    40,
    58,
    60,
    76,
    80,
    87,
    120,
    152,
    167,
    180,
    1024, // App Store图标
  ];

  // 生成Android图标
  console.log('\nGenerating Android icons...');
  for (const [density, size] of Object.entries(androidSizes)) {
    const androidDir = path.join(outputDir, 'android', `mipmap-${density}`);
    await fs.mkdir(androidDir, { recursive: true });

    const outputPath = path.join(androidDir, 'ic_launcher.png');
    await sharp(inputPath).resize(size, size).png().toFile(outputPath);

    console.log(`Generated ${outputPath}`);
  }

  // 生成iOS图标
  console.log('\nGenerating iOS icons...');
  const iosDir = path.join(outputDir, 'ios');
  await fs.mkdir(iosDir, { recursive: true });

  for (const size of iosSizes) {
    const outputPath = path.join(iosDir, `icon-${size}x${size}.png`);
    await sharp(inputPath).resize(size, size).png().toFile(outputPath);

    console.log(`Generated ${outputPath}`);
  }

  console.log('\nMobile icons generated successfully!');
}

// 使用示例
const inputFile = process.argv[2] || 'icon.svg';
const outputDir = process.argv[3] || 'output/mobile-icons';

generateMobileIcons(inputFile, outputDir).catch(console.error);
