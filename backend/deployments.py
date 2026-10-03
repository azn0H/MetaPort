"""Persistent deployment manager. Only trusted administrators may execute repository code."""
import json
import os
import re
import subprocess
import threading
import time
import uuid
from pathlib import Path
from urllib.parse import urlparse

import docker
import httpx
from cryptography.fernet import Fernet
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from routers.auth import require_roles

ROOT = Path(os.getenv('METAPORT_DEPLOY_ROOT', '/opt/metaport-deploy'))
router = APIRouter(prefix='/api/v1/deployments', tags=['Nasazování'], dependencies=[Depends(require_roles(['superadmin']))])
lock = threading.RLock()
stop = threading.Event()
thread = None

def setup():
    ROOT.mkdir(parents=True, exist_ok=True, mode=0o700)
    key = ROOT / 'secret.key'
    if not key.exists():
        fd = os.open(key, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'wb') as f:
            f.write(Fernet.generate_key())
    return Fernet(key.read_bytes())

def read():
    cipher = setup()
    path = ROOT / 'state.enc'
    return json.loads(cipher.decrypt(path.read_bytes())) if path.exists() else {'connections': [], 'projects': []}

def write(state):
    data = setup().encrypt(json.dumps(state).encode())
    tmp = ROOT / 'state.tmp'
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'wb') as f:
        f.write(data)
    tmp.replace(ROOT / 'state.enc')

def public(state):
    return {'manager_available': bool(thread and thread.is_alive()), 'connections': [{k: v for k, v in c.items() if k != 'token'} for c in state['connections']], 'projects': [{k: v for k, v in p.items() if k != 'environment'} | {'environment_keys': list(p.get('environment', {}))} for p in state['projects']]}

class Connection(BaseModel):
    provider: str
    token: str = Field(min_length=1, max_length=4096)
    name: str = Field(min_length=1, max_length=80)

class Project(BaseModel):
    name: str = Field(pattern=r'^[a-z][a-z0-9-]{1,40}$')
    connection_id: str
    repository: str
    branch: str = Field(min_length=1, max_length=200)
    compose_file: str = 'compose.yaml'
    auto_deploy: bool = False
    environment: dict[str, str] | None = None

    @field_validator('name', mode='before')
    @classmethod
    def normalize_name(cls, value):
        return value.strip().lower() if isinstance(value, str) else value

@router.get('')
def listing():
    with lock:
        state = public(read())
        for p in state['projects']:
            if p.get('external_updater'):
                status = ROOT / 'self-update' / 'status.json'
                if status.exists():
                    current = json.loads(status.read_text())
                    p.update({k: current[k] for k in ('status', 'commit', 'started_at', 'finished_at') if k in current})
                    p['logs'] = [current[k] for k in ('phase', 'error') if current.get(k)]
                if (ROOT / 'self-update' / 'request').exists():
                    p['status'] = 'queued'
        return state

@router.post('/connections')
def connection(data: Connection):
    if data.provider not in ('github', 'gitlab'):
        raise HTTPException(400, 'Podporován GitHub a GitLab.com')
    with lock:
        state = read()
        state['connections'].append(data.model_dump() | {'id': uuid.uuid4().hex})
        write(state)
    return {'ok': True}

@router.delete('/connections/{cid}')
def delete_connection(cid: str):
    with lock:
        state = read()
        if any(p['connection_id'] == cid for p in state['projects']):
            raise HTTPException(409, 'Připojení používá projekt')
        state['connections'] = [c for c in state['connections'] if c['id'] != cid]
        write(state)
    return {'ok': True}

@router.get('/repositories/{cid}')
async def repositories(cid: str, page: int = 1):
    if page < 1 or page > 10000:
        raise HTTPException(400, 'Neplatná stránka')
    with lock:
        c = next((c for c in read()['connections'] if c['id'] == cid), None)
    if not c:
        raise HTTPException(404, 'Připojení nenalezeno')
    github = c['provider'] == 'github'
    url = 'https://api.github.com/user/repos' if github else 'https://gitlab.com/api/v4/projects'
    headers = {'Authorization': 'Bearer ' + c['token']} if github else {'PRIVATE-TOKEN': c['token']}
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(url, headers=headers, params={'page': page, 'per_page': 100, **({'sort': 'updated'} if github else {'membership': 'true'})})
            response.raise_for_status()
            return {'items': [{'name': r['full_name'] if github else r['path_with_namespace'], 'url': r['clone_url'] if github else r['http_url_to_repo'], 'branch': r.get('default_branch') or 'main'} for r in response.json()], 'page': page, 'has_more': len(response.json()) == 100}
    except (httpx.HTTPError, ValueError):
        raise HTTPException(502, 'Provider odmítl požadavek nebo není dostupný. Ověřte oprávnění tokenu.')

def validate_project(data, state):
    c = next((c for c in state['connections'] if c['id'] == data.connection_id), None)
    host = 'github.com' if c and c['provider'] == 'github' else 'gitlab.com'
    u = urlparse(data.repository)
    if not c or u.scheme != 'https' or u.netloc != host or u.query or u.fragment or not re.fullmatch(r'/[A-Za-z0-9_./-]+\.git', u.path) or '..' in u.path:
        raise HTTPException(400, 'Zvolte HTTPS repozitář připojeného providera')
    path = Path(data.compose_file)
    if path.is_absolute() or '..' in path.parts or '\\' in data.compose_file or not data.compose_file:
        raise HTTPException(400, 'Compose cesta musí být relativní uvnitř repozitáře')
    if data.branch.startswith('-') or any(x in data.branch for x in ['..', '~', '^', ':', ' ', '\\', '@{']) or not re.fullmatch(r'[A-Za-z0-9_./-]+', data.branch):
        raise HTTPException(400, 'Neplatná větev')
    if data.environment and any(not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', k) or '\n' in v or '\r' in v or '\x00' in v for k, v in data.environment.items()):
        raise HTTPException(400, 'Prostředí musí obsahovat platné názvy a jednořádkové hodnoty')

@router.put('/projects/{pid}')
def save_project(pid: str, data: Project):
    with lock:
        state = read()
        validate_project(data, state)
        old = next((p for p in state['projects'] if p['id'] == pid), None)
        if old and old.get('external_updater'):
            raise HTTPException(409, 'MetaPort spravuje externí služba. Její větev a automatické nasazování se nastavují na hostiteli.')
        if old and old.get('status') in ('queued', 'running'):
            raise HTTPException(409, 'Probíhá nasazení')
        if any(p['name'] == data.name and p['id'] != pid for p in state['projects']):
            raise HTTPException(409, 'Název Compose projektu je již použit')
        if old is None:
            old = {'id': uuid.uuid4().hex, 'status': 'idle', 'logs': [], 'history': []}
            state['projects'].append(old)
        if (old.get('history') or old.get('adopted_stack')) and old.get('name') != data.name:
            raise HTTPException(400, 'Název již nasazeného projektu nelze změnit: je svázaný s volumes a kontejnery')
        changed = any(old.get(k) != getattr(data, k) for k in ('repository', 'branch', 'compose_file', 'connection_id'))
        old.update(data.model_dump(exclude={'environment'}))
        if changed:
            old.pop('commit', None)
            old.pop('attempted_commit', None)
        if data.environment is not None:
            old['environment'] = data.environment
            old.pop('attempted_commit', None)
        write(state)
    return {'ok': True}

@router.delete('/projects/{pid}')
def remove_project(pid: str):
    with lock:
        state = read()
        p = next((p for p in state['projects'] if p['id'] == pid), None)
        if not p:
            raise HTTPException(404, 'Projekt nenalezen')
        if p['status'] in ('running', 'queued'):
            raise HTTPException(409, 'Probíhá nasazení')
        state['projects'].remove(p)
        write(state)
    return {'ok': True, 'message': 'Odstraněna pouze konfigurace; kontejnery, images a data zůstávají.'}

@router.post('/projects/{pid}/deploy')
def queue(pid: str):
    if os.name != 'posix':
        raise HTTPException(503, 'Nasazovací správce vyžaduje Linux hostitele')
    with lock:
        state = read()
        p = next((p for p in state['projects'] if p['id'] == pid), None)
        if not p:
            raise HTTPException(404, 'Projekt nenalezen')
        if p.get('external_updater'):
            (ROOT / 'self-update' / 'request').touch(mode=0o600)
            return {'ok': True}
        if p['status'] in ('queued', 'running'):
            raise HTTPException(409, 'Nasazení už probíhá')
        p['status'] = 'queued'
        write(state)
    return {'ok': True}

def update(pid, **values):
    with lock:
        state = read()
        p = next((p for p in state['projects'] if p['id'] == pid), None)
        if p is None:
            return
        p.update(values)
        write(state)

def event(pid, message):
    with lock:
        state = read()
        p = next(p for p in state['projects'] if p['id'] == pid)
        p['logs'] = (p.get('logs', []) + [time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime()) + ' ' + message])[-100:]
        write(state)

def command(args, cwd=None, env=None, timeout=1800):
    # Never persist raw subprocess output: Dockerfiles can print arbitrary secrets.
    import tempfile
    with tempfile.TemporaryFile() as output:
        result = subprocess.run(args, cwd=cwd, env=env if env is not None else {k: v for k, v in os.environ.items() if k in ('PATH', 'HOME', 'LANG', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP')}, stdout=output, stderr=subprocess.STDOUT, timeout=timeout, check=False)
        if result.returncode:
            if args[:2] == ['docker', 'compose'] and 'config' in args:
                output.seek(0)
                diagnostic = output.read(1024 * 1024).decode('utf-8', errors='replace')
                missing = re.search(r'required variable ([A-Za-z_][A-Za-z0-9_]{0,127}) is missing a value', diagnostic)
                if missing:
                    raise RuntimeError('V prostředí projektu chybí povinná proměnná ' + missing.group(1) + '. Doplňte ji v nastavení prostředí projektu.')
            raise RuntimeError('Příkaz selhal (exit %d)' % result.returncode)
        output.seek(0)
        return output.read(4 * 1024 * 1024).decode('utf-8', errors='replace').strip()

def git_environment(c):
    env = {k: v for k, v in os.environ.items() if not k.startswith(('GIT_', 'DOCKER_', 'COMPOSE_'))}
    ask = ROOT / 'askpass.sh'
    ask.write_text('#!/bin/sh\ncase "$1" in *Username*) printf "%s" "$METAPORT_GIT_USER" ;; *) printf "%s" "$METAPORT_GIT_TOKEN" ;; esac\n')
    ask.chmod(0o700)
    env.update(GIT_ASKPASS=str(ask), GIT_TERMINAL_PROMPT='0', GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL='/dev/null', METAPORT_GIT_USER='x-access-token' if c['provider'] == 'github' else 'oauth2', METAPORT_GIT_TOKEN=c['token'])
    return env

def deploy(p, c):
    pid = p['id']
    update(pid, status='running', logs=[], started_at=time.time())
    release = ROOT / 'projects' / pid / uuid.uuid4().hex
    release.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    try:
        client = docker.from_env()
        adoption = p.get('adopted_stack', {})
        stack = adoption.get('name') or 'mp-' + p['name']
        if not adoption and client.containers.list(all=True, filters={'label': 'com.docker.compose.project=' + p['name']}):
            raise RuntimeError('Na hostiteli již existuje Compose stack ' + p['name'] + '. Nejprve nastavte jeho převzetí se zachováním prostředí a volumes; nové nasazení by vytvořilo jiný stack mp-' + p['name'] + '.')
        event(pid, '1/5 Stahování sledované větve')
        command(['git', '-c', 'credential.helper=', 'clone', '--depth', '1', '--single-branch', '--branch', p['branch'], '--', p['repository'], str(release)], env=git_environment(c), timeout=300)
        sha = command(['git', 'rev-parse', 'HEAD'], release)
        compose = (release / p['compose_file']).resolve()
        if not compose.is_relative_to(release.resolve()) or not compose.is_file():
            raise RuntimeError('Compose soubor chybí nebo směřuje mimo repozitář')
        control = release.parent / (release.name + '-control')
        control.mkdir(mode=0o700)
        envfile = control / 'project.env'
        envfile.write_text('\n'.join(k + '=' + "'" + v.replace("'", "\\'") + "'" for k, v in p.get('environment', {}).items()))
        envfile.chmod(0o600)
        base = ['docker', 'compose', '--project-name', stack, '--project-directory', str(release), '--env-file', str(envfile), '-f', str(compose)]
        if adoption:
            mounts = control / 'adopted-mounts.json'
            mounts.write_text(json.dumps({'services': {name: {'volumes': volumes} for name, volumes in adoption.get('binds', {}).items()}}))
            base += ['-f', str(mounts)]
        event(pid, '2/5 Validace konfigurace a zachování předchozích images')
        config = json.loads(command(base + ['config', '--format', 'json'], release))
        if adoption:
            actual = {v['name'] for v in config.get('volumes', {}).values()}
            if actual != set(adoption['volumes']):
                raise RuntimeError('Konfigurace mění volumes převzatého stacku. Před nasazením je nutné ověřit migraci dat.')
        for service in config['services'].values():
            for mount in service.get('volumes', []):
                if mount.get('type') == 'bind' and Path(mount['source']).resolve().is_relative_to(release.resolve()):
                    raise RuntimeError('Bind mount uvnitř release není stabilní mezi nasazeními. Použijte absolutní hostitelskou cestu nebo named volume.')
        client = docker.from_env()
        previous = {}
        for container in client.containers.list(all=True, filters={'label': 'com.docker.compose.project=' + stack}):
            service = container.labels.get('com.docker.compose.service')
            if service:
                tag = 'metaport-retained/' + pid + ':' + service + '-' + str(int(time.time()))
                client.images.get(container.attrs['Image']).tag(tag)
                previous[service] = tag
        update(pid, previous_images=previous)
        override = control / 'images.json'
        services = {}
        for name, service in config['services'].items():
            if service.get('build'):
                services[name] = {'image': 'metaport/' + pid + ':' + name + '-' + sha[:12]}
        override.write_text(json.dumps({'services': services}))
        base += ['-f', str(override)]
        event(pid, '3/5 Build images; běžící kontejnery zůstávají aktivní')
        command(base + ['build', '--pull'], release)
        if any(not s.get('build') for s in config['services'].values()):
            command(base + ['pull', '--ignore-buildable'], release, timeout=900)
        sizes = {name: client.images.get(v['image']).attrs['Size'] for name, v in services.items()}
        growth = {name: size - p.get('image_sizes', {}).get(name, size) for name, size in sizes.items()}
        update(pid, previous_images=previous, release=str(release), image_growth=growth)
        event(pid, '4/5 Aktualizace kontejnerů a čekání na running/healthy')
        command(base + ['up', '-d', '--no-build', '--pull', 'never', '--wait', '--wait-timeout', '120'], release, timeout=240)
        event(pid, '5/5 Nasazení dokončeno. Bez healthchecku je ověřen pouze stav running.')
        history = (p.get('history', []) + [{'commit': sha, 'finished_at': time.time(), 'release': str(release)}])[-20:]
        update(pid, status='success', commit=sha, image_sizes=sizes, finished_at=time.time(), history=history)
    except Exception as exc:
        message = str(exc) if isinstance(exc, RuntimeError) else 'Operace selhala nebo překročila časový limit; ověřte Docker/Git na hostiteli.'
        event(pid, message + ' Předchozí označené images zůstávají zachovány. Databázové migrace nejsou vraceny.')
        update(pid, status='failed', finished_at=time.time())

def worker():
    # Enforce one manager across API workers/processes on the Linux deployment host.
    import fcntl
    setup()
    handle = open(ROOT / 'worker.lock', 'a')
    try:
        fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        handle.close()
        return
    with lock:
        state = read()
        for p in state['projects']:
            if p['status'] == 'running':
                p['status'] = 'failed'
                p['logs'] = p.get('logs', []) + ['Nasazení přerušeno restartem správce; ověřte kontejnery ručně.']
        write(state)
    while not stop.is_set():
        with lock:
            state = read()
        for p in state['projects']:
            if stop.is_set():
                break
            if p.get('external_updater'):
                continue
            c = next((c for c in state['connections'] if c['id'] == p['connection_id']), None)
            if not c:
                continue
            if p['status'] == 'queued':
                deploy(p, c)
            elif p['auto_deploy']:
                try:
                    sha = command(['git', '-c', 'credential.helper=', 'ls-remote', '--exit-code', p['repository'], 'refs/heads/' + p['branch']], env=git_environment(c), timeout=60).split()[0]
                    update(p['id'], checked_at=time.time(), poll_error=None)
                    if sha != p.get('commit') and sha != p.get('attempted_commit'):
                        with lock:
                            latest = read()
                            current = next(x for x in latest['projects'] if x['id'] == p['id'])
                            if any(current.get(k) != p.get(k) for k in ('name', 'connection_id', 'repository', 'branch', 'compose_file', 'environment', 'auto_deploy')) or current['status'] == 'queued':
                                continue
                            current.update(attempted_commit=sha, status='queued')
                            write(latest)
                            p = dict(current)
                        deploy(p, c)
                except Exception:
                    update(p['id'], checked_at=time.time(), poll_error='Kontrola větve selhala; ověřte token, větev a síť.')
        stop.wait(max(30, int(os.getenv('METAPORT_POLL_SECONDS', '60'))))
    handle.close()

def start():
    global thread
    if os.name == 'posix':
        stop.clear()
        thread = threading.Thread(target=worker, daemon=True)
        thread.start()

@router.get('/disk')
def disk():
    try:
        client = docker.from_env()
        df = client.df()
        containers = []
        for c in client.containers.list(all=True):
            a = c.attrs
            path = a.get('LogPath')
            # Host paths may not be mounted into the manager; absence means unknown, never zero.
            containers.append({'name': c.name, 'log_bytes': os.path.getsize(path) if path and os.path.isfile(path) else None, 'mounts': [{'type': m['Type'], 'source': m.get('Source'), 'destination': m.get('Destination'), 'bytes': None} for m in a.get('Mounts', [])]})
        images = [{'id': i['Id'], 'tags': i.get('RepoTags'), 'size': i['Size'], 'shared': i.get('SharedSize'), 'unique': max(0, i['Size'] - i['SharedSize']) if i.get('SharedSize', -1) >= 0 else None, 'containers': i.get('Containers'), 'retained': any(t.startswith('metaport-retained/') for t in (i.get('RepoTags') or []))} for i in df.get('Images', [])]
        cache = df.get('BuildCache', [])
        recommendations = []
        reclaim = sum(x.get('Size', 0) for x in cache if not x.get('InUse') and not x.get('Shared'))
        if reclaim:
            recommendations.append({'text': 'Nepoužívaná nesdílená build cache: po kontrole lze zvážit cílený úklid. Další build bude pomalejší.', 'potential_bytes': reclaim})
        for image in images:
            if image['containers'] == 0 and image['unique'] and not image['retained']:
                recommendations.append({'text': 'Image bez kontejnerů: ' + image['id'][:19] + '. Ověřte, zda není potřebný pro obnovu.', 'potential_bytes': image['unique']})
        with lock:
            for p in read()['projects']:
                for service, growth in p.get('image_growth', {}).items():
                    if growth > 0:
                        recommendations.append({'text': p['name'] + '/' + service + ': image narostl o ' + str(growth) + ' B. Zkontrolujte build context, .dockerignore, vícefázový build a cache balíčků. Úspora zatím není změřena.', 'potential_bytes': None})
        return {'image_bytes': df.get('LayersSize'), 'images': images, 'containers': [{k: x.get(k) for k in ('Id', 'Names', 'SizeRw', 'SizeRootFs', 'State')} for x in df.get('Containers', [])], 'build_cache': [{k: x.get(k) for k in ('ID', 'Size', 'InUse', 'Shared', 'LastUsedAt', 'UsageCount')} for x in cache], 'volumes': [{'name': x.get('Name'), 'usage': x.get('UsageData')} for x in df.get('Volumes', [])], 'details': containers, 'recommendations': recommendations, 'notes': ['LayersSize počítá sdílené image vrstvy jednou; součet velikostí jednotlivých images není skutečná spotřeba.', 'Kategorie se mohou překrývat; nesčítejte je na celkovou spotřebu disku.', 'Logy a bind mounty na hostiteli mohou být nedostupné. Neznámá velikost není nula.', 'Dive je volitelná ruční analýza; odhad plýtvání není garantovaná úspora. Nic se automaticky nemaže.']}
    except Exception:
        raise HTTPException(503, 'Docker diagnostika není dostupná')
