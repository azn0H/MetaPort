import { useState, useEffect } from 'react'
import {
  Cpu,
  HardDrive,
  Thermometer,
  Clock,
  Globe,
  Server,
  Power,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Zap,
  Database,
  Terminal,
  Gamepad2,
} from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { Card, CardTitle } from '../../components/ui/Card'
import { MetricCard } from '../../components/ui/MetricCard'
import { CircularGauge } from '../../components/ui/CircularGauge'
import { Button } from '../../components/ui/Button'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { DashboardSkeleton } from '../../components/ui/Skeleton'
import { ProgressBar } from '../../components/ui/ProgressBar'

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

function SystemInfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between py-3 px-3.5 rounded-xl hover:bg-zinc-800/40 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold text-zinc-400">{label}</span>
      </div>
      <span className="text-xs font-mono font-medium text-zinc-200">{value || 'N/A'}</span>
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
  const canControlPower = userRole === 'superadmin'

  useEffect(() => {
    const fetchSystem = async () => {
      try {
        const token = localStorage.getItem('jwt_token')
        const response = await fetch('https://api-metaport.aznoh.cz/api/v1/system/status', {
          headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
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
      <div className="fixed inset-0 bg-[#09090b] flex flex-col items-center justify-center z-50 p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6">
          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{powerActionText}</h2>
        <p className="text-zinc-400 text-sm max-w-md">
          {powerActionText.includes('Restart')
            ? `Systém se restartuje. Stránka se automaticky obnoví za ${powerCountdown} sekund.`
            : `Systém se vypíná. Můžeš bezpečně zavřít prohlížeč (odpočet: ${powerCountdown} s).`}
        </p>
      </div>
    )
  }

  if (!data) {
    return <DashboardSkeleton />
  }

  const ramPercent = data.ram_total > 0 ? (data.ram_used / data.ram_total) * 100 : 0
  const ramUsedPercent = Math.round(ramPercent)

  const disks: DiskInfo[] =
    data.disks && data.disks.length > 0
      ? data.disks
      : [
          {
            name: 'Systémový disk',
            device: '/dev/root',
            mountpoint: '/',
            total_gb:
              Math.round(
                ((data.disk_free_gb || 0) / (1 - (data.disk_percent || 0) / 100 || 1)) * 10
              ) / 10 || 32,
            used_gb: Math.round((data.disk_free_gb || 0) * ((data.disk_percent || 0) / 100) * 10) / 10,
            free_gb: data.disk_free_gb || 0,
            percent: data.disk_percent || 0,
            is_ssd: false,
          },
        ]

  const nvmeDisk = disks.find((d) => d.is_ssd || d.device.includes('nvme'))
  const primaryDisplayDisk = nvmeDisk || disks[0]
  const primaryDiskPercent = primaryDisplayDisk ? primaryDisplayDisk.percent : data.disk_percent || 0
  const primaryDiskFree = primaryDisplayDisk ? primaryDisplayDisk.free_gb : data.disk_free_gb || 0

  const isMcOnline = data.mc_status?.includes('ONLINE')

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>

        {canControlPower && (
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="dark"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-purple-400" />}
              onClick={() =>
                requestPowerAction(
                  'prune',
                  'Opravdu chceš promazat Docker systém? Smažou se všechny nepoužívané kontejnery, sítě, image a volumes.'
                )
              }
            >
              Docker Prune
            </Button>
            <Button
              variant="dark"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-amber-400" />}
              onClick={() =>
                requestPowerAction('reboot', 'Opravdu chceš restartovat Raspberry Pi?')
              }
            >
              Restart
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Power className="w-3.5 h-3.5 text-rose-400" />}
              onClick={() =>
                requestPowerAction('shutdown', 'Opravdu chceš úplně vypnout Raspberry Pi?')
              }
            >
              Vypnout
            </Button>
          </div>
        )}
      </div>

      {/* Top 4 Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Teplota CPU"
          value={data.temp}
          unit="°C"
          icon={Thermometer}
          gradient="from-rose-500 to-pink-600"
          percent={data.temp}
          badge={data.temp > 75 ? 'Horký' : 'Optimální'}
          badgeVariant={data.temp > 75 ? 'rose' : 'emerald'}
        />

        <MetricCard
          title={nvmeDisk ? 'NVMe Úložiště' : 'Systémové Úložiště'}
          value={primaryDiskFree}
          unit="GB volných"
          icon={nvmeDisk ? Zap : HardDrive}
          gradient="from-cyan-500 to-blue-600"
          percent={primaryDiskPercent}
          badge={nvmeDisk ? 'NVMe SSD' : 'SD Karta'}
          badgeVariant="cyan"
        />

        <MetricCard
          title="Využití RAM"
          value={data.ram_used}
          unit="MB"
          icon={Cpu}
          gradient="from-emerald-500 to-teal-600"
          percent={ramUsedPercent}
          badge={`${ramUsedPercent}%`}
          badgeVariant={ramUsedPercent > 85 ? 'rose' : 'emerald'}
        />

        <Card variant="bento" hover className="p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-black/30">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <StatusBadge status={isMcOnline ? 'ONLINE' : 'OFFLINE'} />
          </div>

          <div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-1">
              Minecraft Server
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold ${isMcOnline ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {data.mc_status || 'OFFLINE'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Middle Bento Row: System Utilization Gauges & Server Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Resource Circular Gauges */}
        <Card variant="bento" className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <CardTitle>Využití kapacity</CardTitle>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-around gap-6 py-4">
              <CircularGauge
                value={ramPercent}
                label="Operační paměť"
                sublabel={`${data.ram_used} / ${data.ram_total || 4096} MB`}
              />
              {disks.map((disk, idx) => (
                <CircularGauge
                  key={idx}
                  value={disk.percent}
                  label={disk.is_ssd ? 'NVMe SSD Disk' : disk.name}
                  sublabel={`${disk.free_gb} GB volno`}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Right: System Info (KokonutUI style list) */}
        <Card variant="bento" className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                </div>
                <CardTitle>Systémové informace</CardTitle>
              </div>
            </div>

            <div className="space-y-1">
              <SystemInfoRow icon={Clock} label="Doba běhu (Uptime)" value={data.uptime} />
              <SystemInfoRow icon={Globe} label="Operační systém" value={data.os_name || 'Ubuntu 24.04 LTS'} />
              <SystemInfoRow icon={Cpu} label="Jádro systému (Kernel)" value={data.kernel} />
              <SystemInfoRow icon={Server} label="Docker Runtime" value={data.docker_version} />
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Bento Row: Connected Drives & Storage */}
      <Card variant="bento" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Database className="w-4 h-4 text-white" />
            </div>
            <CardTitle>Disky a Úložiště</CardTitle>
          </div>
          <Badge variant="zinc">
            {disks.length} {disks.length === 1 ? 'jednotka' : 'jednotky'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {disks.map((disk, index) => (
            <div
              key={index}
              className="rounded-xl bg-[#15151a] border border-zinc-800/80 p-4.5 hover:border-zinc-700 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg ${
                      disk.is_ssd
                        ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-cyan-500/20'
                        : 'bg-zinc-800 text-zinc-300'
                    } flex items-center justify-center shadow-sm`}
                  >
                    {disk.is_ssd ? (
                      <Zap className="w-4 h-4 text-white" />
                    ) : (
                      <HardDrive className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors">
                        {disk.name}
                      </span>
                      {disk.is_ssd && (
                        <Badge variant="cyan" size="sm">
                          NVMe
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {disk.device} • {disk.mountpoint}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono text-zinc-300">
                  {Math.round(disk.percent)}%
                </span>
              </div>

              <div className="space-y-2 mt-3">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>
                    Volno: <strong className="text-zinc-200">{disk.free_gb} GB</strong>
                  </span>
                  <span>
                    Celkem: <strong className="text-zinc-200">{disk.total_gb} GB</strong>
                  </span>
                </div>
                <ProgressBar value={disk.percent} size="sm" variant="auto" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        maxWidth="max-w-md"
        title={
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-white font-semibold text-base">Potvrzení akce</span>
          </div>
        }
      >
        <div className="p-6 space-y-6">
          <p className="text-zinc-300 text-sm leading-relaxed">{confirmMessage}</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Zrušit
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={executePowerAction}
            >
              Potvrdit akci
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}