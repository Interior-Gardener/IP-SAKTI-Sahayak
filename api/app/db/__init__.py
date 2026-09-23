from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.settings import get_settings

_settings = get_settings()

# A connect timeout, so a machine with no database says so in seconds rather
# than blocking a test run (or a request) for minutes while the OS works
# through every address the host resolves to.
engine = create_engine(
    _settings.database_url,
    pool_pre_ping=True,
    connect_args={"connect_timeout": _settings.db_connect_timeout},
)
SessionLocal = sessionmaker(engine, expire_on_commit=False)
