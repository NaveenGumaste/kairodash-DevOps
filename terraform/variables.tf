variable "aws_region" {
  description = "AWS region where KairoDash infrastructure will be deployed."
  type        = string
}

variable "environment" {
  description = "Deployment environment."
  type        = string

  default = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}
