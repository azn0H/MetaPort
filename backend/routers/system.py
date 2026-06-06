import os
import time
import socket
from fastapi import APIRouter
from pydantic import BaseModel

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

@router.post("/reboot")
def reboot_system():
    try:
        os.system("dbus-send --system --print-reply --dest=org.freedesktop.login1 /org/freedesktop/login1 org.freedesktop.login1.Manager.Reboot boolean:true")
        return {"status": "rebooting"}
    except Exception as e:
        return {"error": str(e)}

@router.post("/shutdown")
def shutdown_system():
    try:
        os.system("dbus-send --system --print-reply --dest=org.freedesktop.login1 /org/freedesktop/login1 org.freedesktop.login1.Manager.PowerOff boolean:true")
        return {"status": "shutting down"}
    except Exception as e:
        return {"error": str(e)}

@router.get("/status", response_model=SystemStatus)
def get_system_status():

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