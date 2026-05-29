variable "aws_region" {
  default = "eu-west-2"
}

variable "app_name" {
  default = "expense-tracker"
}

variable "db_connection_string" {
  description = "Azure SQL connection string"
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth Client ID"
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  sensitive   = true
}
