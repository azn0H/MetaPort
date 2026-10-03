#!/usr/bin/env python3
"""Host-side updater. Never runs inside the backend it replaces."""
import fcntl
import json
import os
import subprocess
import time
import urllib.request
from pathlib import Path

ROOT = Path(os.environ.get('METAPORT_CHECKOUT', '/home/aznoh/mojserver/www/MetaPort'))
STATE = Path(os.environ.get('METAPORT_UPDATE_STATE', '/opt/metaport-deploy/self-update'))
BRANCH = os.environ.get('METAPORT_UPDATE_BRANCH', 'codex/compose-deployments-disk')
SERVICES = ['metaport-backend', 'metaport-frontend']


def run(args, timeout=120):
    result = subprocess.run(args, cwd=ROOT, capture_output=True, text=True, timeout=timeout,
                            env=os.environ | {'GIT_TERMINAL_PROMPT': '0'})
    if result.returncode:
        # Subprocesses and Dockerfiles may emit credentials: do not journal output.
        raise RuntimeError('Command failed: ' + args[0] + ' (exit ' + str(result.returncode) + ')')
    return result.stdout.strip()


def save(state):
    temporary = STATE / 'status.tmp'
    temporary.write_text(json.dumps(state))
    temporary.chmod(0o600)
    temporary.replace(STATE / 'status.json')


def healthy():
    deadline = time.monotonic() + 150
    while time.monotonic() < deadline:
        try:
            for url in ['http://127.0.0.1:85/', 'http://127.0.0.1:8025/openapi.json']:
                with urllib.request.urlopen(url, timeout=5) as response:
                    if response.status != 200:
                        raise RuntimeError('HTTP health check failed')
            return
        except Exception:
            time.sleep(3)
    raise RuntimeError('Web/API health check timed out')


def main():
    os.umask(0o077)
    STATE.mkdir(parents=True, exist_ok=True, mode=0o700)
    with (STATE / 'update.lock').open('a') as handle:
        try:
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return
        path = STATE / 'status.json'
        state = json.loads(path.read_text()) if path.exists() else {}
        revision = run(['git', 'ls-remote', '--exit-code', 'origin', 'refs/heads/' + BRANCH]).split()[0]
        requested = STATE / 'request'
        force = requested.exists()
        requested.unlink(missing_ok=True)
        if not force and (revision == state.get('commit') or revision == state.get('attempted_commit')):
            return
        state.update(status='running', attempted_commit=revision, started_at=time.time(), phase='Stahování a validace konfigurace')
        save(state)
        try:
            run(['git', 'fetch', 'origin', BRANCH])
            # Avoid racing a new push between checking and fetching.
            if run(['git', 'rev-parse', 'FETCH_HEAD']) != revision:
                raise RuntimeError('Branch changed during fetch; retry required')
            release = STATE / 'releases' / revision
            release.parent.mkdir(parents=True, exist_ok=True)
            if not release.exists():
                run(['git', 'worktree', 'add', '--detach', str(release), revision])
            snapshots = {}
            for service in SERVICES:
                snapshots[service] = json.loads(run(['docker', 'inspect', service]))[0]
            stamp = str(int(time.time()))
            rollback = {'services': {}}
            override = {'services': {}}
            for service, snapshot in snapshots.items():
                tag = 'metaport-self-retained/' + service + ':' + stamp
                run(['docker', 'image', 'tag', snapshot['Image'], tag])
                # Preserve the actual running environment, including SSO/provider configuration.
                environment = dict(item.split('=', 1) for item in snapshot['Config']['Env'])
                environment = {k: v.replace('$', '$$') for k, v in environment.items()}
                folder = 'backend' if service.endswith('backend') else 'frontend'
                override['services'][service] = {'build': {'context': str(release / folder)},
                    'image': 'metaport-self/' + service + ':' + revision[:12], 'environment': environment}
                rollback['services'][service] = {'image': tag, 'environment': environment}
            control = STATE / ('control-' + revision)
            control.mkdir(exist_ok=True)
            config = control / 'override.json'
            config.write_text(json.dumps(override))
            old = control / 'rollback.json'
            old.write_text(json.dumps(rollback))
            base = ['docker', 'compose', '--project-name', 'metaport', '--project-directory', str(ROOT),
                    '-f', str(release / 'docker-compose.yml'), '-f', str(config)]
            run(base + ['config', '--quiet'])
            state['phase'] = 'Build images; původní kontejnery běží'
            save(state)
            run(base + ['build', '--pull'] + SERVICES, timeout=1800)
            # Fast-forward preserves local secret files and refuses conflicts with local edits.
            run(['git', 'merge', '--ff-only', revision])
            state['phase'] = 'Aktualizace kontejnerů a kontrola webu/API'
            save(state)
            run(base + ['up', '-d', '--no-deps', '--no-build', '--pull', 'never'] + SERVICES, timeout=240)
            healthy()
            state.update(status='success', commit=revision, finished_at=time.time(), error=None, phase='Nasazení dokončeno; web a API HTTP 200')
            print('MetaPort updated to ' + revision[:12], flush=True)
        except Exception as error:
            state.update(status='failed', finished_at=time.time(), error=str(error) if isinstance(error, RuntimeError)
                         else 'Update failed or timed out; inspect host and retained images.')
            print(state['error'], flush=True)
            # No automatic DB rollback or destructive Git reset. Retained images remain available.
            save(state)
            raise SystemExit(1)
        save(state)


if __name__ == '__main__':
    main()
