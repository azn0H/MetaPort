from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Získání URL databáze z proměnných prostředí (.env nebo docker-compose)
# Výchozí hodnota je PostgreSQL (metaport-db:5432)
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
    role = Column(String, default="admin", nullable=False) # admin, betteradmin, superadmin

# Funkce pro získání připojení k DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()