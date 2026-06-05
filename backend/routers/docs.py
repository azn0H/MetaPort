from fastapi import APIRouter, Depends, HTTPException
import os
from .auth import get_current_user

router = APIRouter(prefix="/api/v1/docs", tags=["Dokumentace"])

DOCS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs")

@router.get("/{project_id}")
async def get_project_documentation(project_id: str, current_user: str = Depends(get_current_user)):
    safe_project_id = os.path.basename(project_id)
    file_path = os.path.join(DOCS_DIR, f"{safe_project_id}.md")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Dokumentace pro projekt '{safe_project_id}' nebyla nalezena.")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"project_id": safe_project_id, "content": content}
    except Exception:
        raise HTTPException(status_code=500, detail="Chyba při čtení souboru dokumentace.")