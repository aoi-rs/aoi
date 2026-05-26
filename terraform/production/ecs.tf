resource "aws_ecs_cluster" "main" {
  name = "rinku"
}

# =============================================================================
# ECS task definition data source
#
# We read the latest active revision from AWS to avoid stale state in
# Terraform causing unwanted rollbacks.
#
# First-time setup: create the service first without the data source — use 
# "${aws_ecr_repository.rinku.repository_url}:latest" as the image URL — 
# then add the data source.
# =============================================================================

locals {
  service_task_definition_family = "rinku"
}

data "aws_ecs_task_definition" "service" {
  task_definition = local.service_task_definition_family
}

resource "aws_ecs_task_definition" "service" {
  family                   = local.service_task_definition_family
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([
    {
      name      = "rinku"
      image     = jsondecode(data.aws_ecs_task_definition.service.container_definitions)[0].image
      essential = true

      portMappings = [
        {
          containerPort = 10000
          hostPort      = 10000
        }
      ]

      environment = [
        {
          name  = "RINKU_ENV"
          value = "production"
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
          name  = "RINKU_REDIS_HOST"
          value = aws_elasticache_cluster.redis.cache_nodes[0].address
        },
        {
          name  = "RINKU_REDIS_PORT"
          value = tostring(aws_elasticache_cluster.redis.port)
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "service" {
  name            = "rinku"
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
    container_name   = "rinku"
    container_port   = 10000
  }
}
