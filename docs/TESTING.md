# 测试指南

本文档介绍 EmbyTok 项目的测试设置和最佳实践。

## 技术栈

- **测试框架**: Vitest
- **React 测试库**: @testing-library/react
- **DOM 模拟**: happy-dom
- **断言库**: @testing-library/jest-dom

## 安装依赖

```bash
npm install
```

所有测试相关的依赖已经在 `package.json` 中配置。

## 运行测试

### 运行所有测试

```bash
npm run test
```

### 运行测试并观察文件变化

```bash
npm run test
```

### 运行测试并显示覆盖率报告

```bash
npm run test:coverage
```

### 以 UI 模式运行测试

```bash
npm run test:ui
```

### 单次运行所有测试（CI 模式）

```bash
npm run test:run
```

## 测试结构

### 测试文件位置

测试文件位于源代码旁边的 `__tests__` 目录中：

```
components/
└── __tests__/
    ├── Login.test.tsx
    └── VideoPlayer.test.tsx
src/
├── hooks/
│   └── __tests__/
│       ├── useConfig.test.ts
│       ├── useFavorites.test.ts
│       └── useLocalStorageState.test.ts
services/
└── __tests__/
    ├── EmbyClient.test.ts
    └── PlexClient.test.ts
utils/
└── __tests__/
    ├── media.test.ts
    ├── time.test.ts
    └── device.test.ts
```

## 测试命名约定

- 测试文件命名：`<module-name>.test.ts` 或 `<module-name>.test.tsx`
- 测试描述使用中文，便于团队理解
- 使用 `describe` 对测试进行分组
- 使用 `it` 或 `test` 描述单个测试用例

## 测试类型

### 1. 单元测试

测试独立的函数、工具类和纯组件。

示例：

- 工具函数测试
- API 客户端测试
- 自定义 Hook 测试

### 2. 组件测试

测试 React 组件的渲染和交互行为。

### 3. 集成测试

测试多个组件或模块之间的交互。

## 测试最佳实践

### 1. 隔离测试

每个测试应该独立运行，不依赖其他测试的执行顺序。

```typescript
beforeEach(() => {
  // 重置 mocks 和状态
  localStorage.clear();
  vi.clearAllMocks();
});
```

### 2. 使用 Arrange-Act-Assert 模式

```typescript
it('should do something', () => {
  // Arrange - 准备测试数据和环境
  const input = 'test';

  // Act - 执行被测试的代码
  const result = functionUnderTest(input);

  // Assert - 验证结果
  expect(result).toBe('expected');
});
```

### 3. Mock 外部依赖

```typescript
vi.mock('../../../services/clientFactory');

const mockClient = {
  authenticate: vi.fn(),
  getVideos: vi.fn(),
};

(ClientFactory.create as any).mockReturnValue(mockClient);
```

### 4. 测试用户交互，而不是实现细节

```typescript
// 好的做法 - 测试用户能看到和做的
fireEvent.click(screen.getByText('登录'));
expect(screen.getByText('欢迎')).toBeInTheDocument();

// 避免 - 测试内部实现
expect(component.state.isLoggedIn).toBe(true);
```

### 5. 保持测试简单和快速

- 每个测试只测试一件事
- 避免不必要的渲染
- 使用适当的 mock 减少外部依赖

## 编写新测试

### 1. 工具函数测试

```typescript
import { describe, it, expect } from 'vitest';
import { yourFunction } from '../your-file';

describe('yourFunction', () => {
  it('should handle normal case', () => {
    expect(yourFunction('input')).toBe('output');
  });

  it('should handle edge cases', () => {
    expect(yourFunction(null)).toBe('');
  });
});
```

### 2. React Hook 测试

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useYourHook } from '../useYourHook';

describe('useYourHook', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useYourHook());
    expect(result.current.someValue).toBe('initial');
  });

  it('should update state when called', () => {
    const { result } = renderHook(() => useYourHook());

    act(() => {
      result.current.updateValue('newValue');
    });

    expect(result.current.someValue).toBe('newValue');
  });
});
```

### 3. API 客户端测试

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YourClient } from '../YourClient';

describe('YourClient', () => {
  let client: YourClient;

  beforeEach(() => {
    client = new YourClient(config);
    global.fetch = vi.fn();
  });

  it('should make API call correctly', async () => {
    const mockResponse = { data: 'test' };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await client.getData();
    expect(result).toEqual(mockResponse);
  });
});
```

## 覆盖率

当前的测试覆盖率目标：

- 工具函数: 80%+
- API 客户端: 70%+
- 自定义 Hooks: 70%+

运行 `npm run test:coverage` 查看详细的覆盖率报告。

## 持续集成

（待配置）在 CI/CD 流程中，每次提交都会自动运行所有测试，确保代码质量。

## 常见问题

### 测试 localStorage

```typescript
beforeEach(() => {
  localStorage.clear();
});
```

### Mock window 对象

```typescript
Object.defineProperty(window, 'innerWidth', {
  value: 1920,
  configurable: true,
});
```

### Mock fetch

```typescript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => mockData,
});
```

## 下一步

- [ ] 为更多 React 组件添加集成测试（如 VideoControls、VideoFeed 等）
- [ ] 为剩余的自定义 Hooks 添加测试
- [ ] 配置 CI/CD 自动运行测试
- [ ] 添加 E2E 测试
- [ ] 提高测试覆盖率到 80% 以上
- [ ] 为移动和电视模式添加专门的测试用例
- [ ] 配置测试覆盖率报告和监控
