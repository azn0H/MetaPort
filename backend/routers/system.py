import os
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/system", tags=["System"])

class SystemStatus(BaseModel):
    temp: float
    disk_free_gb: float
    disk_total_gb: float
    ram_used_mb: int
    ram_total_mb: int
    uptime: str

@router.get("/status", response_model=SystemStatus)
def get_system_status():
    # Teplota
    with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
        temp = round(int(f.read()) / 1000, 1)

    # Disk
    st = os.statvfs("/")
    free_gb = round((st.f_bavail * st.f_frsize) / (1024**3), 1)
    total_gb = round((st.f_blocks * st.f_frsize) / (1024**3), 1)

    # RAM
    with open("/proc/meminfo", "r") as f:
        mem_info = f.readlines()
        mem_total = int(mem_info[0].split()[1]) // 1024
        mem_avail = int(mem_info[2].split()[1]) // 1024
        mem_used = mem_total - mem_avail

    # Uptime
    uptime = os.popen("uptime -p").read().strip().replace("up ", "")

    return {
        "temp": temp,
        "disk_free_gb": free_gb,
        "disk_total_gb": total_gb,
        "ram_used_mb": mem_used,
        "ram_total_mb": mem_total,
        "uptime": uptime
    }