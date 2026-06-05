from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from .auth import get_current_user

router = APIRouter(prefix="/api/v1/projects", tags=["Projekty"])

class ProjectLink(BaseModel):
    id: str
    name: str
    frontend_url: Optional[str] = None
    api_url: Optional[str] = None
    git_url: Optional[str] = None
    docs_url: Optional[str] = None

@router.get("", response_model=List[ProjectLink])
async def get_projects(current_user: str = Depends(get_current_user)):
    return [
        ProjectLink(
            id="qrco",
            name="QRCO",
            frontend_url="https://qrco.aznoh.cz",
            api_url="https://api.qrco.aznoh.cz",
            git_url="https://github.com/aznoh/qrco",
            docs_url="/api/v1/projects/qrco/docs"
        )
    ]