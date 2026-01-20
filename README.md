<div align="center">

# Multi-AI Workflow (MAW)

### *Unleash the Power of AI Collaboration*

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br/>

```
   __  __   _  __        __
  |  \/  | /_\ \ \      / /
  | |\/| |/ _ \ \ \ /\ / /
  | |  | / ___ \ \ V  V /
  |_|  |_/_/   \_\_\_/\_/

  Multi-AI Workflow Framework
```

**Claude + Codex + Gemini = Unstoppable**

[Features](#features) | [Quick Start](#quick-start) | [Architecture](#architecture) | [Commands](#commands) | [Contributing](#contributing)

</div>

---

## What is MAW?

**MAW (Multi-AI Workflow)** is a revolutionary CLI framework that orchestrates multiple AI agents to work together seamlessly. Imagine having Claude's reasoning, Codex's code execution, and Gemini's multimodal capabilities all working in harmony on your projects.

```
+------------------------------------------------------------------+
|                                                                  |
|   [CLAUDE]           [CODEX]            [GEMINI]                 |
|   Planning &         Code Execution     Multimodal               |
|   Reasoning          & Analysis         Analysis                 |
|                                                                  |
|         \                |               /                       |
|          \               |              /                        |
|           \              |             /                         |
|            v             v            v                          |
|         +-----------------------------+                          |
|         |      MAW ORCHESTRATOR       |                          |
|         |   Unified Session Control   |                          |
|         +-----------------------------+                          |
|                        |                                         |
|                        v                                         |
|              +-----------------+                                 |
|              |    YOUR CODE    |                                 |
|              +-----------------+                                 |
|                                                                  |
+------------------------------------------------------------------+
```

---

## Features

<table>
<tr>
<td width="50%">

### Multi-AI Delegation
Delegate tasks to the right AI for the job. Claude plans, Codex executes, Gemini analyzes.

### Unified Sessions
Single session ID syncs across all AI agents. Resume work seamlessly.

### Semantic Routing
Auto-detect the best AI for your task based on content analysis with `maw run`.

</td>
<td width="50%">

### 5-Phase Collaboration
Professional workflow pattern:
1. **Context** - Gather project info
2. **Analysis** - Multi-AI analysis
3. **Prototype** - Initial implementation
4. **Implement** - Full implementation
5. **Audit** - Review & verify

### Sandbox Security
Three security levels:
- `read-only` - Safe exploration
- `workspace-write` - Project changes
- `full-access` - Complete control

</td>
</tr>
<tr>
<td width="50%">

### 4-Level Workflows
- **Lite**: Instant execution
- **Lite-Plan**: Quick planning
- **Plan**: Standard planning
- **TDD-Plan**: Test-driven development
- **Brainstorm**: Multi-role ideation

</td>
<td width="50%">

### Real-time Dashboard
Visual workflow management with:
- Session monitoring
- Workflow tracking
- AI execution logs
- Skills management
- WebSocket live updates

</td>
</tr>
</table>

---

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Python >= 3.9
- [Claude Code](https://claude.ai) CLI installed
- [Codex CLI](https://github.com/openai/codex) (optional)
- [Gemini CLI](https://github.com/google/gemini-cli) (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/SexyERIC0723/Multi-AI-Workflow.git
cd Multi-AI-Workflow

# Install dependencies
npm install

# Build the project
npm run build

# Install Python bridges
pip install -e bridges/

# Link globally (optional)
npm link
```

### First Run

```bash
# Check available commands
maw --help

# Smart routing - auto-selects best AI
maw run "Analyze this codebase structure"

# Run a simple workflow
maw workflow lite "Analyze this codebase"

# 5-phase professional workflow
maw workflow five-phase "Implement user authentication"

# Delegate to specific AI
maw delegate codex "Write unit tests" --cd .
maw delegate gemini "Analyze these screenshots"

# Open the dashboard
maw view
```

---

## Architecture

```
Multi-AI-Workflow/
|
+-- maw/                       # TypeScript CLI Core
|   +-- src/
|   |   +-- cli.ts            # Main CLI entry
|   |   +-- commands/         # Command implementations
|   |   |   +-- delegate.ts   # AI delegation + semantic routing
|   |   |   +-- workflow.ts   # Workflow execution
|   |   |   +-- session.ts    # Session management
|   |   |   +-- ...
|   |   +-- core/             # Core modules
|   |   |   +-- workflow-engine.ts   # 4-level + 5-phase workflows
|   |   |   +-- session-manager.ts
|   |   |   +-- skill-registry.ts
|   |   +-- adapters/         # AI adapters
|   +-- bin/maw.js            # CLI executable
|
+-- bridges/                   # Python AI Bridges
|   +-- src/maw_bridges/
|       +-- codex_bridge.py   # Codex CLI wrapper (streaming)
|       +-- gemini_bridge.py  # Gemini CLI wrapper
|
+-- dashboard/                 # Web Dashboard
|   +-- src/
|   |   +-- server.ts         # Express + WebSocket server
|   |   +-- storage.ts        # SQLite database
|   |   +-- maw-bridge.ts     # CLI data integration
|   |   +-- routes/api.ts     # REST API endpoints
|   +-- public/               # Frontend SPA
|
+-- codex-lens/               # Code search & indexing
+-- .maw/                     # Configuration & skills
    +-- skills/               # Installed skills
```

---

## Commands

### Workflow Commands

| Command | Description | Example |
|---------|-------------|---------|
| `workflow lite <task>` | Instant execution | `maw workflow lite "Fix typos"` |
| `workflow lite-plan <task>` | Quick plan + execute | `maw workflow lite-plan "Add logging"` |
| `workflow plan <task>` | Standard planning | `maw workflow plan "Add auth"` |
| `workflow tdd-plan <task>` | Test-driven development | `maw workflow tdd-plan "Add API endpoint"` |
| `workflow brainstorm <topic>` | Multi-role ideation | `maw workflow brainstorm "API design"` |
| `workflow five-phase <task>` | 5-phase collaboration | `maw workflow five-phase "Refactor auth"` |

### Smart Routing

| Command | Description | Example |
|---------|-------------|---------|
| `run <task>` | Auto-select best AI | `maw run "Write unit tests"` |

The `run` command analyzes your task and routes it to:
- **Codex**: Code execution, tests, debugging
- **Gemini**: Image analysis, documentation review
- **Claude**: Planning, reasoning, architecture

### Delegation Commands

| Command | Description | Example |
|---------|-------------|---------|
| `delegate <ai> <task>` | Delegate to specific AI | `maw delegate codex "Write tests"` |
| `delegate codex <task>` | Send to Codex | `maw delegate codex "Debug this" --cd .` |
| `delegate gemini <task>` | Send to Gemini | `maw delegate gemini "Analyze diagram"` |

### Session Commands

| Command | Description |
|---------|-------------|
| `session list` | List all sessions |
| `session new <name>` | Create new session |
| `session resume <id>` | Resume session |
| `session sync` | Sync across AIs |

### Other Commands

| Command | Description |
|---------|-------------|
| `skill list` | List available skills |
| `skill install <source>` | Install skill |
| `view` | Open dashboard |
| `bridge start` | Start bridge service |

---

## Dashboard

The MAW Dashboard provides real-time visualization of your AI workflows:

```bash
# Start the dashboard
maw view

# Or directly
cd dashboard && npm start
```

### Features

- **Overview**: Stats, AI usage, recent activity
- **Sessions**: Manage workflow sessions with linked AI session IDs
- **Workflows**: Track execution progress and results
- **AI Logs**: View prompts, responses, and token usage
- **Skills**: Manage installed AI collaboration skills

### Real-time Updates

The dashboard uses WebSocket for live updates:
- Session state changes
- Workflow progress
- AI execution status

---

## Configuration

MAW stores configuration in `.maw/config.json`:

```json
{
  "defaultAI": "claude",
  "sandbox": "workspace-write",
  "sessionPersistence": true,
  "bridgePort": 8765,
  "dashboard": {
    "port": 3000,
    "theme": "dark"
  }
}
```

---

## Workflow Levels

```
Level 1: LITE          Level 2: LITE-PLAN      Level 3: PLAN          Level 4: BRAINSTORM
==============        ================        ============          ================

  +---------+          +---------+            +---------+            +---------+
  | Execute |          |  Plan   |            |  Plan   |            | Roles:  |
  | Instant |          |    |    |            |    |    |            | - Arch  |
  +---------+          |    v    |            |    v    |            | - Dev   |
                       | Execute |            | Review  |            | - QA    |
                       +---------+            |    |    |            +---------+
                                              |    v    |                 |
                                              | Execute |            Collaborate
                                              |    |    |
                                              |    v    |
                                              | Verify  |
                                              +---------+


Level 5: FIVE-PHASE
===================

  +---------+    +-----------+    +-----------+    +-----------+    +-------+
  | Context | -> | Analysis  | -> | Prototype | -> | Implement | -> | Audit |
  | Claude  |    | Codex +   |    | Claude    |    | Claude    |    | All   |
  +---------+    | Gemini    |    +-----------+    +-----------+    +-------+
                 +-----------+
```

---

## Skills

MAW supports extensible skills for AI collaboration:

```bash
# List installed skills
maw skill list

# Skills are stored in ~/.maw/skills/
```

### Available Skills

| Skill | Description |
|-------|-------------|
| `collaborating-with-codex` | Codex CLI integration |
| `collaborating-with-gemini` | Gemini CLI integration |

---

## Contributing

We welcome contributions! Please see our contributing guidelines.

```bash
# Fork the repository
# Create your feature branch
git checkout -b feature/amazing-feature

# Commit your changes
git commit -m 'Add amazing feature'

# Push to the branch
git push origin feature/amazing-feature

# Open a Pull Request
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### Star us on GitHub!

If you find MAW useful, please consider giving us a star. It helps others discover this project!

[![GitHub stars](https://img.shields.io/github/stars/SexyERIC0723/Multi-AI-Workflow?style=social)](https://github.com/SexyERIC0723/Multi-AI-Workflow)

---

**Built by [SexyERIC0723](https://github.com/SexyERIC0723)**

*Making AI collaboration accessible to everyone*

</div>
