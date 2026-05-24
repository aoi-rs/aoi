# Rinku Infrastructure as Code (IaC)

Rinku uses Terraform to manage and provision its cloud infrastructure. The Terraform state, secrets and runs are managed on [HCP Terraform](https://developer.hashicorp.com/terraform/cloud-docs).

## Infrastructure details

Rinku uses...

- [AWS ECS on Fargate](https://aws.amazon.com/ecs) for webservices
- [AWS RDS](https://aws.amazon.com/rds) for relational databases
- [GHCR](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) to store container images