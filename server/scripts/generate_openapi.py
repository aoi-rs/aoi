import yaml
import sys

from rinku.app import app

if __name__ == "__main__":
    schema = app.openapi()
    yaml.dump(schema, sys.stdout)
    sys.stdout.flush()
