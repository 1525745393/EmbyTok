import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * 生成Favicon图标
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputDir - 输出目录
 */
async function generateFavicon(inputPath, outputDir) {
  // 确保输出目录存在
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`Generating favicon from ${inputPath}...`);

  // Favicon尺寸列表
  const faviconSizes = [16, 32, 48, 64, 128, 256];

  // 生成不同尺寸的PNG图标
  for (const size of faviconSizes) {
    const outputPath = path.join(outputDir, `favicon-${size}x${size}.png`);
    await sharp(inputPath).resize(size, size).png().toFile(outputPath);
    console.log(`Generated ${outputPath}`);
  }

  // 生成ICO格式（需要先生成临时PNG文件）
  const icoSizes = [16, 32, 48];
  const icoInputFiles = [];

  for (const size of icoSizes) {
    const tempPath = path.join(outputDir, `temp-${size}x${size}.png`);
    await sharp(inputPath).resize(size, size).png().toFile(tempPath);
    icoInputFiles.push(tempPath);
  }

  // 使用sharp生成ICO
  // 注意：sharp需要libvips支持ICO格式
  try {
    await sharp(icoInputFiles[0]).png().toFile(path.join(outputDir, 'favicon.ico'));
    console.log('Generated favicon.ico');
  } catch (error) {
    console.warn(
      'Failed to generate ICO format. You may need to use an online converter for ICO files.'
    );
  }

  // 清理临时文件
  for (const file of icoInputFiles) {
    await fs.unlink(file).catch(() => {});
  }

  console.log('Favicon generation completed!');
}

// 使用示例
const inputFile = process.argv[2] || 'icon.svg';
const outputDir = process.argv[3] || 'output/favicon';

generateFavicon(inputFile, outputDir).catch(console.error);
