# Ralph Loop - 迭代式 AI 开发循环

启动一个 Ralph Loop，让 AI 持续迭代直到任务完成。

## 任务
$ARGUMENTS

## 执行方式

Ralph Loop 会持续执行以下循环：
1. 向 AI 发送 prompt
2. AI 执行任务
3. 检查输出中是否包含完成标记
4. 如果没有完成 → 继续下一次迭代
5. AI 可以看到自己之前的工作（文件、git 历史）

## 运行命令

```bash
cd $PWD && node ~/.maw/maw/bin/maw.js workflow ralph "$ARGUMENTS" \
  --max-iterations 30 \
  --completion-promise "COMPLETE" \
  --ai auto \
  --verbose
```

## 关键说明

- **完成标记**: 当任务完成时，请在回复中包含 `<promise>COMPLETE</promise>`
- **迭代哲学**: 不追求一次完美，通过循环持续改进
- **失败是数据**: 每次迭代的失败都为下一次提供信息
- **持久性取胜**: 坚持迭代直到成功

## 最佳实践

1. **明确的完成标准**: 在 prompt 中定义可测试的成功标准
2. **增量目标**: 将复杂任务分解为阶段
3. **自我纠正**: 包含测试/调试循环
4. **安全限制**: 使用 --max-iterations 作为安全网

## 适用场景

✅ 适合:
- 有明确成功标准的任务
- 需要迭代改进的任务
- 有自动验证的任务（测试、linter）

❌ 不适合:
- 需要人类判断的任务
- 一次性操作
- 标准不清晰的任务
