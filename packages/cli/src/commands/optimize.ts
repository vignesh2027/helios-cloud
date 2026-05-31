import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import type { Orchestrator } from '@helios-cloud/core';
import { printCostSummary, printRecommendations, printHeader } from '../ui/output.js';

export function createOptimizeCommand(orchestrator: Orchestrator): Command {
  const cmd = new Command('optimize');

  cmd
    .description('Analyze cost optimization opportunities')
    .option('--output <format>', 'Output format: table|json', 'table')
    .option('--min-savings <amount>', 'Minimum monthly savings threshold', '0')
    .option('--action <action>', 'Filter by action type (rightsize|terminate|schedule|savings-plan)')
    .option('--top <n>', 'Show top N recommendations', '20')
    .option('--region <region>', 'Filter by region')
    .action(async (options) => {
      printHeader('HELIOS — Cost Optimizer');

      const spinner = ora('Analyzing cost optimization opportunities...').start();

      try {
        const summary = await orchestrator.analyzeCosts();
        spinner.stop();

        if (!summary) {
          console.log(chalk.yellow('  Cost analyzer not configured. Add a metricsProvider in config.'));
          return;
        }

        if (options.output === 'json') {
          console.log(JSON.stringify(summary, null, 2));
          return;
        }

        printCostSummary(summary);

        let recs = summary.recommendations;
        if (options.action) recs = recs.filter(r => r.action === options.action);
        if (options.minSavings) recs = recs.filter(r => r.monthlySavings >= Number(options.minSavings));
        if (options.region) recs = recs.filter(r => r.region === options.region);

        const top = recs.slice(0, Number(options.top));

        console.log(chalk.bold(`  Top ${top.length} Recommendations`));
        console.log();
        printRecommendations(top);

        if (recs.length > top.length) {
          console.log(chalk.dim(`  ... and ${recs.length - top.length} more. Use --top N to see more.`));
        }

        console.log();
        console.log(
          `  ${chalk.bold('Total potential savings:')} ${chalk.green.bold(`$${summary.potentialMonthlySavings.toFixed(2)}/month`)} · ${chalk.green(`$${summary.potentialAnnualSavings.toFixed(0)}/year`)}`,
        );
      } catch (err) {
        spinner.fail(chalk.red(`Optimization analysis failed: ${(err as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
