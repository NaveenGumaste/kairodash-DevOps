data "aws_caller_identity" "current" {}

# ============================================================
# GitHub Actions OIDC Identity Provider
# ============================================================

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]
}

# ============================================================
# GitHub Actions Trust Policy
# ============================================================

data "aws_iam_policy_document" "github_actions_trust" {
  statement {
    sid    = "GitHubActionsOIDC"
    effect = "Allow"

    actions = [
      "sts:AssumeRoleWithWebIdentity"
    ]

    principals {
      type = "Federated"

      identifiers = [
        aws_iam_openid_connect_provider.github.arn
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"

      values = [
        "sts.amazonaws.com"
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"

      values = [
        "repo:NaveenGumaste@64587607/kairodash-DevOps@1331818586:ref:refs/heads/devops/initial-setup"
      ]
    }
  }
}

# ============================================================
# GitHub Actions IAM Role
# ============================================================

resource "aws_iam_role" "github_actions_ecr" {
  name = "KairoDashGitHubActionsECR"

  assume_role_policy = data.aws_iam_policy_document.github_actions_trust.json
}

# ============================================================
# ECR Permissions
# ============================================================

data "aws_iam_policy_document" "github_actions_ecr" {
  statement {
    sid    = "ECRAuthentication"
    effect = "Allow"

    actions = [
      "ecr:GetAuthorizationToken"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "ECRPushKairoDash"
    effect = "Allow"

    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:CompleteLayerUpload",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart"
    ]

    resources = [
      aws_ecr_repository.kairo.arn
    ]
  }
}

# ============================================================
# Attach ECR Permissions to GitHub Actions Role
# ============================================================

resource "aws_iam_role_policy" "github_actions_ecr" {
  name = "KairoDashECRPush"

  role = aws_iam_role.github_actions_ecr.id

  policy = data.aws_iam_policy_document.github_actions_ecr.json
}

# ============================================================
# Outputs
# ============================================================

output "github_actions_role_arn" {
  description = "IAM role assumed by GitHub Actions through OIDC."
  value       = aws_iam_role.github_actions_ecr.arn
}
