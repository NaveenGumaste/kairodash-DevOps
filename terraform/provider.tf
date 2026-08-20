provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "KairoDash"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
