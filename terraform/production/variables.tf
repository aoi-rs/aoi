variable "service_secret_production" {
  description = "Service secret for production"
  sensitive   = true
  type        = string
}

variable "service_resend_api_key_production" {
  description = "Resend API Key for production"
  sensitive   = true
  type        = string
}
