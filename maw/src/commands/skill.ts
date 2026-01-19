/**
 * Skill Commands
 */

import chalk from 'chalk';
import { SkillRegistry } from '../core/skill-registry.js';

/**
 * List available skills
 */
export async function listSkills(): Promise<void> {
  const registry = new SkillRegistry();
  await registry.discover();

  const skills = registry.listSkills();

  if (skills.length === 0) {
    console.log(chalk.dim('No skills found.'));
    console.log(chalk.dim('Install skills with: maw skill install <source>'));
    return;
  }

  console.log(chalk.bold('\nAvailable Skills:\n'));

  // Group by type
  const groups = {
    'built-in': skills.filter(s => s.type === 'built-in'),
    'ai-bridge': skills.filter(s => s.type === 'ai-bridge'),
    'custom': skills.filter(s => s.type === 'custom'),
  };

  for (const [type, typeSkills] of Object.entries(groups)) {
    if (typeSkills.length === 0) continue;

    console.log(chalk.cyan(`[${type}]`));
    for (const skill of typeSkills) {
      const status = skill.enabled ? chalk.green('●') : chalk.red('○');
      console.log(`  ${status} ${skill.name} ${chalk.dim(`v${skill.version}`)}`);
      console.log(chalk.dim(`    ${skill.description}`));

      if (skill.type === 'ai-bridge' && skill.bridge) {
        console.log(chalk.dim(`    Target AI: ${skill.bridge.targetAI}`));
      }
    }
    console.log();
  }

  console.log(chalk.dim(`Total: ${skills.length} skill(s)`));
}

/**
 * Install skill
 */
export async function installSkill(
  source: string,
  options: { scope: string; skills?: string }
): Promise<void> {
  const registry = new SkillRegistry();

  console.log(chalk.dim(`Installing from: ${source}`));
  console.log(chalk.dim(`Scope: ${options.scope}`));

  try {
    await registry.install(source, {
      scope: options.scope as 'user' | 'project',
      skills: options.skills?.split(','),
    });

    console.log(chalk.green('✓ Skill installed'));

    // Re-discover and list
    await registry.discover();
    const skills = registry.listSkills();
    console.log(chalk.dim(`Total skills: ${skills.length}`));
  } catch (error) {
    console.error(chalk.red('Failed to install:'), error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Create new skill from template
 */
export async function createSkill(name: string): Promise<void> {
  const registry = new SkillRegistry();

  try {
    const path = await registry.createFromTemplate(name);
    console.log(chalk.green('✓ Skill created'));
    console.log(chalk.dim('  Path:'), path);
    console.log(chalk.dim('\nEdit SKILL.md and scripts/main.py to customize.'));
  } catch (error) {
    console.error(chalk.red('Failed to create skill:'), error instanceof Error ? error.message : 'Unknown error');
  }
}
