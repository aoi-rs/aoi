resource "aws_db_subnet_group" "main" {
  name = "rinku-db-subnets"

  subnet_ids = [
    aws_subnet.private_a.id,
    aws_subnet.private_b.id,
  ]
}

resource "aws_db_instance" "postgres" {
  identifier = "rinku-postgres"
  engine         = "postgres"
  engine_version = "18"

  instance_class    = "db.t4g.micro"
  allocated_storage = 20

  username            = "rinku_db_user"
  db_name             = "rinku_db"
  publicly_accessible = false

  vpc_security_group_ids = [aws_security_group.postgres.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  skip_final_snapshot = true
}
