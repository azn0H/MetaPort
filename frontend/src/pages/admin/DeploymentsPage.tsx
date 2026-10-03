import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { AlertCircle, Clock, FileText, FolderGit2, GitBranch, GitFork, HardDrive, KeyRound, Link2, Plus, RefreshCw, Rocket, Settings, Trash2 } from 'lucide-react'
import { FilterSelect } from '../../components/FilterSelect'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input, SearchInput } from '../../components/ui/Input'
import { Select } from '../../components/ui/FormControls'
import { ProjectCardSkeleton } from '../../components/ui/Skeleton'
import { Tabs } from '../../components/ui/Tabs'
import { DiskPanel } from '../../components/deployments/DiskPanel'
import { ProjectEditor, type ProjectConfiguration } from '../../components/deployments/ProjectEditor'
import { deploymentRequest, deploymentStatuses, formatDate, type DeploymentState, type DiskUsage, type Project } from '../../components/deployments/deploymentTypes'
import { usePageTitle } from '../../hooks/usePageTitle'

type Tab = 'projects' | 'connections' | 'disk'
type Removal = { kind: 'projects' | 'connections'; id: string; name: string }
const emptyConnection = { name: '', provider: 'github', token: '' }

export default function DeploymentsPage() {
  usePageTitle('Nasazování a disk')
  const { showToast } = useToast()
  const [state, setState] = useState<DeploymentState>({ connections: [], projects: [] })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [tab, setTab] = useState<Tab>('projects')
  const [operation, setOperation] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectOpen, setProjectOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [connectionOpen, setConnectionOpen] = useState(false)
  const [connection, setConnection] = useState(emptyConnection)
  const [removal, setRemoval] = useState<Removal | null>(null)
  const [logsId, setLogsId] = useState<string | null>(null)
  const [disk, setDisk] = useState<DiskUsage | null>(null)
  const [diskLoading, setDiskLoading] = useState(false)
  const [diskError, setDiskError] = useState('')
  const [measuredAt, setMeasuredAt] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setState(await deploymentRequest<DeploymentState>(''))
    setLoadError('')
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    let fetching = false
    async function load() {
      if (fetching) return
      fetching = true
      try {
        const data = await deploymentRequest<DeploymentState>('', 'GET', undefined, controller.signal)
        if (!controller.signal.aborted) { setState(data); setLoadError('') }
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Data se nepodařilo načíst.')
      } finally {
        fetching = false
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    const timer = setInterval(() => void load(), 5000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [])

  async function mutate(name: string, task: () => Promise<void>, message: string): Promise<boolean> {
    setOperation(name)
    try {
      await task()
      showToast(message, 'success')
      if (name !== 'refresh') {
        try { await refresh() } catch { setLoadError('Změna je uložená, ale přehled se nepodařilo obnovit.') }
      }
      return true
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Operace selhala.', 'error')
      return false
    } finally { setOperation(null) }
  }
  async function loadDisk() {
    if (diskLoading) return
    setDiskLoading(true); setDiskError('')
    try { setDisk(await deploymentRequest<DiskUsage>('/disk')); setMeasuredAt(Date.now()) }
    catch (error) { const message = error instanceof Error ? error.message : 'Diagnostiku nelze načíst.'; setDiskError(message); showToast(message, 'error') }
    finally { setDiskLoading(false) }
  }
  function changeTab(next: Tab) {
    setTab(next)
    if (next === 'disk' && !disk) void loadDisk()
  }
  function newProject() {
    if (!state.connections.length) { setTab('connections'); setConnection(emptyConnection); setConnectionOpen(true); return }
    setEditing(null); setProjectOpen(true)
  }
  async function saveProject(id: string, data: ProjectConfiguration) {
    return mutate('save-project', async () => { await deploymentRequest('/projects/' + id, 'PUT', data) }, id === 'new' ? 'Projekt byl přidán.' : 'Nastavení projektu bylo uloženo.')
  }
  async function connect(event: FormEvent) {
    event.preventDefault()
    if (await mutate('connect', async () => { await deploymentRequest('/connections', 'POST', connection) }, 'Připojení bylo uloženo.')) {
      setConnectionOpen(false); setConnection(emptyConnection)
    }
  }
  function closeConnection() { if (!operation) { setConnectionOpen(false); setConnection(emptyConnection) } }
  async function removeConfiguration() {
    if (!removal) return
    if (await mutate('remove', async () => { await deploymentRequest('/' + removal.kind + '/' + removal.id, 'DELETE') }, removal.kind === 'projects' ? 'Konfigurace byla odebrána. Kontejnery a data zůstávají.' : 'Git připojení bylo odpojeno.')) setRemoval(null)
  }
  const filtered = state.projects.filter(project => (statusFilter === 'all' || project.status === statusFilter) && `${project.name} ${project.repository} ${project.branch}`.toLowerCase().includes(search.toLowerCase()))
  const logProject = state.projects.find(project => project.id === logsId)
  const busy = operation !== null

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Nasazování a disk</h1><Badge variant="zinc">{state.projects.length}</Badge></div><p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Správa Compose projektů, Git připojení a využití Docker disku.</p></div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" isLoading={operation === 'refresh'} disabled={busy} leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => void mutate('refresh', refresh, 'Přehled byl obnoven.')}>Obnovit</Button>
        {tab !== 'disk' && <Button size="sm" variant="primary" disabled={busy || loading} leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={tab === 'connections' ? () => { setConnection(emptyConnection); setConnectionOpen(true) } : newProject}>{tab === 'connections' ? 'Přidat připojení' : 'Nový projekt'}</Button>}
      </div>
    </div>
    <div className="overflow-x-auto pb-1"><Tabs<Tab> activeTab={tab} onChange={changeTab} tabs={[
      { id: 'projects', label: 'Projekty', icon: FolderGit2, badge: state.projects.length },
      { id: 'connections', label: 'Připojení', icon: Link2, badge: state.connections.length },
      { id: 'disk', label: 'Diagnostika disku', icon: HardDrive },
    ]} /></div>
    {loadError && <Card role="alert" className="p-4 flex items-center gap-3 border-rose-200 dark:border-rose-500/20"><AlertCircle className="w-5 h-5 text-rose-500 shrink-0" /><p className="text-sm text-rose-600 dark:text-rose-400">{loadError}</p></Card>}
    {state.manager_available === false && <Card variant="subtle" className="p-4 flex gap-3"><AlertCircle className="w-5 h-5 text-amber-500 shrink-0" /><div><p className="text-sm font-medium">Nasazovací správce není aktivní</p><p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Na Windows worker neběží. Na Pi ověřte backend a oprávnění úložiště.</p></div></Card>}

    {tab === 'projects' && <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3"><SearchInput aria-label="Hledat projekt" placeholder="Hledat projekt, repozitář…" value={search} onChange={event => setSearch(event.target.value)} /><FilterSelect value={statusFilter} onChange={setStatusFilter} icon={Rocket} options={[{ value: 'all', label: 'Všechny stavy' }, ...Object.entries(deploymentStatuses).map(([value, status]) => ({ value, label: status.label }))]} /><span className="text-xs text-zinc-500 dark:text-zinc-400 ml-auto">Průběh se obnovuje automaticky</span></div>
      {loading ? <div className="grid md:grid-cols-2 gap-4">{[0, 1].map(index => <ProjectCardSkeleton key={index} />)}</div> : !state.projects.length ? <Card className="p-10 text-center"><div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-4"><FolderGit2 className="w-7 h-7" /></div><h2 className="font-semibold text-zinc-900 dark:text-white">Zatím žádné nasazované projekty</h2><p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 mb-5">{state.connections.length ? 'Vyberte repozitář, sledovanou větev a Compose soubor.' : 'Nejprve připojte GitHub nebo GitLab a potom vyberte repozitář.'}</p><Button variant="primary" onClick={newProject} leftIcon={<Plus className="w-4 h-4" />}>{state.connections.length ? 'Přidat první projekt' : 'Připojit Git účet'}</Button></Card> : !filtered.length ? <Card className="p-10 text-center"><p className="text-sm text-zinc-500">Žádný projekt neodpovídá filtru.</p><Button variant="ghost" size="sm" className="mt-3" onClick={() => { setSearch(''); setStatusFilter('all') }}>Vymazat filtry</Button></Card> : <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(project => {
          const status = deploymentStatuses[project.status] || deploymentStatuses.idle
          const deploying = ['running', 'queued'].includes(project.status)
          return <Card key={project.id} hover className="flex flex-col">
            <CardHeader><div className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center shrink-0"><FolderGit2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /></div><div className="min-w-0"><CardTitle className="truncate">{project.name}</CardTitle><CardDescription>{state.connections.find(item => item.id === project.connection_id)?.name || 'Git projekt'}</CardDescription></div></div><Badge variant={status.variant} dot pulse={deploying}>{status.label}</Badge></CardHeader>
            <CardContent className="space-y-3 flex-1"><p className="text-xs text-zinc-500 dark:text-zinc-400 break-all">{project.repository.replace(/^https:\/\//, '').replace(/\.git$/, '')}</p>
              <div className="flex items-center flex-wrap gap-2"><Badge variant="zinc"><GitBranch className="w-3 h-3 mr-1" />{project.branch}</Badge><Badge variant={project.auto_deploy ? 'cyan' : 'zinc'}>{project.auto_deploy ? 'Automaticky' : 'Ruční nasazení'}</Badge><span className="text-xs text-zinc-500 break-all">{project.compose_file}</span></div>
              <div className="border-t border-zinc-200 dark:border-zinc-800/60 pt-3 space-y-2 text-xs"><div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400"><Clock className="w-3.5 h-3.5 shrink-0" /><span>{project.finished_at ? `Poslední pokus: ${formatDate(project.finished_at)}` : 'Zatím bez nasazení'}</span></div><p className="text-zinc-500">Úspěšný commit: <span className="font-mono text-zinc-700 dark:text-zinc-300">{project.commit?.slice(0, 8) || 'Žádný'}</span></p>{project.checked_at && <p className="text-zinc-500">Kontrola větve: {formatDate(project.checked_at)}</p>}</div>
              {project.poll_error && <p className="text-xs text-amber-600 dark:text-amber-400">{project.poll_error}</p>}
            </CardContent>
            <CardFooter className="gap-2 flex-wrap"><Button size="sm" variant="primary" disabled={busy || deploying || !state.manager_available} isLoading={operation === 'deploy-' + project.id} leftIcon={<Rocket className="w-3.5 h-3.5" />} onClick={() => void mutate('deploy-' + project.id, async () => { await deploymentRequest('/projects/' + project.id + '/deploy', 'POST') }, 'Nasazení bylo zařazeno do fronty.')}>{deploying ? 'Probíhá nasazení' : 'Nasadit'}</Button><Button size="sm" variant="outline" leftIcon={<FileText className="w-3.5 h-3.5" />} onClick={() => setLogsId(project.id)}>Průběh a logy</Button><div className="flex gap-1 ml-auto"><Button size="icon" variant="ghost" aria-label={`Upravit projekt ${project.name}`} title="Upravit projekt" disabled={busy || deploying} onClick={() => { setEditing(project); setProjectOpen(true) }}><Settings className="w-4 h-4" /></Button><Button size="icon" variant="ghost" aria-label={`Odebrat konfiguraci ${project.name}`} title="Odebrat konfiguraci" disabled={busy || deploying} onClick={() => setRemoval({ kind: 'projects', id: project.id, name: project.name })}><Trash2 className="w-4 h-4 text-rose-500" /></Button></div></CardFooter>
          </Card>
        })}
      </div>}
    </div>}

    {tab === 'connections' && <div className="space-y-5">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Přístupové údaje jsou uložené šifrovaně. Každý projekt si vybírá vlastní připojení.</p>
      {loading ? <div className="grid md:grid-cols-2 gap-4">{[0, 1].map(index => <ProjectCardSkeleton key={index} />)}</div> : !state.connections.length ? <Card className="p-10 text-center"><KeyRound className="w-10 h-10 text-zinc-400 mx-auto mb-4" /><h2 className="font-semibold">Žádné Git připojení</h2><p className="text-sm text-zinc-500 mt-2 mb-5">Připojte GitHub nebo GitLab pomocí tokenu pro čtení repozitářů.</p><Button variant="primary" onClick={() => { setConnection(emptyConnection); setConnectionOpen(true) }} leftIcon={<Plus className="w-4 h-4" />}>Přidat připojení</Button></Card> : <div className="grid md:grid-cols-2 gap-4">{state.connections.map(item => {
        const projectCount = state.projects.filter(project => project.connection_id === item.id).length
        const Icon = item.provider === 'github' ? FolderGit2 : GitFork
        return <Card key={item.id}><CardHeader><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"><Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-300" /></div><div><CardTitle>{item.name}</CardTitle><CardDescription>{item.provider === 'github' ? 'GitHub' : 'GitLab.com'}</CardDescription></div></div><Badge variant="emerald">Uloženo</Badge></CardHeader><CardContent><p className="text-xs text-zinc-500 dark:text-zinc-400">{projectCount ? `Používá ${projectCount} projektů` : 'Zatím bez přiřazených projektů'}</p></CardContent><CardFooter><Button size="sm" variant="danger" disabled={busy || projectCount > 0} title={projectCount ? 'Nejprve změňte připojení přiřazených projektů.' : undefined} leftIcon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setRemoval({ kind: 'connections', id: item.id, name: item.name })}>Odpojit</Button></CardFooter></Card>
      })}</div>}
    </div>}
    {tab === 'disk' && <>{diskError && <Card role="alert" className="p-4 text-sm text-rose-600 dark:text-rose-400">{diskError}{disk && <p className="text-xs mt-1">Níže je zobrazené předchozí úspěšné měření.</p>}</Card>}<DiskPanel data={disk} loading={diskLoading} measuredAt={measuredAt} onRefresh={() => void loadDisk()} /></>}

    {projectOpen && <ProjectEditor key={editing?.id || 'new'} project={editing} connections={state.connections} saving={operation === 'save-project'} onClose={() => setProjectOpen(false)} onSave={saveProject} />}
    <Modal isOpen={connectionOpen} onClose={closeConnection} title={<><KeyRound className="w-5 h-5 text-cyan-500" />Přidat Git připojení</>}>
      <form onSubmit={event => void connect(event)} className="p-6 space-y-5">
        <Input label="Název připojení" required maxLength={80} placeholder="GitHub – osobní projekty" value={connection.name} disabled={busy} onChange={event => setConnection({ ...connection, name: event.target.value })} />
        <Select label="Provider" value={connection.provider} disabled={busy} onChange={event => setConnection({ ...connection, provider: event.target.value })}><option value="github">GitHub</option><option value="gitlab">GitLab.com</option></Select>
        <Input label="Přístupový token" type="password" autoComplete="new-password" required maxLength={4096} value={connection.token} disabled={busy} onChange={event => setConnection({ ...connection, token: event.target.value })} helperText={connection.provider === 'github' ? 'Token s přístupem ke zvoleným repozitářům a čtením jejich obsahu.' : 'Token s oprávněními read_api a read_repository.'} />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Po uložení se token nevrací do prohlížeče ani nezobrazuje v logu.</p>
        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800"><Button type="button" variant="ghost" disabled={busy} onClick={closeConnection}>Zrušit</Button><Button type="submit" variant="primary" isLoading={operation === 'connect'} leftIcon={<Link2 className="w-4 h-4" />}>Připojit</Button></div>
      </form>
    </Modal>
    <Modal isOpen={removal !== null} onClose={() => { if (!busy) setRemoval(null) }} title={<><Trash2 className="w-5 h-5 text-rose-500" />{removal?.kind === 'projects' ? 'Odebrat konfiguraci projektu' : 'Odpojit Git připojení'}</>}>
      <div className="p-6 space-y-5"><p className="text-sm text-zinc-700 dark:text-zinc-300">{removal?.kind === 'projects' ? <>Odebrat správu projektu <strong>{removal.name}</strong>? Automatické nasazování se zastaví. Běžící kontejnery, images a data zůstanou zachované.</> : <>Odpojit <strong>{removal?.name}</strong>? Uložený token bude z konfigurace odstraněn.</>}</p><div className="flex justify-end gap-2"><Button variant="ghost" disabled={busy} onClick={() => setRemoval(null)}>Zrušit</Button><Button variant="danger" isLoading={operation === 'remove'} onClick={() => void removeConfiguration()}>{removal?.kind === 'projects' ? 'Odebrat konfiguraci' : 'Odpojit'}</Button></div></div>
    </Modal>
    <Modal isOpen={Boolean(logProject)} onClose={() => setLogsId(null)} maxWidth="max-w-3xl" title={<><FileText className="w-5 h-5 text-cyan-500" />Průběh nasazení · {logProject?.name}</>}>
      {logProject && <div className="p-6 space-y-4"><div className="flex items-center justify-between gap-3"><Badge variant={(deploymentStatuses[logProject.status] || deploymentStatuses.idle).variant}>{(deploymentStatuses[logProject.status] || deploymentStatuses.idle).label}</Badge><p className="text-xs text-zinc-500">Průběh se obnovuje automaticky</p></div><pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-xs leading-relaxed font-mono text-zinc-700 dark:text-zinc-300">{logProject.logs.join('\n') || 'Projekt zatím nebyl nasazen.'}</pre>
        {Object.keys(logProject.previous_images || {}).length > 0 && <div className="space-y-2"><h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Images zachované pro ruční obnovu</h3>{Object.entries(logProject.previous_images || {}).map(([service, image]) => <div key={service} className="text-xs flex flex-col sm:flex-row gap-1 sm:gap-3"><span className="font-semibold text-zinc-700 dark:text-zinc-300">{service}</span><code className="break-all text-zinc-500 dark:text-zinc-400">{image}</code></div>)}</div>}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Zobrazuje se bezpečný fázový log. Bez healthchecku se ověřuje pouze stav kontejneru. Databázové migrace se automaticky nevracejí.</p><div className="flex justify-end"><Button variant="outline" onClick={() => setLogsId(null)}>Zavřít</Button></div>
      </div>}
    </Modal>
  </div>
}
