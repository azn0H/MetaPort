import { useState, useEffect } from 'react'
import { Cpu, HardDrive, Thermometer, Clock, Globe, Server, Power, RefreshCw, Trash2, AlertTriangle, Zap, Database } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'

interface DiskInfo {
  name: string
  device: string
  mountpoint: string
  total_gb: number
  used_gb: number
  free_gb: number
  percent: number
  is_ssd: boolean
}

const getProgressColor = (value: number) => {
  if (value >= 90) return 'text-rose-500'
  if (value >= 70) return 'text-amber-500'
  return 'text-emerald-500'
}

const getProgressGradient = (value: number) => {
  if (value >= 90) return 'from-rose-500 to-pink-600'
  if (value >= 70) return 'from-amber-500 to-orange-500'
  return 'from-emerald-500 to-teal-600'
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
      <span className="text-slate-400 flex items-center gap-2"><Icon className="w-4 h-4" /> {label}</span>
      <span className="text-white font-medium">{value || 'N/A'}</span>
    </div>
  )
}

function MetricCard({ title, value, unit, icon: Icon, color, gradient, percent, badge }: any) {
  const progressWidth = percent !== undefined ? percent : value

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-sm font-medium ${color}`}>{value}{unit}</span>
          {badge && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 mt-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {badge}
            </span>
          )}
        </div>
      </div>
      <h3 className="text-slate-400 text-sm mb-3">{title}</h3>
      {typeof progressWidth === 'number' && (
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500 rounded-full`}
            style={{ width: `${Math.min(Math.max(progressWidth, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function CircularProgress({ value, label, sublabel }: { value: number; label: string; sublabel?: string }) {
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (Math.min(value, 100) / 100) * circumference
  const colorClass = getProgressColor(value)

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="64" cy="64" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
          <circle 
            cx="64" cy="64" r="45" fill="none" 
            stroke="currentColor" 
            strokeWidth="8" strokeLinecap="round" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            className={`transition-all duration-700 ${colorClass}`} 
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${colorClass}`}>{Math.round(value)}%</span>
          {sublabel && <span className="text-[10px] text-slate-400 mt-0.5">{sublabel}</span>}
        </div>
      </div>
      <span className="text-slate-300 text-sm font-medium mt-2 text-center">{label}</span>
    </div>
  )
}

export default function DashboardPage() {
  usePageTitle('Dashboard')

  const [data, setData] = useState<any>(null)
  const [powerCountdown, setPowerCountdown] = useState<number | null>(null)
  const [powerActionText, setPowerActionText] = useState('')

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'reboot' | 'shutdown' | 'prune' | null>(null)
  const [confirmMessage, setConfirmMessage] = useState('')
  
  const { showToast } = useToast()

  const userRole = localStorage.getItem('user_role') || 'admin'
  const canControlPower =  userRole === 'superadmin'

  useEffect(() => {
    const fetchSystem = async () => {
      try {
        const token = localStorage.getItem('jwt_token')
        const response = await fetch('https://api-metaport.aznoh.cz/api/v1/system/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.status === 401) {
          localStorage.removeItem('jwt_token')
          localStorage.removeItem('user_role')
          window.location.href = '/login'
          return
        }
        if (response.ok) {
          const json = await response.json()
          setData(json)
        }
      } catch (err) {}
    }
    
    fetchSystem()
    const interval = setInterval(fetchSystem, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (powerCountdown !== null && powerCountdown > 0) {
      const timer = setTimeout(() => setPowerCountdown(powerCountdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (powerCountdown === 0 && powerActionText.includes('Restart')) {
      window.location.reload()
    }
  }, [powerCountdown, powerActionText])

  const requestPowerAction = (action: 'reboot' | 'shutdown' | 'prune', message: string) => {
    setPendingAction(action)
    setConfirmMessage(message)
    setIsConfirmModalOpen(true)
  }

  const executePowerAction = async () => {
    if (!pendingAction) return
    const action = pendingAction
    
    setIsConfirmModalOpen(false)
    setPendingAction(null)

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`https://api-metaport.aznoh.cz/api/v1/system/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.detail || responseData.error || 'Nepodařilo se provést akci')
      }
      
      if (action === 'prune') {
        showToast('Čištění Docker systému bylo spuštěno na pozadí.', 'success')
        return
      }

      setPowerActionText(action === 'reboot' ? 'Restartování serveru...' : 'Vypínání serveru...')
      setPowerCountdown(action === 'reboot' ? 45 : 20)
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  if (powerCountdown !== null) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
        <RefreshCw className="w-16 h-16 text-cyan-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">{powerActionText}</h2>
        <p className="text-slate-400 text-lg">
          {powerActionText.includes('Restart') 
            ? `Stránka se automaticky obnoví za ${powerCountdown} sekund.`
            : `Můžeš bezpečně zavřít prohlížeč. (Vypne se za ${powerCountdown} s)`}
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <div className="w-40 h-8 bg-slate-800/50 rounded-lg animate-pulse mb-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-4 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-slate-800" />
                <div className="w-16 h-5 bg-slate-800 rounded" />
              </div>
              <div className="w-24 h-4 bg-slate-800 rounded mb-3 animate-pulse" />
              <div className="h-2 bg-slate-800 rounded-full w-full animate-pulse" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm">
            <div className="w-32 h-6 bg-slate-800 rounded mb-6 animate-pulse" />
            <div className="flex justify-around animate-pulse">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full border-8 border-slate-800" />
                <div className="w-24 h-4 bg-slate-800 rounded mt-2" />
              </div>
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full border-8 border-slate-800" />
                <div className="w-24 h-4 bg-slate-800 rounded mt-2" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm">
            <div className="w-32 h-6 bg-slate-800 rounded mb-6 animate-pulse" />
            <div className="space-y-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-slate-800" />
                    <div className="w-20 h-4 bg-slate-800 rounded" />
                  </div>
                  <div className="w-32 h-4 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ramPercent = data.ram_total > 0 ? (data.ram_used / data.ram_total) * 100 : 0
  const ramUsedPercent = data.ram_total > 0 ? Math.round((data.ram_used / data.ram_total) * 100) : 0
  const ramColor = getProgressColor(ramUsedPercent)

  const disks: DiskInfo[] = data.disks && data.disks.length > 0 
    ? data.disks 
    : [
        {
          name: 'Systémový disk',
          device: '/dev/root',
          mountpoint: '/',
          total_gb: Math.round(((data.disk_free_gb || 0) / (1 - ((data.disk_percent || 0) / 100) || 1)) * 10) / 10 || 32,
          used_gb: Math.round(((data.disk_free_gb || 0) * (data.disk_percent || 0) / 100) * 10) / 10,
          free_gb: data.disk_free_gb || 0,
          percent: data.disk_percent || 0,
          is_ssd: false
        }
      ]

  const nvmeDisk = disks.find(d => d.is_ssd || d.device.includes('nvme'))
  const primaryDisplayDisk = nvmeDisk || disks[0]
  const primaryDiskPercent = primaryDisplayDisk ? primaryDisplayDisk.percent : (data.disk_percent || 0)
  const primaryDiskFree = primaryDisplayDisk ? primaryDisplayDisk.free_gb : (data.disk_free_gb || 0)
  const primaryDiskColor = getProgressColor(primaryDiskPercent)
  const primaryDiskGradient = getProgressGradient(primaryDiskPercent)

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl bg-[url('/grid.svg')] bg-center bg-cover flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold text-white">Vítejte v administraci MetaPort</h2>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
        </div>
        
        {canControlPower && (
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => requestPowerAction('prune', 'Opravdu chceš promazat Docker systém? Smažou se všechny nepoužívané kontejnery, sítě, image a volumes.')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-purple-500/20 text-slate-300 hover:text-purple-400 border border-slate-700 hover:border-purple-500/50 rounded-xl transition-all text-sm font-medium shadow-lg"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Vyčistit Systém</span>
            </button>
            <button 
              onClick={() => requestPowerAction('reboot', 'Opravdu chceš restartovat Raspberry Pi?')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-700 hover:border-amber-500/50 rounded-xl transition-all text-sm font-medium shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Restartovat</span>
            </button>
            <button 
              onClick={() => requestPowerAction('shutdown', 'Opravdu chceš úplně vypnout Raspberry Pi?')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 rounded-xl transition-all text-sm font-medium shadow-lg"
            >
              <Power className="w-4 h-4" />
              <span className="hidden sm:inline">Vypnout</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Teplota CPU" 
          value={data.temp} 
          unit="°C" 
          icon={Thermometer} 
          color={getProgressColor(data.temp)} 
          gradient="from-rose-500 to-pink-600" 
          percent={data.temp} 
        />
        <MetricCard 
          title={nvmeDisk ? "Volné místo (NVMe SSD)" : "Volné místo"} 
          value={primaryDiskFree} 
          unit=" GB" 
          icon={HardDrive} 
          color={primaryDiskColor} 
          gradient={primaryDiskGradient} 
          percent={primaryDiskPercent}
          badge={nvmeDisk ? "NVMe" : undefined}
        />
        <MetricCard 
          title="RAM Využito" 
          value={data.ram_used} 
          unit=" MB" 
          icon={Cpu} 
          color={ramColor} 
          gradient="from-emerald-500 to-teal-600" 
          percent={ramUsedPercent} 
        />
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 flex flex-col justify-center items-center backdrop-blur-sm">
          <h3 className="text-slate-400 text-sm mb-2">Minecraft Server</h3>
          <span className={`text-xl font-bold ${data.mc_status?.includes("ONLINE") ? "text-emerald-400" : "text-rose-500"}`}>
            {data.mc_status || "OFFLINE"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white mb-6">Využití systému</h2>
            <div className="flex flex-wrap items-center justify-around gap-6 py-2">
              <CircularProgress value={ramPercent} label="Využití RAM" sublabel={`${data.ram_used} MB`} />
              {disks.map((disk, idx) => (
                <CircularProgress 
                  key={idx} 
                  value={disk.percent} 
                  label={disk.is_ssd ? 'Využití NVMe SSD' : `Využití ${disk.name.split(' ')[0]}`} 
                  sublabel={`${disk.free_gb} GB volných`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-6">System Info</h2>
          <div className="space-y-1">
            <InfoRow icon={Clock} label="Uptime" value={data.uptime} />
            <InfoRow icon={Globe} label="OS" value={data.os_name || "Ubuntu 22.04 LTS"} />
            <InfoRow icon={Cpu} label="Kernel" value={data.kernel} />
            <InfoRow icon={Server} label="Docker" value={data.docker_version} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Disky & Úložiště</h2>
              <p className="text-xs text-slate-400">Připojené úložné jednotky (SD, NVMe SSD)</p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg">
            {disks.length} {disks.length === 1 ? 'disk' : disks.length < 5 ? 'disky' : 'disků'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {disks.map((disk, index) => {
            const diskProgressGradient = getProgressGradient(disk.percent)
            const diskTextColor = getProgressColor(disk.percent)

            return (
              <div 
                key={index} 
                className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-5 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${disk.is_ssd ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-cyan-500/20' : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'} flex items-center justify-center shadow-md`}>
                      {disk.is_ssd ? <Zap className="w-5 h-5 text-white" /> : <HardDrive className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                          {disk.name}
                        </span>
                        {disk.is_ssd && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                            NVMe
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {disk.device} • {disk.mountpoint}
                      </span>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${diskTextColor}`}>
                    {Math.round(disk.percent)}%
                  </span>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">
                      Volno: <strong className="text-slate-200">{disk.free_gb} GB</strong>
                    </span>
                    <span className="text-slate-400">
                      Celkem: <strong className="text-slate-200">{disk.total_gb} GB</strong>
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full bg-gradient-to-r ${diskProgressGradient} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.min(Math.max(disk.percent, 0), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        maxWidth="max-w-md"
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-white font-semibold text-lg">Potvrzení akce</span>
          </div>
        }
      >
        <div className="p-6">
          <p className="text-slate-300 text-base mb-8">
            {confirmMessage}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-300 font-medium hover:bg-slate-800 transition-colors"
            >
              Zrušit
            </button>
            <button
              onClick={executePowerAction}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium transition-colors shadow-lg shadow-rose-500/20"
            >
              Provést
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}