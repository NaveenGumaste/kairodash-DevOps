# ============================================================
# KairoDash EC2 Infrastructure
# ============================================================

# ------------------------------------------------------------
# Availability Zones
# ------------------------------------------------------------

data "aws_availability_zones" "available" {
  state = "available"
}

# ------------------------------------------------------------
# VPC
# ------------------------------------------------------------

resource "aws_vpc" "kairo" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "KairoDash-VPC"
    Project     = "KairoDash"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

# ------------------------------------------------------------
# Public Subnet
# ------------------------------------------------------------

resource "aws_subnet" "kairo_public" {
  vpc_id                  = aws_vpc.kairo.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "KairoDash-Public-Subnet"
    Project     = "KairoDash"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

# ------------------------------------------------------------
# Internet Gateway
# ------------------------------------------------------------

resource "aws_internet_gateway" "kairo" {
  vpc_id = aws_vpc.kairo.id

  tags = {
    Name        = "KairoDash-IGW"
    Project     = "KairoDash"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

# ------------------------------------------------------------
# Route Table
# ------------------------------------------------------------

resource "aws_route_table" "kairo_public" {
  vpc_id = aws_vpc.kairo.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.kairo.id
  }

  tags = {
    Name        = "KairoDash-Public-RT"
    Project     = "KairoDash"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_route_table_association" "kairo_public" {
  subnet_id      = aws_subnet.kairo_public.id
  route_table_id = aws_route_table.kairo_public.id
}

# ------------------------------------------------------------
# Security Group
# ------------------------------------------------------------

resource "aws_security_group" "kairo_ec2" {
  name        = "KairoDash-EC2"
  description = "Security group for KairoDash EC2 instance"
  vpc_id      = aws_vpc.kairo.id

  ingress {
    description = "KairoDash application"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH from administrator"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["122.171.22.25/32"]
  }

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "KairoDash-EC2-SG"
    Project     = "KairoDash"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

# ------------------------------------------------------------
# EC2 IAM Role
# ------------------------------------------------------------

resource "aws_iam_role" "kairo_ec2" {
  name = "KairoDashEC2Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ec2.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Project     = "KairoDash"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

# ------------------------------------------------------------
# Systems Manager
# ------------------------------------------------------------

resource "aws_iam_role_policy_attachment" "kairo_ssm" {
  role       = aws_iam_role.kairo_ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# ------------------------------------------------------------
# ECR Pull Permissions
# ------------------------------------------------------------

data "aws_iam_policy_document" "kairo_ecr_pull" {
  statement {
    sid    = "ECRAuthentication"
    effect = "Allow"

    actions = [
      "ecr:GetAuthorizationToken"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "ECRPullKairoDash"
    effect = "Allow"

    actions = [
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer"
    ]

    resources = [
      aws_ecr_repository.kairo.arn
    ]
  }
}

resource "aws_iam_role_policy" "kairo_ecr_pull" {
  name   = "KairoDashECRPull"
  role   = aws_iam_role.kairo_ec2.id
  policy = data.aws_iam_policy_document.kairo_ecr_pull.json
}

# ------------------------------------------------------------
# EC2 Instance Profile
# ------------------------------------------------------------

resource "aws_iam_instance_profile" "kairo_ec2" {
  name = "KairoDashEC2InstanceProfile"
  role = aws_iam_role.kairo_ec2.name

  tags = {
    Project     = "KairoDash"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

# ------------------------------------------------------------
# EC2 Instance
# ------------------------------------------------------------

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["137112412989"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-arm64"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }

  filter {
    name   = "architecture"
    values = ["arm64"]
  }
}

resource "aws_instance" "kairo" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t4g.micro"

  subnet_id                   = aws_subnet.kairo_public.id
  vpc_security_group_ids      = [aws_security_group.kairo_ec2.id]
  associate_public_ip_address = true

  # Existing AWS EC2 key pair
  key_name = "kairodash"

  iam_instance_profile = aws_iam_instance_profile.kairo_ec2.name

  user_data = <<-EOF
    #!/bin/bash

    dnf update -y

    dnf install -y git docker amazon-ssm-agent

    systemctl enable amazon-ssm-agent
    systemctl start amazon-ssm-agent

    systemctl enable docker
    systemctl start docker
    usermod -aG docker ec2-user
  EOF

  root_block_device {
    volume_size = 8
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name        = "KairoDash-Server"
    Project     = "KairoDash"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}
