from rinku.integrations.aws.dynamodb.client import dynamodb

has_tables = False

for table in dynamodb.tables.all():
  has_tables = True
  print(table)

print(has_tables)
