from threading import Lock
from decimal import Decimal
from aoi.integrations.aws.dynamodb.client import dynamodb

COUNTER_ITEM_KEY = "global"
COUNTER_ALLOCATION_SIZE = 100

counter_table = dynamodb.Table("counters")


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
        response = counter_table.update_item(
            Key={"k": COUNTER_ITEM_KEY},
            UpdateExpression="ADD #v :inc",
            ExpressionAttributeNames={"#v": "v"},
            ExpressionAttributeValues={":inc": COUNTER_ALLOCATION_SIZE},
            ReturnValues="UPDATED_NEW",
        )

        attributes = response["Attributes"]
        assert isinstance(attributes["v"], Decimal)

        value = int(attributes["v"])

        self.next_value = value - COUNTER_ALLOCATION_SIZE
        self.allocation_end = value - 1


monotonic_counter = MonotonicCounter()
