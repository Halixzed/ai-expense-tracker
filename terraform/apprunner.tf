resource "aws_apprunner_service" "api" {
  service_name = "${var.app_name}-api"

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr_role.arn
    }

    image_repository {
      image_identifier      = "${aws_ecr_repository.api.repository_url}:latest"
      image_repository_type = "ECR"

      image_configuration {
        port = "8080"
        runtime_environment_variables = {
          "ConnectionStrings__DefaultConnection" = var.db_connection_string
          "ASPNETCORE_ENVIRONMENT"               = "Production"
        }
      }
    }
  }

  tags = {
    Name = "${var.app_name}-api"
  }
}
