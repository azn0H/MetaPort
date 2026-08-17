import {
  Globe,
  Book,
  Layers,
  PenTool,
  Key,
  Server,
  Shield,
  Activity,
  Database,
  Terminal,
  Sparkles,
  Cpu,
  Folder,
  Boxes,
  Code,
  Cloud,
  HardDrive,
  Lock,
  Compass
} from 'lucide-react'

export interface PortalSettings {
  title: string
  subtitle: string
  version: string
  footer_text: string
}

export interface PortalLink {
  id: number
  title: string
  description: string
  url: string
  icon: string
  gradient: string
  order: number
  is_active: boolean
  is_external: boolean
}

export const ICON_MAP: Record<string, any> = {
  Globe,
  Book,
  Layers,
  PenTool,
  Key,
  Server,
  Shield,
  Activity,
  Database,
  Terminal,
  Sparkles,
  Cpu,
  Folder,
  Boxes,
  Code,
  Cloud,
  HardDrive,
  Lock,
  Compass
}

export const GRADIENT_OPTIONS = [
  { label: 'Cyan / Modrá', value: 'from-cyan-500 to-blue-600', class: 'bg-gradient-to-r from-cyan-500 to-blue-600' },
  { label: 'Smaragd / Teal', value: 'from-emerald-500 to-teal-600', class: 'bg-gradient-to-r from-emerald-500 to-teal-600' },
  { label: 'Oranžová / Rose', value: 'from-orange-500 to-rose-600', class: 'bg-gradient-to-r from-orange-500 to-rose-600' },
  { label: 'Indigo / Fialová', value: 'from-indigo-500 to-purple-600', class: 'bg-gradient-to-r from-indigo-500 to-purple-600' },
  { label: 'Cyan / Žlutá', value: 'from-cyan-500 to-yellow-600', class: 'bg-gradient-to-r from-cyan-500 to-yellow-600' },
  { label: 'Fialová / Fuchsia', value: 'from-violet-500 to-fuchsia-600', class: 'bg-gradient-to-r from-violet-500 to-fuchsia-600' },
  { label: 'Amber / Červená', value: 'from-amber-500 to-red-600', class: 'bg-gradient-to-r from-amber-500 to-red-600' },
  { label: 'Růžová / Rose', value: 'from-pink-500 to-rose-600', class: 'bg-gradient-to-r from-pink-500 to-rose-600' },
  { label: 'Modrá / Indigo', value: 'from-blue-500 to-indigo-600', class: 'bg-gradient-to-r from-blue-500 to-indigo-600' },
  { label: 'Lime / Zelená', value: 'from-lime-500 to-emerald-600', class: 'bg-gradient-to-r from-lime-500 to-emerald-600' }
]
