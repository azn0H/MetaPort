import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets

class UserInvite(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: str
    role: str

class RoleUpdate(BaseModel):
    role: str

def send_invite_email(email_to: str, token: str):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", 465))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    reset_link = f"https://metaport.aznoh.cz/set-password?token={token}"

    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = email_to
    msg['Subject'] = "Pozvánka do MetaPort Administrace"

    body = f"""
    Dobrý den,
    
    byl Vám vytvořen účet v systému MetaPort.
    Pro dokončení registrace a nastavení hesla klikněte na následující odkaz:
    
    {reset_link}
    
    Tento odkaz je platný 24 hodin.
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
    except Exception as e:
        print(f"Chyba odesilani emailu: {e}")

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