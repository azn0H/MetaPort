from fastapi import APIRouter, Depends
from pydantic import BaseModel
import psutil
import time
import os
import platform
from .auth import get_current_user

router = APIRouter(prefix="/api/v1/hardware", tags=["Hardware"])

class HardwareStats(BaseModel):
    cpu_temp_c: float
    cpu_freq_mhz: float
    cpu_load: float
    ram_used_mb: float
    ram_total_mb: float
    sd_usage_percent: float
    sd_free_gb: float
    uptime_seconds: float

def read_cpu_temp() -> float:
    if platform.system() != "Linux":
        return 45.5
    try:
        with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
            return round(float(f.read().strip()) / 1000.0, 1)
    except Exception:
        return 0.0

@router.get("", response_model=HardwareStats)
async def get_hardware_stats(current_user: str = Depends(get_current_user)):
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    uptime = time.time() - psutil.boot_time()
    
    try:
        load1, _, _ = os.getloadavg()
    except OSError:
        load1 = 0.0

    freq = psutil.cpu_freq().current if psutil.cpu_freq() else 0.0

    return HardwareStats(
        cpu_temp_c=read_cpu_temp(),
        cpu_freq_mhz=round(freq, 0),
        cpu_load=round(load1, 2),
        ram_used_mb=round(mem.used / (1024 * 1024), 0),
        ram_total_mb=round(mem.total / (1024 * 1024), 0),
        sd_usage_percent=disk.percent,
        sd_free_gb=round(disk.free / (1024**3), 1),
        uptime_seconds=round(uptime, 0)
    )