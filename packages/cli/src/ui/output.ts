import chalk from 'chalk';
import Table from 'cli-table3';
import boxen from 'boxen';
import type { Resource } from '@helios-cloud/core';
import type { CostRecommendation, CostSummary } from '@helios-cloud/core';
import type { DriftReport } from '@helios-cloud/core';

export const icons = {
  success: chalk.green('✓'),
  error: chalk.red('✗'),
  warning: chalk.yellow('⚠'),
  info: chalk.blue('ℹ'),
  arrow: chalk.cyan('→'),
  dot: chalk.dim('·'),
};

export function printHeader(title: string): void {
  console.log(
    boxen(chalk.bold.cyan(title), {
      padding: { left: 2, right: 2, top: 0, bottom: 0 },
      borderStyle: 'round',
      borderColor: 'cyan',
    }),
  );
  console.log();
}

export function printResourceTable(resources: Resource[]): void {
  const table = new Table({
    head: [
      chalk.bold('ID'),
      chalk.bold('Type'),
      chalk.bold('Name'),
      chalk.bold('Region'),
      chalk.bold('Status'),
      chalk.bold('Cost/mo'),
    ],
    style: { head: [], border: ['dim'] },
    colWidths: [36, 22, 28, 14, 12, 12],
  });

  for (const r of resources) {
    table.push([
      chalk.dim(r.id.length > 34 ? r.id.slice(0, 31) + '...' : r.id),
      r.type,
      r.name ?? chalk.dim('—'),
      r.region,
      formatStatus(r.status),
      r.costPerMonth !== undefined ? chalk.green(`$${r.costPerMonth.toFixed(2)}`) : chalk.dim('—'),
    ]);
  }

  console.log(table.toString());
}

export function printCostSummary(summary: CostSummary): void {
  console.log();
  console.log(chalk.bold('  Cost Summary'));
  console.log(chalk.dim('  ─────────────────────────────────────────'));
  console.log(
    `  Total monthly cost:       ${chalk.yellow.bold(`$${summary.totalMonthlyCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)}`,
  );
  console.log(
    `  Potential monthly savings: ${chalk.green.bold(`$${summary.potentialMonthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${summary.savingsPercentage.toFixed(1)}%)`)}`,
  );
  console.log(
    `  Potential annual savings:  ${chalk.green.bold(`$${summary.potentialAnnualSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)}`,
  );
  console.log();
}

export function printRecommendations(recommendations: CostRecommendation[]): void {
  const table = new Table({
    head: [
      chalk.bold('Resource ID'),
      chalk.bold('Action'),
      chalk.bold('Current Config'),
      chalk.bold('Recommended'),
      chalk.bold('Savings/mo'),
      chalk.bold('Confidence'),
      chalk.bold('Risk'),
    ],
    style: { head: [], border: ['dim'] },
  });

  for (const r of recommendations) {
    const shortId = r.resourceId.length > 28 ? r.resourceId.slice(-28) : r.resourceId;
    table.push([
      chalk.dim(shortId),
      formatAction(r.action),
      r.currentConfig,
      chalk.cyan(r.recommendedConfig),
      chalk.green.bold(`$${r.monthlySavings.toFixed(2)}`),
      `${(r.confidenceScore * 100).toFixed(0)}%`,
      formatRisk(r.risk),
    ]);
  }

  console.log(table.toString());
}

export function printDriftReport(report: DriftReport): void {
  if (!report.hasDrift) {
    console.log(`  ${icons.success} ${chalk.green.bold('No drift detected')} — infrastructure matches state file`);
    return;
  }

  console.log(`  ${icons.warning} ${chalk.yellow.bold(`${report.totalDrifted} drifted resources detected`)}`);
  console.log();

  const sevTable = new Table({
    head: ['Severity', 'Count'],
    style: { head: [], border: ['dim'] },
  });
  const sev = report.bySeverity;
  if (sev.critical > 0) sevTable.push([chalk.red.bold('critical'), chalk.red.bold(String(sev.critical))]);
  if (sev.high > 0) sevTable.push([chalk.redBright('high'), String(sev.high)]);
  if (sev.medium > 0) sevTable.push([chalk.yellow('medium'), String(sev.medium)]);
  if (sev.low > 0) sevTable.push([chalk.dim('low'), String(sev.low)]);
  console.log(sevTable.toString());

  console.log();
  console.log(chalk.bold('  Drifted Resources'));
  const driftTable = new Table({
    head: [chalk.bold('Resource ID'), chalk.bold('Type'), chalk.bold('Drift Type'), chalk.bold('Severity'), chalk.bold('Attributes Changed')],
    style: { head: [], border: ['dim'] },
  });

  for (const d of report.driftedResources) {
    const shortId = d.resourceId.length > 32 ? d.resourceId.slice(-32) : d.resourceId;
    driftTable.push([
      chalk.dim(shortId),
      d.resourceType,
      formatDriftType(d.driftType),
      formatSeverity(d.severity),
      d.attributes.length > 0 ? String(d.attributes.length) : chalk.dim('—'),
    ]);
  }
  console.log(driftTable.toString());
}

function formatStatus(status: Resource['status']): string {
  switch (status) {
    case 'active': return chalk.green('active');
    case 'stopped': return chalk.yellow('stopped');
    case 'terminated': return chalk.red('terminated');
    case 'pending': return chalk.blue('pending');
    case 'error': return chalk.red.bold('error');
    default: return chalk.dim('unknown');
  }
}

function formatAction(action: string): string {
  switch (action) {
    case 'rightsize': return chalk.cyan('rightsize');
    case 'terminate': return chalk.red('terminate');
    case 'schedule': return chalk.blue('schedule');
    case 'reserve': case 'savings-plan': return chalk.green('savings-plan');
    case 'storage-tier': return chalk.yellow('storage-tier');
    case 'delete-snapshot': return chalk.red('delete');
    default: return action;
  }
}

function formatRisk(risk: string): string {
  switch (risk) {
    case 'low': return chalk.green('low');
    case 'medium': return chalk.yellow('medium');
    case 'high': return chalk.red('high');
    default: return risk;
  }
}

function formatDriftType(type: string): string {
  switch (type) {
    case 'config-changed': return chalk.yellow('config-changed');
    case 'resource-deleted': return chalk.red('resource-deleted');
    case 'resource-added': return chalk.blue('resource-added');
    case 'tag-drift': return chalk.dim('tag-drift');
    default: return type;
  }
}

function formatSeverity(severity: string): string {
  switch (severity) {
    case 'critical': return chalk.red.bold('critical');
    case 'high': return chalk.redBright('high');
    case 'medium': return chalk.yellow('medium');
    case 'low': return chalk.dim('low');
    default: return severity;
  }
}
