output "ecr_repository_name" {
  description = "ECR repository name."
  value       = aws_ecr_repository.kairo.name
}

output "ecr_repository_url" {
  description = "ECR repository URL."
  value       = aws_ecr_repository.kairo.repository_url
}

output "ecr_repository_arn" {
  description = "ECR repository ARN."
  value       = aws_ecr_repository.kairo.arn
}

output "ec2_instance_id" {
  description = "KairoDash EC2 instance ID."
  value       = aws_instance.kairo.id
}
