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
