import { useState, useEffect } from 'react'
import { Cpu, HardDrive, Thermometer, Clock, Globe, Server, Power, RefreshCw  } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'

const getProgressColor = (value: number) => {
  if (value >= 90) return 'text-rose-500';
  if (value >= 70) return 'text-amber-500';
  return 'text-emerald-500';
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
      <span className="text-slate-400 flex items-center gap-2"><Icon className="w-4 h-4" /> {label}</span>
      <span className="text-white font-medium">{value || 'N/A'}</span>
    </div>
  )
}

function MetricCard({ title, value, unit, icon: Icon, color, gradient, percent }: any) {
  const progressWidth = percent !== undefined ? percent : value;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className={`text-sm font-medium ${color}`}>{value}{unit}</span>
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

function CircularProgress({ value, label }: { value: number; label: string }) {
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (Math.min(value, 100) / 100) * circumference
  const colorClass = getProgressColor(value);

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
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${colorClass}`}>{Math.round(value)}%</span>
        </div>
      </div>
      <span className="text-slate-400 text-sm mt-2">{label}</span>
    </div>
  )
}

export default function DashboardPage() {
  usePageTitle('Dashboard') // <-- Zavolání hooku pro změnu titulku

  const [data, setData] = useState<any>(null)
  
  const [powerCountdown, setPowerCountdown] = useState<number | null>(null)
  const [powerActionText, setPowerActionText] = useState('')

  const userRole = localStorage.getItem('user_role') || 'admin'
  const canControlPower =  userRole === 'superadmin'

  useEffect(() => {
    const fetchSystem = async () => {
      try {
        const token = localStorage.getItem('jwt_token')
        const response = await fetch('https://api-metaport.aznoh.cz/api/v1/system/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const json = await response.json()
          setData(json)
        }
      } catch (err) { console.error("Chyba při fetch:", err) }
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

  const handlePowerAction = async (action: 'reboot' | 'shutdown') => {
    const isReboot = action === 'reboot'
    const confirmMessage = isReboot 
      ? 'Opravdu chceš restartovat Raspberry Pi?' 
      : 'Opravdu chceš úplně vypnout Raspberry Pi?'

    if (!window.confirm(confirmMessage)) return

    try {
      const token = localStorage.getItem('jwt_token')
      await fetch(`https://api-metaport.aznoh.cz/api/v1/system/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setPowerActionText(isReboot ? 'Restartování serveru...' : 'Vypínání serveru...')
      setPowerCountdown(isReboot ? 45 : 20)
    } catch (err) {
      console.error("Chyba při odesílání příkazu:", err)
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

  const ramPercent = data.ram_total > 0 ? (data.ram_used / data.ram_total) * 100 : 0;
  const diskPercent = data.disk_percent || 0;
  const ramUsedPercent = data.ram_total > 0 ? Math.round((data.ram_used / data.ram_total) * 100) : 0;
  const ramColor = getProgressColor(ramUsedPercent);

  const diskColor = getProgressColor(diskPercent);
  const diskGradient = diskPercent >= 90 
    ? "from-rose-500 to-pink-600" 
    : diskPercent >= 70 
    ? "from-amber-500 to-orange-500" 
    : "from-emerald-500 to-teal-600";

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl bg-[url('/grid.svg')] bg-center bg-cover flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold text-white">Vítejte v administraci MetaPort</h2>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
        </div>
        
        {canControlPower && (
          <div className="flex gap-3">
            <button 
              onClick={() => handlePowerAction('reboot')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-700 hover:border-amber-500/50 rounded-xl transition-all text-sm font-medium shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Restartovat</span>
            </button>
            <button 
              onClick={() => handlePowerAction('shutdown')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 rounded-xl transition-all text-sm font-medium shadow-lg"
            >
              <Power className="w-4 h-4" />
              <span className="hidden sm:inline">Vypnout</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Teplota CPU" value={data.temp} unit="°C" icon={Thermometer} color={getProgressColor(data.temp)} gradient="from-rose-500 to-pink-600" percent={data.temp} />
        <MetricCard title="Volné místo" value={data.disk_free_gb} unit=" GB" icon={HardDrive} color={diskColor} gradient={diskGradient} percent={diskPercent} />
        <MetricCard title="RAM Využito" value={data.ram_used} unit=" MB" icon={Cpu} color={ramColor} gradient="from-emerald-500 to-teal-600" percent={ramUsedPercent} />
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 flex flex-col justify-center items-center">
          <h3 className="text-slate-400 text-sm mb-2">Minecraft Server</h3>
          <span className={`text-xl font-bold ${data.mc_status?.includes("ONLINE") ? "text-emerald-400" : "text-rose-500"}`}>
            {data.mc_status || "OFFLINE"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-6">Využití</h2>
          <div className="flex justify-around">
            <CircularProgress value={ramPercent} label="využití RAM" />
            <CircularProgress value={diskPercent} label="využití disku" />
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
    </div>
  )
}