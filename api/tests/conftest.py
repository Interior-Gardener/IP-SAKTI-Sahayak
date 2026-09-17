import pytest
from sqlalchemy import text


@pytest.fixture
def db_session():
    """A session on the compose Postgres, or a skip when it isn't running (CI starts one)."""
    from app.db import SessionLocal, engine

    try:
        with engine.connect() as conn:
            conn.execute(text("select 1 from chunks limit 1"))
    except Exception as e:  # noqa: BLE001 - any connection or schema problem means skip
        pytest.skip(f"database not available: {e.__class__.__name__}")
    session = SessionLocal()
    yield session
    session.close()
