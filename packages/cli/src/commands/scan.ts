import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import type { Orchestrator } from '@helios-cloud/core';
import { printResourceTable, printHeader, icons } from '../ui/output.js';

export function createScanCommand(orchestrator: Orchestrator): Command {
  const cmd = new Command('scan');

  cmd
    .description('Discover and inventory cloud resources')
    .option('--provider <provider>', 'Cloud provider to scan (aws|gcp|azure)', 'aws')
    .option('--region <region>', 'Specific region to scan')
    .option('--output <format>', 'Output format: table|json|yaml', 'table')
    .option('--type <type>', 'Filter by resource type (e.g. ec2:instance)')
    .option('--no-color', 'Disable colored output')
    .action(async (options) => {
      printHeader('HELIOS — Infrastructure Scan');

      const spinner = ora({
        text: `Scanning ${chalk.cyan(options.provider)} infrastructure...`,
        color: 'cyan',
      }).start();

      const startTime = Date.now();

      try {
        const graph = await orchestrator.scan();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        spinner.succeed(
          `Scan complete in ${chalk.bold(elapsed + 's')} — ${chalk.green.bold(graph.size() + ' resources')}, ${chalk.dim(graph.edgeCount() + ' edges')}`,
        );
        console.log();

        let resources = graph.getAll();
        if (options.type) {
          resources = resources.filter(r => r.type === options.type);
        }
        if (options.region) {
          resources = resources.filter(r => r.region === options.region);
        }

        if (options.output === 'json') {
          console.log(JSON.stringify({ resources, total: resources.length }, null, 2));
          return;
        }

        const summary = graph.getAll();
        const byType: Record<string, number> = {};
        for (const r of summary) byType[r.type] = (byType[r.type] ?? 0) + 1;

        console.log(chalk.bold('  Resource Summary'));
        for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
          console.log(`  ${icons.arrow} ${type.padEnd(30)} ${chalk.bold(String(count))}`);
        }
        console.log();

        if (options.output === 'table') {
          printResourceTable(resources.slice(0, 50));
          if (resources.length > 50) {
            console.log(chalk.dim(`  ... and ${resources.length - 50} more. Use --output json for full output.`));
          }
        }

        const orphaned = graph.getOrphanedResources();
        if (orphaned.length > 0) {
          console.log(
            `  ${icons.warning} ${chalk.yellow(orphaned.length + ' orphaned resources')} detected (no dependencies)`,
          );
        }
      } catch (err) {
        spinner.fail(chalk.red(`Scan failed: ${(err as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
