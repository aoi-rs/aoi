data "tfe_project" "production" {
  name         = "Production"
  organization = "rinku-sh"
}

resource "tfe_variable_set" "production" {
  name              = "Production Settings"
  description       = "For variables specific to the production environment"
  organization      = "rinku-sh"
  parent_project_id = data.tfe_project.production.id
}

resource "tfe_variable" "service_secret_production" {
  variable_set_id = tfe_variable_set.production.id
  key             = "service_secret_production"
  category        = "terraform"
  description     = "Service secret for production"
  sensitive       = true
}

resource "tfe_variable" "service_resend_api_key_production" {
  variable_set_id = tfe_variable_set.production.id
  key             = "service_resend_api_key_production"
  category        = "terraform"
  description     = "Resend API Key for production"
  sensitive       = true
}
