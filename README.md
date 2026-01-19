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

### 4-Level Workflows
- **Lite**: Instant execution
- **Plan**: Standard planning
- **TDD-Plan**: Test-driven development
- **Brainstorm**: Multi-role ideation

</td>
<td width="50%">

### Sandbox Security
Three security levels:
- `read-only` - Safe exploration
- `workspace-write` - Project changes
- `full-access` - Complete control

### Python Bridges
Robust Python wrappers for Codex and Gemini CLI integration.

### Dashboard
Visual workflow management and monitoring.

</td>
</tr>
</table>

---

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Python >= 3.9
- [Claude Code](https://claude.ai) CLI installed
- [Codex](https://openai.com/codex) CLI (optional)
- [Gemini](https://gemini.google.com) API access (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/SexyERIC0723/Multi-AI-Workflow.git
cd Multi-AI-Workflow

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

### First Run

```bash
# Check available commands
maw --help

# Run a simple workflow
maw workflow lite "Analyze this codebase"

# Delegate to Codex
maw delegate codex "Write unit tests" --cd .

# Multi-AI collaboration
maw collaborate "Refactor authentication module"
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
|   |   |   +-- delegate.ts   # AI delegation
|   |   |   +-- workflow.ts   # Workflow execution
|   |   |   +-- session.ts    # Session management
|   |   |   +-- ...
|   |   +-- core/             # Core modules
|   |   |   +-- workflow-engine.ts
|   |   |   +-- session-manager.ts
|   |   |   +-- skill-registry.ts
|   |   +-- adapters/         # AI adapters
|   +-- bin/maw.js            # CLI executable
|
+-- bridges/                   # Python AI Bridges
|   +-- src/maw_bridges/
|       +-- codex_bridge.py   # Codex CLI wrapper
|       +-- gemini_bridge.py  # Gemini API wrapper
|
+-- codex-lens/               # Code search & indexing
+-- dashboard/                # Web dashboard
+-- .maw/                     # Configuration
```

---

## Commands

### Workflow Commands

| Command | Description | Example |
|---------|-------------|---------|
| `workflow lite <task>` | Instant execution | `maw workflow lite "Fix typos"` |
| `workflow plan <task>` | Standard planning | `maw workflow plan "Add auth"` |
| `workflow brainstorm <topic>` | Multi-role ideation | `maw workflow brainstorm "API design"` |

### Delegation Commands

| Command | Description | Example |
|---------|-------------|---------|
| `delegate <ai> <task>` | Delegate to AI | `maw delegate codex "Write tests"` |
| `collaborate <task>` | Multi-AI collab | `maw collaborate "Refactor module"` |

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
| `bridge start` | Start bridge service |
| `search <query>` | Search codebase |
| `view` | Open dashboard |

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
```

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

## Acknowledgments

- [Claude-Code-Workflow](https://github.com/catlog22/Claude-Code-Workflow) - Workflow engine inspiration
- [GuDaStudio/skills](https://github.com/GuDaStudio/skills) - AI collaboration skills

---

<div align="center">

### Star us on GitHub!

If you find MAW useful, please consider giving us a star. It helps others discover this project!

[![GitHub stars](https://img.shields.io/github/stars/SexyERIC0723/Multi-AI-Workflow?style=social)](https://github.com/SexyERIC0723/Multi-AI-Workflow)

---

**Built by [SexyERIC0723](https://github.com/SexyERIC0723)**

*Making AI collaboration accessible to everyone*

</div>
