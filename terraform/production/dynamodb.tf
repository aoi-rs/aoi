resource "aws_dynamodb_table" "counters" {
  name         = "counters"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "k"

  attribute {
    name = "k"
    type = "S"
  }
}

resource "aws_dynamodb_table_item" "global_counter" {
  table_name = aws_dynamodb_table.counters.name
  hash_key   = "k"

  item = jsonencode({
    k = { S = "global" }
    v = { N = "14776336" }
  })

  lifecycle {
    ignore_changes = [
      item
    ]
  }
}

resource "aws_dynamodb_table" "links" {
  name         = "links"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "s"

  attribute {
    name = "i"
    type = "B"
  }

  attribute {
    name = "u"
    type = "B"
  }

  attribute {
    name = "s"
    type = "S"
  }

  global_secondary_index {
    name               = "user_links"
    projection_type    = "INCLUDE"
    non_key_attributes = ["d"]

    key_schema {
      attribute_name = "u"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "i"
      key_type       = "RANGE"
    }
  }
}
