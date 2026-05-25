terraform {
  required_version = ">= 1.15"

  cloud {
    organization = "rinku-sh"

    workspaces {
      name = "production"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.46.0"
    }

    random = {
      source  = "hashicorp/random"
      version = "3.9.0"
    }
  }
}
