"""The verified IP profiles, served from the same data the web shows.

`profiles.json` is written by `npm run export:ipr` from `src/data/ipr/` and checked
in; CI fails when it falls behind. `seed_profiles` loads it into `material_ipr`,
validating every profile against the contract first, so a profile the API would
refuse to return is refused at seed time instead.
"""

import json
from datetime import date
from pathlib import Path

from sqlalchemy.orm import Session

from app.db.models import MaterialIpr
from app.schemas import MaterialIPProfile

PROFILES = Path(__file__).with_name("profiles.json")


def load_profiles(path: Path = PROFILES) -> list[tuple[str, str, MaterialIPProfile]]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    out = []
    for kind, by_id in raw.items():
        for material_id, profile in by_id.items():
            parsed = MaterialIPProfile.model_validate(profile)
            if parsed.kind != kind:
                raise ValueError(
                    f"{material_id}: filed under {kind!r} but its profile says {parsed.kind!r}"
                )
            out.append((kind, material_id, parsed))
    return out


def seed_profiles(session: Session, path: Path = PROFILES) -> int:
    """Write every exported profile, replacing what is stored. Idempotent."""
    profiles = load_profiles(path)
    for kind, material_id, profile in profiles:
        row = session.get(MaterialIpr, (kind, material_id)) or MaterialIpr(
            kind=kind, material_id=material_id
        )
        row.profile = profile.model_dump(mode="json", exclude_none=True)
        verified = profile.lastVerified
        row.last_verified = date.fromisoformat(verified) if verified else None
        session.add(row)
    session.commit()
    return len(profiles)
