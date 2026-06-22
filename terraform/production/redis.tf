resource "aws_elasticache_subnet_group" "main" {
  name = "aoi-redis-subnets"

  subnet_ids = [
    aws_subnet.private_a.id,
    aws_subnet.private_b.id
  ]
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id        = "aoi-redis"
  engine            = "redis"
  node_type         = "cache.t4g.micro"
  num_cache_nodes   = 1
  port              = 6379
  subnet_group_name = aws_elasticache_subnet_group.main.name

  security_group_ids = [
    aws_security_group.redis.id
  ]
}
