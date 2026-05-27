resource "vercel_dns_record" "acm_validation" {
  for_each = {
    for d in aws_acm_certificate.srv.domain_validation_options : d.domain_name => {
      name  = d.resource_record_name
      type  = d.resource_record_type
      value = d.resource_record_value
    }
  }

  domain = "rinku.sh"
  name   = trimsuffix(each.value.name, ".rinku.sh.")
  type   = each.value.type
  value  = trimsuffix(each.value.value, ".")
}

resource "vercel_dns_record" "caa_amazon" {
  domain = "rinku.sh"
  type   = "CAA"
  name   = ""
  value  = "0 issue \"amazon.com\""
}

resource "vercel_dns_record" "srv" {
  domain = "rinku.sh"
  type   = "CNAME"
  name   = "srv"
  value  = aws_alb.main.dns_name
}
