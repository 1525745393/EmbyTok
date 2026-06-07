#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_PATH = path.join(__dirname, '..', 'package.json');
const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');

function checkVersionFormat(version) {
  const isValid = /^\d+\.\d+\.\d+$/.test(version);
  return {
    passed: isValid,
    message: isValid ? '版本号格式正确' : `版本号格式错误: ${version}，应为 x.y.z 格式`,
  };
}

function checkChangelog(version) {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    return {
      passed: false,
      message: 'CHANGELOG.md 文件不存在',
    };
  }

  const content = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
  const hasVersion1 = content.includes(`## v${version}`);
  const hasVersion2 = content.includes(`## [${version}]`);

  return {
    passed: hasVersion1 || hasVersion2,
    message:
      hasVersion1 || hasVersion2
        ? `CHANGELOG 包含 v${version} 更新说明`
        : `CHANGELOG 中未找到 v${version} 的更新说明`,
  };
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
    return {
      passed: status === '',
      message: status === '' ? 'Git 工作区干净' : `存在未提交的更改:\n${status}`,
    };
  } catch (error) {
    return {
      passed: false,
      message: `Git 检查失败: ${error.message}`,
    };
  }
}

function checkTests() {
  try {
    console.log('运行测试中...');
    execSync('npm run test:run', {
      encoding: 'utf-8',
      stdio: 'inherit',
    });
    return {
      passed: true,
      message: '所有测试通过',
    };
  } catch (error) {
    return {
      passed: false,
      message: '测试失败',
    };
  }
}

function checkBuild() {
  try {
    console.log('构建测试中...');
    execSync('npm run build', {
      encoding: 'utf-8',
      stdio: 'inherit',
    });
    return {
      passed: true,
      message: '构建成功',
    };
  } catch (error) {
    return {
      passed: false,
      message: '构建失败',
    };
  }
}

function checkTypeScript() {
  try {
    console.log('TypeScript 类型检查中...');
    execSync('npx tsc --noEmit', {
      encoding: 'utf-8',
      stdio: 'inherit',
    });
    return {
      passed: true,
      message: 'TypeScript 类型检查通过',
    };
  } catch (error) {
    return {
      passed: false,
      message: 'TypeScript 类型检查失败',
    };
  }
}

function main() {
  const args = process.argv.slice(2);
  const skipTests = args.includes('--skip-tests');
  const skipBuild = args.includes('--skip-build');
  const skipGit = args.includes('--skip-git');

  const pkgContent = fs.readFileSync(PACKAGE_PATH, 'utf-8');
  const pkg = JSON.parse(pkgContent);
  const version = pkg.version;

  console.log('╔════════════════════════════════════════╗');
  console.log('║      EmbyTok 发布前检查清单            ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n当前版本: v${version}\n`);

  const checks = [];

  // 1. 版本号格式
  checks.push({ name: '版本号格式', check: () => checkVersionFormat(version) });

  // 2. CHANGELOG
  checks.push({ name: 'CHANGELOG', check: () => checkChangelog(version) });

  // 3. Git 状态
  if (!skipGit) {
    checks.push({ name: 'Git 状态', check: checkGitStatus });
  }

  // 4. TypeScript 类型检查
  checks.push({ name: 'TypeScript', check: checkTypeScript });

  // 5. 测试
  if (!skipTests) {
    checks.push({ name: '测试', check: checkTests });
  }

  // 6. 构建
  if (!skipBuild) {
    checks.push({ name: '构建', check: checkBuild });
  }

  // 执行检查
  let allPassed = true;
  const results = [];

  for (const { name, check } of checks) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`检查: ${name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      const result = check();
      results.push({ name, ...result });

      if (result.passed) {
        console.log(`✅ ${result.message}`);
      } else {
        console.log(`❌ ${result.message}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ 检查失败: ${error.message}`);
      results.push({ name, passed: false, message: error.message });
      allPassed = false;
    }
  }

  // 总结
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log('║              检查总结                  ║');
  console.log('╚════════════════════════════════════════╝\n');

  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  }

  console.log(
    `\n${allPassed ? '✅ 所有检查通过！可以发布。' : '❌ 部分检查失败，请修复后再发布。'}`
  );

  process.exit(allPassed ? 0 : 1);
}

main();
