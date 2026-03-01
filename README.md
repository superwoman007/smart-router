# 🧠 Smart Model Router

**Intelligently route AI requests to the optimal model** — Save 30%+ on costs while maintaining quality.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw Plugin](https://img.shields.io/badge/OpenClaw-Plugin-blue)](https://openclaw.ai)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

[English](#english) | [中文](#中文)

---

## English

### 🚀 What is Smart Model Router?

Smart Model Router is an **OpenClaw plugin** that automatically selects the best AI model for your task based on:

- **Task Type** — Code generation? Use Claude Sonnet. Simple Q&A? Use GPT-4o-mini.
- **Cost** — Save up to 90% by routing to cheaper models when quality difference is minimal
- **Speed** — Get responses 2-3x faster by choosing low-latency models
- **Quality** — Ensure best output for critical tasks

**No code changes needed** — Just enable the plugin and let AI agents use it automatically.

### ✨ Key Features

- 🎯 **Intelligent Routing** — Automatically selects optimal model based on task type
- 💰 **Cost Optimization** — Reduce AI costs by 30-90% without sacrificing quality
- ⚡ **Speed Priority** — Route to fastest models for real-time interactions
- 🛡️ **Auto Fallback** — Automatically switch to backup model if primary fails
- 📊 **Analytics** — Track usage, costs, and performance metrics
- 🔧 **Customizable** — Define your own task-to-model mappings
- 🌐 **Multi-Provider** — Supports OpenAI, Anthropic, Google, DeepSeek, and more

### 📦 Installation

```bash
# Install the plugin
openclaw plugins install @openclaw/smart-model-router

# Or install from local directory
openclaw plugins install -l ./smart-router

# Restart OpenClaw Gateway
openclaw gateway restart
```

### ⚙️ Configuration

Add to your OpenClaw config (`~/.openclaw/config.yaml`):

```yaml
plugins:
  entries:
    smart-model-router:
      enabled: true
      config:
        defaultStrategy: balanced  # cost | speed | quality | balanced
        enableLogging: true
        enableFallback: true
        models:
          - name: gpt-4o
            provider: openai
            costPer1kTokens: 0.005
            avgLatencyMs: 1500
            qualityScore: 4.8
          - name: gpt-4o-mini
            provider: openai
            costPer1kTokens: 0.0005
            avgLatencyMs: 800
            qualityScore: 4.2
          - name: claude-sonnet-4
            provider: anthropic
            costPer1kTokens: 0.003
            avgLatencyMs: 1200
            qualityScore: 4.9
```

### 🎮 Usage

#### As Agent Tool (Automatic)

AI agents will automatically call the `smart_model_router` tool:

```
User: Write a Python function to calculate Fibonacci numbers

AI Agent: [Calls smart_model_router tool]
{
  "task_type": "code_generation",
  "strategy": "balanced"
}

Tool Response:
{
  "selected_model": "claude-sonnet-4",
  "provider": "anthropic",
  "reason": "Best overall balance for code_generation",
  "estimated_cost_per_1k_tokens": 0.003,
  "quality_score": 4.9
}

AI Agent: [Uses claude-sonnet-4 to generate code]
```

#### CLI Commands

```bash
# View routing statistics
openclaw smart-router stats

# View recent routing logs
openclaw smart-router logs -n 50

# Test routing decision
openclaw smart-router test --task code_generation --strategy cost
```

### 📊 Routing Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| **cost** | Cheapest model | High-volume, non-critical tasks |
| **speed** | Fastest response | Real-time chat, interactive apps |
| **quality** | Best output | Critical tasks, complex problems |
| **balanced** | Smart mix of all factors | General use (recommended) |

### 🎯 Task Types

| Task Type | Preferred Models | Use Case |
|-----------|------------------|----------|
| `code_generation` | Claude Sonnet, GPT-4o | Writing code |
| `code_review` | Claude Sonnet, GPT-4o | Reviewing code |
| `qa` | GPT-4o-mini, Claude Haiku | Simple questions |
| `translation` | GPT-4o-mini | Language translation |
| `creative_writing` | Claude Sonnet, GPT-4o | Stories, articles |
| `summarization` | GPT-4o-mini | Text summarization |
| `data_analysis` | GPT-4o, Claude Sonnet | Analyzing data |
| `chat` | GPT-4o-mini, Gemini Flash | Casual conversation |

### 💡 Examples

#### Example 1: Cost Optimization

**Before:** Using GPT-4o for all tasks → $0.005/1k tokens

**After:** Smart routing
- Simple Q&A → GPT-4o-mini ($0.0005/1k) — **90% savings**
- Code generation → Claude Sonnet ($0.003/1k) — **40% savings**
- Chat → Gemini Flash ($0.0002/1k) — **96% savings**

**Result:** 30-70% overall cost reduction

#### Example 2: Speed Priority

**Before:** Using Claude Sonnet for chat → ~1200ms latency

**After:** Smart routing to Gemini Flash → ~500ms latency

**Result:** 2.4x faster responses

#### Example 3: Auto Fallback

**Scenario:** Claude Sonnet API is down

**Before:** Request fails, user sees error

**After:** Automatically switches to GPT-4o

**Result:** 99.9%+ uptime

### 🔧 Advanced Configuration

#### Custom Task Rules

```yaml
plugins:
  entries:
    smart-model-router:
      config:
        taskRules:
          my_custom_task:
            - deepseek-coder
            - gpt-4o
          another_task:
            - gemini-pro
```

#### Add Custom Models

```yaml
plugins:
  entries:
    smart-model-router:
      config:
        models:
          - name: my-custom-model
            provider: custom-provider
            costPer1kTokens: 0.002
            avgLatencyMs: 1000
            qualityScore: 4.5
            enabled: true
```

### 📈 Analytics

View detailed statistics:

```bash
$ openclaw smart-router stats

📊 Smart Model Router Statistics

Total Calls: 1,234
Total Cost: $12.45
Avg Latency: 856ms
Success Rate: 99.8%

Model Usage:
  gpt-4o-mini: 789 (63.9%)
  claude-sonnet-4: 312 (25.3%)
  gemini-flash: 133 (10.8%)

Strategy Usage:
  balanced: 856 (69.4%)
  cost: 234 (19.0%)
  speed: 144 (11.6%)
```

### 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 🙏 Acknowledgments

- Built for [OpenClaw](https://openclaw.ai) — The AI assistant platform
- Inspired by [LiteLLM](https://github.com/BerriAI/litellm)

### 📞 Support

- 📖 [Documentation](https://docs.openclaw.ai/plugins/smart-model-router)
- 💬 [Discord Community](https://discord.com/invite/clawd)
- 🐛 [Issue Tracker](https://github.com/superwoman007/smart-router/issues)

---

## 中文

### 🚀 什么是智能模型路由？

智能模��路由是一个 **OpenClaw 插件**，可以根据以下因素自动为您的任务选择最佳 AI 模型：

- **任务类型** — 代码生成？使用 Claude Sonnet。简单问答？使用 GPT-4o-mini。
- **成本** — 在质量差异最小的情况下，通过路由到更便宜的模型节省高达 90% 的成本
- **速度** — 通过选择低延迟模型，获得 2-3 倍更快的响应
- **质量** — 确保关键任务的最佳输出

**无需修改代码** — 只需启用插件，让 AI 代理自动使用它。

### ✨ 核心功能

- 🎯 **智能路由** — 根据任务类型自动选择最优模型
- 💰 **成本优化** — 在不牺牲质量的情况下降低 30-90% 的 AI 成本
- ⚡ **速度优先** — 为实时交互路由到最快的模型
- 🛡️ **自动回退** — 主模型失败时自动切换到备用模型
- 📊 **分析统计** — 跟踪使用情况、成本和性能指标
- 🔧 **可自定义** — 定义您自己的任务到模型映射
- 🌐 **多提供商** — 支持 OpenAI、Anthropic、Google、DeepSeek 等

### 📦 安装

```bash
# 安装插件
openclaw plugins install @openclaw/smart-model-router

# 或从本地目录安装
openclaw plugins install -l ./smart-router

# 重启 OpenClaw Gateway
openclaw gateway restart
```

### ⚙️ 配置

在 OpenClaw 配置文件中添加（`~/.openclaw/config.yaml`）：

```yaml
plugins:
  entries:
    smart-model-router:
      enabled: true
      config:
        defaultStrategy: balanced  # cost | speed | quality | balanced
        enableLogging: true
        enableFallback: true
        models:
          - name: gpt-4o
            provider: openai
            costPer1kTokens: 0.005
            avgLatencyMs: 1500
            qualityScore: 4.8
          - name: gpt-4o-mini
            provider: openai
            costPer1kTokens: 0.0005
            avgLatencyMs: 800
            qualityScore: 4.2
```

### 🎮 使用方法

#### 作为 Agent 工具（自动）

AI 代理会自动调用 `smart_model_router` 工具：

```
用户：写一个 Python 函数计算斐波那契数列

AI 代理：[调用 smart_model_router 工具]
{
  "task_type": "code_generation",
  "strategy": "balanced"
}

工具响应：
{
  "selected_model": "claude-sonnet-4",
  "provider": "anthropic",
  "reason": "代码生成的最佳平衡选择",
  "estimated_cost_per_1k_tokens": 0.003,
  "quality_score": 4.9
}

AI 代理：[使用 claude-sonnet-4 生成代码]
```

#### CLI 命令

```bash
# 查看路由统计
openclaw smart-router stats

# 查看最近的路由日志
openclaw smart-router logs -n 50

# 测试路由决策
openclaw smart-router test --task code_generation --strategy cost
```

### 📊 路由策略

| 策略 | 描述 | 最适合 |
|------|------|--------|
| **cost** | 最便宜的模型 | 大量非关键任务 |
| **speed** | 最快响应 | 实时聊天、交互式应用 |
| **quality** | 最佳输出 | 关键任务、复杂问题 |
| **balanced** | 所有因素的智能组合 | 通用场景（推荐） |

### 🎯 任务类型

| 任务类型 | 首选模型 | 使用场景 |
|---------|---------|---------|
| `code_generation` | Claude Sonnet, GPT-4o | 编写代码 |
| `code_review` | Claude Sonnet, GPT-4o | 代码审查 |
| `qa` | GPT-4o-mini, Claude Haiku | 简单问答 |
| `translation` | GPT-4o-mini | 语言翻译 |
| `creative_writing` | Claude Sonnet, GPT-4o | 故事、文章 |
| `summarization` | GPT-4o-mini | 文本摘要 |
| `data_analysis` | GPT-4o, Claude Sonnet | 数据分析 |
| `chat` | GPT-4o-mini, Gemini Flash | 日常对话 |

### 💡 示例

#### 示例 1：成本优化

**之前：** 所有任务使用 GPT-4o → $0.005/1k tokens

**之后：** 智能路由
- 简单问答 → GPT-4o-mini ($0.0005/1k) — **节省 90%**
- 代码生成 → Claude Sonnet ($0.003/1k) — **节省 40%**
- 聊天 → Gemini Flash ($0.0002/1k) — **节省 96%**

**结果：** 总体成本降低 30-70%

#### 示例 2：速度优先

**之前：** 聊天使用 Claude Sonnet → ~1200ms 延迟

**之后：** 智能路由到 Gemini Flash → ~500ms 延迟

**结果：** 响应速度提升 2.4 倍

#### 示例 3：自动回退

**场景：** Claude Sonnet API 宕机

**之前：** 请求失败，用户看到错误

**之后：** 自动切换到 GPT-4o

**结果：** 99.9%+ 正常运行时间

### 📈 分析统计

查看详细统计：

```bash
$ openclaw smart-router stats

📊 智能模型路由统计

总调用次数：1,234
总成本：$12.45
平均延迟：856ms
成功率：99.8%

模型使用：
  gpt-4o-mini: 789 (63.9%)
  claude-sonnet-4: 312 (25.3%)
  gemini-flash: 133 (10.8%)

策略使用：
  balanced: 856 (69.4%)
  cost: 234 (19.0%)
  speed: 144 (11.6%)
```

### 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

### 🙏 致谢

- 为 [OpenClaw](https://openclaw.ai) 构建 — AI 助手平台
- 灵感来自 [LiteLLM](https://github.com/BerriAI/litellm)

### 📞 支持

- 📖 [文档](https://docs.openclaw.ai/plugins/smart-model-router)
- 💬 [Discord 社区](https://discord.com/invite/clawd)
- 🐛 [问题追踪](https://github.com/superwoman007/smart-router/issues)

---

**⭐ If you find this plugin useful, please give it a star!**

**⭐ 如果您觉得这个插��有用，请给它一个星标！**
