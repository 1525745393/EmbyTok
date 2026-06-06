import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * 转换图片格式
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputPath - 输出文件路径
 */
async function convertFormat(inputPath, outputPath) {
  console.log(`Converting ${inputPath} to ${outputPath}...`);

  // 确保输出目录存在
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  // 获取输出格式
  const outputFormat = path.extname(outputPath).slice(1).toLowerCase();

  try {
    await sharp(inputPath)[outputFormat]().toFile(outputPath);

    console.log(`Successfully converted to ${outputPath}`);
  } catch (error) {
    console.error(`Failed to convert: ${error.message}`);
    process.exit(1);
  }
}

// 使用示例
const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Please provide input and output file paths');
  console.log('Usage: node scripts/convert-format.mjs input.svg output.png');
  process.exit(1);
}

convertFormat(inputFile, outputFile).catch(console.error);
