# =============================================================================
# DNS records needed to validate ACM certificate
# =============================================================================

resource "vercel_dns_record" "caa_amazon" {
  domain = "aoi.rs"
  type   = "CAA"
  name   = ""
  value  = "0 issue \"amazon.com\""
}

resource "vercel_dns_record" "acm_validation" {
  for_each = {
    for d in aws_acm_certificate.main.domain_validation_options : d.domain_name => {
      name  = d.resource_record_name
      type  = d.resource_record_type
      value = d.resource_record_value
    }
  }

  domain = "aoi.rs"
  name   = trimsuffix(each.value.name, ".aoi.rs.")
  type   = each.value.type
  value  = trimsuffix(each.value.value, ".")
}

# =============================================================================
# DNS records that connect the AWS infrastructure to the aoi.rs domain
# =============================================================================

resource "vercel_dns_record" "service" {
  domain = "aoi.rs"
  type   = "CNAME"
  name   = "service"
  value  = aws_alb.service.dns_name
}

resource "vercel_dns_record" "redirects" {
  domain = "aoi.rs"
  type   = "ALIAS"
  name   = ""
  value  = aws_cloudfront_distribution.redirects.domain_name
}

# =============================================================================
# Resources for the account.aoi.rs website
# =============================================================================

resource "vercel_project" "website" {
  name           = "aoi"
  framework      = "nextjs"
  root_directory = "apps/www"

  git_repository = {
    type = "github"
    repo = "aoi-rs/aoi"
  }

  git_provider_options = {
    create_deployments = false
  }

  environment = [
    {
      key       = "NEXT_PUBLIC_API_BASE_URL"
      value     = "https://service.aoi.rs"
      sensitive = false

      target = [
        "production"
      ]
    }
  ]
}

resource "vercel_project_domain" "website" {
  project_id = vercel_project.website.id
  domain     = "account.aoi.rs"
}
