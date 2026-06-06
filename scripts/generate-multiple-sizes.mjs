import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * 批量生成不同尺寸的图标
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputDir - 输出目录
 * @param {Array<number>} sizes - 要生成的尺寸列表
 * @param {string} format - 输出格式 (png, jpg, webp)
 */
async function generateMultipleSizes(inputPath, outputDir, sizes, format = 'png') {
  // 确保输出目录存在
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`Generating ${format} icons from ${inputPath}...`);

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.${format}`);

    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // 透明背景
      })
      [format]()
      .toFile(outputPath);

    console.log(`Generated ${outputPath}`);
  }

  console.log('All icons generated successfully!');
}

// 使用示例
const inputFile = process.argv[2] || 'icon.svg';
const outputDir = process.argv[3] || 'output/icons';
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

if (!inputFile) {
  console.error('Please provide an input file path');
  process.exit(1);
}

generateMultipleSizes(inputFile, outputDir, sizes).catch(console.error);
