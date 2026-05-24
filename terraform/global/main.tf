provider "tfe" {}

resource "tfe_variable_set" "global" {
  name         = "Global Settings"
  description  = "For variables that are used in multiple or all environments"
  organization = "rinku-sh"
  global       = true
}

resource "tfe_variable" "tfc_aws_provider_auth" {
  key      = "TFC_AWS_PROVIDER_AUTH"
  value    = "true"
  category = "env"
  variable_set_id = tfe_variable_set.global.id
  description = "Enable the Workload Identity integration for AWS"
}

resource "tfe_variable" "tfc_aws_run_role_arn" {
  key = "TFC_AWS_RUN_ROLE_ARN"
  value = "arn:aws:iam::891924440815:role/terraform-cloud"
  category = "env"
  variable_set_id = tfe_variable_set.global.id
  description = "The AWS role arn runs will use to authenticate"
}
