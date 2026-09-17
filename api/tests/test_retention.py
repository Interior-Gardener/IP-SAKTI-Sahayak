from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select

from app.db.models import AuditEvent, Escalation, StoredAnswer
from app.retention import purge

SID = "test-retention-session"


def test_retention_deletes_only_expired_rows(db_session):
    s = db_session
    old = datetime.now(UTC) - timedelta(days=40)
    for model in (StoredAnswer, Escalation, AuditEvent):
        s.execute(delete(model).where(model.session_id == SID))
    s.add_all([
        StoredAnswer(id="ret-old", session_id=SID, envelope={}, created_at=old),
        StoredAnswer(id="ret-new", session_id=SID, envelope={}),
        Escalation(id="ret-open", session_id=SID, status="open", created_at=old),
        Escalation(id="ret-closed", session_id=SID, status="closed", created_at=old),
        AuditEvent(session_id=SID, kind="ask", payload={}, created_at=old),
    ])  # fmt: skip
    s.commit()

    dry = purge(s, datetime.now(UTC), days=30, audit_days=180, dry_run=True)
    assert dry["answers"] >= 1 and dry["escalations"] >= 1
    purge(s, datetime.now(UTC), days=30, audit_days=180, dry_run=False)

    answers = set(s.scalars(select(StoredAnswer.id).where(StoredAnswer.session_id == SID)))
    escalations = set(s.scalars(select(Escalation.id).where(Escalation.session_id == SID)))
    assert answers == {"ret-new"}
    assert escalations == {"ret-open"}  # open tickets wait until closed
    assert (
        s.scalar(select(AuditEvent.id).where(AuditEvent.session_id == SID)) is not None
    )  # 40 < 180 days

    for model in (StoredAnswer, Escalation, AuditEvent):
        s.execute(delete(model).where(model.session_id == SID))
    s.commit()
