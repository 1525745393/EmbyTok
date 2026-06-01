# EmbyTok 代码审查标准规范

## 1. 总则

### 1.1 目的

建立统一的代码质量标准，规范代码审查流程，提高代码可维护性、可读性、安全性和性能。

### 1.2 适用范围

- 所有提交到 main 分支的代码
- 所有 Pull Request/Merge Request
- 重要的重构和新功能开发

### 1.3 审查原则

- **功能性优先**：代码必须能正确工作，无明显 bug
- **可读性至上**：代码应易于理解，减少后续维护成本
- **逐步优化**：不要追求完美，确保每次审查都有进步
- **尊重贡献者**：保持建设性的反馈，尊重不同的编码风格

---

## 2. TypeScript 规范

### 2.1 类型安全

- ✅ **要求**：避免使用 `any` 类型，使用 `unknown` 代替，必要时提供类型守卫
- ✅ **要求**：所有函数参数和返回值必须标注类型
- ✅ **要求**：对象属性类型定义完整，避免使用 `object` 类型
- ✅ **要求**：使用严格模式，在 `tsconfig.json` 中开启 `strict: true`

**示例**：

```typescript
// ❌ 不推荐
function processData(data: any) {
  /* ... */
}

// ✅ 推荐
type UserData = { name: string; age: number };
function processData(data: UserData) {
  /* ... */
}

// 使用类型守卫
function isUserData(data: unknown): data is UserData {
  return typeof data === 'object' && data !== null && 'name' in data && 'age' in data;
}
```

### 2.2 类型定义

- ✅ **要求**：在 `types.ts` 中定义共享类型，避免重复定义
- ✅ **要求**：使用 `interface` 定义对象类型，`type` 用于联合类型和工具类型
- ✅ **要求**：类型命名使用 PascalCase

**示例**：

```typescript
// ✅ 推荐
interface EmbyItem {
  Id: string;
  Name: string;
  Type: string;
}

type FeedType = 'latest' | 'random' | 'favorites';
```

### 2.3 空值处理

- ✅ **要求**：明确处理 null 和 undefined，不使用 `!` 非空断言
- ✅ **要求**：使用可选链操作符 `?.` 和空值合并操作符 `??`

---

## 3. React 组件规范

### 3.1 组件结构

- ✅ **要求**：组件文件应遵循以下结构顺序
  1. 导入语句（按：第三方库 -> 内部模块 -> 样式/静态资源）
  2. 类型定义
  3. 常量定义
  4. 组件函数
  5. 导出语句

### 3.2 函数组件

- ✅ **要求**：使用函数组件和 Hooks，不使用类组件
- ✅ **要求**：组件命名使用 PascalCase
- ✅ **要求**：复杂组件使用 `React.memo()` 优化性能
- ✅ **要求**：Props 接口定义使用 `ComponentNameProps` 格式

**示例**：

```typescript
// ✅ 推荐
interface VideoCardProps {
  item: EmbyItem;
  isActive: boolean;
  onToggleFavorite: () => void;
}

const VideoCard: React.FC<VideoCardProps> = React.memo(({ item, isActive, onToggleFavorite }) => {
  // 组件实现
});
```

### 3.3 Hooks 使用

- ✅ **要求**：自定义 Hook 以 `use` 开头，在 `src/hooks/` 目录
- ✅ **要求**：正确使用 `useCallback` 和 `useMemo` 避免不必要的重渲染
- ✅ **要求**：Hook 调用顺序固定，不要在条件语句中调用 Hook
- ✅ **要求**：清理 effect 中的副作用

**示例**：

```typescript
// ✅ 推荐
const handleClick = useCallback(() => {
  // 处理逻辑
}, [dependency1, dependency2]);

const computedValue = useMemo(() => {
  return calculate(someValue);
}, [someValue]);

useEffect(() => {
  const subscription = someService.subscribe();
  return () => subscription.unsubscribe(); // 清理函数
}, [someService]);
```

### 3.4 Props 传递

- ✅ **要求**：避免传递过多 props，考虑使用 Context 或复合组件
- ✅ **要求**：使用对象解构简化 props 传递
- ✅ **要求**：提供合理的默认值

---

## 4. 代码风格规范

### 4.1 命名约定

- ✅ **要求**：
  - 组件名：PascalCase（VideoCard）
  - 变量名、函数名：camelCase（getVideoUrl）
  - 常量：UPPER_SNAKE_CASE（MAX_RETRIES）
  - 类型名、接口名：PascalCase（EmbyItem）
  - Hook 名：useCamelCase（useVideoControls）
  - 私有属性、方法：下划线前缀（\_getHeaders）

### 4.2 函数规范

- ✅ **要求**：函数应保持简短，单一职责，一般不超过 50 行
- ✅ **要求**：复杂逻辑拆分到独立函数
- ✅ **要求**：避免深层嵌套，使用早返回（Early Return）模式

**示例**：

```typescript
// ✅ 推荐 - 早返回模式
function processItem(item: EmbyItem) {
  if (!item.Id) return null;
  if (!item.Name) return null;

  // 主逻辑
  return processValidItem(item);
}
```

### 4.3 注释规范

- ✅ **要求**：公共 API 必须有 JSDoc 注释
- ✅ **要求**：复杂逻辑需要注释说明
- ✅ **要求**：不要注释显而易见的代码
- ❌ **禁止**：注释掉的代码，应直接删除

**示例**：

```typescript
/**
 * 获取 Emby 视频流 URL
 * @param item 视频项对象
 * @returns 视频流 URL
 */
getVideoUrl(item: EmbyItem): string {
  // 实现
}
```

---

## 5. 性能规范

### 5.1 React 性能

- ✅ **要求**：避免在 render 中创建新对象或函数
- ✅ **要求**：列表渲染使用 key，且 key 稳定
- ✅ **要求**：大型组件拆分，使用懒加载
- ✅ **要求**：合理使用 `React.memo`、`useMemo`、`useCallback`

### 5.2 网络请求

- ✅ **要求**：实现请求缓存和防抖/节流
- ✅ **要求**：错误重试机制
- ✅ **要求**：加载状态和错误处理

### 5.3 资源加载

- ✅ **要求**：图片使用懒加载
- ✅ **要求**：避免不必要的重渲染

---

## 6. 测试规范

### 6.1 测试覆盖

- ✅ **要求**：工具函数必须有单元测试
- ✅ **要求**：核心业务逻辑必须有测试
- ✅ **要求**：新功能必须附带测试
- ✅ **推荐**：目标测试覆盖率不低于 60%

### 6.2 测试质量

- ✅ **要求**：测试应该独立、可重复
- ✅ **要求**：测试描述清晰，说明测试目的
- ✅ **要求**：使用 AAA 模式（Arrange-Act-Assert）

**示例**：

```typescript
describe('formatTimeText', () => {
  it('should correctly format 1 hour video', () => {
    // Arrange
    const runTimeTicks = 3600 * 10000000; // 1 hour

    // Act
    const result = formatTimeText(runTimeTicks);

    // Assert
    expect(result).toBe('1:00:00');
  });
});
```

---

## 7. 安全规范

### 7.1 输入验证

- ✅ **要求**：所有用户输入必须验证和清理
- ✅ **要求**：URL 参数需要正确编码

### 7.2 敏感信息

- ✅ **要求**：不要在代码中硬编码密码、密钥
- ✅ **要求**：错误信息不要泄露内部细节
- ✅ **要求**：不要在日志中记录敏感信息

### 7.3 XSS 防护

- ✅ **要求**：使用 React 的 JSX 自动转义，避免 `dangerouslySetInnerHTML`
- ✅ **要求**：如必须使用，确保内容已正确清理

---

## 8. Git 提交规范

### 8.1 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 8.2 Type 类型

- `feat`：新功能
- `fix`：修复 bug
- `docs`：文档更新
- `style`：代码格式（不影响功能）
- `refactor`：重构
- `test`：测试相关
- `chore`：构建/工具相关

**示例**：

```
feat(video): add smart preload functionality

Adds intelligent video preloading based on network quality
and user behavior patterns.

Closes #123
```

---

## 9. 代码审查 CheckList

### 9.1 功能性检查

- [ ] 代码是否实现了预期功能？
- [ ] 边界条件是否处理正确？
- [ ] 错误处理是否完善？
- [ ] 是否有明显的 bug？

### 9.2 代码质量检查

- [ ] TypeScript 类型是否正确使用？
- [ ] 是否有未使用的变量/导入？
- [ ] 函数是否单一职责？
- [ ] 命名是否清晰易懂？
- [ ] 是否有重复代码可以抽象？

### 9.3 性能检查

- [ ] 是否有不必要的重渲染？
- [ ] 是否有可优化的循环或计算？
- [ ] 网络请求是否合理？

### 9.4 安全性检查

- [ ] 输入是否验证？
- [ ] 敏感信息是否泄露？
- [ ] XSS 风险是否处理？

### 9.5 可维护性检查

- [ ] 注释是否充分？
- [ ] 测试是否足够？
- [ ] 代码是否易于理解？

---

## 10. 审查响应级别

### 10.1 阻塞（必须修改）

- 功能性 bug
- 安全漏洞
- 类型错误
- 测试失败

### 10.2 重要（建议修改）

- 性能问题
- 代码结构问题
- 缺乏测试
- 可维护性问题

### 10.3 轻微（可选修改）

- 代码风格问题
- 命名改进
- 注释完善

---

_文档版本: 1.0_
_最后更新: 2026-06-01_
