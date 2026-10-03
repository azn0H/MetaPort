import { useState, type ReactNode } from 'react'
import { AlertTriangle, Box, Database, FileText, HardDrive, Layers, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { SearchInput } from '../ui/Input'
import { Tabs } from '../ui/Tabs'
import { MetricCard } from '../ui/MetricCard'
import { MetricCardSkeleton, Skeleton } from '../ui/Skeleton'
import { FilterSelect } from '../FilterSelect'
import { formatBytes, type DiskUsage } from './deploymentTypes'

type DiskTab = 'images' | 'cache' | 'containers' | 'volumes' | 'logs'
function UsageTable({ headings, rows, empty }: { headings: string[]; rows: ReactNode[][]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-zinc-500 dark:text-zinc-400 py-8 text-center">{empty}</p>
  return <div className="overflow-x-auto"><table className="w-full text-xs text-left">
    <thead className="text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/40"><tr>{headings.map(heading => <th key={heading} className="px-4 py-3 font-semibold whitespace-nowrap">{heading}</th>)}</tr></thead>
    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">{rows.map((cells, row) => <tr key={row} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">{cells.map((cell, column) => <td key={column} className="px-4 py-3 align-top text-zinc-700 dark:text-zinc-300">{cell}</td>)}</tr>)}</tbody>
  </table></div>
}
export function DiskPanel({ data, loading, measuredAt, onRefresh }: { data: DiskUsage | null; loading: boolean; measuredAt: number | null; onRefresh: () => void }) {
  const [tab, setTab] = useState<DiskTab>('images')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  if (!data) return <div className="space-y-5">
    {loading ? <><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{[0, 1, 2, 3].map(index => <MetricCardSkeleton key={index} />)}</div><Skeleton className="h-64 w-full" /></> : <Card className="p-10 text-center space-y-3"><HardDrive className="w-10 h-10 text-zinc-400 mx-auto" /><p className="text-sm text-zinc-500">Načtěte aktuální přehled využití Docker disku.</p><Button onClick={onRefresh} leftIcon={<RefreshCw className="w-4 h-4" />}>Načíst diagnostiku</Button></Card>}
  </div>
  const images = data.images.filter(image => {
    const label = (image.tags || []).join(' ') + ' ' + image.id
    return label.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || (filter === 'unused' ? image.containers === 0 && !image.retained : image.retained))
  })
  return <div className="space-y-5">
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <MetricCard title="Image vrstvy" value={formatBytes(data.image_bytes)} icon={HardDrive} subtext="Sdílené vrstvy započítané jednou" badge="Skutečná data" />
      <MetricCard title="Images" value={data.images.length} icon={Layers} gradient="from-indigo-500 to-purple-600" subtext={`${data.images.filter(image => image.retained).length} zachovaných pro obnovu`} />
      <MetricCard title="Build cache" value={data.build_cache.length} icon={Box} gradient="from-amber-500 to-orange-600" subtext="Počet záznamů; vrstvy mohou být sdílené" />
      <MetricCard title="Volumes" value={data.volumes.length} icon={Database} gradient="from-emerald-500 to-teal-600" subtext="Datová úložiště se automaticky nemažou" />
    </div>
    <Card>
      <CardHeader><div><CardTitle>Využití disku</CardTitle><CardDescription>{measuredAt ? `Změřeno ${new Date(measuredAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}` : 'Aktuální přehled Dockeru'}</CardDescription></div><Button size="sm" variant="outline" isLoading={loading} leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onRefresh}>Obnovit</Button></CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto pb-1"><Tabs<DiskTab> activeTab={tab} onChange={setTab} tabs={[
          { id: 'images', label: 'Images', icon: Layers }, { id: 'cache', label: 'Cache', icon: Box },
          { id: 'containers', label: 'Kontejnery', icon: Box }, { id: 'volumes', label: 'Volumes', icon: Database }, { id: 'logs', label: 'Logy a mounty', icon: FileText },
        ]} /></div>
        {tab === 'images' && <><div className="flex flex-wrap items-center gap-3"><SearchInput aria-label="Hledat image" placeholder="Hledat image…" value={search} onChange={event => setSearch(event.target.value)} /><FilterSelect value={filter} onChange={setFilter} icon={Layers} options={[{ value: 'all', label: 'Všechny images' }, { value: 'unused', label: 'Bez kontejnerů' }, { value: 'retained', label: 'Pro obnovu' }]} /></div>
          <UsageTable headings={['Image', 'Logická velikost', 'Sdílené vrstvy', 'Unikátní vrstvy', 'Kontejnery']} empty="Žádný image neodpovídá filtru." rows={images.map(image => [<div className="max-w-sm space-y-1"><span className="break-all font-medium">{image.tags?.join(', ') || image.id.slice(0, 19)}</span>{image.retained && <div><Badge variant="purple">Pro obnovu</Badge></div>}</div>, formatBytes(image.size), formatBytes(image.shared), formatBytes(image.unique), image.containers >= 0 ? image.containers : 'Nezměřeno'])} />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Logické velikosti images obsahují sdílené vrstvy. Jejich součet neodpovídá skutečné spotřebě disku.</p></>}
        {tab === 'cache' && <UsageTable headings={['Záznam', 'Velikost', 'Použití', 'Sdílení', 'Počet použití']} empty="Docker nevrátil záznamy build cache." rows={data.build_cache.map(entry => [<span className="font-mono">{entry.ID.slice(0, 16)}</span>, formatBytes(entry.Size), <Badge variant={entry.InUse ? 'cyan' : 'zinc'}>{entry.InUse ? 'Používá se' : 'Nepoužívaná'}</Badge>, entry.Shared ? 'Sdílená' : 'Nesdílená', entry.UsageCount ?? 'Nezměřeno'])} />}
        {tab === 'containers' && <UsageTable headings={['Kontejner', 'Zapisovatelná vrstva', 'Logická velikost filesystemu', 'Stav']} empty="Docker nevrátil kontejnery." rows={data.containers.map(container => [<span className="font-medium break-all">{container.Names?.map(name => name.replace(/^\//, '')).join(', ') || container.Id.slice(0, 12)}</span>, formatBytes(container.SizeRw), formatBytes(container.SizeRootFs), container.State === 'running' ? 'Běží' : container.State === 'exited' ? 'Zastavený' : container.State])} />}
        {tab === 'volumes' && <><UsageTable headings={['Volume', 'Změřená velikost', 'Připojené kontejnery']} empty="Docker nevrátil volumes." rows={data.volumes.map(volume => [<span className="font-medium break-all">{volume.name}</span>, formatBytes(volume.usage?.Size), volume.usage?.RefCount != null && volume.usage.RefCount >= 0 ? volume.usage.RefCount : 'Nezměřeno'])} /><p className="text-xs text-zinc-500 dark:text-zinc-400">Dostupnost velikostí závisí na volume driveru. Databáze ani volumes se zde nemažou.</p></>}
        {tab === 'logs' && <div className="space-y-4"><UsageTable headings={['Kontejner', 'Velikost logu']} empty="Žádné kontejnery k zobrazení." rows={data.details.map(container => [container.name, formatBytes(container.log_bytes)])} />
          <UsageTable headings={['Kontejner', 'Typ mountu', 'Zdroj na hostiteli', 'Cíl', 'Velikost']} empty="Žádné mounty k zobrazení." rows={data.details.flatMap(container => container.mounts.map(mount => [container.name, mount.type === 'bind' ? 'Bind mount' : mount.type === 'volume' ? 'Volume' : mount.type, <span className="break-all max-w-xs inline-block">{mount.source || 'Neznámý'}</span>, <span className="break-all">{mount.destination}</span>, formatBytes(mount.bytes)]))} />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Hostitelské logy a bind mounty nemusí být z backendu přístupné. Nezměřená velikost není nula.</p></div>}
      </CardContent>
    </Card>
    <Card><CardHeader><div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /><CardTitle>Doporučení podle měření</CardTitle></div><Badge variant="zinc">{data.recommendations.length}</Badge></CardHeader>
      <CardContent className="space-y-3">{data.recommendations.length ? data.recommendations.map((recommendation, index) => <div key={index} className="rounded-xl border border-zinc-200 dark:border-zinc-800/60 p-4 space-y-2"><p className="text-sm text-zinc-700 dark:text-zinc-300 break-words">{recommendation.text}</p>{recommendation.potential_bytes != null && <Badge variant="amber">Potenciální úspora {formatBytes(recommendation.potential_bytes)}</Badge>}</div>) : <p className="text-sm text-zinc-500 dark:text-zinc-400">Měření neukázalo doložitelný návrh na úsporu.</p>}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Odhady nejsou garantované a nesčítají se. Před úklidem ověřte potřebu obnovy a zálohy.</p>
      </CardContent>
    </Card>
    <Card variant="subtle" className="p-4"><ul className="list-disc pl-4 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">{data.notes.map(note => <li key={note}>{note}</li>)}</ul></Card>
  </div>
}
