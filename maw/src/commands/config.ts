/**
 * Config Commands
 */

import chalk from 'chalk';
import { loadConfig, saveConfig, getConfigValue, setConfigValue } from '../config/loader.js';

export async function getConfig(key?: string): Promise<void> {
  const config = loadConfig();

  if (key) {
    const value = getConfigValue(config, key);
    if (value !== undefined) {
      console.log(chalk.cyan(`${key}:`), JSON.stringify(value, null, 2));
    } else {
      console.log(chalk.red(`Key not found: ${key}`));
    }
  } else {
    console.log(chalk.cyan('Current configuration:'));
    console.log(JSON.stringify(config, null, 2));
  }
}

export async function setConfig(key: string, value: string): Promise<void> {
  const config = loadConfig();

  // Try to parse value as JSON
  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(value);
  } catch {
    parsedValue = value;
  }

  const newConfig = setConfigValue(config, key, parsedValue);
  saveConfig(newConfig);

  console.log(chalk.green('✓ Configuration updated'));
  console.log(chalk.dim(`  ${key} = ${JSON.stringify(parsedValue)}`));
}
