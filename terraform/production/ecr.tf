resource "aws_ecr_repository" "service" {
  name = "aoi"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "redirector" {
  name = "aoi-redirector"

  image_scanning_configuration {
    scan_on_push = true
  }
}

data "aws_ecr_lifecycle_policy_document" "default" {
  rule {
    priority    = 1
    description = "Retain 10 most recent images"

    selection {
      tag_status   = "any"
      count_type   = "imageCountMoreThan"
      count_number = 10
    }

    action {
      type = "expire"
    }
  }
}

resource "aws_ecr_lifecycle_policy" "service" {
  repository = aws_ecr_repository.service.name
  policy     = data.aws_ecr_lifecycle_policy_document.default.json
}

resource "aws_ecr_lifecycle_policy" "redirector" {
  repository = aws_ecr_repository.redirector.name
  policy     = data.aws_ecr_lifecycle_policy_document.default.json
}
