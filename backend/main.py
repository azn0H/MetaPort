from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os

from routers import auth, projects, containers, hardware, docs, system, github

from database import engine, Base, SessionLocal, User
from passlib.context import CryptContext

app = FastAPI(title="MetaPort API", version="1.0.0")

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://metaport.aznoh.cz",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

def init_db():
    db = SessionLocal()
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    
    if not db.query(User).filter(User.username == admin_username).first():
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        admin_password = os.getenv("ADMIN_PASSWORD_HASH", "heslo123") 
        
        if not admin_password.startswith("$2b$"):
            admin_password = pwd_context.hash(admin_password)

        new_admin = User(
            username=admin_username,
            first_name="Jan",
            last_name="Pšenčík",
            email="hopsen@seznam.cz",
            hashed_password=admin_password,
            role="superadmin"
        )
        db.add(new_admin)
        db.commit()
    db.close()

init_db()

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(containers.router)
app.include_router(hardware.router)
app.include_router(docs.router)
app.include_router(system.router)
app.include_router(github.router)