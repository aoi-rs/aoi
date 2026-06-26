resource "aws_alb" "main" {
  name               = "main"
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

resource "aws_alb" "internal" {
  name               = "internal"
  load_balancer_type = "application"
  internal           = true

  security_groups = [
    aws_security_group.internal_alb.id,
  ]

  subnets = [
    aws_subnet.private_a.id,
    aws_subnet.private_b.id,
  ]
}

resource "aws_alb_target_group" "service" {
  vpc_id      = aws_vpc.main.id
  name        = "service"
  port        = 10000
  protocol    = "HTTP"
  target_type = "ip"

  health_check {
    path = "/healthz"
  }
}

resource "aws_alb_target_group" "redirector" {
  vpc_id      = aws_vpc.main.id
  name        = "redirector"
  port        = 12000
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

locals {
  load_balancers = {
    main = {
      arn              = aws_alb.main.arn
      target_group_arn = aws_alb_target_group.service.arn
    }

    internal = {
      arn              = aws_alb.internal.arn
      target_group_arn = aws_alb_target_group.redirector.arn
    }
  }
}

resource "aws_alb_listener" "https" {
  for_each = local.load_balancers

  load_balancer_arn = each.value.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-Res-PQ-2025-09"
  certificate_arn   = aws_acm_certificate_validation.main.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = each.value.target_group_arn
  }
}
