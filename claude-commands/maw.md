# MAW - Multi-AI Workflow

Execute MAW workflow commands for multi-AI collaboration.

## Task
$ARGUMENTS

## Instructions

Run the MAW CLI command:

```bash
node ~/.maw/maw/bin/maw.js $ARGUMENTS --cd "$PWD"
```

## Available Commands

- `workflow lite "<task>"` - Instant execution
- `workflow plan "<task>"` - Standard planning
- `workflow five-phase "<task>"` - 5-phase collaboration
- `workflow ralph "<prompt>"` - Iterative AI loop
- `delegate codex "<task>"` - Delegate to Codex
- `delegate gemini "<task>"` - Delegate to Gemini
- `run "<task>"` - Smart routing to best AI
- `session list` - List sessions
- `view` - Open dashboard

## Examples

- `/maw workflow lite "fix typos"`
- `/maw workflow ralph "build REST API. Output COMPLETE when done."`
- `/maw delegate codex "write tests"`
- `/maw run "analyze this code"`
