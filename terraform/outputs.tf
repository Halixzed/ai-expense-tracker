output "ecr_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "apprunner_url" {
  value = "https://${aws_apprunner_service.api.service_url}"
}

output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "s3_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}
