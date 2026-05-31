import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import type { Orchestrator } from '@helios-cloud/core';
import { printDriftReport, printHeader } from '../ui/output.js';

export function createDriftCommand(orchestrator: Orchestrator): Command {
  const cmd = new Command('drift');

  cmd
    .description('Detect infrastructure drift from IaC state')
    .requiredOption('--state-file <path>', 'Path to Terraform state file (.tfstate)')
    .option('--output <format>', 'Output format: table|json', 'table')
    .option('--severity <level>', 'Minimum severity: critical|high|medium|low')
    .option('--remediate', 'Generate remediation plan')
    .action(async (options) => {
      printHeader('HELIOS — Drift Detector');

      const spinner = ora(`Comparing live state against ${chalk.cyan(options.stateFile)}...`).start();

      try {
        const report = await orchestrator.detectDrift(options.stateFile);
        spinner.stop();

        if (!report) {
          console.log(chalk.yellow('  Drift detector not configured.'));
          return;
        }

        if (options.output === 'json') {
          console.log(JSON.stringify(report, null, 2));
          return;
        }

        printDriftReport(report);

        if (options.remediate && report.hasDrift) {
          console.log();
          console.log(chalk.bold('  Remediation Commands'));
          console.log(chalk.dim('  ─────────────────────────────────────────'));
          for (const d of report.driftedResources) {
            if (d.remediationCommand) {
              console.log(`  ${chalk.cyan('$')} ${d.remediationCommand}`);
            }
          }
        }

        console.log();
        console.log(chalk.dim(`  Checked in ${report.durationMs}ms · State: ${options.stateFile}`));
      } catch (err) {
        spinner.fail(chalk.red(`Drift detection failed: ${(err as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
