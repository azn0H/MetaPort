import os
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import httpx
from .auth import get_current_user

load_dotenv()

router = APIRouter(prefix="/api/v1/containers", tags=["Kontejnery"])

# Ujistíme se, že URL nekončí lomítkem
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

@router.get("", response_model=List[ContainerSummary])
async def get_containers(current_user: str = Depends(get_current_user)):
    url = f"{PORTAINER_URL}/endpoints/{ENDPOINT_ID}/docker/containers/json?all=true"
    headers = {"X-API-Key": PORTAINER_API_KEY}
    
    print(f"DEBUG: Volám Portainer API na adrese: {url}")
    
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            print(f"DEBUG: Portainer vrátil status kód: {response.status_code}")
            
            if response.status_code != 200:
                print(f"DEBUG: Tělo chyby z Portaineru: {response.text}")
                # Pošleme detailní chybu i na frontend
                raise HTTPException(status_code=500, detail=f"Portainer zamítl přístup (Kód {response.status_code}): {response.text}")
            
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

                result.append(
                    ContainerSummary(
                        id=c.get("Id", "")[:12],
                        name=name,
                        status=c.get("State", "unknown"),
                        image=c.get("Image", "unknown"),
                        ports=ports_str,
                        created=c.get("Status", "-")
                    )
                )
            return result
        except httpx.RequestError as e:
            print(f"DEBUG: Spojení selhalo úplně: {str(e)}")
            raise HTTPException(status_code=503, detail=f"Nelze se spojit s Portainerem: {str(e)}")