from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os

from routers import auth, projects, containers, hardware, docs, system, github, portal

from database import engine, Base, SessionLocal, User, PortalSetting, PortalLink
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

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not connect to DB for create_all (expected if running locally outside Docker): {e}")

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

        setting = db.query(PortalSetting).first()
        if not setting:
            db.add(PortalSetting(
                title="METAFRA",
                subtitle="MetaPort - Rozcestník a Raspberry Pi management dashboard",
                version="v1.0",
                footer_text="MetaPort {version} © {year} aznoH.cz"
            ))
            db.commit()

        if db.query(PortalLink).count() == 0:
            default_links = [
                PortalLink(
                    title="TaskApp",
                    description="Task management and collaboration platform",
                    icon="Book",
                    url="https://taskapp.aznoh.cz",
                    gradient="from-cyan-500 to-blue-600",
                    order=1,
                    is_active=True,
                    is_external=True
                ),
                PortalLink(
                    title="Aznoh Blog",
                    description="Personal blog and article publishing",
                    icon="PenTool",
                    url="https://blog.aznoh.cz",
                    gradient="from-emerald-500 to-teal-600",
                    order=2,
                    is_active=True,
                    is_external=True
                ),
                PortalLink(
                    title="QRco",
                    description="QR code generator and management",
                    icon="Layers",
                    url="https://qrco.aznoh.cz",
                    gradient="from-orange-500 to-rose-600",
                    order=3,
                    is_active=True,
                    is_external=True
                ),
                PortalLink(
                    title="MetaPort",
                    description="Raspberry Pi management dashboard",
                    icon="Globe",
                    url="https://metaport.aznoh.cz/admin",
                    gradient="from-indigo-500 to-purple-600",
                    order=4,
                    is_active=True,
                    is_external=True
                ),
                PortalLink(
                    title="Password Generator",
                    description="Secure password generation",
                    icon="Globe",
                    url="https://password.aznoh.cz",
                    gradient="from-cyan-500 to-yellow-600",
                    order=5,
                    is_active=True,
                    is_external=True
                )
            ]
            db.add_all(default_links)
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
app.include_router(portal.router)