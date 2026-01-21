# Delegate task to Codex CLI

Delegate the following task to Codex CLI for code execution, debugging, or testing.

## Task
$ARGUMENTS

## Instructions

Execute the Codex bridge script to delegate this task:

```bash
python ~/.maw/skills/collaborating-with-codex/scripts/codex_bridge.py \
  --cd "$PWD" \
  --PROMPT "$ARGUMENTS" \
  --sandbox workspace-write
```

Parse the JSON output and report:
1. Whether the task succeeded (`success` field)
2. The `SESSION_ID` for follow-up tasks
3. The response from `agent_messages`

If there's an error, report the `error` field.
