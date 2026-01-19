/**
 * Delegate Commands
 *
 * Implements AI delegation (from skills pattern) and collaboration.
 */

import chalk from 'chalk';
import ora from 'ora';
import { WorkflowEngine, WorkflowContext } from '../core/workflow-engine.js';
import { SessionManager } from '../core/session-manager.js';
import { ClaudeAdapter, CodexAdapter, GeminiAdapter, SandboxLevel } from '../adapters/base-adapter.js';
import { loadConfig } from '../config/loader.js';

interface DelegateOptions {
  sandbox: string;
  session?: string;
  cd: string;
  stream: boolean;
}

interface CollaborateOptions {
  planner: string;
  executors: string;
  parallel: boolean;
}

/**
 * Delegate task to external AI
 */
export async function delegateToAI(
  ai: string,
  task: string,
  options: DelegateOptions
): Promise<void> {
  const spinner = ora(`Delegating to ${ai}...`).start();

  try {
    const config = loadConfig();
    const sessionManager = new SessionManager(options.cd);

    // Get or create session
    let session;
    if (options.session) {
      session = await sessionManager.resumeSession(options.session);
      spinner.text = `Resuming session ${options.session.substring(0, 8)}...`;
    } else {
      session = await sessionManager.createSession({
        name: `delegate-${ai}-${Date.now()}`,
        workflowLevel: 'delegate',
        projectRoot: options.cd,
      });
    }

    // Get appropriate adapter
    let adapter;
    switch (ai.toLowerCase()) {
      case 'codex':
        adapter = new CodexAdapter({
          name: 'codex',
          enabled: true,
          cliPath: config.ai.codex.cliPath,
        });
        break;
      case 'gemini':
        adapter = new GeminiAdapter({
          name: 'gemini',
          enabled: true,
          cliPath: config.ai.gemini.cliPath,
        });
        break;
      default:
        spinner.fail(chalk.red(`Unknown AI: ${ai}`));
        console.log(chalk.dim('Available: codex, gemini'));
        return;
    }

    // Check if adapter is available
    const isAvailable = await adapter.isAvailable();
    if (!isAvailable) {
      spinner.fail(chalk.red(`${ai} CLI is not available`));
      console.log(chalk.dim(`Make sure ${ai} CLI is installed and in your PATH`));
      return;
    }

    spinner.text = `${ai} is processing...`;

    // Execute delegation
    const result = await adapter.execute({
      prompt: task,
      workingDir: options.cd,
      sandbox: options.sandbox as SandboxLevel,
      sessionId: session.aiSessions[ai as keyof typeof session.aiSessions],
      stream: options.stream,
    });

    if (result.success) {
      spinner.succeed(chalk.green(`${ai} completed`));

      // Save SESSION_ID for future use
      if (result.sessionId) {
        await sessionManager.linkExternalSession(
          session,
          ai as 'codex' | 'gemini',
          result.sessionId
        );
        console.log(chalk.dim('\nSESSION_ID:'), result.sessionId);
      }

      console.log(chalk.dim('MAW Session:'), session.mawSessionId);
      console.log(chalk.dim('Sandbox:'), options.sandbox);

      // Display result
      console.log(chalk.cyan('\n--- Response ---\n'));
      console.log(result.content);

      // Show artifacts if any
      if (result.artifacts && result.artifacts.length > 0) {
        console.log(chalk.cyan('\n--- Artifacts ---'));
        for (const artifact of result.artifacts) {
          console.log(chalk.dim(`\n[${artifact.type}] ${artifact.language || ''}`));
          console.log(artifact.content.substring(0, 500));
          if (artifact.content.length > 500) {
            console.log(chalk.dim('... (truncated)'));
          }
        }
      }
    } else {
      spinner.fail(chalk.red(`${ai} failed`));
      console.error(chalk.red(result.error));
    }
  } catch (error) {
    spinner.fail(chalk.red('Delegation error'));
    console.error(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Execute multi-AI collaboration
 */
export async function executeCollaboration(
  task: string,
  options: CollaborateOptions
): Promise<void> {
  const executors = options.executors.split(',').map(e => e.trim());

  const spinner = ora(
    `Starting collaboration: ${options.planner} (plan) + ${executors.join(', ')} (execute)`
  ).start();

  try {
    const config = loadConfig();
    const engine = new WorkflowEngine();

    // Register Claude as planner
    engine.registerAdapter(new ClaudeAdapter({ name: 'claude', enabled: true }));

    // Register executor adapters
    for (const executor of executors) {
      switch (executor.toLowerCase()) {
        case 'codex':
          if (config.ai.codex.enabled) {
            engine.registerAdapter(new CodexAdapter({
              name: 'codex',
              enabled: true,
              cliPath: config.ai.codex.cliPath,
            }));
          }
          break;
        case 'gemini':
          if (config.ai.gemini.enabled) {
            engine.registerAdapter(new GeminiAdapter({
              name: 'gemini',
              enabled: true,
              cliPath: config.ai.gemini.cliPath,
            }));
          }
          break;
      }
    }

    // Create collaborate workflow
    const workflow = WorkflowEngine.createCollaborateWorkflow(task);

    // Adjust workflow based on options
    if (!options.parallel) {
      workflow.parallelConfig = {
        maxConcurrency: 1,
        dependencyAware: true,
      };
    }

    const context: WorkflowContext = {
      projectRoot: process.cwd(),
      task,
    };

    spinner.text = 'Claude is planning...';
    const result = await engine.execute(workflow, context);

    if (result.success) {
      spinner.succeed(chalk.green('Collaboration completed'));

      console.log(chalk.dim('\nSession:'), result.session.mawSessionId);
      console.log(chalk.dim('Planner:'), options.planner);
      console.log(chalk.dim('Executors:'), executors.join(', '));
      console.log(chalk.dim('Parallel:'), options.parallel);

      // Show task breakdown
      console.log(chalk.cyan('\n--- Task Breakdown ---'));
      for (const task of result.tasks) {
        const icon = task.status === 'completed' ? '✓' : task.status === 'failed' ? '✗' : '○';
        const color = task.status === 'completed' ? chalk.green : task.status === 'failed' ? chalk.red : chalk.yellow;
        console.log(color(`  ${icon} [${task.assignedAI}] ${task.description}`));
      }

      // Show AI session IDs for continuation
      console.log(chalk.cyan('\n--- Session IDs (for continuation) ---'));
      const aiSessions = result.session.aiSessions;
      for (const [ai, sessionId] of Object.entries(aiSessions)) {
        if (sessionId) {
          console.log(chalk.dim(`  ${ai}:`), sessionId);
        }
      }
    } else {
      spinner.fail(chalk.red('Collaboration failed'));
      console.error(chalk.red(result.error));
    }
  } catch (error) {
    spinner.fail(chalk.red('Collaboration error'));
    console.error(error instanceof Error ? error.message : 'Unknown error');
  }
}
