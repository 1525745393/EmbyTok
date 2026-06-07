#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');

function readChangelog() {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    console.error('Error: CHANGELOG.md not found');
    process.exit(1);
  }
  return fs.readFileSync(CHANGELOG_PATH, 'utf-8');
}

function extractLatestVersion(content) {
  // 匹配版本标题格式: ## [1.2.3] 或 ## v1.2.3
  const versionRegex = /^## \[(\d+\.\d+\.\d+)\]|^## v(\d+\.\d+\.\d+)/gm;
  const matches = [];
  let match;

  while ((match = versionRegex.exec(content)) !== null) {
    matches.push({
      version: match[1] || match[2],
      index: match.index,
    });
  }

  if (matches.length === 0) {
    console.error('Error: No versions found in CHANGELOG');
    process.exit(1);
  }

  return matches[0].version;
}

function extractVersionContent(content, version) {
  // 查找指定版本的开始位置（支持两种格式）
  const startRegex = new RegExp(
    `^## \\[${version.replace(/\./g, '\\.')}\\]|^## v${version.replace(/\./g, '\\.')}`,
    'm'
  );
  const startMatch = content.search(startRegex);

  if (startMatch === -1) {
    console.error(`Error: Version v${version} not found in CHANGELOG`);
    process.exit(1);
  }

  const startIndex = startMatch;

  // 查找下一个版本的开始位置（作为结束位置）
  const remainingContent = content.slice(startIndex);
  const nextVersionRegex = /^## \[\d+\.\d+\.\d+\]|^## v\d+\.\d+\.\d+/m;
  const nextMatch = remainingContent.search(nextVersionRegex);

  let endIndex;
  if (nextMatch > 0) {
    endIndex = startIndex + nextMatch;
  } else {
    endIndex = content.length;
  }

  return content.slice(startIndex, endIndex).trim();
}

function generateReleaseBody(version, changelogContent) {
  return `# EmbyTok v${version}

## 📥 下载安装

### Android
- **正式版**: 下载下方的 APK 文件安装
- **Docker**: \`docker pull ${process.env.DOCKER_HUB_USERNAME || 'yourusername'}/embytok:${version}\`

## 📝 更新说明

${changelogContent}

---

## 🚀 功能特性
- TikTok 式竖屏浏览体验
- 支持 Emby/Jellyfin/Plex 服务器
- 智能视频预加载
- 收藏分类管理
- 播放历史记录
- 搜索功能
- 字幕支持
- 播放速度调节

## 🔗 相关链接
- [GitHub 项目](https://github.com/${process.env.GITHUB_REPOSITORY || 'yourrepo/embytok'})
- [完整更新日志](https://github.com/${process.env.GITHUB_REPOSITORY || 'yourrepo/embytok'}/blob/main/CHANGELOG.md)
`;
}

function main() {
  const args = process.argv.slice(2);
  const content = readChangelog();

  let version;
  if (args.length > 0) {
    version = args[0].replace(/^v/, '');
  } else {
    version = extractLatestVersion(content);
  }

  const versionContent = extractVersionContent(content, version);
  const releaseBody = generateReleaseBody(version, versionContent);

  // 输出到 stdout，供 GitHub Actions 使用
  console.log(releaseBody);

  // 也可以保存到文件
  if (args.includes('--save') || args.includes('-s')) {
    const outputPath = path.join(__dirname, '..', 'RELEASE_BODY.md');
    fs.writeFileSync(outputPath, releaseBody);
    console.log(`\n✅ Release body saved to ${outputPath}`);
  }

  // 只输出版本号
  if (args.includes('--version-only') || args.includes('-v')) {
    console.log(`\nVERSION:${version}`);
  }
}

main();
