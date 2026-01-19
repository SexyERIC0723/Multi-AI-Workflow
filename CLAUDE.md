# Multi-AI-Workflow (MAW)

This is the MAW project directory. Claude Code can use this file for project context.

## Project Structure

- `maw/` - TypeScript CLI core
- `bridges/` - Python AI bridge scripts
- `.maw/` - Configuration and skills

## Quick Commands

```bash
# Build
cd maw && npm run build

# Run CLI
node maw/bin/maw.js --help

# Delegate to AI
node maw/bin/maw.js delegate codex "task" --cd .
```

## AI Integration

- **Claude**: Native (runs within Claude Code)
- **Codex**: Via `bridges/src/maw_bridges/codex_bridge.py`
- **Gemini**: Via `bridges/src/maw_bridges/gemini_bridge.py`
