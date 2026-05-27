resource "aws_acm_certificate" "srv" {
  domain_name       = "srv.rinku.sh"
  validation_method = "DNS"
}