import { useEffect, useState, type FormEvent } from 'react'
import { FolderGit2, GitBranch, RefreshCw, Save } from 'lucide-react'
import { Modal } from '../Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select, Switch, Textarea } from '../ui/FormControls'
import { deploymentRequest, type Connection, type Project, type Repository } from './deploymentTypes'

export type ProjectConfiguration = {
  name: string; connection_id: string; repository: string; branch: string; compose_file: string
  auto_deploy: boolean; environment?: Record<string, string>
}
export function ProjectEditor({ project, connections, saving, onClose, onSave }: {
  project: Project | null; connections: Connection[]; saving: boolean; onClose: () => void
  onSave: (id: string, data: ProjectConfiguration) => Promise<boolean>
}) {
  const [form, setForm] = useState({
    name: project?.name || '', connection_id: project?.connection_id || connections[0]?.id || '',
    repository: project?.repository || '', branch: project?.branch || 'development',
    compose_file: project?.compose_file || 'docker-compose.yml', auto_deploy: project?.auto_deploy || false,
  })
  const [replaceEnvironment, setReplaceEnvironment] = useState(false)
  const [environment, setEnvironment] = useState('')
  const [environmentError, setEnvironmentError] = useState('')
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(Boolean(form.connection_id))
  const [repositoryError, setRepositoryError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!form.connection_id) return
    const controller = new AbortController()
    void deploymentRequest<{ items: Repository[]; has_more: boolean }>('/repositories/' + form.connection_id, 'GET', undefined, controller.signal)
      .then(data => { setRepositories(data.items); setHasMore(data.has_more); setPage(1); setRepositoryError('') })
      .catch(error => { if (!controller.signal.aborted) setRepositoryError(error instanceof Error ? error.message : 'Repozitáře nelze načíst.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [form.connection_id, reload])

  async function nextPage() {
    setLoading(true)
    setRepositoryError('')
    try {
      const data = await deploymentRequest<{ items: Repository[]; has_more: boolean }>('/repositories/' + form.connection_id + '?page=' + (page + 1))
      setRepositories(previous => [...previous, ...data.items]); setHasMore(data.has_more); setPage(page + 1)
    } catch (error) { setRepositoryError(error instanceof Error ? error.message : 'Repozitáře nelze načíst.') }
    finally { setLoading(false) }
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    setEnvironmentError('')
    let parsed: Record<string, string> | undefined
    if (replaceEnvironment) {
      parsed = {}
      for (const line of environment.split('\n').filter(line => line.trim())) {
        const index = line.indexOf('=')
        const key = line.slice(0, index).trim()
        if (index < 1 || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
          setEnvironmentError('Každý řádek musí mít platný název proměnné a hodnotu oddělenou znakem =.')
          return
        }
        parsed[key] = line.slice(index + 1)
      }
    }
    if (await onSave(project?.id || 'new', { ...form, environment: parsed })) onClose()
  }
  return <Modal isOpen onClose={() => { if (!saving) onClose() }} maxWidth="max-w-2xl" title={<><FolderGit2 className="w-5 h-5 text-cyan-500" />{project ? 'Upravit projekt' : 'Nový projekt'}</>}>
    <form onSubmit={event => void submit(event)} className="p-6 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Název projektu" required pattern="[a-z][a-z0-9-]{1,40}" placeholder="moje-aplikace" disabled={saving || Boolean(project?.commit)} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} helperText={project?.commit ? 'Název je svázaný s kontejnery a volumes.' : 'Malá písmena, čísla a pomlčky; alespoň 2 znaky.'} />
        <Select label="Git připojení" required disabled={saving || loading} value={form.connection_id} onChange={event => {
          setForm({ ...form, connection_id: event.target.value, repository: '' }); setRepositories([]); setRepositoryError(''); setLoading(Boolean(event.target.value)); setHasMore(false)
        }}><option value="">Vyberte připojení</option>{connections.map(connection => <option key={connection.id} value={connection.id}>{connection.name}</option>)}</Select>
      </div>
      <div className="space-y-2">
        <Select label="Repozitář" required disabled={saving || loading || !form.connection_id} value={form.repository} onChange={event => {
          const repository = repositories.find(item => item.url === event.target.value)
          setForm({ ...form, repository: event.target.value, branch: repository?.branch || form.branch })
        }}><option value="">{loading ? 'Načítání repozitářů…' : 'Vyberte repozitář'}</option>
          {form.repository && !repositories.some(item => item.url === form.repository) && <option value={form.repository}>{form.repository}</option>}
          {repositories.map(repository => <option key={repository.url} value={repository.url}>{repository.name}</option>)}
        </Select>
        {repositoryError && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{repositoryError}</p>}
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" disabled={saving || !form.connection_id || loading} leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => { setLoading(true); setReload(previous => previous + 1) }}>Obnovit seznam</Button>
          {hasMore && <Button type="button" variant="outline" size="sm" isLoading={loading} onClick={() => void nextPage()}>Další repozitáře</Button>}
          {!loading && !repositoryError && form.connection_id && <span className="text-xs text-zinc-500">{repositories.length} načtených</span>}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Sledovaná větev" required leftIcon={<GitBranch className="w-4 h-4" />} disabled={saving} value={form.branch} onChange={event => setForm({ ...form, branch: event.target.value })} helperText="Například development nebo main." />
        <Input label="Compose soubor" required disabled={saving} value={form.compose_file} onChange={event => setForm({ ...form, compose_file: event.target.value })} helperText="Relativní cesta od kořene repozitáře." />
      </div>
      <Switch label="Automatické nasazování" description="Nový commit ve sledované větvi spustí nasazení. Kontrola probíhá každou minutu." checked={form.auto_deploy} disabled={saving} onChange={checked => setForm({ ...form, auto_deploy: checked })} />
      <div className="space-y-3">
        <Switch label={project ? 'Nahradit prostředí projektu' : 'Nastavit prostředí projektu'} description={project ? `Uložené proměnné: ${project.environment_keys.join(', ') || 'žádné'}. Hodnoty se z bezpečnostních důvodů nezobrazují.` : 'Přidejte proměnné používané v Compose konfiguraci.'} checked={replaceEnvironment} disabled={saving} onChange={setReplaceEnvironment} />
        {replaceEnvironment && <><Textarea label="Proměnné prostředí" rows={5} className="font-mono text-xs" autoComplete="off" spellCheck={false} disabled={saving} placeholder={'APP_ENV=production\nPORT=3000'} value={environment} onChange={event => setEnvironment(event.target.value)} helperText="Jeden řádek KEY=value. Nahrazuje celé prostředí; prázdné pole odstraní všechny proměnné." />{environmentError && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{environmentError}</p>}</>}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Před převzetím existující aplikace ověřte datové volumes a absolutní bind cesty. Nasazujte pouze důvěryhodné repozitáře.</p>
      <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="button" variant="ghost" disabled={saving} onClick={onClose}>Zrušit</Button>
        <Button type="submit" variant="primary" isLoading={saving} disabled={!form.repository} leftIcon={<Save className="w-4 h-4" />}>Uložit projekt</Button>
      </div>
    </form>
  </Modal>
}
