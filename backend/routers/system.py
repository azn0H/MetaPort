import os
import time
import socket
import asyncio
import asyncssh
import stat
from fastapi import HTTPException
from fastapi import UploadFile, File
from fastapi.responses import StreamingResponse
import io
import jwt
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel
from .auth import require_roles, get_current_user

router = APIRouter(prefix="/api/v1/system", tags=["System"])

class SystemStatus(BaseModel):
    cpu_model: str
    cpu_freq: int
    kernel: str
    ping: int | str
    temp: float
    ram_used: int
    ram_total: int
    ram_percent: int
    cpu_load: str
    disk_percent: int
    disk_free_gb: float
    uptime: str
    net_rx: float
    net_tx: float
    mc_status: str

async def verify_ws_superadmin(token: str):
    try:
        SECRET_KEY = os.getenv("SECRET_KEY", "fallback-klic")
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        role = payload.get("role")
        if role != "superadmin":
            return False
        return True
    except:
        return False

@router.websocket("/ws/console")
async def websocket_console(websocket: WebSocket, token: str = Query(...)):
    await websocket.accept()

    is_valid = await verify_ws_superadmin(token)
    if not is_valid:
        await websocket.send_text("\r\n[Chyba] Pristup odepren.\r\n")
        await websocket.close(code=1008)
        return

    host = os.getenv("RPI_SSH_HOST", "172.17.0.1")
    user = os.getenv("RPI_SSH_USER", "aznoh")

    try:
        async with asyncssh.connect(host, username=user, client_keys=['/app/ssh_key'], known_hosts=None) as conn:
            async with conn.create_process(term_type='xterm') as process:
                await websocket.send_text(f"\r\n[Uspech] Pripojeno k {user}@{host}!\r\n")

                async def read_from_ssh():
                    try:
                        while not process.stdout.at_eof():
                            data = await process.stdout.read(1024)
                            if data:
                                await websocket.send_text(data)
                    except Exception:
                        pass

                async def write_to_ssh():
                    try:
                        while True:
                            data = await websocket.receive_text()
                            process.stdin.write(data)
                    except WebSocketDisconnect:
                        pass

                await asyncio.gather(read_from_ssh(), write_to_ssh())

    except Exception as e:
        await websocket.send_text(f"\r\n[Chyba SSH spojeni] {str(e)}\r\n")
        await websocket.close()

class FileItem(BaseModel):
    name: str
    is_dir: bool
    size: int
    permissions: str

@router.get("/files", response_model=list[FileItem])
async def list_files(
    path: str = "/home/aznoh",
    current_user = Depends(require_roles(["superadmin"]))
):
    host = os.getenv("RPI_SSH_HOST", "172.17.0.1")
    user = os.getenv("RPI_SSH_USER", "aznoh")

    try:
        async with asyncssh.connect(host, username=user, client_keys=['/app/ssh_key'], known_hosts=None) as conn:
            async with conn.start_sftp_client() as sftp:
                try:
                    files = await sftp.readdir(path)
                except asyncssh.SFTPNoSuchFile:
                    raise HTTPException(status_code=404, detail="Slozka neexistuje")
                except asyncssh.SFTPPermissionDenied:
                    raise HTTPException(status_code=403, detail="Pristup odepren")

                result = []
                for f in files:
                    if f.filename in ('.', '..'):
                        continue
                    
                    attrs = f.attrs
                    is_dir = stat.S_ISDIR(attrs.permissions) if attrs.permissions else False
                    
                    result.append({
                        "name": f.filename,
                        "is_dir": is_dir,
                        "size": attrs.size or 0,
                        "permissions": stat.filemode(attrs.permissions) if attrs.permissions else ""
                    })
                
                result.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))
                return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reboot")
def reboot_system(current_user = Depends(require_roles(["betteradmin", "superadmin"]))):
    try:
        os.system("dbus-send --system --print-reply --dest=org.freedesktop.login1 /org/freedesktop/login1 org.freedesktop.login1.Manager.Reboot boolean:true")
        return {"status": "rebooting"}
    except Exception as e:
        return {"error": str(e)}

@router.post("/shutdown")
def shutdown_system(current_user = Depends(require_roles(["betteradmin", "superadmin"]))):
    try:
        os.system("dbus-send --system --print-reply --dest=org.freedesktop.login1 /org/freedesktop/login1 org.freedesktop.login1.Manager.PowerOff boolean:true")
        return {"status": "shutting down"}
    except Exception as e:
        return {"error": str(e)}

@router.get("/status", response_model=SystemStatus)
def get_system_status(current_user = Depends(get_current_user)):
    with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
        temp = round(int(f.read()) / 1000, 1)

    with open("/proc/meminfo", "r") as f:
        lines = f.readlines()
        total = int(lines[0].split()[1]) // 1024
        avail = int(lines[2].split()[1]) // 1024
        used = total - avail
    
    with open("/proc/loadavg", "r") as f:
        load = f.read().split()[0]

    with open("/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq", "r") as f:
        freq = int(f.read()) // 1000

    try:
        start = time.time()
        socket.create_connection(("8.8.8.8", 53), timeout=0.5).close()
        ping = int((time.time() - start) * 1000)
    except:
        ping = "Timeout"

    with open("/proc/version", "r") as f:
        kernel = f.read().split()[2]

    st = os.statvfs("/")
    free = round((st.f_bavail * st.f_frsize) / 1024**3, 1)
    total_disk = round((st.f_blocks * st.f_frsize) / 1024**3, 1)
    disk_p = int(((total_disk - free) / total_disk) * 100)

    with open("/proc/uptime", "r") as f:
        sec = int(float(f.readline().split()[0]))
        d, s = divmod(sec, 86400)
        h, s = divmod(s, 3600)
        m, s = divmod(s, 60)
        uptime = f"{d} dní, {h} hod, {m} min"

    try:
        socket.create_connection(("192.168.0.5", 25565), timeout=0.1).close()
        mc = "ONLINE"
    except:
        mc = "OFFLINE"

    return {
        "cpu_model": "Raspberry Pi 5",
        "cpu_freq": freq,
        "kernel": kernel,
        "ping": ping,
        "temp": temp,
        "ram_used": used,
        "ram_total": total,
        "ram_percent": int((used / total) * 100),
        "cpu_load": load,
        "disk_percent": disk_p,
        "disk_free_gb": free,
        "uptime": uptime,
        "net_rx": 0.0,
        "net_tx": 0.0,
        "mc_status": mc
    }

@router.get("/download")
async def download_file(
    path: str,
    current_user = Depends(require_roles(["superadmin"]))
):
    host = os.getenv("RPI_SSH_HOST", "172.17.0.1")
    user = os.getenv("RPI_SSH_USER", "aznoh")

    try:
        async with asyncssh.connect(host, username=user, client_keys=['/app/ssh_key'], known_hosts=None) as conn:
            async with conn.start_sftp_client() as sftp:
                memory_file = io.BytesIO()
                await sftp.get(path, memory_file)
                memory_file.seek(0)
                filename = path.split("/")[-1]
                return StreamingResponse(
                    memory_file, 
                    media_type="application/octet-stream",
                    headers={"Content-Disposition": f"attachment; filename={filename}"}
                )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_file(
    path: str,
    file: UploadFile = File(...),
    current_user = Depends(require_roles(["superadmin"]))
):
    host = os.getenv("RPI_SSH_HOST", "172.17.0.1")
    user = os.getenv("RPI_SSH_USER", "aznoh")

    try:
        async with asyncssh.connect(host, username=user, client_keys=['/app/ssh_key'], known_hosts=None) as conn:
            async with conn.start_sftp_client() as sftp:
                file_content = await file.read()
                remote_path = f"{path.rstrip('/')}/{file.filename}"
                
                async with sftp.open(remote_path, 'wb') as remote_file:
                    await remote_file.write(file_content)
                
                return {"msg": "Soubor nahran"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))