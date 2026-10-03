import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

os.environ['DATABASE_URL'] = 'sqlite://'
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import deployments as d
from fastapi import FastAPI
from fastapi.testclient import TestClient
from database import User
from routers.auth import get_current_user, router as auth_router

class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root_patch = patch.object(d, 'ROOT', Path(self.temp.name))
        self.root_patch.start()
        self.app = FastAPI()
        self.app.include_router(d.router)
        self.app.include_router(auth_router)
        self.app.dependency_overrides[get_current_user] = lambda: User(role='superadmin')
        self.api = TestClient(self.app)
        self.api.post('/api/v1/deployments/connections', json={'name': 'test', 'provider': 'github', 'token': 'secret-token'})
        self.cid = d.read()['connections'][0]['id']
        self.data = {'name': 'example', 'connection_id': self.cid, 'repository': 'https://github.com/owner/repo.git', 'branch': 'development', 'compose_file': 'compose.yaml', 'environment': {'PASSWORD': 'secret-password'}}
        self.api.put('/api/v1/deployments/projects/new', json=self.data)
        self.project = d.read()['projects'][0]

    def tearDown(self):
        self.root_patch.stop()
        self.temp.cleanup()

    def test_secrets_encrypted_and_not_returned(self):
        self.assertNotIn(b'secret-token', (d.ROOT / 'state.enc').read_bytes())
        self.assertNotIn(b'secret-password', (d.ROOT / 'state.enc').read_bytes())
        response = self.api.get('/api/v1/deployments')
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('secret-token', response.text)
        self.assertNotIn('secret-password', response.text)
        self.assertEqual(response.json()['projects'][0]['environment_keys'], ['PASSWORD'])

    def test_uppercase_project_name_is_normalized_and_duplicate_checked(self):
        result = self.api.put('/api/v1/deployments/projects/new', json=self.data | {'name': ' Vortex '})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(d.read()['projects'][-1]['name'], 'vortex')
        duplicate = self.api.put('/api/v1/deployments/projects/new', json=self.data | {'name': 'VORTEX'})
        self.assertEqual(duplicate.status_code, 409)
        invalid = self.api.put('/api/v1/deployments/projects/new', json=self.data | {'name': 'Bad Name!'})
        self.assertEqual(invalid.status_code, 422)

    def test_authorization(self):
        self.app.dependency_overrides[get_current_user] = lambda: User(role='betteradmin')
        for route in ['', '/disk', '/repositories/' + self.cid]:
            self.assertEqual(self.api.get('/api/v1/deployments' + route).status_code, 403)
        self.assertEqual(self.api.post('/api/v1/deployments/projects/' + self.project['id'] + '/deploy').status_code, 403)

    def test_validation_and_edit_preserves_environment(self):
        for change in ({'compose_file': '../compose.yaml'}, {'repository': 'https://secret@github.com/owner/repo.git'}, {'repository': 'https://evil.test/owner/repo.git'}, {'branch': '--upload-pack=bad'}, {'environment': {'BAD': 'line\nbreak'}}):
            self.assertEqual(self.api.put('/api/v1/deployments/projects/new', json=self.data | change).status_code, 400)
        self.assertEqual(self.api.put('/api/v1/deployments/projects/' + self.project['id'], json=self.data | {'environment': None}).status_code, 200)
        self.assertEqual(d.read()['projects'][0]['environment'], {'PASSWORD': 'secret-password'})
        d.update(self.project['id'], status='running')
        self.assertEqual(self.api.put('/api/v1/deployments/projects/' + self.project['id'], json=self.data).status_code, 409)
        self.assertEqual(self.api.delete('/api/v1/deployments/connections/' + self.cid).status_code, 409)

    def fake_command(self, calls, fail_build=False, fail_up=False, relative_bind=False):
        def run(args, cwd=None, env=None, timeout=1800):
            calls.append(args)
            if 'clone' in args:
                release = Path(args[-1]); release.mkdir()
                (release / 'compose.yaml').write_text('services: {}')
                return ''
            if args[:3] == ['git', 'rev-parse', 'HEAD']:
                return 'a' * 40
            if 'config' in args:
                volumes = [{'type': 'bind', 'source': str(cwd / 'data')}] if relative_bind else []
                return json.dumps({'services': {'web': {'build': {'context': '.'}, 'volumes': volumes}}})
            if fail_build and 'build' in args:
                raise RuntimeError('Příkaz selhal (exit 1)')
            if fail_up and 'up' in args:
                raise RuntimeError('Příkaz selhal (exit 1)')
            return ''
        return run

    def docker_client(self):
        image = Mock(attrs={'Size': 100})
        container = SimpleNamespace(labels={'com.docker.compose.service': 'web'}, attrs={'Image': 'sha256:old'})
        client = Mock()
        client.containers.list.return_value = [container]
        client.images.get.return_value = image
        return client

    def test_build_failure_does_not_replace_running_version(self):
        calls = []
        client = self.docker_client()
        with patch.object(d, 'command', side_effect=self.fake_command(calls, fail_build=True)), patch.object(d.docker, 'from_env', return_value=client):
            d.deploy(self.project, d.read()['connections'][0])
        self.assertFalse(any('up' in args or 'down' in args for args in calls))
        self.assertEqual(d.read()['projects'][0]['status'], 'failed')
        client.images.get.return_value.tag.assert_called_once()
        self.assertNotIn('secret-password', json.dumps(d.public(d.read())))

    def test_success_wait_growth_and_retained_images(self):
        calls = []
        self.project['image_sizes'] = {'web': 70}
        with patch.object(d, 'command', side_effect=self.fake_command(calls)), patch.object(d.docker, 'from_env', return_value=self.docker_client()):
            d.deploy(self.project, d.read()['connections'][0])
        p = d.read()['projects'][0]
        self.assertEqual(p['status'], 'success')
        self.assertEqual(p['image_growth']['web'], 30)
        self.assertIn('web', p['previous_images'])
        up = next(a for a in calls if 'up' in a)
        self.assertIn('--wait', up)
        self.assertIn('--no-build', up)
        self.assertLess(next(i for i, a in enumerate(calls) if 'build' in a), calls.index(up))

    def test_health_failure_does_not_record_success(self):
        calls = []
        with patch.object(d, 'command', side_effect=self.fake_command(calls, fail_up=True)), patch.object(d.docker, 'from_env', return_value=self.docker_client()):
            d.deploy(self.project, d.read()['connections'][0])
        p = d.read()['projects'][0]
        self.assertEqual(p['status'], 'failed')
        self.assertNotIn('commit', p)
        self.assertIn('web', p['previous_images'])

    def test_unstable_bind_mount_rejected_before_build(self):
        calls = []
        with patch.object(d, 'command', side_effect=self.fake_command(calls, relative_bind=True)):
            d.deploy(self.project, d.read()['connections'][0])
        self.assertFalse(any('build' in a or 'up' in a for a in calls))
        self.assertEqual(d.read()['projects'][0]['status'], 'failed')

    def test_disk_shared_layers_not_summed_and_metadata_filtered(self):
        client = Mock()
        client.containers.list.return_value = []
        client.df.return_value = {'LayersSize': 150, 'Images': [{'Id': 'sha256:a', 'Size': 100, 'SharedSize': 50, 'Containers': 0, 'RepoTags': ['repo:a']}, {'Id': 'sha256:b', 'Size': 100, 'SharedSize': 50, 'Containers': 0, 'RepoTags': ['metaport-retained/test:b']}], 'BuildCache': [{'ID': 'cache', 'Size': 20, 'Shared': False, 'InUse': False}], 'Containers': [{'Id': 'one', 'Labels': {'PASSWORD': 'secret-password'}}], 'Volumes': [{'Name': 'db', 'Labels': {'token': 'secret-token'}, 'UsageData': {'Size': 10}}]}
        with patch.object(d.docker, 'from_env', return_value=client):
            data = self.api.get('/api/v1/deployments/disk').json()
        self.assertEqual(data['image_bytes'], 150)
        self.assertEqual(data['images'][0]['unique'], 50)
        self.assertEqual(len(data['recommendations']), 2)
        self.assertNotIn('secret-password', json.dumps(data))
        self.assertNotIn('secret-token', json.dumps(data))

    def test_provider_repository_pagination_and_headers(self):
        import httpx
        for provider in ('github', 'gitlab'):
            with d.lock:
                state = d.read()
                state['connections'][0]['provider'] = provider
                d.write(state)
            payload = {'full_name': 'owner/repo', 'clone_url': 'https://github.com/owner/repo.git', 'path_with_namespace': 'group/repo', 'http_url_to_repo': 'https://gitlab.com/group/repo.git', 'default_branch': 'development'}
            mock_client = AsyncMock()
            mock_client.get.return_value = httpx.Response(200, json=[payload] * 100, request=httpx.Request('GET', 'https://example.test'))
            mock_context = AsyncMock()
            mock_context.__aenter__.return_value = mock_client
            with patch.object(d.httpx, 'AsyncClient', return_value=mock_context):
                result = self.api.get('/api/v1/deployments/repositories/' + self.cid + '?page=2')
            self.assertEqual(result.status_code, 200)
            self.assertTrue(result.json()['has_more'])
            self.assertEqual(result.json()['items'][0]['branch'], 'development')
            self.assertNotIn('secret-token', result.text)
            self.assertEqual(mock_client.get.call_args.kwargs['params']['page'], 2)
            header = 'Authorization' if provider == 'github' else 'PRIVATE-TOKEN'
            self.assertIn('secret-token', mock_client.get.call_args.kwargs['headers'][header])

    def test_config_removal_preserves_deployment_files(self):
        sentinel = d.ROOT / 'existing-release'
        sentinel.write_text('keep')
        result = self.api.delete('/api/v1/deployments/projects/' + self.project['id'])
        self.assertEqual(result.status_code, 200)
        self.assertTrue(sentinel.exists())
        self.assertEqual(d.read()['projects'], [])
        self.assertEqual(self.api.delete('/api/v1/deployments/connections/' + self.cid).status_code, 200)

    def test_sso_forged_token_rejected(self):
        import jwt
        with patch.dict(os.environ, {'SSO_ISSUER': '', 'SSO_AUDIENCE': '', 'SSO_JWKS_URL': ''}):
            token = jwt.encode({'sub': 'attacker', 'roles': ['superadmin']}, key='', algorithm='none')
            self.assertEqual(self.api.post('/api/v1/auth/sso', json={'token': token}).status_code, 503)

if __name__ == '__main__':
    unittest.main()
