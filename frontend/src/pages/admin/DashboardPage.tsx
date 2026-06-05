import { useState, useEffect } from 'react'
import { Cpu, HardDrive, Thermometer, Clock, Globe, Server } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number | string
  unit: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  gradient: string
}

function MetricCard({ title, value, unit, icon: Icon, color, gradient }: MetricCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className={`text-sm font-medium ${color}`}>{value}{unit}</span>
      </div>
      <h3 className="text-slate-400 text-sm mb-3">{title}</h3>
      {typeof value === 'number' && (
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500 rounded-full`}
            style={{ width: `${Math.min(value, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function CircularProgress({ value, label, color }: { value: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (value / 100) * circumference
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="64" cy="64" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
          <circle cx="64" cy="64" r="45" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-500" />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{value}%</span>
        </div>
      </div>
      <span className="text-slate-400 text-sm mt-2">{label}</span>
    </div>
  )
}

function DashboardPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const fetchSystem = async () => {
      try {
        const token = localStorage.getItem('jwt_token')
        const response = await fetch('https://api-metaport.aznoh.cz/api/v1/system/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) setData(await response.json())
      } catch (err) { console.error(err) }
    }
    
    fetchSystem()
    const interval = setInterval(fetchSystem, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!data) return <div className="text-slate-400 p-8">Načítání metrik systému...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Raspberry Pi Monitor</h1>
        <p className="text-slate-400">Reálný stav tvého hardwaru</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Teplota CPU" value={data.temp} unit="°C" icon={Thermometer} color="text-rose-400" gradient="from-rose-500 to-pink-600" />
        <MetricCard title="Volné místo" value={data.disk_free_gb} unit=" GB" icon={HardDrive} color="text-orange-400" gradient="from-orange-500 to-rose-600" />
        <MetricCard title="RAM Využito" value={data.ram_used_mb} unit=" MB" icon={Cpu} color="text-emerald-400" gradient="from-emerald-500 to-teal-600" />
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm flex flex-col justify-center items-center">
          <h3 className="text-slate-400 text-sm mb-2">Minecraft Server</h3>
          <span className={`text-xl font-bold ${data.mc_status?.includes("ONLINE") ? "text-emerald-400" : "text-rose-500"}`}>
            {data.mc_status || "OFFLINE"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-6">Resource Usage</h2>
          <div className="flex justify-around">
            <CircularProgress value={Math.round((data.ram_used_mb / data.ram_total_mb) * 100)} label="RAM Usage" color="text-emerald-400" />
            <CircularProgress value={Math.round(((data.disk_total_gb - data.disk_free_gb) / data.disk_total_gb) * 100)} label="Disk Usage" color="text-orange-400" />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-6">System Info</h2>
          <div className="space-y-4">
            <InfoRow icon={Clock} label="Uptime" value={data.uptime} />
            <InfoRow icon={Globe} label="OS" value={data.os_name || "Ubuntu 22.04 LTS"} />
            <InfoRow icon={Cpu} label="Kernel" value={data.kernel || "5.15.0-generic"} />
            <InfoRow icon={Server} label="Docker" value={data.docker_version || "24.0.5"} />
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800">
      <span className="text-slate-400 flex items-center gap-2"><Icon className="w-4 h-4" /> {label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}

export default DashboardPage