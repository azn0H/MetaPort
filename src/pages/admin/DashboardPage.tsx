import { useState, useEffect } from 'react'
import { Cpu, HardDrive, Thermometer, Clock } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number
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

      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500 rounded-full`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
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
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-800"
          />
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
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
  const [metrics, setMetrics] = useState({
    cpu: 45,
    ram: 62,
    disk: 38,
    temp: 52,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.floor(Math.random() * 40) + 30,
        ram: Math.floor(Math.random() * 30) + 50,
        disk: Math.floor(Math.random() * 20) + 30,
        temp: Math.floor(Math.random() * 20) + 45,
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">System Overview</h1>
        <p className="text-slate-400">Monitor your hardware metrics in real-time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="CPU Usage"
          value={metrics.cpu}
          unit="%"
          icon={Cpu}
          color="text-cyan-400"
          gradient="from-cyan-500 to-blue-600"
        />
        <MetricCard
          title="RAM Usage"
          value={metrics.ram}
          unit="%"
          icon={HardDrive}
          color="text-emerald-400"
          gradient="from-emerald-500 to-teal-600"
        />
        <MetricCard
          title="Disk Usage"
          value={metrics.disk}
          unit="%"
          icon={HardDrive}
          color="text-orange-400"
          gradient="from-orange-500 to-rose-600"
        />
        <MetricCard
          title="Temperature"
          value={metrics.temp}
          unit="C"
          icon={Thermometer}
          color="text-rose-400"
          gradient="from-rose-500 to-pink-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-6">Resource Usage</h2>
          <div className="flex justify-around">
            <CircularProgress value={metrics.cpu} label="CPU" color="text-cyan-400" />
            <CircularProgress value={metrics.ram} label="RAM" color="text-emerald-400" />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-6">System Info</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Uptime
              </span>
              <span className="text-white font-medium">14 days, 6 hours</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-800">
              <span className="text-slate-400">OS</span>
              <span className="text-white font-medium">Ubuntu 22.04 LTS</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-800">
              <span className="text-slate-400">Kernel</span>
              <span className="text-white font-medium">5.15.0-generic</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-slate-400">Docker</span>
              <span className="text-white font-medium">24.0.5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
