terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "my-terraform-state-bucket"
    key            = "helios/examples/complete/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      "Project"          = "helios"
      "ManagedBy"        = "terraform"
      "Environment"      = var.environment
      "Owner"            = "platform-engineering"
    }
  }
}

locals {
  cluster_name = "${var.project_name}-${var.environment}"

  common_tags = {
    "Project"     = var.project_name
    "Environment" = var.environment
  }
}

# ── VPC ──────────────────────────────────────────────────────────────────────

module "vpc" {
  source = "../../modules/vpc"

  name         = "${var.project_name}-${var.environment}"
  cidr_block   = "10.0.0.0/16"
  cluster_name = local.cluster_name

  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

  enable_nat_gateway       = true
  single_nat_gateway       = var.environment == "dev"
  enable_flow_logs         = true
  flow_logs_retention_days = 30

  tags = local.common_tags
}

# ── EKS ──────────────────────────────────────────────────────────────────────

module "eks" {
  source = "../../modules/eks"

  cluster_name       = local.cluster_name
  kubernetes_version = "1.29"
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = concat(module.vpc.public_subnet_ids, module.vpc.private_subnet_ids)
  private_subnet_ids = module.vpc.private_subnet_ids

  endpoint_private_access = true
  endpoint_public_access  = var.environment != "prod"

  node_groups = {
    system = {
      instance_types = ["m5.large"]
      capacity_type  = "ON_DEMAND"
      disk_size      = 50
      desired_size   = 2
      min_size       = 2
      max_size       = 4
      labels         = { role = "system" }
      taints         = []
    }
    workers = {
      instance_types = var.environment == "prod" ? ["m5.2xlarge", "m5a.2xlarge"] : ["m5.xlarge"]
      capacity_type  = var.environment == "prod" ? "ON_DEMAND" : "SPOT"
      disk_size      = 100
      desired_size   = var.environment == "prod" ? 6 : 2
      min_size       = var.environment == "prod" ? 3 : 1
      max_size       = var.environment == "prod" ? 50 : 10
      labels         = { role = "worker", environment = var.environment }
      taints         = []
    }
  }

  tags = local.common_tags
}

# ── Variables ─────────────────────────────────────────────────────────────────

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "helios"
}

variable "environment" {
  description = "Environment name (dev|staging|prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "eks_cluster_endpoint" {
  value     = module.eks.cluster_endpoint
  sensitive = true
}

output "eks_cluster_name" {
  value = module.eks.cluster_id
}

output "kubeconfig_command" {
  description = "Command to update kubeconfig"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_id}"
}
