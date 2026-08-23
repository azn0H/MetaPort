import os
import time
import socket
import asyncio
import asyncssh
import stat
import psutil
from fastapi import HTTPException
from fastapi import UploadFile, File
from fastapi.responses import StreamingResponse
import io
import jwt
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel
from .auth import require_roles, get_current_user

router = APIRouter(prefix="/api/v1/system", tags=["System"])

class DiskInfo(BaseModel):
    name: str
    device: str
    mountpoint: str
    total_gb: float
    used_gb: float
    free_gb: float
    percent: float
    is_ssd: bool

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
    disks: list[DiskInfo] = []
    uptime: str
    net_rx: float
    net_tx: float
    mc_status: str

def get_all_disks() -> list[DiskInfo]:
    disks: list[DiskInfo] = []
    seen_mounts = set()
    seen_devices = set()

    mount_sources = ["/proc/mounts", "/host_proc_mounts"]
    mount_entries = []

    for src in mount_sources:
        if os.path.exists(src):
            try:
                with open(src, "r") as f:
                    for line in f:
                        parts = line.split()
                        if len(parts) >= 3:
                            dev, mount, fstype = parts[0], parts[1], parts[2]
                            if fstype in ["ext4", "ext3", "ext2", "btrfs", "xfs", "zfs", "vfat", "fat", "ntfs", "exfat"]:
                                mount_entries.append((dev, mount, fstype))
            except Exception:
                pass

    try:
        for part in psutil.disk_partitions(all=True):
            if part.fstype and part.fstype not in ["squashfs", "tmpfs", "overlay", "proc", "sysfs"]:
                mount_entries.append((part.device, part.mountpoint, part.fstype))
    except Exception:
        pass

    if not any(m[1] == "/" for m in mount_entries):
        mount_entries.append(("/dev/root", "/", "ext4"))

    nvme_candidates = [
        ("/dev/nvme0n1p1", "/mnt/nvme"),
        ("/dev/nvme0n1p1", "/mnt/ssd"),
        ("/dev/nvme0n1p1", "/mnt/nvme0n1"),
        ("/dev/nvme0n1p1", "/host_mnt/nvme"),
        ("/dev/nvme0n1p1", "/host_mnt/ssd"),
        ("/dev/nvme0n1p1", "/host_mnt/nvme0n1"),
    ]
    for dev, mnt in nvme_candidates:
        if os.path.exists(mnt) and not any(m[1] == mnt for m in mount_entries):
            mount_entries.append((dev, mnt, "ext4"))

    for dev, mount, _ in mount_entries:
        if mount in seen_mounts:
            continue
        if mount.startswith(("/proc", "/sys", "/dev", "/run", "/var/lib/docker")):
            continue

        try:
            st = os.statvfs(mount)
            if st.f_blocks == 0:
                continue

            total_gb = round((st.f_blocks * st.f_frsize) / (1024**3), 1)
            free_gb = round((st.f_bavail * st.f_frsize) / (1024**3), 1)
            used_gb = round(total_gb - free_gb, 1)
            percent = round(((total_gb - free_gb) / total_gb) * 100, 1) if total_gb > 0 else 0.0

            is_nvme = "nvme" in dev.lower() or "nvme" in mount.lower() or "ssd" in mount.lower()
            is_sd = "mmcblk" in dev.lower()

            if is_nvme:
                name = f"NVMe SSD ({dev.split('/')[-1] if '/' in dev else dev})"
            elif is_sd or mount == "/":
                name = "Systémový disk (SD / Root)" if mount == "/" else f"SD oddíl ({dev.split('/')[-1]})"
            else:
                name = f"Disk ({mount})"

            dev_key = (dev, total_gb, free_gb)
            if dev_key in seen_devices:
                continue
            seen_devices.add(dev_key)
            seen_mounts.add(mount)

            disks.append(DiskInfo(
                name=name,
                device=dev,
                mountpoint=mount.replace("/host_mnt", "/mnt").replace("/host_media", "/media"),
                total_gb=total_gb,
                used_gb=used_gb,
                free_gb=free_gb,
                percent=percent,
                is_ssd=is_nvme
            ))
        except Exception:
            continue

    has_nvme = any(d.is_ssd or "nvme" in d.device.lower() for d in disks)
    if not has_nvme:
        sys_nvme_paths = ["/sys/block/nvme0n1", "/sys/class/block/nvme0n1"]
        for sp in sys_nvme_paths:
            if os.path.exists(sp):
                try:
                    sector_path = os.path.join(sp, "size")
                    total_gb = 0.0
                    if os.path.exists(sector_path):
                        with open(sector_path, "r") as f:
                            sectors = int(f.read().strip())
                            total_gb = round((sectors * 512) / (1024**3), 1)
                    disks.append(DiskInfo(
                        name="NVMe SSD (nvme0n1)",
                        device="/dev/nvme0n1",
                        mountpoint="Připojeno (NVMe)",
                        total_gb=total_gb,
                        used_gb=0.0,
                        free_gb=total_gb,
                        percent=0.0,
                        is_ssd=True
                    ))
                    break
                except Exception:
                    pass

    return disks

def get_ssh_connect_kwargs():
    host = os.getenv("RPI_SSH_HOST", "172.17.0.1")
    port = int(os.getenv("RPI_SSH_PORT", "22"))
    user = os.getenv("RPI_SSH_USER", "aznoh")
    password = os.getenv("RPI_SSH_PASSWORD")
    key_path = os.getenv("RPI_SSH_KEY_PATH", "/app/ssh_key")
    key_content = os.getenv("RPI_SSH_KEY")
    
    kwargs = {
        "host": host,
        "port": port,
        "username": user,
        "known_hosts": None,
    }
    
    if password:
        kwargs["password"] = password

    client_keys = []
    if key_content:
        try:
            client_keys.append(asyncssh.import_private_key(key_content))
        except Exception:
            pass

    for candidate_path in [
        key_path,
        "/app/ssh_key",
        os.path.join(os.path.dirname(__file__), "..", "ssh_key"),
        os.path.expanduser("~/.ssh/id_rsa"),
        os.path.expanduser("~/.ssh/id_ed25519"),
    ]:
        if candidate_path and os.path.exists(candidate_path) and os.path.isfile(candidate_path):
            if candidate_path not in client_keys:
                client_keys.append(candidate_path)

    if client_keys:
        kwargs["client_keys"] = client_keys

    return kwargs

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
        await websocket.send_text("\r\n\x1b[31m[Chyba] Pristup odepren (neplatny token nebo nedostatecna role).\x1b[0m\r\n")
        await asyncio.sleep(0.5)
        await websocket.close(code=1008)
        return

    ssh_kwargs = get_ssh_connect_kwargs()
    host = ssh_kwargs.get("host", "host")
    user = ssh_kwargs.get("username", "user")

    try:
        async with asyncssh.connect(**ssh_kwargs) as conn:
            async with conn.create_process(term_type='xterm-256color', term_size=(80, 24)) as process:
                await websocket.send_text(f"\r\n\x1b[32m[Uspech] Pripojeno k {user}@{host}!\x1b[0m\r\n\r\n")

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
                    except Exception:
                        pass

                await asyncio.gather(read_from_ssh(), write_to_ssh())

    except Exception as e:
        await websocket.send_text(f"\r\n\x1b[31m[Chyba SSH spojeni] {str(e)}\x1b[0m\r\n")
        if not ssh_kwargs.get("password") and not ssh_kwargs.get("client_keys"):
            await websocket.send_text("\x1b[33m[Tip] Nastavte v .env promennou RPI_SSH_PASSWORD nebo RPI_SSH_KEY_PATH.\x1b[0m\r\n")
        await asyncio.sleep(0.5)
        try:
            await websocket.close()
        except Exception:
            pass

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
    try:
        async with asyncssh.connect(**get_ssh_connect_kwargs()) as conn:
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

@router.post("/prune")
def prune_system(current_user = Depends(require_roles(["superadmin"]))):
    try:
        os.system("docker system prune -a --volumes -f &")
        return {"status": "pruning initiated"}
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

    disks = get_all_disks()

    return {
        "cpu_model": "Raspberry Pi 5",
        "cpu_freq": freq,
        "kernel": kernel,
        "ping": ping,
        "temp": temp,
        "ram_used": used,
        "ram_total": total,
        "ram_percent": int((used / total) * 100) if total > 0 else 0,
        "cpu_load": load,
        "disk_percent": disk_p,
        "disk_free_gb": free,
        "disks": disks,
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
    filename = path.rstrip("/").split("/")[-1] or "download"

    async def file_iterator():
        try:
            async with asyncssh.connect(**get_ssh_connect_kwargs()) as conn:
                async with conn.start_sftp_client() as sftp:
                    async with sftp.open(path, 'rb') as remote_file:
                        while True:
                            chunk = await remote_file.read(65536)
                            if not chunk:
                                break
                            yield chunk
        except Exception:
            pass

    return StreamingResponse(
        file_iterator(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.post("/upload")
async def upload_file(
    path: str,
    file: UploadFile = File(...),
    current_user = Depends(require_roles(["superadmin"]))
):
    try:
        async with asyncssh.connect(**get_ssh_connect_kwargs()) as conn:
            async with conn.start_sftp_client() as sftp:
                remote_path = f"{path.rstrip('/')}/{file.filename}"
                async with sftp.open(remote_path, 'wb') as remote_file:
                    while content := await file.read(65536):
                        await remote_file.write(content)
                
                return {"msg": "Soubor byl úspěšně nahrán"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))