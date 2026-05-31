#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { readFile, existsSync } from 'fs';
import { promisify } from 'util';
import { parse as parseYaml } from 'yaml';
import { HeliosConfigSchema, Orchestrator } from '@helios-cloud/core';
import { HeliosCostAnalyzer } from '@helios-cloud/optimizer';
import { HeliosDriftDetector } from '@helios-cloud/drift';
import { createScanCommand } from './commands/scan.js';
import { createOptimizeCommand } from './commands/optimize.js';
import { createDriftCommand } from './commands/drift.js';

const readFileAsync = promisify(readFile);

const HELIOS_BANNER = gradient(['#FF6B35', '#F7C948', '#4ECDC4'])('\n  ██╗  ██╗███████╗██╗     ██╗ ██████╗ ███████╗\n  ██║  ██║██╔════╝██║     ██║██╔═══██╗██╔════╝\n  ███████║█████╗  ██║     ██║██║   ██║███████╗\n  ██╔══██║██╔══╝  ██║     ██║██║   ██║╚════██║\n  ██║  ██║███████╗███████╗██║╚██████╔╝███████║\n  ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝ ╚═════╝ ╚══════╝\n');

async function loadConfig(configPath: string) {
  if (!existsSync(configPath)) {
    return HeliosConfigSchema.parse({
      version: '1',
      providers: {
        aws: {
          regions: [process.env['AWS_REGION'] ?? 'us-east-1'],
          accounts: [{ id: process.env['AWS_ACCOUNT_ID'] ?? '000000000000' }],
        },
      },
    });
  }

  const raw = await readFileAsync(configPath, 'utf-8');
  const parsed = parseYaml(raw);
  return HeliosConfigSchema.parse(parsed);
}

async function main() {
  const program = new Command();

  program
    .name('helios')
    .description('Enterprise Cloud Infrastructure Orchestration Platform')
    .version('0.1.0')
    .option('--config <path>', 'Path to helios.yaml', './helios.yaml')
    .option('--no-color', 'Disable colored output')
    .hook('preAction', (thisCmd) => {
      if (thisCmd.opts()['noColor']) {
        process.env['NO_COLOR'] = '1';
      }
    });

  const configPath = process.argv.find((_, i) => process.argv[i - 1] === '--config') ?? './helios.yaml';

  let orchestrator: Orchestrator;
  try {
    const config = await loadConfig(configPath);
    orchestrator = new Orchestrator({
      config,
      providers: [],
      costAnalyzer: new HeliosCostAnalyzer(),
      driftDetector: new HeliosDriftDetector(),
    });
  } catch (err) {
    console.error(chalk.red(`Configuration error: ${(err as Error).message}`));
    process.exit(1);
  }

  program.addCommand(createScanCommand(orchestrator));
  program.addCommand(createOptimizeCommand(orchestrator));
  program.addCommand(createDriftCommand(orchestrator));

  program.addCommand(
    new Command('version')
      .description('Show version information')
      .action(() => {
        console.log(HELIOS_BANNER);
        console.log(`  Version:  ${chalk.cyan('0.1.0')}`);
        console.log(`  Node.js:  ${chalk.dim(process.version)}`);
        console.log(`  Platform: ${chalk.dim(process.platform)}`);
        console.log();
      }),
  );

  program.addHelpText('before', HELIOS_BANNER);

  await program.parseAsync(process.argv);
}

main().catch(err => {
  console.error(chalk.red.bold('Fatal error:'), err);
  process.exit(1);
});
