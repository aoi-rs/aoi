variable "service_secret_production" {
  description = "Service secret for production"
  sensitive   = true
  type        = string
}

variable "aws_access_key_id_production" {
  description = "AWS Access Key ID for production"
  sensitive = true
  type = string
}

variable "aws_secret_access_key_production" {
  description = "AWS Secret Access Key for production"
  sensitive = true
  type = string
}
