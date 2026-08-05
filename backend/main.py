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
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:85",
        "https://metaport.aznoh.cz",
        "https://api-metaport.aznoh.cz",
    ],
    allow_origin_regex=r"https://.*aznoh\.cz.*|http://localhost.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

def init_db():
    try:
        db = SessionLocal()
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        admin_password_env = os.getenv("ADMIN_PASSWORD_HASH", "heslo123") 
        if admin_password_env.startswith("$$2b$$"):
            admin_password = admin_password_env.replace("$$", "$")
        elif not admin_password_env.startswith("$2b$"):
            admin_password = pwd_context.hash(admin_password_env)
        else:
            admin_password = admin_password_env

        user = db.query(User).filter(User.username == admin_username).first()
        if not user:
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
        else:
            user.hashed_password = admin_password
            db.commit()
        db.close()
    except Exception as e:
        print(f"Error initializing DB: {e}")

init_db()

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(containers.router)
app.include_router(hardware.router)
app.include_router(docs.router)
app.include_router(system.router)
app.include_router(github.router)