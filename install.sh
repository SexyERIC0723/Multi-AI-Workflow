#!/bin/bash
#
# MAW (Multi-AI Workflow) Installation Script
# This script installs MAW globally for use in any directory
#

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           MAW - Multi-AI Workflow Installer                ║"
echo "║         Claude + Codex + Gemini Collaboration              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAW_HOME="$HOME/.maw"

# Step 1: Create directories
echo "📁 Creating directories..."
mkdir -p "$MAW_HOME/bin"
mkdir -p "$MAW_HOME/skills"

# Step 2: Install Node.js dependencies and build
echo "📦 Installing Node.js dependencies..."
cd "$SCRIPT_DIR/maw"
npm install --silent

echo "🔨 Building MAW CLI..."
npm run build --silent

# Step 3: Copy MAW CLI to global directory
echo "📋 Installing MAW CLI to ~/.maw/..."
cp -r "$SCRIPT_DIR/maw" "$MAW_HOME/"

# Step 4: Install Python bridges
echo "🐍 Installing Python bridges..."
cd "$SCRIPT_DIR"
if [ -d "bridges" ]; then
    pip install -e bridges/ --quiet 2>/dev/null || pip3 install -e bridges/ --quiet 2>/dev/null || echo "⚠️  Python bridges installation skipped (pip not available)"
fi

# Step 5: Copy skills
echo "🎯 Installing skills..."
if [ -d "$SCRIPT_DIR/.maw/skills" ]; then
    cp -r "$SCRIPT_DIR/.maw/skills/"* "$MAW_HOME/skills/" 2>/dev/null || true
fi

# Step 6: Create global maw command
echo "🔗 Creating global maw command..."
cat > "$MAW_HOME/bin/maw" << 'EOF'
#!/bin/bash
node ~/.maw/maw/bin/maw.js "$@"
EOF
chmod +x "$MAW_HOME/bin/maw"

# Step 7: Install Claude Code slash commands
echo "⚡ Installing Claude Code slash commands..."
CLAUDE_COMMANDS="$HOME/.claude/commands"
mkdir -p "$CLAUDE_COMMANDS"

# Copy slash commands if they exist in the project
if [ -d "$SCRIPT_DIR/claude-commands" ]; then
    cp "$SCRIPT_DIR/claude-commands/"*.md "$CLAUDE_COMMANDS/" 2>/dev/null || true
fi

# Step 8: Add to PATH
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ]; then
    if ! grep -q '\.maw/bin' "$SHELL_RC" 2>/dev/null; then
        echo '' >> "$SHELL_RC"
        echo '# MAW - Multi-AI Workflow' >> "$SHELL_RC"
        echo 'export PATH="$HOME/.maw/bin:$PATH"' >> "$SHELL_RC"
        echo "✅ Added to $SHELL_RC"
    else
        echo "✅ PATH already configured in $SHELL_RC"
    fi
fi

# Step 9: Verify installation
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                 Installation Complete!                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 MAW installed to: $MAW_HOME"
echo ""
echo "🚀 To start using MAW:"
echo ""
echo "   1. Restart your terminal or run:"
echo "      source $SHELL_RC"
echo ""
echo "   2. Verify installation:"
echo "      maw --version"
echo ""
echo "   3. Try a command:"
echo "      maw workflow lite \"Hello MAW\""
echo ""
echo "📚 Documentation: https://github.com/SexyERIC0723/Multi-AI-Workflow"
echo ""
