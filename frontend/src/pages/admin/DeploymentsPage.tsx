import { useEffect, useState } from 'react'
import { apiFetch } from '../../config/api'

type Connection = { id: string; name: string; provider: string }
type Repo = { name: string; url: string; branch: string }
type Project = { id: string; name: string; connection_id: string; repository: string; branch: string; compose_file: string; auto_deploy: boolean; status: string; logs: string[]; commit?: string; environment_keys: string[]; poll_error?: string; previous_images?: Record<string, string> }
type State = { manager_available?: boolean; connections: Connection[]; projects: Project[] }
type Disk = { image_bytes: number; images: { id: string; tags: string[]; size: number; shared: number; unique: number | null; containers: number; retained: boolean }[]; recommendations: { text: string; potential_bytes: number | null }[]; notes: string[]; build_cache: unknown[]; volumes: unknown[]; containers: unknown[]; details: unknown[] }
const bytes = (n: number | null) => n == null ? 'Neznámé' : `${(n / 1024 ** 3).toFixed(2)} GiB`
const blank = { name: '', connection_id: '', repository: '', branch: 'development', compose_file: 'docker-compose.yml', auto_deploy: false }
export default function DeploymentsPage() {
  const [state, setState] = useState<State>({ connections: [], projects: [] })
  const [error, setError] = useState('')
  const [connection, setConnection] = useState({ name: '', provider: 'github', token: '' })
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState('new')
  const [environment, setEnvironment] = useState('')
  const [replaceEnv, setReplaceEnv] = useState(false)
  const [repos, setRepos] = useState<Repo[]>([])
  const [page, setPage] = useState(1)
  const [more, setMore] = useState(false)
  const [disk, setDisk] = useState<Disk | null>(null)
  const [busy, setBusy] = useState(false)
  async function request(path: string, method = 'GET', body?: unknown) {
    const response = await apiFetch('/api/v1/deployments' + path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    const result = await response.json()
    if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Požadavek byl odmítnut; ověřte zadané hodnoty.')
    return result
  }
  async function refresh() { setState(await request('')) }
  async function action(task: () => Promise<void>) {
    setBusy(true); setError('')
    try { await task(); await refresh() } catch (e) { setError(e instanceof Error ? e.message : 'Operace selhala') } finally { setBusy(false) }
  }
  useEffect(() => {
    let active = true
    const load = async () => { try { const data = await request(''); if (active) setState(data) } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Načtení selhalo') } }
    void load(); const timer = setInterval(() => void load(), 5000)
    return () => { active = false; clearInterval(timer) }
  }, [])
  const input = 'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2'
  const card = 'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3'
  const button = 'rounded-lg bg-cyan-700 text-white px-4 py-2 disabled:opacity-50'
  return <div className="space-y-6">
    <h1 className="text-2xl font-bold">Nasazování a disk</h1>
    {state.manager_available === false && <p className="text-amber-600">Nasazovací worker není aktivní. Na Windows neběží; na Pi ověřte backend a oprávnění úložiště.</p>}
    <p>Správce na Pi kontroluje větve každou minutu. Nasazuje pouze důvěryhodné repozitáře. Compose spouští kód s přístupem k hostiteli.</p>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    <section className={card}><h2 className="font-semibold">Připojení GitHub / GitLab.com</h2>
      <form className="grid md:grid-cols-4 gap-3" onSubmit={e => { e.preventDefault(); void action(async () => { await request('/connections', 'POST', connection); setConnection({ ...connection, token: '' }) }) }}>
        <label>Název<input required className={input} value={connection.name} onChange={e => setConnection({ ...connection, name: e.target.value })} /></label>
        <label>Provider<select className={input} value={connection.provider} onChange={e => setConnection({ ...connection, provider: e.target.value })}><option value="github">GitHub</option><option value="gitlab">GitLab.com</option></select></label>
        <label>Přístupový token<input required type="password" autoComplete="new-password" className={input} value={connection.token} onChange={e => setConnection({ ...connection, token: e.target.value })} /></label>
        <button disabled={busy} className={button}>Připojit</button>
      </form>
      <p className="text-sm text-zinc-500">Token potřebuje čtení repozitářů a API seznamu. Po uložení se nevrací do prohlížeče.</p>
      {state.connections.map(c => <div key={c.id} className="flex gap-3 items-center"><span>{c.name} · {c.provider}</span><button disabled={busy} onClick={() => void action(async () => { await request('/connections/' + c.id, 'DELETE') })}>Odpojit</button></div>)}
    </section>
    <section className={card}><h2 className="font-semibold">{editing === 'new' ? 'Nový projekt' : 'Nastavení projektu'}</h2>
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); void action(async () => {
        let env: Record<string, string> | undefined
        if (replaceEnv) { env = {}; for (const line of environment.split('\n').filter(Boolean)) { const index = line.indexOf('='); if (index < 1) throw new Error('Prostředí zadávejte jako KEY=value'); env[line.slice(0, index)] = line.slice(index + 1) } }
        await request('/projects/' + editing, 'PUT', { ...form, environment: env }); setForm(blank); setEditing('new'); setEnvironment(''); setReplaceEnv(false)
      }) }}>
      <div className="grid md:grid-cols-2 gap-3">
        <label>Název (malá písmena, čísla, pomlčky)<input required pattern="[a-z][a-z0-9-]{1,40}" className={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label>Připojení<select required className={input} value={form.connection_id} onChange={e => { setForm({ ...form, connection_id: e.target.value, repository: '' }); setRepos([]); setPage(1); setMore(false) }}><option value="">Vyberte</option>{state.connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
      <button type="button" disabled={busy || !form.connection_id} className={button} onClick={() => void action(async () => { const data = await request('/repositories/' + form.connection_id + '?page=1'); setRepos(data.items); setPage(1); setMore(data.has_more) })}>Načíst repozitáře</button>
      {more && <button type="button" disabled={busy} onClick={() => void action(async () => { const data = await request('/repositories/' + form.connection_id + '?page=' + (page + 1)); setRepos([...repos, ...data.items]); setPage(page + 1); setMore(data.has_more) })}>Další stránka</button>}
      <label className="block">Repozitář<select className={input} value={form.repository} onChange={e => { const r = repos.find(r => r.url === e.target.value); setForm({ ...form, repository: e.target.value, branch: r?.branch || form.branch }) }}><option value="">Vyberte repozitář</option>{form.repository && !repos.some(r => r.url === form.repository) && <option value={form.repository}>{form.repository}</option>}{repos.map(r => <option key={r.url} value={r.url}>{r.name}</option>)}</select></label>
      <div className="grid md:grid-cols-2 gap-3"><label>Větev<input required className={input} value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} /></label><label>Compose cesta v repozitáři<input required className={input} value={form.compose_file} onChange={e => setForm({ ...form, compose_file: e.target.value })} /></label></div>
      <label className="block"><input type="checkbox" checked={form.auto_deploy} onChange={e => setForm({ ...form, auto_deploy: e.target.checked })} /> Automatické nasazování</label>
      <label className="block"><input type="checkbox" checked={replaceEnv} onChange={e => setReplaceEnv(e.target.checked)} /> Nahradit celé prostředí projektu (prázdné pole jej vymaže)</label>
      {replaceEnv && <label className="block">KEY=value, jeden řádek na proměnnou<textarea autoComplete="off" className={input} value={environment} onChange={e => setEnvironment(e.target.value)} /></label>}
      <button disabled={busy || !form.repository} className={button}>Uložit konfiguraci</button> <button type="button" onClick={() => { setEditing('new'); setForm(blank); setEnvironment(''); setReplaceEnv(false) }}>Nový projekt</button>
      </form>
    </section>
    {state.projects.map(p => <section key={p.id} className={card}><div className="flex flex-wrap gap-3 items-center"><h2 className="font-semibold">{p.name}</h2><span>{p.status}</span><span>{p.auto_deploy ? 'Automaticky' : 'Ručně'}</span><button disabled={busy || ['running', 'queued'].includes(p.status)} className={button} onClick={() => void action(async () => { await request('/projects/' + p.id + '/deploy', 'POST') })}>Nasadit</button><button onClick={() => { setEditing(p.id); setForm({ name: p.name, connection_id: p.connection_id, repository: p.repository, branch: p.branch, compose_file: p.compose_file, auto_deploy: p.auto_deploy }); setEnvironment(''); setReplaceEnv(false); setRepos([]) }}>Upravit</button><button disabled={busy || ['running', 'queued'].includes(p.status)} onClick={() => void action(async () => { await request('/projects/' + p.id, 'DELETE') })}>Odebrat konfiguraci (kontejnery zůstanou)</button></div>
      <p className="break-all">{p.repository} · {p.branch} · {p.compose_file}</p><p>Poslední úspěšný commit: {p.commit || 'Žádný'} · Prostředí: {p.environment_keys.join(', ') || 'Prázdné'}</p>{p.poll_error && <p className="text-amber-600">{p.poll_error}</p>}
      <pre className="whitespace-pre-wrap text-xs bg-zinc-100 dark:bg-zinc-950 rounded-lg p-3">{p.logs.join('\n') || 'Zatím bez nasazení'}</pre>
      {p.previous_images && <details><summary>Images zachované pro ruční obnovu</summary><pre className="whitespace-pre-wrap text-xs">{JSON.stringify(p.previous_images, null, 2)}</pre></details>}
    </section>)}
    <section className={card}><h2 className="font-semibold">Diagnostika disku</h2><button disabled={busy} className={button} onClick={() => void action(async () => setDisk(await request('/disk')))}>Změřit Docker</button>
      {disk && <><p>Image vrstvy se sdílenými daty započtenými jednou: <strong>{bytes(disk.image_bytes)}</strong></p>{disk.notes.map(n => <p key={n} className="text-sm text-zinc-500">{n}</p>)}
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{['Image', 'Logická velikost', 'Sdílené', 'Unikátní', 'Kontejnery'].map(h => <th key={h} className="text-left p-2">{h}</th>)}</tr></thead><tbody>{disk.images.map(i => <tr key={i.id}><td className="p-2 break-all">{i.tags?.join(', ') || i.id.slice(0, 20)}{i.retained && ' (obnova)'}</td><td>{bytes(i.size)}</td><td>{bytes(i.shared < 0 ? null : i.shared)}</td><td>{bytes(i.unique)}</td><td>{i.containers}</td></tr>)}</tbody></table></div>
      <h3 className="font-semibold">Doporučení podle měření</h3>{disk.recommendations.length ? disk.recommendations.map((r, i) => <p key={i}>{r.text} {r.potential_bytes != null && `Potenciál: ${bytes(r.potential_bytes)} (odhady nesčítejte).`}</p>) : <p>Žádný doložitelný kandidát na úsporu.</p>}
      {(['build_cache', 'containers', 'volumes', 'details'] as const).map(key => <details key={key}><summary>{({ build_cache: 'Build cache', containers: 'Zapisovatelné vrstvy kontejnerů', volumes: 'Volumes', details: 'Logy a bind mounty (null = nezměřeno)' })[key]}</summary><pre className="text-xs overflow-auto max-h-96">{JSON.stringify(disk[key], null, 2)}</pre></details>)}
      </>}
    </section>
  </div>
}
