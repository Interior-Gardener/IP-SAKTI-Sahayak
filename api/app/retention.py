"""Retention job (docs/dpdp-and-security.md §3). Run daily, e.g. from cron or a scheduled
container:

    python -m app.retention            # delete what is past its window
    python -m app.retention --dry-run  # only count

Windows come from env: RETENTION_DAYS (answers, closed escalations, revoked consent;
default 30) and AUDIT_RETENTION_DAYS (audit rows, which hold hashes not text; default 180).
Open escalations are kept until they are closed.
"""

import argparse
import os
import sys
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.db.models import AuditEvent, ConsentGrant, Escalation, StoredAnswer


def purge(
    session: Session, now: datetime, days: int, audit_days: int, dry_run: bool
) -> dict[str, int]:
    cutoff = now - timedelta(days=days)
    audit_cutoff = now - timedelta(days=audit_days)
    targets = {
        "answers": (StoredAnswer, StoredAnswer.created_at < cutoff),
        "escalations": (
            Escalation,
            (Escalation.created_at < cutoff) & (Escalation.status == "closed"),
        ),
        "consent_grants": (ConsentGrant, ConsentGrant.revoked_at < cutoff),
        "audit_events": (AuditEvent, AuditEvent.created_at < audit_cutoff),
    }
    counts = {}
    for name, (model, condition) in targets.items():
        if dry_run:
            counts[name] = session.scalar(select(func.count()).select_from(model).where(condition))
        else:
            counts[name] = session.execute(delete(model).where(condition)).rowcount
    if not dry_run:
        session.add(AuditEvent(session_id="system", kind="purge", payload={"retention": counts}))
        session.commit()
    return counts


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.retention")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)
    days = int(os.environ.get("RETENTION_DAYS", "30"))
    audit_days = int(os.environ.get("AUDIT_RETENTION_DAYS", "180"))
    with SessionLocal() as session:
        counts = purge(session, datetime.now(UTC), days, audit_days, args.dry_run)
    print(
        ("would delete " if args.dry_run else "deleted ")
        + ", ".join(f"{k}={v}" for k, v in counts.items())
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
