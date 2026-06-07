/**
 * ============================================
 * EmbyTok 版本管理模块
 * ============================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从 package.json 读取的版本号
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

/**
 * 当前版本号
 * @type {string}
 */
export const VERSION = packageJson.version;

/**
 * 版本号解析
 * @param {string} version - 版本号字符串
 * @returns {{ major: number, minor: number, patch: number, preRelease?: string, build?: string }}
 */
export function parseVersion(version) {
  const regex =
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  const match = version.match(regex);

  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    preRelease: match[4] || undefined,
    build: match[5] || undefined,
  };
}

/**
 * 版本号格式化
 * @param {{ major: number, minor: number, patch: number, preRelease?: string, build?: string }} parsed - 解析后的版本对象
 * @returns {string}
 */
export function formatVersion(parsed) {
  let version = `${parsed.major}.${parsed.minor}.${parsed.patch}`;

  if (parsed.preRelease) {
    version += `-${parsed.preRelease}`;
  }

  if (parsed.build) {
    version += `+${parsed.build}`;
  }

  return version;
}

/**
 * 比较两个版本号
 * @param {string} versionA - 版本号 A
 * @param {string} versionB - 版本号 B
 * @returns {number} -1: A < B, 0: A == B, 1: A > B
 */
export function compareVersions(versionA, versionB) {
  const a = parseVersion(versionA);
  const b = parseVersion(versionB);

  // 比较主版本号
  if (a.major !== b.major) {
    return a.major > b.major ? 1 : -1;
  }

  // 比较次版本号
  if (a.minor !== b.minor) {
    return a.minor > b.minor ? 1 : -1;
  }

  // 比较修订号
  if (a.patch !== b.patch) {
    return a.patch > b.patch ? 1 : -1;
  }

  // 比较预发布版本
  if (a.preRelease && !b.preRelease) {
    return -1; // 有预发布标签的版本更小
  }
  if (!a.preRelease && b.preRelease) {
    return 1;
  }
  if (a.preRelease && b.preRelease) {
    const aParts = a.preRelease.split('.');
    const bParts = b.preRelease.split('.');

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i];
      const bPart = bParts[i];

      if (aPart === undefined) return -1;
      if (bPart === undefined) return 1;

      const aNum = parseInt(aPart, 10);
      const bNum = parseInt(bPart, 10);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        if (aNum !== bNum) {
          return aNum > bNum ? 1 : -1;
        }
      } else {
        if (aPart !== bPart) {
          return aPart > bPart ? 1 : -1;
        }
      }
    }
  }

  return 0;
}

/**
 * 检查是否为预发布版本
 * @param {string} version - 版本号
 * @returns {boolean}
 */
export function isPreRelease(version) {
  const parsed = parseVersion(version);
  return !!parsed.preRelease;
}

/**
 * 获取版本号的主版本号
 * @param {string} version - 版本号
 * @returns {number}
 */
export function getMajor(version) {
  return parseVersion(version).major;
}

/**
 * 获取版本号的次版本号
 * @param {string} version - 版本号
 * @returns {number}
 */
export function getMinor(version) {
  return parseVersion(version).minor;
}

/**
 * 获取版本号的修订号
 * @param {string} version - 版本号
 * @returns {number}
 */
export function getPatch(version) {
  return parseVersion(version).patch;
}

/**
 * 升级版本号
 * @param {string} version - 当前版本号
 * @param {'major' | 'minor' | 'patch' | 'pre' | 'pre-major' | 'pre-minor' | 'pre-patch'} type - 升级类型
 * @param {string} [preId='beta'] - 预发布标识符
 * @returns {string}
 */
export function bumpVersion(version, type, preId = 'beta') {
  const parsed = parseVersion(version);

  switch (type) {
    case 'major':
      parsed.major += 1;
      parsed.minor = 0;
      parsed.patch = 0;
      parsed.preRelease = undefined;
      break;

    case 'minor':
      parsed.minor += 1;
      parsed.patch = 0;
      parsed.preRelease = undefined;
      break;

    case 'patch':
      parsed.patch += 1;
      parsed.preRelease = undefined;
      break;

    case 'pre':
      if (!parsed.preRelease) {
        parsed.patch += 1;
        parsed.preRelease = `${preId}.1`;
      } else {
        const preParts = parsed.preRelease.split('.');
        const lastPart = preParts[preParts.length - 1];
        const num = parseInt(lastPart, 10);

        if (!isNaN(num)) {
          preParts[preParts.length - 1] = (num + 1).toString();
          parsed.preRelease = preParts.join('.');
        } else {
          parsed.preRelease += '.1';
        }
      }
      break;

    case 'pre-major':
      parsed.major += 1;
      parsed.minor = 0;
      parsed.patch = 0;
      parsed.preRelease = `${preId}.1`;
      break;

    case 'pre-minor':
      parsed.minor += 1;
      parsed.patch = 0;
      parsed.preRelease = `${preId}.1`;
      break;

    case 'pre-patch':
      parsed.patch += 1;
      parsed.preRelease = `${preId}.1`;
      break;

    default:
      throw new Error(`Unknown version bump type: ${type}`);
  }

  return formatVersion(parsed);
}

/**
 * 检查是否有新版本可用
 * @param {string} currentVersion - 当前版本
 * @param {string} latestVersion - 最新版本
 * @returns {{ hasUpdate: boolean, isMajor: boolean, isMinor: boolean, isPatch: boolean, isPreRelease: boolean }}
 */
export function checkForUpdate(currentVersion, latestVersion) {
  const comparison = compareVersions(currentVersion, latestVersion);
  const hasUpdate = comparison < 0;

  if (!hasUpdate) {
    return {
      hasUpdate: false,
      isMajor: false,
      isMinor: false,
      isPatch: false,
      isPreRelease: false,
    };
  }

  const current = parseVersion(currentVersion);
  const latest = parseVersion(latestVersion);

  return {
    hasUpdate: true,
    isMajor: latest.major > current.major,
    isMinor: latest.major === current.major && latest.minor > current.minor,
    isPatch:
      latest.major === current.major &&
      latest.minor === current.minor &&
      latest.patch > current.patch,
    isPreRelease: isPreRelease(latestVersion),
  };
}

export default {
  VERSION,
  parseVersion,
  formatVersion,
  compareVersions,
  isPreRelease,
  getMajor,
  getMinor,
  getPatch,
  bumpVersion,
  checkForUpdate,
};
