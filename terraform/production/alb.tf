resource "aws_alb" "main" {
  name               = "rinku"
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
  name        = "rinku"
  port        = 10000
  protocol    = "HTTP"
  target_type = "ip"

  health_check {
    path = "/healthz"
  }
}

resource "aws_alb_listener" "http" {
  load_balancer_arn = aws_alb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.service.arn
  }
}
