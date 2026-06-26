resource "aws_cloudfront_cache_policy" "redirects" {
  name        = "redirects"
  min_ttl     = 0
  default_ttl = 0
  max_ttl     = 31536000

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_vpc_origin" "redirects" {
  vpc_origin_endpoint_config {
    name                   = "alb"
    arn                    = aws_alb.redirector.arn
    http_port              = 80
    https_port             = 443
    origin_protocol_policy = "https-only"

    origin_ssl_protocols {
      items    = ["TLSv1.2"]
      quantity = 1
    }
  }
}

resource "aws_cloudfront_distribution" "redirects" {
  enabled = true
  aliases = ["aoi.rs"]

  origin {
    domain_name = "aoi.rs"
    origin_id   = "alb"

    vpc_origin_config {
      vpc_origin_id = aws_cloudfront_vpc_origin.redirects.id
    }
  }

  default_cache_behavior {
    target_origin_id       = "alb"
    viewer_protocol_policy = "allow-all"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = aws_cloudfront_cache_policy.redirects.id
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.main.arn
    ssl_support_method  = "sni-only"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
