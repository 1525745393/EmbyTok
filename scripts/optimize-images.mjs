import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * 优化单个图片文件
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputPath - 输出文件路径
 * @param {number} quality - 输出质量 (0-100)
 */
async function optimizeImage(inputPath, outputPath, quality = 80) {
  console.log(`Optimizing ${inputPath}...`);

  // 确保输出目录存在
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const ext = path.extname(inputPath).slice(1).toLowerCase();

  try {
    if (ext === 'png') {
      await sharp(inputPath).png({ quality }).toFile(outputPath);
    } else if (ext === 'jpg' || ext === 'jpeg') {
      await sharp(inputPath).jpeg({ quality }).toFile(outputPath);
    } else if (ext === 'webp') {
      await sharp(inputPath).webp({ quality }).toFile(outputPath);
    } else {
      console.log(`Skipping ${inputPath} (unsupported format)`);
      return;
    }

    // 获取文件大小信息
    const inputStats = await fs.stat(inputPath);
    const outputStats = await fs.stat(outputPath);
    const reduction = (((inputStats.size - outputStats.size) / inputStats.size) * 100).toFixed(1);

    console.log(`Optimized ${outputPath} (${reduction}% smaller)`);
  } catch (error) {
    console.error(`Failed to optimize ${inputPath}: ${error.message}`);
  }
}

/**
 * 批量优化图片文件
 * @param {string} inputPattern - 输入文件匹配模式
 * @param {string} outputDir - 输出目录
 * @param {number} quality - 输出质量 (0-100)
 */
async function batchOptimizeImages(inputPattern, outputDir, quality = 80) {
  console.log(`Batch optimizing images with pattern: ${inputPattern}`);

  const files = await glob(inputPattern);

  for (const file of files) {
    const fileName = path.basename(file);
    const outputPath = path.join(outputDir, fileName);
    await optimizeImage(file, outputPath, quality);
  }

  console.log('Batch optimization completed!');
}

// 使用示例
const inputPattern = process.argv[2] || 'input-icons/*.{png,jpg,webp}';
const outputDir = process.argv[3] || 'output/optimized';
const quality = parseInt(process.argv[4]) || 80;

batchOptimizeImages(inputPattern, outputDir, quality).catch(console.error);
