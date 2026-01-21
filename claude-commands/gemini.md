# Delegate task to Gemini (via proxy API)

Delegate the following task to Gemini AI for analysis.

## Task
$ARGUMENTS

## Instructions

Execute the Gemini bridge script:

```bash
python ~/.maw/skills/collaborating-with-gemini/scripts/gemini_bridge.py \
  --cd "$PWD" \
  --PROMPT "$ARGUMENTS" \
  --model "gemini-2.5-flash"
```

## Available Models
- `gemini-2.5-flash` - Fast, efficient (default)
- `gemini-2.5-flash-lite` - Lightweight
- `gemini-2.5-pro` - Advanced reasoning
- `gemini-3-flash-preview` - Latest flash
- `gemini-3-pro-preview` - Latest pro

Parse the JSON output and report:
1. Whether the task succeeded (`success` field)
2. The `SESSION_ID` for follow-up tasks
3. The response from `agent_messages`
4. Token usage information

If there's an error, report the `error` field.
