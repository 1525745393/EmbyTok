# Contributing to EmbyTok

感谢您对 EmbyTok 项目的关注！我们欢迎所有形式的贡献。

## 行为准则

- 尊重他人的意见和贡献
- 保持专业和友善的沟通
- 接受建设性的批评
- 关注对社区最有利的事情

## 如何贡献

### 报告问题

在提交新问题之前，请先搜索现有的 [Issues](../../issues) 以避免重复。

当报告问题时，请包括：

1. 清晰的标题和描述
2. 重现问题的步骤
3. 预期行为和实际行为
4. 截图（如适用）
5. 您的环境信息（浏览器、操作系统、EmbyTok 版本）

### 提交代码

#### 准备工作

1. 从 main 分支创建您的 feature 分支
2. 遵循项目的代码风格（使用 Prettier 格式化）
3. 确保您的代码通过 TypeScript 类型检查

#### 开发流程

1. Fork 本仓库
2. 克隆您的 fork：`git clone https://github.com/YOUR_USERNAME/embytok.git`
3. 创建功能分支：`git checkout -b feature/amazing-feature`
4. 安装依赖：`npm install`
5. 启动开发服务器：`npm run dev`
6. 进行您的修改
7. 提交更改：`git commit -m 'Add some amazing feature'`
8. 推送到分支：`git push origin feature/amazing-feature`
9. 打开一个 Pull Request

#### Pull Request 指南

- PR 标题应该清晰描述更改
- 详细描述 PR 中的更改内容
- 关联相关的 Issue（如适用）
- 确保所有测试通过（我们添加测试后）
- 更新相关文档

## 代码规范

### 命名约定

- 使用有意义的变量名
- React 组件使用 PascalCase
- 函数名和变量名使用 camelCase
- 常量使用 UPPER_SNAKE_CASE
- 文件名与主要导出保持一致

### 代码风格

- 使用 2 空格缩进
- 使用单引号（除非是模板字符串）
- 始终添加分号
- 函数应该简短，每个函数只做一件事
- 避免深层嵌套，提前返回

### 类型安全

- 优先使用 TypeScript
- 避免使用 `any` 类型
- 定义清晰的接口和类型
- 在 [types.ts](file:///workspace/types.ts) 中添加共享类型

### 性能考虑

- 避免不必要的重新渲染（使用 `React.memo`、`useMemo`、`useCallback`）
- 合理使用虚拟滚动处理长列表
- 优化图片和资源加载
- 避免在渲染过程中进行复杂计算

### 注释规范

- 注释应该解释"为什么"而不是"做什么"
- 为公共 API 添加 JSDoc 注释
- 复杂逻辑需要添加注释说明

## 测试

（待添加）当我们添加测试框架后：

- 为新功能添加测试
- 确保现有测试通过
- 优先测试核心功能

## 文档

- 更新相关文档以反映您的更改
- 为新功能添加文档
- 保持文档清晰简洁

## 提交信息规范

请使用清晰的提交信息格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

Type 类型：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式更改（不影响代码运行）
- `refactor`: 重构（既不新增功能也不修复 bug）
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 获取帮助

如果您有任何问题或需要帮助，请随时通过 Issue 提问。

再次感谢您对 EmbyTok 项目的贡献！
