from fastapi import FastAPI
from routers import auth, projects, containers, hardware, docs

app = FastAPI(title="MetaPort API", version="1.0.0")

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(containers.router)
app.include_router(hardware.router)
app.include_router(docs.router)