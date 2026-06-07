#!/usr/bin/env node
/**
 * ============================================
 * EmbyTok 项目构建脚本
 * 参考 MDCx 项目设计模式
 * ============================================
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前脚本目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 配置信息
const CONFIG = {
  appName: 'EmbyTok',
  version: null,
  debug: false,
  createDmg: false,
  iconPath: path.join(PROJECT_ROOT, 'public', 'icons', 'icon-512x512.png'),
  distDir: path.join(PROJECT_ROOT, 'dist'),
  outputDir: path.join(PROJECT_ROOT, 'dist'),
  androidDir: path.join(PROJECT_ROOT, 'android'),
};

// 日志工具
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ✅ ${msg}`),
  error: (msg) => console.error(`[ERROR] ❌ ${msg}`),
  warn: (msg) => console.warn(`[WARN] ⚠️ ${msg}`),
  debug: (msg) => {
    if (CONFIG.debug) {
      console.log(`[DEBUG] ${msg}`);
    }
  },
  section: (title) => {
    console.log('\n' + '='.repeat(60));
    console.log(title);
    console.log('='.repeat(60));
  },
};

// 执行命令工具
const runCommand = (cmd, options = {}) => {
  const { cwd = PROJECT_ROOT, silent = false, env = process.env } = options;
  logger.debug(`执行命令: ${cmd}`);

  try {
    const result = execSync(cmd, {
      cwd,
      env,
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
    });
    return result;
  } catch (error) {
    if (!silent) {
      logger.error(`命令执行失败: ${cmd}`);
    }
    throw error;
  }
};

// 检查环境
const checkEnvironment = () => {
  logger.section('环境检查');

  const checks = [
    { name: 'Node.js', cmd: 'node --version' },
    { name: 'npm', cmd: 'npm --version' },
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      const version = runCommand(check.cmd, { silent: true }).trim();
      logger.info(`${check.name}: ${version}`);
    } catch (error) {
      logger.error(`${check.name} 未安装或不在 PATH 中`);
      allPassed = false;
    }
  }

  // 检查必要文件
  const requiredFiles = [
    path.join(PROJECT_ROOT, 'package.json'),
    path.join(PROJECT_ROOT, 'vite.config.ts'),
  ];

  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      logger.debug(`找到文件: ${file}`);
    } else {
      logger.error(`缺少必要文件: ${file}`);
      allPassed = false;
    }
  }

  if (!allPassed) {
    throw new Error('环境检查失败，请修复上述问题后重试');
  }

  logger.success('环境检查通过');
};

// 清理旧文件
const cleanOldFiles = () => {
  logger.section('清理旧文件');

  const cleanPaths = [
    path.join(PROJECT_ROOT, 'dist'),
    path.join(PROJECT_ROOT, 'android', 'app', 'build'),
  ];

  for (const cleanPath of cleanPaths) {
    if (fs.existsSync(cleanPath)) {
      logger.info(`删除: ${cleanPath}`);
      fs.rmSync(cleanPath, { recursive: true, force: true });
    }
  }

  // 清理旧的 APK 文件
  const apkPattern = /^EmbyTok-v.*\.apk$/;
  const files = fs.readdirSync(PROJECT_ROOT);
  for (const file of files) {
    if (apkPattern.test(file)) {
      logger.info(`删除旧 APK: ${file}`);
      fs.unlinkSync(path.join(PROJECT_ROOT, file));
    }
  }

  logger.success('清理完成');
};

// 读取版本号
const readVersion = () => {
  const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  CONFIG.version = packageJson.version;
  logger.info(`版本号: v${CONFIG.version}`);
};

// 构建 Web 前端
const buildWeb = () => {
  logger.section('构建 Web 前端');

  logger.info('执行 npm run build...');
  runCommand('npm run build');

  if (!fs.existsSync(CONFIG.distDir)) {
    throw new Error('Web 构建失败：dist 目录不存在');
  }

  const distFiles = fs.readdirSync(CONFIG.distDir);
  logger.debug(`dist 目录内容: ${distFiles.join(', ')}`);

  logger.success('Web 前端构建完成');
};

// 同步 Capacitor
const syncCapacitor = () => {
  logger.section('同步 Capacitor');

  logger.info('执行 npx cap sync android...');
  runCommand('npx cap sync android');

  logger.success('Capacitor 同步完成');
};

// 构建 Android APK
const buildAndroid = () => {
  logger.section('构建 Android APK');

  const androidDir = CONFIG.androidDir;
  if (!fs.existsSync(androidDir)) {
    throw new Error('Android 项目目录不存在');
  }

  // 确保 gradlew 可执行
  const gradlewPath = path.join(androidDir, 'gradlew');
  if (process.platform !== 'win32') {
    fs.chmodSync(gradlewPath, '755');
  }

  // 构建 Debug APK
  logger.info('构建 Debug APK...');
  runCommand('./gradlew assembleDebug --no-daemon', { cwd: androidDir });

  // 检查是否有签名配置，构建 Release APK
  let buildRelease = false;
  const keystorePath = path.join(androidDir, 'app', 'embytok-release.keystore');

  if (fs.existsSync(keystorePath) || process.env.ANDROID_KEYSTORE) {
    logger.info('找到签名配置，构建 Release APK...');
    try {
      runCommand('./gradlew assembleRelease --no-daemon', { cwd: androidDir });
      buildRelease = true;
    } catch (error) {
      logger.warn('Release APK 构建失败，继续使用 Debug APK');
    }
  } else {
    logger.warn('未找到签名配置，仅构建 Debug APK');
  }

  logger.success('Android APK 构建完成');
  return buildRelease;
};

// 复制和重命名 APK
const copyAndRenameApk = (buildRelease) => {
  logger.section('处理构建产物');

  const version = CONFIG.version;
  const outputs = [];

  // 处理 Debug APK
  const debugApkSrc = path.join(
    CONFIG.androidDir,
    'app',
    'build',
    'outputs',
    'apk',
    'debug',
    'app-debug.apk'
  );
  const debugApkDest = path.join(PROJECT_ROOT, `EmbyTok-v${version}-debug.apk`);

  if (fs.existsSync(debugApkSrc)) {
    logger.info(`复制 Debug APK: ${debugApkDest}`);
    fs.copyFileSync(debugApkSrc, debugApkDest);
    outputs.push(debugApkDest);
  } else {
    logger.warn('未找到 Debug APK');
  }

  // 处理 Release APK
  if (buildRelease) {
    const releaseApkSrc = path.join(
      CONFIG.androidDir,
      'app',
      'build',
      'outputs',
      'apk',
      'release',
      'app-release.apk'
    );
    const releaseApkDest = path.join(PROJECT_ROOT, `EmbyTok-v${version}-release.apk`);

    if (fs.existsSync(releaseApkSrc)) {
      logger.info(`复制 Release APK: ${releaseApkDest}`);
      fs.copyFileSync(releaseApkSrc, releaseApkDest);
      outputs.push(releaseApkDest);
    } else {
      logger.warn('未找到 Release APK');
    }
  }

  return outputs;
};

// 验证构建产物
const verifyBuild = (outputs) => {
  logger.section('验证构建产物');

  let allValid = true;

  for (const output of outputs) {
    if (fs.existsSync(output)) {
      const stats = fs.statSync(output);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      logger.success(`✓ ${path.basename(output)} (${sizeMB} MB)`);
    } else {
      logger.error(`✗ ${path.basename(output)} - 文件不存在`);
      allValid = false;
    }
  }

  if (!allValid) {
    throw new Error('构建产物验证失败');
  }

  return allValid;
};

// 解析命令行参数
const parseArgs = () => {
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--version':
      case '-v':
        CONFIG.version = args[++i];
        break;
      case '--debug':
      case '-d':
        CONFIG.debug = true;
        break;
      case '--app-name':
        CONFIG.appName = args[++i];
        break;
      case '--create-dmg':
        CONFIG.createDmg = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        logger.warn(`未知参数: ${arg}`);
    }
  }
};

// 打印帮助信息
const printHelp = () => {
  console.log(`
EmbyTok 构建脚本

使用方法:
  node scripts/build.js [选项]

选项:
  --version, -v <version>  指定版本号（默认从 package.json 读取）
  --debug, -d              启用调试模式，输出更多日志
  --app-name <name>        指定应用名称（默认: EmbyTok）
  --create-dmg             创建 macOS DMG 安装包（仅 macOS）
  --help, -h               显示此帮助信息

示例:
  node scripts/build.js
  node scripts/build.js --version 1.0.0 --debug
  node scripts/build.js --create-dmg
`);
};

// 主函数
const main = async () => {
  const startTime = Date.now();

  try {
    // 解析参数
    parseArgs();

    // 打印欢迎信息
    console.log('\n' + '='.repeat(60));
    console.log('       EmbyTok 构建脚本');
    console.log('='.repeat(60));

    // 读取版本号（如果未指定）
    if (!CONFIG.version) {
      readVersion();
    }

    // 执行构建流程
    checkEnvironment();
    cleanOldFiles();
    buildWeb();
    syncCapacitor();
    const buildRelease = buildAndroid();
    const outputs = copyAndRenameApk(buildRelease);
    verifyBuild(outputs);

    // 完成
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.section('构建完成');
    console.log(`
🎉 构建成功！

构建产物:
${outputs.map((f) => `  - ${path.basename(f)}`).join('\n')}

用时: ${duration} 秒
`);
  } catch (error) {
    logger.error(error.message);
    if (CONFIG.debug && error.stack) {
      console.error('\n堆栈跟踪:');
      console.error(error.stack);
    }
    process.exit(1);
  }
};

// 运行主函数
main();
