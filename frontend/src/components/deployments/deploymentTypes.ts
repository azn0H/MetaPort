import { apiFetch } from '../../config/api'

export type Connection = { id: string; name: string; provider: string }
export type Repository = { name: string; url: string; branch: string }
export type Project = {
  id: string; name: string; connection_id: string; repository: string; branch: string; compose_file: string
  auto_deploy: boolean; status: string; logs: string[]; commit?: string; environment_keys: string[]
  poll_error?: string; previous_images?: Record<string, string>; started_at?: number; finished_at?: number; checked_at?: number
}
export type DeploymentState = { manager_available?: boolean; connections: Connection[]; projects: Project[] }
export type DiskUsage = {
  image_bytes: number | null
  images: { id: string; tags: string[] | null; size: number; shared: number | null; unique: number | null; containers: number; retained: boolean }[]
  recommendations: { text: string; potential_bytes: number | null }[]
  notes: string[]
  build_cache: { ID: string; Size: number | null; InUse: boolean; Shared: boolean; LastUsedAt?: string; UsageCount?: number }[]
  containers: { Id: string; Names: string[]; SizeRw: number | null; SizeRootFs: number | null; State: string }[]
  volumes: { name: string; usage: { Size?: number; RefCount?: number } | null }[]
  details: { name: string; log_bytes: number | null; mounts: { type: string; source: string; destination: string; bytes: number | null }[] }[]
}
export async function deploymentRequest<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await apiFetch('/api/v1/deployments' + path, {
    method, signal, headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const result = await response.json()
  if (!response.ok) {
    if (typeof result.detail === 'string') throw new Error(result.detail)
    if (Array.isArray(result.detail)) {
      const labels: Record<string, string> = { name: 'Název projektu', connection_id: 'Git připojení', repository: 'Repozitář', branch: 'Sledovaná větev', compose_file: 'Compose soubor', environment: 'Proměnné prostředí', token: 'Přístupový token', provider: 'Provider' }
      const messages = result.detail.map((error: { loc?: unknown[]; type?: string }) => {
        const field = String(error.loc?.[1] || '')
        if (field === 'name' && error.type === 'string_pattern_mismatch') return 'Název projektu: použijte 2 až 41 znaků, písmena, čísla a pomlčky; začněte písmenem.'
        return `${labels[field] || 'Zadané hodnoty'}: ${error.type === 'missing' ? 'povinné pole není vyplněné.' : 'hodnota není platná.'}`
      })
      throw new Error([...new Set(messages)].join(' '))
    }
    throw new Error('Požadavek byl odmítnut. Ověřte zadané hodnoty.')
  }
  return result as T
}
export function formatBytes(value: number | null | undefined): string {
  if (value == null || value < 0) return 'Nezměřeno'
  if (value === 0) return '0 B'
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  return `${(value / 1024 ** index).toLocaleString('cs-CZ', { maximumFractionDigits: index ? 2 : 0 })} ${units[index]}`
}
export function formatDate(value?: number): string {
  return value ? new Date(value * 1000).toLocaleString('cs-CZ') : 'Zatím neproběhlo'
}
export const deploymentStatuses: Record<string, { label: string; variant: 'zinc' | 'emerald' | 'amber' | 'rose' | 'cyan' }> = {
  idle: { label: 'Připraveno', variant: 'zinc' }, queued: { label: 'Ve frontě', variant: 'amber' },
  running: { label: 'Nasazování', variant: 'cyan' }, success: { label: 'Nasazeno', variant: 'emerald' }, failed: { label: 'Selhalo', variant: 'rose' },
}
