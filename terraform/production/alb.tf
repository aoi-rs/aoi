resource "aws_alb" "main" {
  name               = "aoi"
  load_balancer_type = "application"
  internal           = false

  security_groups = [
    aws_security_group.alb.id
  ]

  subnets = [
    aws_subnet.public_a.id,
    aws_subnet.public_b.id
  ]
}

resource "aws_alb_target_group" "service" {
  vpc_id      = aws_vpc.main.id
  name        = "aoi"
  port        = 10000
  protocol    = "HTTP"
  target_type = "ip"

  health_check {
    path = "/healthz"
  }
}

resource "aws_alb_target_group" "redirector" {
  vpc_id      = aws_vpc.main.id
  name        = "aoi-redirector"
  port        = 3000
  protocol    = "HTTP"
  target_type = "ip"

  health_check {
    path = "/"
  }
}

resource "aws_alb_listener" "http" {
  load_balancer_arn = aws_alb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_alb_listener" "https" {
  load_balancer_arn = aws_alb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-Res-PQ-2025-09"
  certificate_arn   = aws_acm_certificate_validation.main.certificate_arn

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      status_code  = "404"
      message_body = "not found"
    }
  }
}

resource "aws_alb_listener_rule" "service" {
  listener_arn = aws_alb_listener.https.arn

  condition {
    host_header {
      values = [
        "service.aoi.rs"
      ]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.service.arn
  }
}

resource "aws_alb_listener_rule" "redirector" {
  listener_arn = aws_alb_listener.https.arn

  condition {
    host_header {
      values = [
        "aoi.rs",
        "www.aoi.rs"
      ]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.redirector.arn
  }
}