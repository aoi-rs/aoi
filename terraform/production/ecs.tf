resource "aws_ecs_cluster" "main" {
  name = "aoi"
}

# =============================================================================
# ECS container definition data sources
#
# We read the container definition from AWS to avoid stale state in Terraform 
# causing unwanted rollbacks.
#
# First-time setup: create the service first without the data source — use a 
# default tag like "latest"  — then add the data sources with their task 
# definition IDs from the Terraform state.
# =============================================================================

locals {
  service_task_definition_id             = "aoi"
  service_task_definition_container_name = "aoi"

  redirector_task_definition_id             = "aoi-redirector"
  redirector_task_definition_container_name = "aoi-redirector"
}

data "aws_ecs_container_definition" "service" {
  task_definition = local.service_task_definition_id
  container_name  = local.service_task_definition_container_name
}

data "aws_ecs_container_definition" "redirector" {
  task_definition = local.redirector_task_definition_id
  container_name  = local.redirector_task_definition_container_name
}

resource "aws_ecs_task_definition" "service" {
  family                   = "aoi"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  track_latest             = true

  container_definitions = jsonencode([
    {
      name      = "aoi"
      image     = data.aws_ecs_container_definition.service.image
      essential = true

      portMappings = [
        {
          containerPort = 10000
          hostPort      = 10000
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.service.name
          awslogs-region        = aws_cloudwatch_log_group.service.region
          awslogs-stream-prefix = "aoi"
        }
      }

      environment = [
        {
          name  = "RINKU_ENV"
          value = "production"
        },
        {
          name  = "RINKU_SECRET"
          value = var.service_secret_production
        },
        {
          name  = "RINKU_EMAIL_SENDER",
          value = "resend"
        },
        {
          name  = "RINKU_RESEND_API_KEY",
          value = var.service_resend_api_key_production
        },
        {
          name  = "RINKU_POSTGRES_USER"
          value = aws_db_instance.postgres.username
        },
        {
          name  = "RINKU_POSTGRES_PWD"
          value = aws_db_instance.postgres.password
        },
        {
          name  = "RINKU_POSTGRES_HOST"
          value = aws_db_instance.postgres.address
        },
        {
          name  = "RINKU_POSTGRES_PORT"
          value = tostring(aws_db_instance.postgres.port)
        },
        {
          name  = "RINKU_POSTGRES_DATABASE"
          value = aws_db_instance.postgres.db_name
        },
        {
          name  = "AOI_ENV"
          value = "production"
        },
        {
          name  = "AOI_SECRET"
          value = var.service_secret_production
        },
        {
          name  = "AOI_EMAIL_SENDER",
          value = "resend"
        },
        {
          name  = "AOI_RESEND_API_KEY",
          value = var.service_resend_api_key_production
        },
        {
          name  = "AOI_POSTGRES_USER"
          value = aws_db_instance.postgres.username
        },
        {
          name  = "AOI_POSTGRES_PWD"
          value = aws_db_instance.postgres.password
        },
        {
          name  = "AOI_POSTGRES_HOST"
          value = aws_db_instance.postgres.address
        },
        {
          name  = "AOI_POSTGRES_PORT"
          value = tostring(aws_db_instance.postgres.port)
        },
        {
          name  = "AOI_POSTGRES_DATABASE"
          value = aws_db_instance.postgres.db_name
        },
      ]
    }
  ])
}

resource "aws_ecs_task_definition" "redirector" {
  family                   = "aoi-redirector"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  track_latest             = true

  container_definitions = jsonencode([
    {
      name      = "aoi-redirector"
      image     = data.aws_ecs_container_definition.redirector.image
      essential = true

      portMappings = [
        {
          containerPort = 12000
          hostPort      = 12000
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.service.name
          awslogs-region        = aws_cloudwatch_log_group.service.region
          awslogs-stream-prefix = "aoi-redirector"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "service" {
  name            = "aoi"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.service.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    assign_public_ip = true

    subnets = [
      aws_subnet.public_a.id,
      aws_subnet.public_b.id
    ]

    security_groups = [
      aws_security_group.ecs.id
    ]
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.service.arn
    container_name   = "aoi"
    container_port   = 10000
  }
}

resource "aws_ecs_service" "redirector" {
  name            = "aoi-redirector"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.redirector.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    assign_public_ip = true

    subnets = [
      aws_subnet.public_a.id,
      aws_subnet.public_b.id
    ]

    security_groups = [
      aws_security_group.ecs.id
    ]
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.redirector.arn
    container_name   = "aoi-redirector"
    container_port   = 12000
  }
}
