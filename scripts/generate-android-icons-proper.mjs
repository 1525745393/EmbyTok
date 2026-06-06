import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * 基于现有正方形图标生成符合安卓规范的图标
 * 规则：
 * 1. 所有图标必须是正方形，宽高比1:1
 * 2. 不裁切原始图标，而是以原始图标为中心，背景填充或拉伸
 * 3. 桌面图标(mipmap)使用固定像素尺寸
 * 4. 应用内图标(drawable)使用dp单位，基于mdpi基准
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

  // 预处理函数：确保SVG的透明区域被背景色填充
  async function processSvgWithBackground(inputPath, background = { r: 0, g: 0, b: 0, alpha: 1 }) {
    // 先将SVG转换为一个带黑色背景的正方形PNG
    const processedIcon = path.join(baseDir, 'processed-icon.png');
    const canvasSize = 192; // 使用足够大的尺寸

    // 直接将SVG转换为带黑色背景的正方形PNG
    await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background,
      },
    })
      .composite([
        {
          input: inputPath,
          blend: 'over',
          gravity: 'center',
          resize: {
            width: canvasSize,
            height: canvasSize,
            fit: 'contain',
          },
        },
      ])
      .png()
      .toFile(processedIcon);

    return processedIcon;
  }

  // 预处理SVG，生成带黑色背景的临时PNG
  const processedIcon = await processSvgWithBackground(inputSvg);

  // 1. 生成桌面图标(mipmap目录)
  console.log('\n1. 生成桌面图标(mipmap目录)...');

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
    const outputPath = path.join(outputDir, 'ic_launcher.png');

    // 使用预处理后的PNG，确保没有透明区域
    await sharp(processedIcon)
      .resize(size, size, {
        fit: 'cover', // 使用cover模式，确保填满整个画布
      })
      .png()
      .toFile(outputPath);

    console.log(`生成 ${outputPath} (${size}x${size}px)`);

    // 生成其他桌面图标变体
    const variants = ['ic_launcher_round.png', 'ic_launcher_foreground.png'];
    for (const variant of variants) {
      const variantPath = path.join(outputDir, variant);
      await sharp(processedIcon)
        .resize(size, size, {
          fit: 'cover',
        })
        .png()
        .toFile(variantPath);
      console.log(`生成 ${variantPath} (${size}x${size}px)`);
    }
  }

  // 2. 生成TV启动横幅(ic_launcher_banner.png)
  console.log('\n2. 生成TV启动横幅(ic_launcher_banner.png)...');

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

    // 生成ic_launcher_banner.png - TV启动横幅
    const outputPath = path.join(outputDir, 'ic_launcher_banner.png');

    // 先调整processedIcon的大小，确保适合横幅尺寸
    const tempBannerIcon = path.join(baseDir, `temp-banner-icon-${density}.png`);
    const iconSize = Math.min(width, height * 2); // 图标在横幅中的合适尺寸

    await sharp(processedIcon)
      .resize(iconSize, iconSize, {
        fit: 'cover',
      })
      .png()
      .toFile(tempBannerIcon);

    // 使用预处理后的PNG，背景黑色填充
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    })
      .composite([
        {
          input: tempBannerIcon,
          blend: 'over',
          gravity: 'center',
        },
      ])
      .png()
      .toFile(outputPath);

    console.log(`生成 ${outputPath} (${width}x${height}px, 2:1)`);

    // 清理临时文件
    await fs.unlink(tempBannerIcon).catch(console.error);
  }

  // 3. 生成应用横幅(banner.png)
  console.log('\n3. 生成应用横幅(banner.png)...');

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

    // 生成banner.png - 应用横幅
    const outputPath = path.join(outputDir, 'banner.png');

    // 先调整processedIcon的大小，确保适合横幅尺寸
    const tempBannerIcon = path.join(baseDir, `temp-app-banner-${density}.png`);
    const iconSize = Math.min(width, height * 4); // 图标在横幅中的合适尺寸

    await sharp(processedIcon)
      .resize(iconSize, iconSize, {
        fit: 'cover',
      })
      .png()
      .toFile(tempBannerIcon);

    // 使用预处理后的PNG，背景黑色填充
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    })
      .composite([
        {
          input: tempBannerIcon,
          blend: 'over',
          gravity: 'center',
        },
      ])
      .png()
      .toFile(outputPath);

    console.log(`生成 ${outputPath} (${width}x${height}px, 4:1)`);

    // 清理临时文件
    await fs.unlink(tempBannerIcon).catch(console.error);
  }

  // 生成base drawable目录的banner.png
  const baseBannerPath = path.join(androidResDir, 'drawable', 'banner.png');

  // 先调整processedIcon的大小
  const tempBaseBannerIcon = path.join(baseDir, 'temp-base-banner.png');
  await sharp(processedIcon)
    .resize(320, 320, {
      fit: 'cover',
    })
    .png()
    .toFile(tempBaseBannerIcon);

  await sharp({
    create: {
      width: 640,
      height: 160,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([
      {
        input: tempBaseBannerIcon,
        blend: 'over',
        gravity: 'center',
      },
    ])
    .png()
    .toFile(baseBannerPath);

  console.log(`生成 ${baseBannerPath} (640x160px, 4:1)`);

  // 清理临时文件
  await fs.unlink(tempBaseBannerIcon).catch(console.error);

  // 4. 生成启动屏幕图标(splash.png)
  console.log('\n4. 生成启动屏幕图标(splash.png)...');

  // 启动屏幕支持横屏(land)和竖屏(port)
  const splashConfigs = [
    { prefix: 'land', aspect: '16:9' },
    { prefix: 'port', aspect: '9:16' },
  ];

  // 基于mdpi基准的启动屏幕尺寸(dp)
  const splashBaseSize = 48; // mdpi基准尺寸
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
      const basePx = Math.round(splashBaseSize * scale);
      let width, height;

      if (config.aspect === '16:9') {
        // 横屏：16:9
        width = Math.round((basePx * 16) / 9);
        height = basePx;
      } else {
        // 竖屏：9:16
        width = basePx;
        height = Math.round((basePx * 16) / 9);
      }

      const outputDir = path.join(androidResDir, `drawable-${config.prefix}-${density}`);
      await fs.mkdir(outputDir, { recursive: true });

      const outputPath = path.join(outputDir, 'splash.png');

      // 使用预处理后的PNG，背景黑色填充
      await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        },
      })
        .composite([
          {
            input: processedIcon,
            blend: 'over',
            gravity: 'center',
            resize: {
              width: Math.min(width, height),
              height: Math.min(width, height),
            },
          },
        ])
        .png()
        .toFile(outputPath);

      console.log(`生成 ${outputPath} (${width}x${height}px, ${config.aspect})`);
    }
  }

  // 生成base drawable目录的splash.png
  const baseSplashPath = path.join(androidResDir, 'drawable', 'splash.png');
  await sharp({
    create: {
      width: 640,
      height: 360,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([
      {
        input: processedIcon,
        blend: 'over',
        gravity: 'center',
        resize: {
          width: 200,
          height: 200,
        },
      },
    ])
    .png()
    .toFile(baseSplashPath);
  console.log(`生成 ${baseSplashPath} (640x360px, 16:9)`);

  // 清理临时文件
  await fs.unlink(processedIcon).catch(console.error);

  console.log('\n所有图标生成完成！');
  console.log('\n✅ 生成的图标符合安卓规范：');
  console.log('   - 所有图标都是正方形(桌面图标)或符合规定比例(横幅/启动屏)');
  console.log('   - 原始图标完整显示，圆角区域已被背景色填充');
  console.log('   - 桌面图标使用固定像素尺寸');
  console.log('   - 应用内图标使用正确的宽高比');
  console.log('   - 解决了SVG透明区域导致的四角空白问题');
}

generateAndroidIcons().catch(console.error);
