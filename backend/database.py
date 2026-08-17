from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://admin:password@metaport-db:5432/metaportdb"
)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL, pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="admin", nullable=False)

class PortalSetting(Base):
    __tablename__ = "portal_settings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="METAFRA", nullable=False)
    subtitle = Column(String, default="MetaPort - Rozcestník a Raspberry Pi management dashboard", nullable=False)
    version = Column(String, default="v1.0", nullable=False)
    footer_text = Column(String, default="MetaPort {version} © {year} aznoH.cz", nullable=False)

class PortalLink(Base):
    __tablename__ = "portal_links"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    url = Column(String, nullable=False)
    icon = Column(String, default="Globe", nullable=False)
    gradient = Column(String, default="from-cyan-500 to-blue-600", nullable=False)
    order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_external = Column(Boolean, default=True, nullable=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()