use clap::{Parser, Subcommand};
use std::sync::Arc;
use tracing::info;
use tracing_subscriber::{fmt, EnvFilter};

use helios_scanner::{
    aws::{scanner::AwsScanner, scanner::ScanOptions},
    cache::ScanCache,
    metrics::init_metrics,
    server::{start, AppState},
};

#[derive(Parser)]
#[command(
    name = "helios-scanner",
    version = "0.1.0",
    author = "Vigneshwar L <applemacbook6sep2004@gmail.com>",
    about = "High-performance cloud infrastructure scanner — part of the HELIOS platform",
    long_about = None
)]
struct Cli {
    /// Log level (trace, debug, info, warn, error)
    #[arg(long, env = "LOG_LEVEL", default_value = "info")]
    log_level: String,

    /// Output format (json, pretty)
    #[arg(long, default_value = "pretty")]
    output: String,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Scan cloud infrastructure resources
    Scan {
        /// AWS regions to scan (comma-separated)
        #[arg(long, env = "AWS_REGIONS", default_value = "us-east-1")]
        regions: String,

        /// AWS account ID
        #[arg(long, env = "AWS_ACCOUNT_ID")]
        account_id: Option<String>,

        /// AWS named profile to use
        #[arg(long, env = "AWS_PROFILE")]
        profile: Option<String>,

        /// IAM role ARN to assume
        #[arg(long, env = "HELIOS_ROLE_ARN")]
        role_arn: Option<String>,

        /// Resource types to scan (comma-separated)
        #[arg(long, default_value = "ec2:instance,ec2:security-group")]
        services: String,
    },

    /// Start the metrics HTTP server
    Serve {
        /// Port to listen on
        #[arg(long, env = "PORT", default_value = "9090")]
        port: u16,

        /// Scan cache TTL in seconds
        #[arg(long, default_value = "300")]
        cache_ttl: u64,
    },

    /// Print version and build information
    Version,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(&cli.log_level));

    if cli.output == "json" {
        tracing_subscriber::fmt()
            .with_env_filter(filter)
            .json()
            .init();
    } else {
        fmt().with_env_filter(filter).with_target(false).init();
    }

    init_metrics();

    match cli.command {
        Commands::Scan {
            regions,
            account_id,
            profile,
            role_arn,
            services,
        } => {
            let region_list: Vec<String> =
                regions.split(',').map(|s| s.trim().to_string()).collect();
            let service_list: Vec<String> =
                services.split(',').map(|s| s.trim().to_string()).collect();

            let opts = ScanOptions {
                regions: region_list.clone(),
                account_id: account_id.unwrap_or_default(),
                profile,
                role_arn,
                enabled_services: service_list,
                max_concurrent_regions: 4,
            };

            let scanner = AwsScanner::new(opts);
            let results = scanner.scan_all().await;

            let mut total_resources = 0;
            let mut total_errors = 0;

            for (region, result) in region_list.iter().zip(results) {
                match result {
                    Ok(scan) => {
                        total_resources += scan.resources.len();
                        total_errors += scan.errors.len();
                        info!(
                            "✓ {} — {} resources, {}ms",
                            region,
                            scan.resources.len(),
                            scan.duration_ms
                        );
                        if cli.output == "json" {
                            println!("{}", serde_json::to_string_pretty(&scan)?);
                        }
                    }
                    Err(e) => {
                        eprintln!("✗ {region} — error: {e}");
                        total_errors += 1;
                    }
                }
            }

            info!(
                "Scan complete: {} total resources, {} errors",
                total_resources, total_errors
            );
        }

        Commands::Serve { port, cache_ttl } => {
            let state = AppState {
                cache: Arc::new(ScanCache::new(cache_ttl)),
                version: env!("CARGO_PKG_VERSION"),
            };
            start(port, state).await?;
        }

        Commands::Version => {
            println!("helios-scanner {}", env!("CARGO_PKG_VERSION"));
            println!("Built with Rust {}", "1.75+");
            println!("Repository: https://github.com/vignesh2027/helios-cloud");
        }
    }

    Ok(())
}
