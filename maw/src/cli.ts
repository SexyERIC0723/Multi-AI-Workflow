/**
 * Multi-AI Workflow (MAW) CLI
 *
 * Main CLI module using Commander.js for command parsing.
 * Integrates CCW's workflow engine with skills' AI bridging capabilities.
 */

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Get package version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const program = new Command();

program
  .name('maw')
  .description('Multi-AI Workflow - Claude + Codex + Gemini Collaboration Framework')
  .version(packageJson.version);

// ============================================
// Workflow Commands (from CCW's 4-level system)
// ============================================

const workflowCmd = program
  .command('workflow')
  .description('Execute AI-powered workflows');

workflowCmd
  .command('lite <task>')
  .description('Level 1: Instant execution, no artifacts')
  .action(async (task: string) => {
    const { executeLiteWorkflow } = await import('./commands/workflow.js');
    await executeLiteWorkflow(task);
  });

workflowCmd
  .command('plan <task>')
  .description('Level 3: Standard planning with session persistence')
  .option('-l, --level <level>', 'Workflow level (lite-plan|plan|tdd-plan)', 'plan')
  .action(async (task: string, options: { level: string }) => {
    const { executePlanWorkflow } = await import('./commands/workflow.js');
    await executePlanWorkflow(task, options);
  });

workflowCmd
  .command('brainstorm <topic>')
  .description('Level 4: Multi-role brainstorming')
  .option('-p, --parallel', 'Enable parallel execution', false)
  .option('-r, --roles <roles>', 'Comma-separated roles', 'architect,developer,reviewer')
  .action(async (topic: string, options: { parallel: boolean; roles: string }) => {
    const { executeBrainstorm } = await import('./commands/workflow.js');
    await executeBrainstorm(topic, options);
  });

workflowCmd
  .command('five-phase <task>')
  .description('5-Phase collaboration (Skills pattern): Context → Analysis → Prototype → Implement → Audit')
  .option('-p, --parallel', 'Enable parallel analysis', true)
  .action(async (task: string, options: { parallel: boolean }) => {
    const { executeFivePhase } = await import('./commands/workflow.js');
    await executeFivePhase(task, options);
  });

// ============================================
// Ralph Loop Commands (Iterative AI Loop)
// ============================================

workflowCmd
  .command('ralph <prompt>')
  .description('Ralph Loop: Iterative AI execution until completion promise')
  .option('-n, --max-iterations <n>', 'Maximum iterations', '50')
  .option('-c, --completion-promise <text>', 'Completion signal text', 'COMPLETE')
  .option('-a, --ai <ai>', 'AI to use (claude|codex|gemini|auto)', 'auto')
  .option('--cd <dir>', 'Working directory', process.cwd())
  .option('-s, --sandbox <level>', 'Sandbox level', 'workspace-write')
  .option('-v, --verbose', 'Show detailed output', false)
  .option('-d, --delay <ms>', 'Delay between iterations (ms)', '1000')
  .action(async (prompt: string, options) => {
    const { executeRalphLoop } = await import('./commands/ralph.js');
    await executeRalphLoop(prompt, {
      maxIterations: parseInt(options.maxIterations, 10),
      completionPromise: options.completionPromise,
      ai: options.ai,
      cd: options.cd,
      sandbox: options.sandbox,
      verbose: options.verbose,
      delay: parseInt(options.delay, 10),
    });
  });

program
  .command('cancel-ralph')
  .description('Cancel the active Ralph loop')
  .action(async () => {
    const { cancelRalphLoop } = await import('./commands/ralph.js');
    const cancelled = cancelRalphLoop();
    if (cancelled) {
      console.log('Ralph loop cancellation requested.');
    } else {
      console.log('No active Ralph loop to cancel.');
    }
  });

// ============================================
// AI Delegation Commands (from skills)
// ============================================

// Semantic routing - auto-select AI based on task description (CCW feature)
program
  .command('run <task>')
  .description('Auto-route task to best AI using semantic analysis')
  .option('--cd <dir>', 'Working directory', process.cwd())
  .option('-s, --sandbox <level>', 'Sandbox level', 'read-only')
  .option('--prefer <ai>', 'Preferred AI if ambiguous')
  .action(async (task: string, options) => {
    const { semanticRoute } = await import('./commands/delegate.js');
    await semanticRoute(task, options);
  });

program
  .command('delegate <ai> <task>')
  .description('Delegate task to external AI (codex|gemini)')
  .option('-s, --sandbox <level>', 'Sandbox level (read-only|workspace-write|full-access)', 'read-only')
  .option('--session <id>', 'Resume existing session')
  .option('--cd <dir>', 'Working directory', process.cwd())
  .option('--stream', 'Enable streaming output', false)
  .action(async (ai: string, task: string, options) => {
    const { delegateToAI } = await import('./commands/delegate.js');
    await delegateToAI(ai, task, options);
  });

program
  .command('collaborate <task>')
  .description('Multi-AI collaboration (Claude plans, Codex/Gemini execute)')
  .option('--planner <ai>', 'Planning AI', 'claude')
  .option('--executors <ais>', 'Comma-separated executor AIs', 'codex,gemini')
  .option('-p, --parallel', 'Execute in parallel', true)
  .action(async (task: string, options) => {
    const { executeCollaboration } = await import('./commands/delegate.js');
    await executeCollaboration(task, options);
  });

// ============================================
// Session Management (Unified CCW + skills)
// ============================================

const sessionCmd = program
  .command('session')
  .description('Manage workflow sessions');

sessionCmd
  .command('list')
  .description('List all sessions')
  .option('-a, --all', 'Include archived sessions', false)
  .action(async (options: { all: boolean }) => {
    const { listSessions } = await import('./commands/session.js');
    await listSessions(options);
  });

sessionCmd
  .command('new <name>')
  .description('Create new session')
  .option('-l, --level <level>', 'Workflow level', 'plan')
  .action(async (name: string, options: { level: string }) => {
    const { createSession } = await import('./commands/session.js');
    await createSession(name, options);
  });

sessionCmd
  .command('resume <id>')
  .description('Resume existing session (syncs all AI SESSION_IDs)')
  .action(async (id: string) => {
    const { resumeSession } = await import('./commands/session.js');
    await resumeSession(id);
  });

sessionCmd
  .command('sync')
  .description('Sync SESSION_IDs across all AIs')
  .action(async () => {
    const { syncSessions } = await import('./commands/session.js');
    await syncSessions();
  });

// ============================================
// Skill Management
// ============================================

const skillCmd = program
  .command('skill')
  .description('Manage AI skills');

skillCmd
  .command('list')
  .description('List available skills')
  .action(async () => {
    const { listSkills } = await import('./commands/skill.js');
    await listSkills();
  });

skillCmd
  .command('install <source>')
  .description('Install skill from source')
  .option('--scope <scope>', 'Installation scope (user|project)', 'user')
  .option('-s, --skills <names>', 'Specific skills to install')
  .action(async (source: string, options) => {
    const { installSkill } = await import('./commands/skill.js');
    await installSkill(source, options);
  });

skillCmd
  .command('create <name>')
  .description('Create new skill from template')
  .action(async (name: string) => {
    const { createSkill } = await import('./commands/skill.js');
    await createSkill(name);
  });

// ============================================
// Bridge Service (Python HTTP/WebSocket)
// ============================================

const bridgeCmd = program
  .command('bridge')
  .description('Manage AI bridge service');

bridgeCmd
  .command('start')
  .description('Start bridge service')
  .option('-p, --port <port>', 'Service port', '8765')
  .action(async (options: { port: string }) => {
    const { startBridge } = await import('./commands/bridge.js');
    await startBridge(options);
  });

bridgeCmd
  .command('status')
  .description('Check bridge service status')
  .action(async () => {
    const { bridgeStatus } = await import('./commands/bridge.js');
    await bridgeStatus();
  });

bridgeCmd
  .command('stop')
  .description('Stop bridge service')
  .action(async () => {
    const { stopBridge } = await import('./commands/bridge.js');
    await stopBridge();
  });

// ============================================
// Search Commands (CodexLens)
// ============================================

program
  .command('search <query>')
  .description('Search codebase using CodexLens')
  .option('-m, --mode <mode>', 'Search mode (fulltext|semantic|hybrid)', 'hybrid')
  .option('-l, --limit <n>', 'Max results', '10')
  .action(async (query: string, options) => {
    const { searchCode } = await import('./commands/search.js');
    await searchCode(query, options);
  });

program
  .command('index')
  .description('Index codebase for search')
  .option('-f, --full', 'Full reindex', false)
  .action(async (options: { full: boolean }) => {
    const { indexCodebase } = await import('./commands/search.js');
    await indexCodebase(options);
  });

// ============================================
// Dashboard
// ============================================

program
  .command('view')
  .description('Open dashboard in browser')
  .option('-p, --port <port>', 'Dashboard port', '3000')
  .option('--no-browser', 'Do not open browser')
  .action(async (options) => {
    const { openDashboard } = await import('./commands/view.js');
    await openDashboard(options);
  });

// ============================================
// Configuration
// ============================================

const configCmd = program
  .command('config')
  .description('Manage configuration');

configCmd
  .command('get [key]')
  .description('Get configuration value')
  .action(async (key?: string) => {
    const { getConfig } = await import('./commands/config.js');
    await getConfig(key);
  });

configCmd
  .command('set <key> <value>')
  .description('Set configuration value')
  .action(async (key: string, value: string) => {
    const { setConfig } = await import('./commands/config.js');
    await setConfig(key, value);
  });

// ============================================
// Installation
// ============================================

program
  .command('install')
  .description('Install MAW to user or project')
  .option('-m, --mode <mode>', 'Installation mode (Global|Project)', 'Global')
  .option('--with-codex', 'Include Codex skill')
  .option('--with-gemini', 'Include Gemini skill')
  .action(async (options) => {
    const { install } = await import('./commands/install.js');
    await install(options);
  });

// Run CLI
export function run(argv: string[]): void {
  program.parse(argv);
}

export { program };
