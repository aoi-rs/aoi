terraform {
  required_version = ">= 1.15"

  cloud {
    organization = "rinku-sh"

    workspaces {
      name = "global"
    }
  }

  required_providers {
    tfe = {
      source  = "hashicorp/tfe"
      version = "0.77.0"
    }
  }
}