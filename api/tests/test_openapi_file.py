import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import dump_openapi  # noqa: E402


def test_committed_openapi_is_current():
    assert dump_openapi.OUT.read_text(encoding="utf-8") == dump_openapi.render(), (
        "api/openapi.json is stale: run `python scripts/dump_openapi.py` then `npm run gen:api`"
    )
