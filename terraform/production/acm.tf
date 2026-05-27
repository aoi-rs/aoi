resource "aws_acm_certificate" "srv" {
  domain_name       = "srv.rinku.sh"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "vercel_dns_record" "acm_validation" {
  for_each = {
    for d in aws_acm_certificate.srv.domain_validation_options : d.domain_name => {
      name  = d.resource_record_name
      type  = d.resource_record_type
      value = d.resource_record_value
    }
  }

  domain = "rinku.sh"
  name   = replace(each.value.name, ".rinku.sh.", "")
  type   = each.value.type
  value  = trimsuffix(each.value.value, ".")
}

resource "aws_acm_certificate_validation" "srv" {
  certificate_arn = aws_acm_certificate.srv.arn

  validation_record_fqdns = [
    for record in vercel_dns_record.acm_validation : record.name
  ]
}
