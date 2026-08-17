from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db, PortalSetting, PortalLink
from .auth import require_roles

router = APIRouter(prefix="/api/v1/portal", tags=["Portal"])

class PortalSettingSchema(BaseModel):
    title: str
    subtitle: str
    version: str
    footer_text: str

    class Config:
        from_attributes = True

class PortalSettingUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    version: Optional[str] = None
    footer_text: Optional[str] = None

class PortalLinkSchema(BaseModel):
    id: int
    title: str
    description: str
    url: str
    icon: str
    gradient: str
    order: int
    is_active: bool
    is_external: bool

    class Config:
        from_attributes = True

class PortalLinkCreate(BaseModel):
    title: str
    description: str
    url: str
    icon: Optional[str] = "Globe"
    gradient: Optional[str] = "from-cyan-500 to-blue-600"
    order: Optional[int] = 0
    is_active: Optional[bool] = True
    is_external: Optional[bool] = True

class PortalLinkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    icon: Optional[str] = None
    gradient: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None
    is_external: Optional[bool] = None

class PortalPublicResponse(BaseModel):
    settings: PortalSettingSchema
    links: List[PortalLinkSchema]

class ReorderItem(BaseModel):
    id: int
    order: int

@router.get("", response_model=PortalPublicResponse)
def get_public_portal(db: Session = Depends(get_db)):
    settings = db.query(PortalSetting).first()
    if not settings:
        settings = PortalSetting(
            title="METAFRA",
            subtitle="MetaPort - Rozcestník a Raspberry Pi management dashboard",
            version="v1.0",
            footer_text="MetaPort {version} © {year} aznoH.cz"
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    links = db.query(PortalLink).filter(PortalLink.is_active == True).order_by(PortalLink.order.asc(), PortalLink.id.asc()).all()
    return {
        "settings": settings,
        "links": links
    }

@router.get("/admin", response_model=dict)
def get_admin_portal(
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["betteradmin", "superadmin"]))
):
    settings = db.query(PortalSetting).first()
    if not settings:
        settings = PortalSetting(
            title="METAFRA",
            subtitle="MetaPort - Rozcestník a Raspberry Pi management dashboard",
            version="v1.0",
            footer_text="MetaPort {version} © {year} aznoH.cz"
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    links = db.query(PortalLink).order_by(PortalLink.order.asc(), PortalLink.id.asc()).all()
    return {
        "settings": PortalSettingSchema.from_orm(settings),
        "links": [PortalLinkSchema.from_orm(link) for link in links]
    }

@router.put("/settings", response_model=PortalSettingSchema)
def update_portal_settings(
    data: PortalSettingUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["betteradmin", "superadmin"]))
):
    settings = db.query(PortalSetting).first()
    if not settings:
        settings = PortalSetting()
        db.add(settings)

    if data.title is not None:
        settings.title = data.title
    if data.subtitle is not None:
        settings.subtitle = data.subtitle
    if data.version is not None:
        settings.version = data.version
    if data.footer_text is not None:
        settings.footer_text = data.footer_text

    db.commit()
    db.refresh(settings)
    return settings

@router.post("/links", response_model=PortalLinkSchema, status_code=status.HTTP_201_CREATED)
def create_portal_link(
    data: PortalLinkCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["betteradmin", "superadmin"]))
):
    max_order = db.query(PortalLink).count()
    new_link = PortalLink(
        title=data.title,
        description=data.description,
        url=data.url,
        icon=data.icon or "Globe",
        gradient=data.gradient or "from-cyan-500 to-blue-600",
        order=data.order if data.order is not None else max_order,
        is_active=data.is_active if data.is_active is not None else True,
        is_external=data.is_external if data.is_external is not None else True
    )
    db.add(new_link)
    db.commit()
    db.refresh(new_link)
    return new_link

@router.put("/links/{link_id}", response_model=PortalLinkSchema)
def update_portal_link(
    link_id: int,
    data: PortalLinkUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["betteradmin", "superadmin"]))
):
    link = db.query(PortalLink).filter(PortalLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Odkaz nebyl nalezen")

    if data.title is not None:
        link.title = data.title
    if data.description is not None:
        link.description = data.description
    if data.url is not None:
        link.url = data.url
    if data.icon is not None:
        link.icon = data.icon
    if data.gradient is not None:
        link.gradient = data.gradient
    if data.order is not None:
        link.order = data.order
    if data.is_active is not None:
        link.is_active = data.is_active
    if data.is_external is not None:
        link.is_external = data.is_external

    db.commit()
    db.refresh(link)
    return link

@router.delete("/links/{link_id}", status_code=status.HTTP_200_OK)
def delete_portal_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["betteradmin", "superadmin"]))
):
    link = db.query(PortalLink).filter(PortalLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Odkaz nebyl nalezen")

    db.delete(link)
    db.commit()
    return {"msg": "Odkaz byl úspěšně smazán."}

@router.post("/links/reorder", status_code=status.HTTP_200_OK)
def reorder_portal_links(
    items: List[ReorderItem],
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["betteradmin", "superadmin"]))
):
    for item in items:
        link = db.query(PortalLink).filter(PortalLink.id == item.id).first()
        if link:
            link.order = item.order
    db.commit()
    return {"msg": "Pořadí bylo uloženo."}
