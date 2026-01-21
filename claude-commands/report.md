# Generate Report with Diagrams

Generate a professional report from research content using multi-AI collaboration.

## Topic
$ARGUMENTS

## Instructions

This command generates a complete report with auto-generated diagrams.

### Step 1: Gather Content
Ask the user for their research content, notes, or knowledge points if not already provided.

### Step 2: Generate Report
Execute the report generator:

```bash
python ~/.maw/skills/report-generator/report_generator.py \
  --topic "$ARGUMENTS" \
  --content "USER_PROVIDED_CONTENT" \
  --output "report.md"
```

### Step 3: Review Output
- Check the generated `report.md`
- Review any Mermaid diagrams
- Verify section structure

## Features
- Auto-generates report structure from content
- Creates Mermaid diagrams for concepts
- Professional academic style
- Multi-AI collaboration (Claude + Gemini)

## Example Usage
```
/report "Machine Learning Pipeline Architecture"
```
Then provide your research notes when prompted.
