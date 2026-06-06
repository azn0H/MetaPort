import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from .auth import get_current_user

router = APIRouter(prefix="/api/v1/docs", tags=["Dokumentace"])

DOCS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs")

PROJECTS_METADATA = {
    "metaport": {
        "name": "MetaPort",
        "description": "Hlavní administrační portál a dashboard pro správu serveru.",
        "tech_stack": ["React", "TypeScript", "Tailwind", "FastAPI", "Docker"]
    },
    "qrco": {
        "name": "QRCO",
        "description": "Aplikace pro generování a správu QR kódů.",
        "tech_stack": ["React", "TypeScript", "FastAPI"]
    },
    "bookiva": {
        "name": "Bookiva",
        "description": "Backendové služby pro univerzální rezervační platformu.",
        "tech_stack": ["Python", "FastAPI", "Stripe", "PostgreSQL"]
    }
}

class DocProjectSummary(BaseModel):
    id: str
    name: str
    description: str
    tech_stack: List[str]

class DocProjectDetail(DocProjectSummary):
    content: str

@router.get("", response_model=List[DocProjectSummary])
async def get_all_docs(current_user: str = Depends(get_current_user)):
    result = []
    for pid, meta in PROJECTS_METADATA.items():
        result.append(DocProjectSummary(
            id=pid,
            name=meta["name"],
            description=meta["description"],
            tech_stack=meta["tech_stack"]
        ))
    return result

@router.get("/{project_id}", response_model=DocProjectDetail)
async def get_project_documentation(project_id: str, current_user: str = Depends(get_current_user)):
    safe_project_id = os.path.basename(project_id)
    meta = PROJECTS_METADATA.get(safe_project_id)
    
    if not meta:
        raise HTTPException(status_code=404, detail="Projekt nenalezen v metadatech.")

    file_path = os.path.join(DOCS_DIR, f"{safe_project_id}.md")
    content = "Dokumentace zatím nebyla vytvořena."
    
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception:
            raise HTTPException(status_code=500, detail="Chyba při čtení souboru dokumentace.")
    
    return DocProjectDetail(
        id=safe_project_id,
        name=meta["name"],
        description=meta["description"],
        tech_stack=meta["tech_stack"],
        content=content
    )