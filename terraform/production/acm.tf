resource "aws_acm_certificate" "main" {
  domain_name               = "aoi.rs"
  subject_alternative_names = ["service.aoi.rs"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "main" {
  depends_on      = [vercel_dns_record.caa_amazon]
  certificate_arn = aws_acm_certificate.main.arn

  validation_record_fqdns = [
    for record in vercel_dns_record.acm_validation : "${record.name}.aoi.rs."
  ]
}
