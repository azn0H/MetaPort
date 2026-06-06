import os
from datetime import datetime
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import httpx
from .auth import get_current_user

load_dotenv()

router = APIRouter(prefix="/api/v1/projects", tags=["Projekty"])

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME")

class ProjectSummary(BaseModel):
    id: int
    name: str
    description: str
    language: str
    branch: str
    lastUpdate: str
    url: str

def format_date(iso_string: str) -> str:
    if not iso_string:
        return "Neznámé"
    dt = datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
    return dt.strftime("%d.%m.%Y")

@router.get("", response_model=List[ProjectSummary])
async def get_github_projects(current_user: str = Depends(get_current_user)):
    if not GITHUB_TOKEN or not GITHUB_USERNAME:
        raise HTTPException(status_code=500, detail="Chybí GitHub konfigurace v .env")

    url = f"https://api.github.com/user/repos?sort=updated&direction=desc&per_page=10"
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"token {GITHUB_TOKEN}"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Chyba při komunikaci s GitHub API")
            
            repos = response.json()
            result = []
            
            for repo in repos:
                result.append(
                    ProjectSummary(
                        id=repo["id"],
                        name=repo["name"],
                        description=repo["description"] or "Bez popisu",
                        language=repo["language"] or "Neznámý",
                        branch=repo["default_branch"],
                        lastUpdate=format_date(repo["updated_at"]),
                        url=repo["html_url"]
                    )
                )
            return result
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=str(e))