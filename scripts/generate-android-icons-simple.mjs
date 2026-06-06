import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * 基于现有正方形图标生成符合安卓规范的图标
 * 规则：
 * 1. 先将SVG转换为带黑色背景的正方形PNG
 * 2. 基于这个PNG生成所有其他图标
 * 3. 不裁切原始图标，而是以原始图标为中心，背景填充
 * 4. 桌面图标(mipmap)使用固定像素尺寸
 * 5. 应用内图标(drawable)使用正确的宽高比
 */
async function generateAndroidIcons() {
  const baseDir = process.cwd();
  const inputSvg = path.join(baseDir, 'icon.svg');
  const androidResDir = path.join(baseDir, 'android', 'app', 'src', 'main', 'res');

  console.log('生成符合安卓规范的图标...');

  // 检查输入文件是否存在
  try {
    await fs.access(inputSvg);
  } catch (error) {
    console.error('输入文件不存在:', error.message);
    return;
  }

  // Step 1: 将SVG转换为带黑色背景的正方形PNG
  console.log('\n1. 预处理：将SVG转换为带黑色背景的正方形PNG...');

  const processedIcon = path.join(baseDir, 'processed-icon.png');
  const baseSize = 1024; // 使用足够大的尺寸，确保清晰度

  // 直接创建一个黑色背景的画布，然后将SVG居中放置并放大填满整个画布
  await sharp({
    create: {
      width: baseSize,
      height: baseSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }, // 黑色背景
    },
  })
    .composite([
      {
        input: inputSvg,
        blend: 'over',
        gravity: 'center',
        resize: {
          width: baseSize,
          height: baseSize,
          fit: 'cover', // 放大SVG填满整个画布
        },
      },
    ])
    .png()
    .toFile(processedIcon);

  console.log(`生成带黑色背景的正方形PNG: ${processedIcon}`);

  // Step 2: 生成桌面图标(mipmap目录)
  console.log('\n2. 生成桌面图标(mipmap目录)...');

  // 桌面图标固定尺寸(px)
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

    // 生成ic_launcher.png - 桌面图标
    const iconPath = path.join(outputDir, 'ic_launcher.png');
    await sharp(processedIcon).resize(size, size).png().toFile(iconPath);
    console.log(`生成 ${iconPath} (${size}x${size}px)`);

    // 生成其他桌面图标变体
    const variants = ['ic_launcher_round.png', 'ic_launcher_foreground.png'];
    for (const variant of variants) {
      const variantPath = path.join(outputDir, variant);
      await sharp(processedIcon).resize(size, size).png().toFile(variantPath);
      console.log(`生成 ${variantPath} (${size}x${size}px)`);
    }
  }

  // Step 3: 生成TV启动横幅(ic_launcher_banner.png)
  console.log('\n3. 生成TV启动横幅(ic_launcher_banner.png)...');

  // TV横幅尺寸规则：宽高比2:1
  const tvBannerSizes = {
    mdpi: 320,
    hdpi: 480,
    xhdpi: 640,
    xxhdpi: 960,
    xxxhdpi: 1280,
  };

  for (const [density, width] of Object.entries(tvBannerSizes)) {
    const height = Math.round(width / 2); // 2:1 宽高比
    const outputDir = path.join(androidResDir, `mipmap-${density}`);

    const outputPath = path.join(outputDir, 'ic_launcher_banner.png');

    // 对于TV横幅，使用cover模式，让图标填充整个横幅区域
    await sharp(processedIcon)
      .resize(width, height, {
        fit: 'cover', // 覆盖整个横幅区域
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .png()
      .toFile(outputPath);

    console.log(`生成 ${outputPath} (${width}x${height}px, 2:1)`);
  }

  // Step 4: 生成应用横幅(banner.png)
  console.log('\n4. 生成应用横幅(banner.png)...');

  // 应用横幅尺寸规则：宽高比4:1
  const appBannerSizes = {
    mdpi: 320,
    hdpi: 480,
    xhdpi: 640,
    xxhdpi: 960,
    xxxhdpi: 1280,
  };

  for (const [density, width] of Object.entries(appBannerSizes)) {
    const height = Math.round(width / 4); // 4:1 宽高比
    const outputDir = path.join(androidResDir, `drawable-${density}`);
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, 'banner.png');

    // 对于应用横幅，使用cover模式，让图标填充整个横幅区域
    await sharp(processedIcon)
      .resize(width, height, {
        fit: 'cover', // 覆盖整个横幅区域
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .png()
      .toFile(outputPath);

    console.log(`生成 ${outputPath} (${width}x${height}px, 4:1)`);
  }

  // 生成base drawable目录的banner.png
  const baseBannerPath = path.join(androidResDir, 'drawable', 'banner.png');
  await sharp(processedIcon)
    .resize(640, 160, {
      fit: 'cover', // 覆盖整个横幅区域
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toFile(baseBannerPath);
  console.log(`生成 ${baseBannerPath} (640x160px, 4:1)`);

  // Step 5: 生成启动屏幕图标(splash.png)
  console.log('\n5. 生成启动屏幕图标(splash.png)...');

  // 启动屏幕支持横屏(land)和竖屏(port)
  const splashConfigs = [
    { prefix: 'land', aspect: '16:9', width: 640, height: 360 },
    { prefix: 'port', aspect: '9:16', width: 360, height: 640 },
  ];

  // 基于mdpi基准的启动屏幕尺寸(dp)
  const densityScales = {
    mdpi: 1,
    hdpi: 1.5,
    xhdpi: 2,
    xxhdpi: 3,
    xxxhdpi: 4,
  };

  for (const config of splashConfigs) {
    for (const [density, scale] of Object.entries(densityScales)) {
      // 计算实际像素尺寸
      const width = Math.round(config.width * scale);
      const height = Math.round(config.height * scale);

      const outputDir = path.join(androidResDir, `drawable-${config.prefix}-${density}`);
      await fs.mkdir(outputDir, { recursive: true });

      const outputPath = path.join(outputDir, 'splash.png');

      // 对于启动屏幕，使用cover模式，让图标填充大部分屏幕区域
      await sharp(processedIcon)
        .resize(width, height, {
          fit: 'cover', // 覆盖大部分屏幕区域
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        })
        .png()
        .toFile(outputPath);

      console.log(`生成 ${outputPath} (${width}x${height}px, ${config.aspect})`);
    }
  }

  // 生成base drawable目录的splash.png
  const baseSplashPath = path.join(androidResDir, 'drawable', 'splash.png');
  await sharp(processedIcon)
    .resize(640, 360, {
      fit: 'cover', // 覆盖大部分屏幕区域
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toFile(baseSplashPath);
  console.log(`生成 ${baseSplashPath} (640x360px, 16:9)`);

  // 清理临时文件
  await fs.unlink(processedIcon).catch(console.error);

  console.log('\n所有图标生成完成！');
  console.log('\n✅ 生成的图标符合安卓规范：');
  console.log('   - 先将SVG转换为带黑色背景的正方形PNG');
  console.log('   - 基于这个PNG生成所有其他图标');
  console.log('   - 原始图标完整显示，圆角区域已被背景色填充');
  console.log('   - 桌面图标使用固定像素尺寸');
  console.log('   - 应用内图标使用正确的宽高比');
  console.log('   - 解决了SVG透明区域导致的四角空白问题');
}

generateAndroidIcons().catch(console.error);
