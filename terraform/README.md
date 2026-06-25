# Aoi Infrastructure as Code (IaC)

Aoi uses Terraform to manage and provision its cloud infrastructure. The Terraform state, secrets and runs are managed on [HCP Terraform](https://developer.hashicorp.com/terraform/cloud-docs).

## Infrastructure details

Aoi uses...

- [Amazon CloudFront](https://aws.amazon.com/cloudfront/) to cache redirects
- [Amazon DynamoDB](https://aws.amazon.com/dynamodb/) to store short URLs
- [Amazon ECR](https://aws.amazon.com/ecr/) to store container images
- [Amazon VPC](https://aws.amazon.com/vpc/) to isolate networking resources
- [Amazon ECS with AWS Fargate](https://aws.amazon.com/ecs/) to run containerized services
- [Amazon RDS](https://aws.amazon.com/rds/) for relational data
- [Vercel](https://vercel.com) to host the frontend and manage DNS