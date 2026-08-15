from threading import Lock
from aoi.integrations.aws.dynamodb.client import dynamodb

COUNTER_TABLE_NAME = "counters"
COUNTER_ITEM_KEY = "global"
COUNTER_ALLOCATION_SIZE = 100


class MonotonicCounter:
    def __init__(self):
        self.lock = Lock()
        self.next_value = 0
        self.allocation_end = -1

    def increment(self) -> int:
        with self.lock:
            if self.next_value > self.allocation_end:
                self._allocate()

            result = self.next_value
            self.next_value += 1

            return result

    def _allocate(self):
        response = dynamodb.update_item(
            TableName=COUNTER_TABLE_NAME,
            Key={"k": {"S": COUNTER_ITEM_KEY}},
            UpdateExpression="ADD #v :inc",
            ExpressionAttributeNames={"#v": "v"},
            ExpressionAttributeValues={":inc": {"N": str(COUNTER_ALLOCATION_SIZE)}},
            ReturnValues="UPDATED_NEW",
        )

        assert "N" in response["Attributes"]["v"]

        value = int(response["Attributes"]["v"]["N"])

        self.next_value = value - COUNTER_ALLOCATION_SIZE
        self.allocation_end = value - 1


monotonic_counter = MonotonicCounter()
