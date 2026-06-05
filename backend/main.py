from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from routers import auth, projects, containers, hardware, docs, system

class CORSMiddlewareFixed(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        origin = request.headers.get("Origin")
        if origin in ["http://localhost:5173", "http://localhost:5174", "https://metaport.aznoh.cz"]:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
        return response

app = FastAPI(title="MetaPort API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "https://metaport.aznoh.cz"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(CORSMiddlewareFixed)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(containers.router)
app.include_router(hardware.router)
app.include_router(docs.router)
app.include_router(system.router)