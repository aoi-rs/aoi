resource "aws_acm_certificate" "srv" {
  domain_name       = "srv.rinku.sh"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "srv" {
  depends_on      = [vercel_dns_record.caa_amazon]
  certificate_arn = aws_acm_certificate.srv.arn

  validation_record_fqdns = [
    for record in vercel_dns_record.acm_validation : "${record.name}.rinku.sh."
  ]
}
