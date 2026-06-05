import os
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import httpx
from .auth import get_current_user

load_dotenv()

router = APIRouter(prefix="/api/v1/containers", tags=["Kontejnery"])

PORTAINER_URL = os.getenv("PORTAINER_URL", "").rstrip("/")
PORTAINER_API_KEY = os.getenv("PORTAINER_API_KEY")
ENDPOINT_ID = os.getenv("PORTAINER_ENDPOINT_ID", "1")

class ContainerSummary(BaseModel):
    id: str
    name: str
    status: str
    image: str
    ports: str
    created: str
    stack: str

@router.get("", response_model=List[ContainerSummary])
async def get_containers(current_user: str = Depends(get_current_user)):
    url = f"{PORTAINER_URL}/endpoints/{ENDPOINT_ID}/docker/containers/json?all=true"
    headers = {"X-API-Key": PORTAINER_API_KEY}
    
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Portainer API Error")
            
            containers = response.json()
            result = []
            for c in containers:
                names = c.get("Names", [])
                name = names[0].lstrip("/") if names else "unknown"
                
                ports_list = []
                for p in c.get("Ports", []):
                    if "PublicPort" in p:
                        ports_list.append(f"{p['PublicPort']}:{p['PrivatePort']}")
                ports_str = ", ".join(ports_list) if ports_list else "-"

                labels = c.get("Labels") or {}
                stack_name = labels.get("com.docker.compose.project", "Standalone")

                result.append(
                    ContainerSummary(
                        id=c.get("Id", "")[:12],
                        name=name,
                        status=c.get("State", "unknown"),
                        image=c.get("Image", "unknown"),
                        ports=ports_str,
                        created=c.get("Status", "-"),
                        stack=stack_name
                    )
                )
            return result
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=str(e))

@router.post("/{container_id}/{action}")
async def control_container(container_id: str, action: str, current_user: str = Depends(get_current_user)):
    if action not in ["start", "stop", "restart"]:
        raise HTTPException(status_code=400, detail="Neplatná akce")
        
    url = f"{PORTAINER_URL}/endpoints/{ENDPOINT_ID}/docker/containers/{container_id}/{action}"
    headers = {"X-API-Key": PORTAINER_API_KEY}
    
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(url, headers=headers, timeout=15.0)
            if response.status_code not in [204, 304]:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            return {"status": "success"}
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=str(e))