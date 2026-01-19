/**
 * Workflow Commands
 *
 * Implements /workflow:* commands for CCW's 4-level workflow system.
 */

import chalk from 'chalk';
import ora from 'ora';
import { WorkflowEngine, WorkflowContext } from '../core/workflow-engine.js';
import { SessionManager } from '../core/session-manager.js';
import { ClaudeAdapter, CodexAdapter, GeminiAdapter } from '../adapters/base-adapter.js';
import { loadConfig } from '../config/loader.js';

/**
 * Execute Level 1: lite workflow
 */
export async function executeLiteWorkflow(task: string): Promise<void> {
  const spinner = ora('Executing lite workflow...').start();

  try {
    const config = loadConfig();
    const engine = new WorkflowEngine();

    // Register adapters
    engine.registerAdapter(new ClaudeAdapter({ name: 'claude', enabled: true }));

    const workflow = WorkflowEngine.createLiteWorkflow(task);
    const context: WorkflowContext = {
      projectRoot: process.cwd(),
      task,
    };

    const result = await engine.execute(workflow, context);

    if (result.success) {
      spinner.succeed(chalk.green('Lite workflow completed'));
      console.log(chalk.dim('\nSession:'), result.session.mawSessionId);
    } else {
      spinner.fail(chalk.red('Workflow failed'));
      console.error(chalk.red(result.error));
    }
  } catch (error) {
    spinner.fail(chalk.red('Workflow error'));
    console.error(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Execute Level 2-3: plan workflows
 */
export async function executePlanWorkflow(
  task: string,
  options: { level: string }
): Promise<void> {
  const spinner = ora(`Executing ${options.level} workflow...`).start();

  try {
    const config = loadConfig();
    const engine = new WorkflowEngine();

    // Register adapters based on config
    engine.registerAdapter(new ClaudeAdapter({ name: 'claude', enabled: true }));

    if (config.ai.codex.enabled) {
      engine.registerAdapter(new CodexAdapter({
        name: 'codex',
        enabled: true,
        cliPath: config.ai.codex.cliPath,
      }));
    }

    if (config.ai.gemini.enabled) {
      engine.registerAdapter(new GeminiAdapter({
        name: 'gemini',
        enabled: true,
        cliPath: config.ai.gemini.cliPath,
      }));
    }

    // Create appropriate workflow
    let workflow;
    switch (options.level) {
      case 'lite-plan':
        workflow = WorkflowEngine.createLitePlanWorkflow(task);
        break;
      case 'tdd-plan':
        workflow = WorkflowEngine.createPlanWorkflow(task);
        workflow.name = 'tdd-plan';
        break;
      default:
        workflow = WorkflowEngine.createPlanWorkflow(task);
    }

    const context: WorkflowContext = {
      projectRoot: process.cwd(),
      task,
    };

    spinner.text = 'Planning...';
    const result = await engine.execute(workflow, context);

    if (result.success) {
      spinner.succeed(chalk.green(`${options.level} workflow completed`));
      console.log(chalk.dim('\nSession:'), result.session.mawSessionId);
      console.log(chalk.dim('Tasks:'), result.tasks.length);

      // Show task summary
      for (const task of result.tasks) {
        const icon = task.status === 'completed' ? '✓' : task.status === 'failed' ? '✗' : '○';
        const color = task.status === 'completed' ? chalk.green : task.status === 'failed' ? chalk.red : chalk.yellow;
        console.log(color(`  ${icon} ${task.description}`));
      }
    } else {
      spinner.fail(chalk.red('Workflow failed'));
      console.error(chalk.red(result.error));
    }
  } catch (error) {
    spinner.fail(chalk.red('Workflow error'));
    console.error(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Execute Level 4: brainstorm workflow
 */
export async function executeBrainstorm(
  topic: string,
  options: { parallel: boolean; roles: string }
): Promise<void> {
  const spinner = ora('Starting brainstorm session...').start();

  try {
    const config = loadConfig();
    const engine = new WorkflowEngine();

    // Register all AI adapters
    engine.registerAdapter(new ClaudeAdapter({ name: 'claude', enabled: true }));

    if (config.ai.codex.enabled) {
      engine.registerAdapter(new CodexAdapter({
        name: 'codex',
        enabled: true,
        cliPath: config.ai.codex.cliPath,
      }));
    }

    if (config.ai.gemini.enabled) {
      engine.registerAdapter(new GeminiAdapter({
        name: 'gemini',
        enabled: true,
        cliPath: config.ai.gemini.cliPath,
      }));
    }

    const workflow = WorkflowEngine.createBrainstormWorkflow(topic, options.parallel);
    const context: WorkflowContext = {
      projectRoot: process.cwd(),
      task: topic,
    };

    spinner.text = options.parallel
      ? 'Running parallel brainstorm with Codex and Gemini...'
      : 'Running sequential brainstorm...';

    const result = await engine.execute(workflow, context);

    if (result.success) {
      spinner.succeed(chalk.green('Brainstorm completed'));
      console.log(chalk.dim('\nSession:'), result.session.mawSessionId);
      console.log(chalk.dim('Roles involved:'), options.roles);
      console.log(chalk.dim('Parallel:'), options.parallel);

      // Show insights from each AI
      for (const task of result.tasks) {
        console.log(chalk.cyan(`\n${task.assignedAI}:`));
        if (task.result) {
          console.log(chalk.dim(task.result.substring(0, 200) + '...'));
        }
      }
    } else {
      spinner.fail(chalk.red('Brainstorm failed'));
      console.error(chalk.red(result.error));
    }
  } catch (error) {
    spinner.fail(chalk.red('Brainstorm error'));
    console.error(error instanceof Error ? error.message : 'Unknown error');
  }
}
