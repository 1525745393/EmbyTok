import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * 生成社交媒体分享图片
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputDir - 输出目录
 */
async function generateSocialMediaImages(inputPath, outputDir) {
  // 确保输出目录存在
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`Generating social media images from ${inputPath}...`);

  // 社交媒体推荐尺寸
  const socialMediaSizes = {
    facebook: { width: 1200, height: 630 }, // Facebook分享
    twitter: { width: 1200, height: 675 }, // Twitter分享
    linkedin: { width: 1200, height: 627 }, // LinkedIn分享
    'instagram-square': { width: 1080, height: 1080 }, // Instagram方形
    'instagram-portrait': { width: 1080, height: 1350 }, // Instagram竖屏
    pinterest: { width: 1000, height: 1500 }, // Pinterest
    'youtube-thumbnail': { width: 1280, height: 720 }, // YouTube缩略图
  };

  for (const [platform, { width, height }] of Object.entries(socialMediaSizes)) {
    const outputPath = path.join(outputDir, `social-${platform}.png`);

    await sharp(inputPath)
      .resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // 白色背景
      })
      .png()
      .toFile(outputPath);

    console.log(`Generated ${outputPath}`);
  }

  console.log('Social media images generated successfully!');
}

// 使用示例
const inputFile = process.argv[2] || 'icon.svg';
const outputDir = process.argv[3] || 'output/social';

generateSocialMediaImages(inputFile, outputDir).catch(console.error);
