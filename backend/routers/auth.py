import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
import jwt
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import User, get_db

load_dotenv()

router = APIRouter(prefix="/api/v1/auth", tags=["Autentizace"])

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-klic")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class UserCreate(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: str
    password: str
    role: str

class UserInvite(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: str
    role: str

class RoleUpdate(BaseModel):
    role: str

class UserResponse(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    email: str
    role: str

class SetPasswordRequest(BaseModel):
    token: str
    password: str

    class Config:
        from_attributes = True

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Neplatne prihlasovaci udaje",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Nedostatecna prava pro tuto akci."
            )
        return current_user
    return role_checker

def send_invite_email(email_to: str, token: str):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", 465))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    reset_link = f"https://metaport.aznoh.cz/set-password?token={token}"
    logo_url = "https://metaport.aznoh.cz/icons/Metafra_text-cs.svg"

    msg = MIMEMultipart('alternative')
    msg['From'] = smtp_user
    msg['To'] = email_to
    msg['Subject'] = "Pozvánka do MetaPort Administrace"

    text_body = f"""
    Dobrý den,
    
    byl Vám vytvořen účet v systému MetaPort.
    Pro dokončení registrace a nastavení hesla klikněte na následující odkaz:
    
    {reset_link}
    
    Tento odkaz je platný 24 hodin.
    """

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #090C15; font-family: Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #090C15; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #131927; border-radius: 8px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                        <tr>
                            <td align="center" style="padding: 40px 40px 20px 40px;">
                                <img src="{logo_url}" alt="METAFRA" height="30" style="display: block; margin-bottom: 20px; border: 0;">
                                <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0;">Dokončení registrace</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 40px 20px 40px; color: #E2E8F0; font-size: 16px; line-height: 24px;">
                                <p style="margin: 0 0 16px 0;">Dobrý den,</p>
                                <p style="margin: 0 0 16px 0;">byl Vám vytvořen účet v systému <strong style="color: #00B3E6;">MetaPort</strong>. Kliknutím na následující tlačítko Vás provedeme procesem nastavení Vašeho hesla. Upozorňujeme, že odkaz platí pouze 24 hodin.</p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 10px 40px 30px 40px;">
                                <a href="{reset_link}" style="background-color: #00B3E6; color: #090C15; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Nastavit heslo</a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 40px 30px 40px; color: #94A3B8; font-size: 14px; line-height: 21px;">
                                <p style="margin: 0 0 16px 0;">Pokud si nejste vědomi této aktivity, jednoduše tento email ignorujte.</p>
                                <p style="margin: 0;">Děkujeme,<br>Tým MetaPort</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 40px; background-color: #0B101A; border-top: 1px solid #1E293B; color: #64748B; font-size: 12px; line-height: 18px;">
                                <p style="margin: 0 0 8px 0;">Pokud se Vám nedaří použít výše uvedené tlačítko, využijte odkaz níže:</p>
                                <a href="{reset_link}" style="color: #00B3E6; word-break: break-all; text-decoration: none;">{reset_link}</a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    part1 = MIMEText(text_body, 'plain')
    part2 = MIMEText(html_body, 'html')

    msg.attach(part1)
    msg.attach(part2)

    try:
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
    except Exception as e:
        print(f"Chyba odesilani emailu: {e}")

@router.post("/set-password", status_code=status.HTTP_200_OK)
async def set_password(data: SetPasswordRequest, db: Session = Depends(get_db)):
    users = db.query(User).all()
    target_user = None
    
    for user in users:
        try:
            if verify_password(data.token, user.hashed_password):
                target_user = user
                break
        except:
            continue
            
    if not target_user:
        raise HTTPException(status_code=400, detail="Neplatny nebo expirovany odkaz pozvanky.")
        
    target_user.hashed_password = get_password_hash(data.password)
    db.commit()
    return {"msg": "Heslo bylo uspesne nastaveno. Nyni se muzete prihlasit."}

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nespravne jmeno nebo heslo",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["superadmin"]))
):
    users = db.query(User).all()
    return users

@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_roles(["superadmin"]))
):
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Uzivatel s timto jmenem uz existuje")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Tento email je uz zaregistrovany")
        
    if user_data.role not in ["admin", "betteradmin", "superadmin"]:
        raise HTTPException(status_code=400, detail="Neplatna role")

    new_user = User(
        username=user_data.username,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    return {"msg": f"Uzivatel {user_data.username} uspesne vytvoren."}

@router.post("/users/invite", status_code=status.HTTP_201_CREATED)
async def invite_user(
    user_data: UserInvite, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_roles(["superadmin"]))
):
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Uzivatel s timto jmenem uz existuje")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Tento email je uz zaregistrovany")
    if user_data.role not in ["admin", "betteradmin", "superadmin"]:
        raise HTTPException(status_code=400, detail="Neplatna role")

    invite_token = secrets.token_urlsafe(32)
    
    new_user = User(
        username=user_data.username,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        hashed_password=get_password_hash(invite_token), 
        role=user_data.role
    )
    db.add(new_user)
    db.commit()

    send_invite_email(new_user.email, invite_token)

    return {"msg": f"Pozvanka pro {user_data.username} byla odeslana na {user_data.email}."}

@router.put("/users/{user_id}/role", status_code=status.HTTP_200_OK)
async def update_user_role(
    user_id: int,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["superadmin"]))
):
    if role_data.role not in ["admin", "betteradmin", "superadmin"]:
        raise HTTPException(status_code=400, detail="Neplatna role")
        
    user_to_update = db.query(User).filter(User.id == user_id).first()
    
    if not user_to_update:
        raise HTTPException(status_code=404, detail="Uzivatel nebyl nalezen")
    if user_to_update.id == current_user.id:
        raise HTTPException(status_code=400, detail="Nemuzes zmenit roli sam sobe")

    user_to_update.role = role_data.role
    db.commit()
    return {"msg": f"Role uzivatele {user_to_update.username} zmenena na {role_data.role}."}

@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["superadmin"]))
):
    user_to_delete = db.query(User).filter(User.id == user_id).first()
    
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="Uzivatel nebyl nalezen")
        
    if user_to_delete.id == current_user.id:
        raise HTTPException(status_code=400, detail="Nemuzes smazat vlastni ucet")

    db.delete(user_to_delete)
    db.commit()
    return {"msg": f"Uzivatel {user_to_delete.username} byl uspesne smazan."}