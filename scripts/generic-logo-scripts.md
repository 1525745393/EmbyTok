# Logo设计通用自动化脚本

以下是一组通用的logo设计自动化脚本，使用Node.js和sharp库实现，可以帮助您高效地生成和处理各种类型的logo图标。

## 前提条件

- Node.js 16+
- sharp库：`npm install sharp`

## 脚本1：批量生成不同尺寸的图标

**功能**：从单个SVG或PNG文件生成多种尺寸的图标，适用于Web、iOS、Android等平台。

```javascript
// scripts/generate-multiple-sizes.mjs
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
```

**使用方法**：

```bash
node scripts/generate-multiple-sizes.mjs input.svg output/icons
```

## 脚本2：生成Favicon图标

**功能**：从单个文件生成符合标准的favicon图标，包括不同尺寸的PNG和ICO格式。

```javascript
// scripts/generate-favicon.mjs
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
```

**使用方法**：

```bash
node scripts/generate-favicon.mjs input.svg output/favicon
```

## 脚本3：生成社交媒体分享图片

**功能**：生成适合社交媒体分享的图片，包括Facebook、Twitter、LinkedIn等平台的推荐尺寸。

```javascript
// scripts/generate-social-media.mjs
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
```

**使用方法**：

```bash
node scripts/generate-social-media.mjs input.svg output/social
```

## 脚本4：格式转换工具

**功能**：将logo从一种格式转换为另一种格式，支持SVG、PNG、JPG、WebP等。

```javascript
// scripts/convert-format.mjs
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
    await sharp(inputPath)
      [outputFormat]()
      .toFile(outputPath);

    console.log(`Successfully converted to ${outputPath}`);
  } catch (error) {
    console.error(`Failed to convert: ${error.message}`);
    process.exit(1);
  }
}

// 使用示例
const inputFile =
```
